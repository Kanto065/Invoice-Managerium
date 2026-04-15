// ==> external import <==
const path = require("path");
const fs = require("fs");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Varient = require("../models/varient.model");
const Product = require("../models/product.model");
const ErrorHandler = require("../helper/error.helper");

// ==> create a new varient <==
exports.createVarient = catchAsyncError(async (req, res, next) => {
  const { productId, sku, price, stock } = req.body;

  const isVarientExist = await Varient.findOne({ sku });
  if (isVarientExist) {
    return next(new ErrorHandler("Varient already exists!", 200));
  }
  const productExist = await Product.findOne({ _id: productId });
  if (!productExist) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  if (!req.file) {
    return next(new ErrorHandler("Varient image not found!", 400));
  }

  await Varient.create({
    productId,
    sku,
    price,
    stock,
    image: req.file.filename,
  });

  return res.status(201).json({
    success: true,
    message: `Varient created successfully!`,
  });
});

// ==> update a varient <==
exports.updateVarient = catchAsyncError(async (req, res, next) => {
  const { productId, sku, price, stock } = req.body;
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Varient id is requried!");
  }
  const existVarient = await Varient.findById(id);
  if (!existVarient) {
    return next(new ErrorHandler("Varient not found!", 404));
  }
  let updataData = {};

  if (productId) {
    updataData.productId = productId;
  }
  if (sku) {
    updataData.sku = sku;
  }
  if (price) {
    updataData.price = price;
  }
  if (stock) {
    updataData.stock = stock;
  }

  if (req.file) {
    updataData.image = req.file.filename;
  }

  await Varient.updateOne({ _id: id }, { $set: updataData });

  return res.status(200).json({
    success: true,
    message: `Varient updated successfully!`,
  });
});

// ==> get all varients <==
exports.getAllVarients = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;
  const resData = await Varient.aggregate([
    {
      $facet: {
        varients: [{ $skip: skip }, { $limit: perpage }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (resData[0].varients.length === 0) {
    return res.status(200).json({
      success: true,
      varients: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    varients: resData[0].varients,
    total: resData[0].total[0].count,
  });
});

// ==> get a varient  <==
exports.getSingleVarient = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Varient id is requried!");
  }
  const existVarient = await Varient.findById(id);
  if (!existVarient) {
    return next(new ErrorHandler("Varient not found!", 404));
  }

  return res.status(200).json({
    success: true,
    varient: existVarient,
  });
});
// ==> delete a varient  <==
exports.deleteVarient = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Varient id is requried!");
  }
  const existVarient = await Varient.findById(id);
  if (!existVarient) {
    return next(new ErrorHandler("Varient not found!", 404));
  }
  // removing existing file
  const existFilePath = path.join(
    __dirname,
    "../uploads/image/",
    existVarient.image
  );
  fs.access(existFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(existFilePath, (err) => {
        if (err) {
          return next(new ErrorHandler("Varient image not deleted!", 400));
        }
      });
    }
  });

  await existVarient.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Varient deleted successfully!`,
  });
});
