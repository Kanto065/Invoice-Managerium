// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Shipping = require("../models/shipping.model");
const ErrorHandler = require("../helper/error.helper");

// ==> create a shipping <==
exports.createShipping = catchAsyncError(async (req, res, next) => {
  const { division, cost } = req.body;

  const existShipping = await Shipping.findOne({ division });
  if (existShipping) {
    return next(new ErrorHandler("Shipping already exist!", 400));
  }

  // adding new file
  await Shipping.create({
    division,
    cost,
  });

  return res.status(201).json({
    success: true,
    message: `One shipping created successfully!`,
  });
});

// ==> update a shipping <==
exports.updateShipping = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { division, cost } = req.body;
  if (!id) {
    return next(new ErrorHandler("Shipping id is requried", 400));
  }
  const existShipping = await Shipping.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping not found!", 404));
  }
  let updateData = {};
  if (division) {
    updateData.division = division;
  }
  if (cost) {
    updateData.cost = cost;
  }

  await Shipping.updateOne({ _id: id }, { $set: updateData });
  return res.status(200).json({
    success: true,
    message: "Shipping updated successfully!",
  });
});

// ==> get all shipping  <==
exports.getAllShipping = catchAsyncError(async (req, res, next) => {
  const shippingCosts = await Shipping.find();
  return res.status(200).json({
    success: true,
    shippingCosts,
  });
});

// ==> get a single shipping  <==
exports.getSingleShipping = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Shipping id is requried", 400));
  }
  const existShipping = await Shipping.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping not found!", 404));
  }
  return res.status(200).json({
    success: true,
    shippingCost: existShipping,
  });
});

// ==> delete a shipping  <==
exports.deleteShipping = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Shipping id is requried");
  }
  const existShipping = await Shipping.findById(id);
  if (!existShipping) {
    return next(new ErrorHandler("Shipping not found!", 404));
  }
  await Shipping.deleteOne({ _id: id });

  return res.status(200).json({
    success: true,
    message: "Shipping deleted successfully!",
  });
});

// ==> get all divisions <==
exports.getDivisions = catchAsyncError(async (req, res, next) => {
  const divisions = [
    { label: "All over BD", value: "All over BD" },
    { label: "Insite City", value: "Insite City" },
    { label: "Barishal", value: "Barishal" },
    { label: "Chattogram", value: "Chattogram" },
    { label: "Dhaka", value: "Dhaka" },
    { label: "Khulna", value: "Khulna" },
    { label: "Mymensingh", value: "Mymensingh" },
    { label: "Rajshahi", value: "Rajshahi" },
    { label: "Rangpur", value: "Rangpur" },
    { label: "Sylhet", value: "Sylhet" },
  ];
  return res.status(200).json({
    success: true,
    divisions,
  });
});
