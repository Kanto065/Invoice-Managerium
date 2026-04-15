// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const ShippingAddress = require("../models/shipping-address.model");
const ErrorHandler = require("../helper/error.helper");
const Order = require("../models/order.model");

// ==> create a shipping address <==
exports.createShippingAddress = catchAsyncError(async (req, res, next) => {
  const { street, city, postCode, country } = req.body;
  const userId = req.user._id;

  const existShipping = await ShippingAddress.findOne({
    userId,
    street,
    city,
    postCode,
    country,
  });
  if (existShipping) {
    return next(new ErrorHandler("Shipping address already exists!", 400));
  }

  await ShippingAddress.create({
    userId,
    street,
    city,
    postCode,
    country,
  });

  return res.status(201).json({
    success: true,
    message: `One shipping address created successfully!`,
  });
});

// ==> update a shipping address  <==
exports.updateShippingAddress = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { street, city, postCode, country } = req.body;

  if (!id) {
    return new ErrorHandler("Shipping address id is requried");
  }
  const existShipping = await ShippingAddress.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping address not found!", 404));
  }
  let updateData = {};
  if (street) {
    updateData.street = street;
  }
  if (city) {
    updateData.city = city;
  }
  if (postCode) {
    updateData.postCode = postCode;
  }
  if (country) {
    updateData.country = country;
  }

  await ShippingAddress.updateOne({ _id: id }, { $set: updateData });

  return res.status(200).json({
    success: true,
    message: "Shipping address updated successfully!",
  });
});

// ==> get all shipping address  <==
exports.getAllShippingAddress = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const addresses = await ShippingAddress.find({
    userId,
  }).sort({ createdAt: -1 });

  if (addresses.length === 0) {
    return res.status(200).json({
      success: true,
      addresses: [],
    });
  }
  return res.status(200).json({
    success: true,
    addresses,
  });
});

// ==> get a shipping address <==
exports.getSingleShippingAddress = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Shipping address id is requried");
  }
  const existShipping = await ShippingAddress.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping address not found!", 404));
  }
  return res.status(200).json({
    success: true,
    address: existShipping,
  });
});

// ==> delete a shipping address  <==
exports.deleteShippingAddress = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Shipping address id is requried");
  }
  const existShipping = await ShippingAddress.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping address not found!", 404));
  }

  const existInOrder = await Order.findOne({ shippingAddressId: id });
  if (existInOrder) {
    return next(new ErrorHandler("Shipping address is already in use!", 400));
  }

  await existShipping.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Shipping address deleted successfully!",
  });
});
