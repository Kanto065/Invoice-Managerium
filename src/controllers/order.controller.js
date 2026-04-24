// ==> external import <==
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const OrderItem = require("../models/order-item.model");
const ErrorHandler = require("../helper/error.helper");
const User = require("../models/user.model");
const Varient = require("../models/varient.model");
const DiscountUser = require("../models/discount/discount-user.model");
const CartItem = require("../models/cart/cart-item.model");
const Cart = require("../models/cart/cart.model");

// ==> create a new order <==
exports.createOrder = catchAsyncError(async (req, res, next) => {
  const {
    cartId,
    phone,
    shippingAddressId,
    totalAmount,
    shippingAmount,
    paymentType,
    transactionId,
  } = req.body;

  const userId = req?.user?._id;

  // Update phone if provided
  if (phone) {
    await User.updateOne({ _id: userId }, { $set: { phone } });
  }

  // Get cart
  const userCart = await Cart.findById(cartId);
  if (!userCart) {
    return next(new ErrorHandler(`User cart is not found!`, 400));
  }

  // Get cart items
  const items = await CartItem.find({ cartId: userCart._id });
  if (!items?.length) {
    return next(new ErrorHandler("Cart is empty!", 400));
  }

  // Validate all items before creating order
  for (const item of items) {
    const existProduct = await Product.findById(item.productId);
    if (!existProduct) {
      return next(new ErrorHandler("Product not found!", 400));
    }

    if (item.varientId) {
      const existVarient = await Varient.findById(item.varientId);
      if (!existVarient) {
        return next(new ErrorHandler("Varient not found!", 400));
      }
      if (existVarient.stock < item.quantity) {
        return next(
          new ErrorHandler(
            `${existProduct.name} has only ${existVarient.stock} in stock.`,
            400
          )
        );
      }
    } else {
      if (existProduct.stock < item.quantity) {
        return next(
          new ErrorHandler(
            `${existProduct.name} has only ${existProduct.stock} in stock.`,
            400
          )
        );
      }
    }
  }

  // ---- Create ONE order ----
  const orderId = "ORD-" + uuidv4().substring(0, 20);
  const grossAmount = totalAmount + shippingAmount; // +shipping, +tax, -discount will be gross total
  const netAmount = grossAmount; // -platform fee , -cost of goods will be net total

  const newOrder = await Order.create({
    orderId,
    userId,
    shippingAddressId,
    totalAmount,
    grossAmount,
    shippingAmount,
    netAmount,
    paymentType,
    transactionId,
  });

  // ---- Insert all items & update stock ----
  for (const item of items) {
    const existProduct = await Product.findById(item.productId);

    await OrderItem.create({
      orderId: newOrder._id,
      productId: item.productId,
      varientId: item.varientId || null,
      name: existProduct.name,
      image: item.image || "",
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    });

    if (item.varientId) {
      // Decrement variant stock
      await Varient.updateOne(
        { _id: item.varientId },
        { $inc: { stock: -item.quantity } }
      );
      // Increment sold count on product
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { sold: item.quantity } }
      );
    } else {
      // Decrement main product stock
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
    }
  }

  // ---- Clear cart ----
  await CartItem.deleteMany({ cartId: userCart._id });
  await Cart.deleteOne({ _id: userCart._id });
  await DiscountUser.deleteOne({ userId, cartId: userCart._id });

  return res.status(201).json({
    success: true,
    message: `Order placed successfully!`,
    orderId,
  });
});

// ==> get all orders <==
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;
  const resData = await Order.aggregate([
    {
      $facet: {
        orders: [
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $lookup: {
              from: "orderitems",
              localField: "_id",
              foreignField: "orderId",
              as: "orderitems",
            },
          },
          {
            $lookup: {
              from: "shippingaddresses",
              localField: "shippingAddressId",
              foreignField: "_id",
              as: "shippingaddress",
            },
          },
          {
            $project: {
              __v: 0,
              "user.refreshToken": 0,
              "user.password": 0,
              "user.resetPasswordExpire": 0,
              "user.__v": 0,
              "user.resetPasswordToken": 0,
              "user.emailVerifyExpire": 0,
              "user.emailVerifyToken": 0,
              "orderitems.__v": 0,
              "shippingaddress.__v": 0,
            },
          },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (resData[0].orders.length === 0) {
    return res.status(200).json({
      success: true,
      orders: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    orders: resData[0].orders,
    total: resData[0].total[0].count,
  });
});

// ==> get all my orders <==
exports.getMyOrders = catchAsyncError(async (req, res, next) => {
  // Pagination
  const pageno = req.query?.page ? Number(req.query.page) : 1;
  const perpage = req.query?.limit ? Number(req.query.limit) : 10;

  if (isNaN(pageno) || pageno < 1)
    return next(new Error("Invalid page number"));
  if (isNaN(perpage) || perpage < 1) return next(new Error("Invalid limit"));

  const skip = (pageno - 1) * perpage;
  const userId = req.user?._id;

  // Filtering
  const { status = "all", search } = req.query;
  let match = { userId };
  if (status !== "all") {
    match.status = status;
  }
  if (search) {
    match.orderId = { $regex: search, $options: "i" };
  }

  // Lookup stages
  const lookups = [
    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderitems",
      },
    },
    {
      $lookup: {
        from: "shippingaddresses",
        localField: "shippingAddressId",
        foreignField: "_id",
        as: "shippingaddress",
      },
    },
    {
      $project: {
        __v: 0,
        "orderitems.__v": 0,
        "shippingaddress.__v": 0,
      },
    },
  ];

  // Aggregation
  const resData = await Order.aggregate([
    {
      $facet: {
        orders: [
          { $match: match },
          ...lookups,
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [{ $match: match }, { $count: "count" }],
      },
    },
  ]);

  const orders = resData[0]?.orders || [];
  const totalCount = resData[0]?.total[0]?.count ?? 0;

  return res.status(200).json({
    success: true,
    orders,
    total: totalCount,
  });
});

// ==> get single order <==
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Order id is required", 400));
  }
  const existOrder = await Order.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderitems",
      },
    },
    {
      $lookup: {
        from: "shippingaddresses",
        localField: "shippingAddressId",
        foreignField: "_id",
        as: "shippingaddress",
      },
    },
    {
      $project: {
        __v: 0,
        "user.refreshToken": 0,
        "user.password": 0,
        "user.resetPasswordExpire": 0,
        "user.__v": 0,
        "user.resetPasswordToken": 0,
        "user.emailVerifyExpire": 0,
        "user.emailVerifyToken": 0,
        "orderitems.__v": 0,
        "shippingaddress.__v": 0,
      },
    },
  ]);
  if (existOrder.length === 0) {
    return next(new ErrorHandler("Order not found!", 404));
  }

  return res.status(200).json({
    success: true,
    order: existOrder[0],
  });
});

// ==> change order status <==
exports.changeOrderStatus = catchAsyncError(async (req, res, next) => {
  const { status, paymentStatus } = req.body;
  const id = req.params.id;

  if (!id) {
    return next(new ErrorHandler("Order id is required!", 400));
  }

  const existOrder = await Order.findById(id);
  if (!existOrder) {
    return next(new ErrorHandler("Order not found!", 404));
  }
  // If already cancelled, don't do it again
  if (existOrder.status === "cancelled" && status === "cancelled") {
    return next(new ErrorHandler("Order already cancelled!", 400));
  }

  let updateData = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  const orderItems = await OrderItem.find({ orderId: existOrder._id });
  if (orderItems.length < 1) {
    return next(new ErrorHandler("No order items found!", 400));
  }
  if (status === "cancelled") {
    for (const item of orderItems) {
      const { productId, varientId, quantity } = item;

      if (varientId) {
        // Restore variant stock
        await Varient.updateOne(
          { _id: varientId },
          { $inc: { stock: quantity } }
        );

        // Restore sold count
        await Product.updateOne(
          { _id: productId },
          { $inc: { sold: -quantity } }
        );
      } else {
        // Product without variant
        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: quantity, sold: -quantity } }
        );
      }
    }
  }
  await Order.updateOne(
    {
      _id: new mongoose.Types.ObjectId(id),
    },
    { $set: updateData }
  );

  return res.status(200).json({
    success: true,
    message: "Order status updated!",
  });
});

// ==> delete a order  <==
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Order id is required", 400));
  }
  const existOrder = await Order.findById(id);
  if (!existOrder) {
    return next(new ErrorHandler("Order not found!", 404));
  }
  await existOrder.deleteOne();
  await OrderItem.deleteMany({ orderId: id });
  return res.status(200).json({
    success: true,
    message: `Order deleted successfully!`,
  });
});

// ==> monthly sales <==
exports.getMonthlySales = catchAsyncError(async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
        status: { $nin: ["cancelled", "returned", "refunded"] },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$netAmount" },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formatted = Array.from({ length: 12 }, (_, i) => {
    const monthData = monthlySales.find((m) => m._id === i + 1);
    return {
      month: new Date(0, i).toLocaleString("default", { month: "short" }),
      totalSales: monthData?.totalSales || 0,
      totalOrders: monthData?.totalOrders || 0,
    };
  });

  res.status(200).json({ success: true, year, data: formatted });
});

// ==> profit summery <==
exports.getProfitSummary = catchAsyncError(async (req, res, next) => {
  const pipeline = [
    {
      $group: {
        _id: null,
        totalGross: { $sum: "$grossAmount" },
        totalNet: { $sum: "$netAmount" },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalGross: 1,
        totalNet: 1,
        profit: { $subtract: ["$totalGross", "$totalNet"] },
        margin: {
          $cond: [
            { $eq: ["$totalGross", 0] },
            0,
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$totalGross", "$totalNet"] },
                    "$totalGross",
                  ],
                },
                100,
              ],
            },
          ],
        },
        totalOrders: 1,
      },
    },
  ];

  let [summary] = await Order.aggregate(pipeline);
  if (summary) {
    summary.margin = Math.round(summary.margin);
  }

  res.status(200).json({
    success: true,
    summary: summary || {
      totalGross: 0,
      totalNet: 0,
      profit: 0,
      margin: 0,
      totalOrders: 0,
    },
  });
});

// ==> stock overview <==
exports.getStockOverview = catchAsyncError(async (req, res, next) => {
  const lowStockProducts = await Product.find({
    stock: { $lte: 5 },
    status: "active",
  })
    .sort({ stock: 1 })
    .limit(10)
    .select("name stock price");

  res.status(200).json({
    success: true,
    lowStockProducts,
  });
});
