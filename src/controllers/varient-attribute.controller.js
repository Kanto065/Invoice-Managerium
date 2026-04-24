// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const VarientAttribute = require("../models/varient-attribut.model");
const ErrorHandler = require("../helper/error.helper");

// ==> create a new varient attribute <==
exports.createVarientAttribute = catchAsyncError(async (req, res, next) => {
  const { name, value } = req.body;

  const isVarientAttrExist = await VarientAttribute.findOne({ name, value });
  if (isVarientAttrExist) {
    return next(new ErrorHandler("Varient attribute already exists!", 200));
  }

  await VarientAttribute.create({
    name,
    value,
  });

  return res.status(201).json({
    success: true,
    message: `Varient attribute created successfully!`,
  });
});

// ==> get all varient attributes <==
exports.getAllVarientAttributes = catchAsyncError(async (req, res, next) => {
  const attributes = await VarientAttribute.find();

  return res.status(200).json({
    success: true,
    attributes,
  });
});

// ==> delete a varient attributes <==
exports.deleteVarientAttributes = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Varient attribute id is required!", 400));
  }
  const existVarientAttribute = await VarientAttribute.findById(id);
  if (!existVarientAttribute) {
    return next(new ErrorHandler("Varient attribute not found!", 404));
  }

  await existVarientAttribute.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Varient attribute deleted successfully!`,
  });
});
