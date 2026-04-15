// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Cart = require("../models/cart/cart.model");
const CartItem = require("../models/cart/cart-item.model");
const Product = require("../models/product.model");
const ErrorHandler = require("../helper/error.helper");
const mongoose = require("mongoose");
const CategoryDiscount = require("../models/discount/category-discount");
const TierProductDiscount = require("../models/discount/tier-product-discount");
const Discount = require("../models/discount/discount.model");
const { applyDiscounts, isValidDate } = require("../utils");
const DiscountUser = require("../models/discount/discount-user.model");

// ==> Get or create cart (by userId or guestId) <==
async function getOrCreateCart(userId, guestId) {
  let cart;

  if (userId) {
    cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, guestId, total: 0 });
    }
  } else if (guestId) {
    cart = await Cart.findOne({ guestId });
    if (!cart) {
      cart = await Cart.create({ guestId, total: 0 });
    }
  } else {
    throw new Error("No userId or guestId provided!");
  }

  return cart;
}

// ==> get cart with items <==
exports.getCart = catchAsyncError(async (req, res, next) => {
  const { userId, guestId } = req.query;
  if (!userId && !guestId) {
    return next(new ErrorHandler("No userId or guestId provided!", 400));
  }

  // 1️⃣ Get or create cart
  const cart = await getOrCreateCart(userId, guestId);

  // 2️⃣ Fetch cart items
  const items = await CartItem.aggregate([
    { $match: { cartId: new mongoose.Types.ObjectId(cart._id) } },
    {
      $lookup: {
        from: "varients",
        foreignField: "_id",
        localField: "varientId",
        as: "varient",
      },
    },
    { $unwind: { path: "$varient", preserveNullAndEmptyArrays: true } },
  ]);

  if (!items.length) {
    return res.status(200).json({
      success: true,
      cart,
      items: [],
    });
  }

  // 3️⃣ Prepare product IDs
  const productIds = items.map((item) => item.productId);
  const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));
  const now = new Date();

  // 4️⃣ Product discounts
  const productDiscounts = await Discount.aggregate([
    {
      $match: {
        type: { $in: ["product", "quantity"] },
        method: { $in: ["flat", "percentage", "bogo"] },
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    },
    {
      $lookup: {
        from: "productdiscounts",
        let: { discountId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$discountId", "$$discountId"] },
                  { $in: ["$productId", objectIds] },
                ],
              },
            },
          },
        ],
        as: "products",
      },
    },
    { $unwind: "$products" },
    {
      $project: {
        productId: "$products.productId",
        discountId: "$_id",
        name: 1,
        method: 1,
        value: 1,
        minQty: 1,
        startDate: 1,
        endDate: 1,
      },
    },
  ]);

  // 5️⃣ Tier discounts
  const tierDiscounts = await TierProductDiscount.aggregate([
    { $match: { productId: { $in: objectIds } } },
    {
      $lookup: {
        from: "tierdiscounts",
        localField: "tierId",
        foreignField: "_id",
        as: "tier",
      },
    },
    { $unwind: "$tier" },
    {
      $lookup: {
        from: "discounts",
        localField: "discountId",
        foreignField: "_id",
        as: "parentDiscount",
      },
    },
    { $unwind: "$parentDiscount" },
    {
      $match: {
        "parentDiscount.status": "active",
        "parentDiscount.startDate": { $lte: now },
        "parentDiscount.endDate": { $gte: now },
      },
    },
    {
      $project: {
        productId: 1,
        min: "$tier.min",
        value: "$tier.value",
        discountId: 1,
        method: "$parentDiscount.method",
        name: "$parentDiscount.name",
        startDate: "$parentDiscount.startDate",
        endDate: "$parentDiscount.endDate",
      },
    },
  ]);

  // 6️⃣ Category discounts
  const products = await Product.find({ _id: { $in: objectIds } }).select(
    "_id categoryId name price"
  );
  const categoryIds = products.map((p) => p.categoryId);

  const categoryDiscounts = await CategoryDiscount.aggregate([
    { $match: { categoryId: { $in: categoryIds } } },
    {
      $lookup: {
        from: "discounts",
        localField: "discountId",
        foreignField: "_id",
        as: "discount",
      },
    },
    { $unwind: "$discount" },
    {
      $match: {
        "discount.status": "active",
        "discount.startDate": { $lte: now },
        "discount.endDate": { $gte: now },
      },
    },
    {
      $project: {
        categoryId: 1,
        method: 1,
        value: 1,
        discountId: 1,
        discountName: "$discount.name",
        startDate: "$discount.startDate",
        endDate: "$discount.endDate",
      },
    },
  ]);

  // 7️⃣ Map discounts to cart items
  const itemsWithDiscounts = items.map((item) => {
    const product = products.find(
      (p) => p._id.toString() === item.productId.toString()
    );
    const currentProductDiscounts = productDiscounts.filter(
      (d) => d.productId.toString() === item.productId.toString()
    );
    const currentCategoryDiscounts = categoryDiscounts.filter(
      (d) => d.categoryId.toString() === product?.categoryId.toString()
    );
    const currentTierDiscounts = tierDiscounts.filter(
      (d) => d.productId.toString() === item.productId.toString()
    );
    const { applied, final, original, savings } = applyDiscounts(
      item,
      currentProductDiscounts,
      currentTierDiscounts,
      currentCategoryDiscounts
    );

    return {
      ...item,
      applied,
      final,
      original,
      savings,
      productDiscounts: currentProductDiscounts,
      tierDiscounts: currentTierDiscounts,
      categoryDiscounts: currentCategoryDiscounts,
    };
  });
  let totalFinalPrice = itemsWithDiscounts.reduce((sum, r) => sum + r.final, 0);
  if (userId) {
    const existCouponDiscount = await DiscountUser.findOne({
      userId: userId,
      cartId: cart._id,
    });
    if (existCouponDiscount) {
      totalFinalPrice = totalFinalPrice - existCouponDiscount?.discountAmount;
    }
  }
  await Cart.updateOne({ _id: cart._id }, { $set: { total: totalFinalPrice } });
  const latestCart = await Cart.findById(cart._id);
  return res.status(200).json({
    success: true,
    cart: latestCart,
    items: itemsWithDiscounts,
  });
});

// ==> add item to the cart <==
exports.addToCart = catchAsyncError(async (req, res, next) => {
  const { userId, guestId, productId, varientId, quantity } = req.body;

  const resData = await Product.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
        status: "active",
      },
    },
    {
      $lookup: {
        from: "productimages",
        localField: "_id",
        foreignField: "productId",
        as: "images",
      },
    },
    {
      $lookup: {
        from: "varients",
        localField: "_id",
        foreignField: "productId",
        as: "varients",
      },
    },
    {
      $addFields: {
        firstImage: { $arrayElemAt: ["$images", 0] },
      },
    },
    {
      $project: {
        images: 0,
      },
    },
  ]);
  const existProduct = resData.length ? resData[0] : null;
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  // ✅ Determine available stock
  let availableStock = 0;
  let unitPrice = 0;
  if (varientId) {
    const variant = existProduct.varients.find(
      (v) => v._id.toString() === varientId.toString()
    );
    if (!variant) {
      return next(new ErrorHandler("Variant not found!", 404));
    }
    availableStock = variant.stock;
    unitPrice = variant.price;
  } else {
    availableStock = existProduct.stock;
    unitPrice = existProduct.price;
  }
  const cart = await getOrCreateCart(userId, guestId);

  // Check if item already exists
  let query = { cartId: cart._id, productId };
  if (varientId) {
    query.varientId = varientId; // look for same variant
  } else {
    query.varientId = null; // look for "no variant"
  }
  let item = await CartItem.findOne(query);

  const totalRequestedQty = item ? item.quantity + quantity : quantity;

  // ✅ Stock validation
  if (totalRequestedQty > availableStock) {
    return next(
      new ErrorHandler(
        `Only ${availableStock} item(s) available in stock.`,
        400
      )
    );
  }

  if (item) {
    await CartItem.updateOne(
      { _id: item._id },
      { quantity: totalRequestedQty }
    );
  } else {
    item = await CartItem.create({
      cartId: cart._id,
      productId,
      varientId: varientId || null,
      name: existProduct?.name,
      image: existProduct?.firstImage?.image,
      price: unitPrice,
      extraPrice: existProduct?.extraPrice,
      quantity,
    });
  }

  // Update cart total
  const items = await CartItem.find({ cartId: cart._id });
  let total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await Cart.updateOne({ _id: cart?._id }, { $set: { total } });

  return res.status(200).json({
    success: true,
    message: `Product added to cart!`,
  });
});

// ==> update quantity in cart <==
exports.updateCartQuantity = catchAsyncError(async (req, res, next) => {
  const { id } = req.params; // cartItemId
  const { type } = req.body;

  let item = await CartItem.findById(id);
  if (!item) {
    return next(new ErrorHandler("Item not found in cart!", 404));
  }
  const existProduct = await Product.findById(item.productId);
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  if (type === "INC") {
    let newQuantity = item.quantity + 1;
    if (newQuantity > existProduct.stock) {
      return next(
        new ErrorHandler("Stock is not sufficient to match the quantity!", 400)
      );
    }
    await CartItem.updateOne(
      {
        _id: id,
      },
      { $set: { quantity: newQuantity } }
    );
  }
  if (type === "DEC") {
    let newQuantity = item.quantity - 1;

    if (newQuantity < 1) {
      return next(new ErrorHandler("Quantity need to be at least 1", 400));
    }
    await CartItem.updateOne(
      {
        _id: id,
      },
      { $set: { quantity: newQuantity } }
    );
  }

  // Update cart total
  const cart = await Cart.findById(item.cartId);
  const items = await CartItem.find({ cartId: cart._id });
  let newTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await Cart.updateOne(
    {
      _id: cart?._id,
    },
    { $set: { total: newTotal } }
  );

  return res.status(200).json({
    success: true,
    message: `Product cart quantity updated!`,
  });
});

// ==> remove item from cart <==
exports.removeItemFromCart = catchAsyncError(async (req, res, next) => {
  const { id } = req.params; // cartItemId
  const item = await CartItem.findById(id);
  if (!item) {
    return next("Item not found in the cart!", 400);
  }

  await CartItem.deleteOne({ _id: id });

  const cartId = item.cartId;
  // Update cart total
  const items = await CartItem.find({ cartId });
  let newTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await Cart.updateOne({ _id: cartId }, { $set: { total: newTotal } });

  return res.status(200).json({
    success: true,
    message: `Product removed from cart!`,
  });
});

// ==> clear cart <==
exports.clearCart = catchAsyncError(async (req, res, next) => {
  const { userId, guestId } = req.query;
  if (!userId && !guestId) {
    return next(new ErrorHandler("No userId or guestId provided!", 400));
  }
  const cart = await Cart.findOne(userId ? { userId } : { guestId });

  if (!cart) {
    return next(new ErrorHandler("Cart not found!", 404));
  }

  // Remove all items
  await CartItem.deleteMany({ cartId: cart._id });

  // Reset total
  await Cart.updateOne({ _id: cart._id }, { total: 0 });

  res.status(200).json({
    success: true,
    message: "Cart is cleared!",
  });
});

// ==> merge guest cart to user cart <==
exports.mergeCart = catchAsyncError(async (req, res, next) => {
  const { userId, guestId } = req.body;

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart) {
    return next(new ErrorHandler("No user/guest cart found!", 404));
  }

  // Find or create user cart
  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    userCart = await Cart.create({ userId });
  }
  const guestItems = await CartItem.find({ cartId: guestCart._id });

  for (const gItem of guestItems) {
    let query = { cartId: userCart._id, productId: gItem.productId };
    query.varientId = gItem?.varientId ? gItem?.varientId : null;
    const existing = await CartItem.findOne(query);

    if (existing) {
      existing.quantity += gItem.quantity;
      await existing.save();
    } else {
      await CartItem.create({
        cartId: userCart._id,
        productId: gItem.productId,
        varientId: gItem.varientId,
        name: gItem.name,
        image: gItem.image,
        price: gItem.price,
        quantity: gItem.quantity,
      });
    }
  }

  // Recalculate totals
  const latestCart = await Cart.findOne({ userId });
  const items = await CartItem.find({ cartId: latestCart._id });
  let newTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await Cart.updateOne({ _id: latestCart?._id }, { $set: { total: newTotal } });

  // Cleanup guest cart
  await Cart.deleteOne({ _id: guestCart._id });
  await CartItem.deleteMany({ cartId: guestCart._id });

  // if (String(guestCart._id) !== String(latestCart._id)) {
  //   // Delete guest cart
  //   await CartItem.deleteMany({ cartId: guestCart._id });
  //   await Cart.deleteOne({ _id: guestCart?._id });
  // }

  return res.status(200).json({
    success: true,
    message: "Guest cart merged to user cart!",
    guestId: latestCart?.guestId,
  });
});

// ==> apply discount coupon <==
exports.applyCoupon = catchAsyncError(async (req, res, next) => {
  const userId = req?.user?._id;
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({
      success: false,
      message: "Coupon code is required",
    });
  }

  // 1. Find coupon
  const coupon = await Discount.findOne({
    code: couponCode,
    type: "coupon",
    status: "active",
  });
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Invalid or expired coupon!",
    });
  }

  // 2. Check validity date
  if (!isValidDate(coupon.startDate, coupon.endDate)) {
    return next(new ErrorHandler("Coupon is not valid at this time!", 400));
  }

  // 3. Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return next(new ErrorHandler("Coupon usage limit reached!", 400));
  }
  const userCart = await Cart.findOne({ userId });
  console.log(userCart);
  if (!userCart) {
    return next(new ErrorHandler("Cart not found for this user!", 400));
  }
  const isAppliedBefore = await DiscountUser.findOne({
    userId,
    cartId: userCart?._id,
  });
  if (isAppliedBefore) {
    return next(new ErrorHandler("You have alredy applied this coupon!", 400));
  }

  let cartTotal = userCart?.total;

  // 4. Check minimum cart value
  if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
    return next(
      new ErrorHandler(
        `Minimum cart value of ${coupon.minCartValue} required`,
        400
      )
    );
  }

  // 5. Calculate discount
  let discountAmount = 0;
  if (coupon.method === "flat") {
    discountAmount = coupon.value;
  } else if (coupon.method === "percentage") {
    discountAmount = (cartTotal * coupon.value) / 100;
  }

  await Cart.updateOne(
    { _id: userCart?._id },
    { $set: { total: cartTotal - discountAmount } }
  );
  await Discount.updateOne(
    {
      _id: coupon?._id,
    },
    { usedCount: coupon?.usedCount + 1 }
  );
  await DiscountUser.create({ userId, cartId: userCart?._id, discountAmount });

  return res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
  });
});
