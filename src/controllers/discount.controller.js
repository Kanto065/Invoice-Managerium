// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Discount = require("../models/discount/discount.model");
const Product = require("../models/product.model");
const DiscountUser = require("../models/discount/discount-user.model");
const ErrorHandler = require("../helper/error.helper");
const CategoryDiscount = require("../models/discount/category-discount");
const ProductDiscount = require("../models/discount/product-discount");
const TierProductDiscount = require("../models/discount/tier-product-discount");
const TierDiscount = require("../models/discount/tier-discount");

// ==> create a discount <==
exports.createDiscount = catchAsyncError(async (req, res, next) => {
  const {
    name,
    type, // "product" | "category" | "coupon" | "quantity"
    method, // "flat" | "percentage" | "bogo" | "tier"
    value,
    minQty,
    minCartValue,
    code,
    usageLimit,
    startDate,
    endDate,
    status,
    productIds, // array (if type = product)
    categoryIds, // array (if type = category)
    tierIds, // array (if method = tier)
  } = req.body;

  const existDisount = await Discount.findOne({ name });
  if (existDisount) {
    return next(new ErrorHandler("Discount already exist! Create another."));
  }

  // Step 1: Create the base discount
  const discount = await Discount.create({
    name,
    type,
    method,
    value,
    minQty,
    minCartValue,
    code,
    usageLimit,
    startDate,
    endDate,
    status,
  });

  // Step 2: Handle product-specific discounts
  if (type === "product" && method !== "bogo" && Array.isArray(productIds)) {
    const discountsToInsert = [];

    for (const pid of productIds) {
      const existProductDiscount = await ProductDiscount.findOne({
        productId: pid,
        // method: { $ne: "bogo" },
      });
      if (existProductDiscount) {
        await discount.deleteOne();
        return next(
          new ErrorHandler(
            "Product discount already exists for one of the products! Create another."
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        productId: pid,
        method,
        value,
      });
    }
    await ProductDiscount.insertMany(discountsToInsert);
  }
  // Step 3: Handle category-specific discounts
  if (type === "category" && Array.isArray(categoryIds)) {
    const discountsToInsert = [];

    for (const cid of categoryIds) {
      const existCategoryDiscount = await CategoryDiscount.findOne({
        categoryId: cid,
      });
      if (existCategoryDiscount) {
        await discount.deleteOne();

        return next(
          new ErrorHandler(
            "Category discount already exists for one of the categories! Create another."
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        categoryId: cid,
        method,
        value,
      });
    }

    await CategoryDiscount.insertMany(discountsToInsert);
  }

  // Step 4: Handle product BOGO discounts
  if (type === "quantity" && method === "bogo" && Array.isArray(productIds)) {
    const discountsToInsert = [];

    for (const pid of productIds) {
      const existProductDiscount = await ProductDiscount.findOne({
        productId: pid,
        // method: "bogo",
      });
      if (existProductDiscount) {
        await discount.deleteOne();
        return next(
          new ErrorHandler(
            "Product discount already exists for one of the products! Create another."
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        productId: pid,
        method,
        value,
      });
    }
    await ProductDiscount.insertMany(discountsToInsert);
  }
  // Step 5: Handle tier discounts
  if (
    type === "quantity" &&
    method === "tier" &&
    Array.isArray(productIds) &&
    Array.isArray(tierIds)
  ) {
    const discountsToInsert = [];
    for (const pid of productIds) {
      const existProductDiscount = await TierProductDiscount.findOne({
        productId: pid,
        method: "tier",
      });
      if (existProductDiscount) {
        await discount.deleteOne();
        return next(
          new ErrorHandler(
            "Product tier discount already exists for one of the products! Create another."
          )
        );
      }
      for (const tid of tierIds) {
        discountsToInsert.push({
          tierId: tid,
          discountId: discount._id,
          productId: pid,
        });
      }
    }

    await TierProductDiscount.insertMany(discountsToInsert);
  }

  return res.status(201).json({
    success: true,
    message: "Discount created successfully",
  });
});

// ==> create a product discount tier <==
exports.createDiscountTier = catchAsyncError(async (req, res, next) => {
  const { min, value } = req.body;

  const existDiscountTier = await TierDiscount.findOne({ min, value });
  if (existDiscountTier) {
    return next(
      new ErrorHandler("Discount tier already exist! Create another.")
    );
  }
  await TierDiscount.create({
    min,
    value,
  });

  return res.status(201).json({
    success: true,
    message: "Discount tier created successfully",
  });
});

// ==> get all discount tier <==
exports.getAllDiscountTier = catchAsyncError(async (req, res, next) => {
  const discountTiers = await TierDiscount.find();
  return res.status(200).json({
    success: true,
    discountTiers,
  });
});

// ==> update a discount  <==
exports.updateDiscount = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    type, // "product" | "category" | "coupon" | "quantity"
    method, // "flat" | "percentage" | "bogo" | "tier"
    value,
    minQty,
    minCartValue,
    code,
    usageLimit,
    startDate,
    endDate,
    status,
    productIds,
    categoryIds,
    tierIds,
  } = req.body;

  // Step 1: Find the discount
  const discount = await Discount.findById(id);
  if (!discount) {
    return next(new ErrorHandler("Discount not found!", 404));
  }

  // Step 2: Check if name is already taken by another discount
  const existDiscount = await Discount.findOne({ name, _id: { $ne: id } });
  if (existDiscount) {
    return next(
      new ErrorHandler("Discount name already exists! Choose another.", 400)
    );
  }

  // Step 3: Update main discount fields
  let updateDiscountData = {};
  if (name) updateDiscountData.name = name;
  if (type) updateDiscountData.type = type;
  if (method) updateDiscountData.method = method;
  if (value) updateDiscountData.value = value;
  if (minQty) updateDiscountData.minQty = minQty;
  if (minCartValue) updateDiscountData.minCartValue = minCartValue;
  if (code) updateDiscountData.code = code;
  if (usageLimit) updateDiscountData.usageLimit = usageLimit;
  if (startDate) updateDiscountData.startDate = startDate;
  if (endDate) updateDiscountData.endDate = endDate;
  if (status) updateDiscountData.status = status;

  await Discount.updateOne({ _id: discount._id }, { $set: updateDiscountData });

  // Step 4: Remove old associations (reset and recreate)
  await ProductDiscount.deleteMany({ discountId: discount._id });
  await CategoryDiscount.deleteMany({ discountId: discount._id });
  await TierProductDiscount.deleteMany({ discountId: discount._id });

  // Step 5: Recreate associations based on type/method
  if (type === "product" && method !== "bogo" && Array.isArray(productIds)) {
    const discountsToInsert = [];
    for (const pid of productIds) {
      const existProductDiscount = await ProductDiscount.findOne({
        productId: pid,
        discountId: { $ne: discount._id },
      });
      if (existProductDiscount) {
        return next(
          new ErrorHandler(
            "Product discount already exists for one of the products!",
            400
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        productId: pid,
        method,
        value,
      });
    }
    await ProductDiscount.insertMany(discountsToInsert);
  }

  if (type === "category" && Array.isArray(categoryIds)) {
    const discountsToInsert = [];
    for (const cid of categoryIds) {
      const existCategoryDiscount = await CategoryDiscount.findOne({
        categoryId: cid,
        discountId: { $ne: discount._id },
      });
      if (existCategoryDiscount) {
        return next(
          new ErrorHandler(
            "Category discount already exists for one of the categories!",
            400
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        categoryId: cid,
        method,
        value,
      });
    }
    await CategoryDiscount.insertMany(discountsToInsert);
  }

  if (type === "quantity" && method === "bogo" && Array.isArray(productIds)) {
    const discountsToInsert = [];
    for (const pid of productIds) {
      const existProductDiscount = await ProductDiscount.findOne({
        productId: pid,
        discountId: { $ne: discount._id },
      });
      if (existProductDiscount) {
        return next(
          new ErrorHandler(
            "Product discount already exists for one of the products!",
            400
          )
        );
      }
      discountsToInsert.push({
        discountId: discount._id,
        productId: pid,
        method,
        value,
      });
    }
    await ProductDiscount.insertMany(discountsToInsert);
  }

  if (
    type === "quantity" &&
    method === "tier" &&
    Array.isArray(productIds) &&
    Array.isArray(tierIds)
  ) {
    const discountsToInsert = [];
    for (const pid of productIds) {
      const existProductDiscount = await TierProductDiscount.findOne({
        productId: pid,
        discountId: { $ne: discount._id },
      });
      if (existProductDiscount) {
        return next(
          new ErrorHandler(
            "Product tier discount already exists for one of the products!",
            400
          )
        );
      }
      for (const tid of tierIds) {
        discountsToInsert.push({
          tierId: tid,
          discountId: discount._id,
          productId: pid,
        });
      }
    }
    await TierProductDiscount.insertMany(discountsToInsert);
  }

  return res.status(200).json({
    success: true,
    message: "Discount updated successfully",
  });
});

// ==> get all product discount  <==
exports.getAllDiscount = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;

  const resData = await Discount.aggregate([
    {
      $facet: {
        discounts: [
          // { $match: { status: "active" } },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (resData[0].discounts.length === 0) {
    return res.status(200).json({
      success: true,
      discounts: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    discounts: resData[0].discounts,
    total: resData[0].total[0].count,
  });
});

// ==> get a product discount  <==
exports.getSingleDiscount = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Discount id is required!", 400));
  }

  const discount = await Discount.findById(id);
  if (!discount || discount.status !== "active") {
    return next(new ErrorHandler("Discount not found!", 404));
  }

  let associations = {};

  if (discount.type === "product" && discount.method !== "bogo") {
    let products = await ProductDiscount.find({ discountId: id });
    associations.products = products?.map((p) => p.productId);
  }

  if (discount.type === "category") {
    let categories = await CategoryDiscount.find({ discountId: id });
    associations.categories = categories?.map((c) => c.categoryId);
  }

  if (discount.type === "quantity" && discount.method === "bogo") {
    let products = await ProductDiscount.find({ discountId: id });
    associations.products = products?.map((b) => b.productId);
  }

  if (discount.type === "quantity" && discount.method === "tier") {
    let tiers = await TierProductDiscount.find({ discountId: id });
    associations.products = [
      ...new Set((tiers ?? []).map((t) => t.productId.toString())),
    ];

    associations.tiers = [
      ...new Set((tiers ?? []).map((t) => t.tierId.toString())),
    ];
  }

  return res.status(200).json({
    success: true,
    discount,
    associations,
  });
});

// ==> delete a product discount  <==
exports.deleteDiscount = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Product discount id is requried");
  }
  const existDisount = await Discount.findById(id);
  if (!existDisount) {
    return next(new ErrorHandler("Product discount not found!", 404));
  }

  await Discount.deleteOne({ _id: existDisount._id });
  await ProductDiscount.deleteMany({ discountId: existDisount._id });
  await CategoryDiscount.deleteMany({ discountId: existDisount._id });
  await TierProductDiscount.deleteMany({ discountId: existDisount._id });

  return res.status(200).json({
    success: true,
    message: "Product discount deleted successfully!",
  });
});

// ==> active / inactive a product discount <==
exports.activeInactiveDiscount = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Product discount id is requried");
  }
  const { status } = req.body;

  const existDisount = await Discount.findById(id);
  if (!existDisount) {
    return next(new ErrorHandler("Product discount not found!", 404));
  }
  await Discount.updateOne(
    {
      _id: id,
    },
    { $set: { status } }
  );
  return res.status(200).json({
    success: true,
    message: "Product discount status updated!",
  });
});

// ==> delete a product discount tier  <==
exports.deleteDiscountTier = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Product discount tier id is requried");
  }
  const existTierDisount = await TierDiscount.findById(id);
  if (!existTierDisount) {
    return next(new ErrorHandler("Product tier discount not found!", 404));
  }

  await existTierDisount.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product tier discount deleted successfully!",
  });
});
