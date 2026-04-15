// ==> external import <==
const fs = require("fs");
const path = require("path");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Brand = require("../models/brand.model");
const ErrorHandler = require("../helper/error.helper");

// ==> create a product brand <==
exports.createBrand = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;

  const existBrand = await Brand.findOne({ name });
  if (existBrand) {
    return next(new ErrorHandler("Brand already exist!", 400));
  }

  // adding new file
  await Brand.create({
    name,
  });

  return res.status(201).json({
    success: true,
    message: `One brand created successfully!`,
  });
});

// ==> update a product brand  <==
exports.updateBrand = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!id) {
    return next(new ErrorHandler("Brand id is requried", 400));
  }
  const existBrand = await Brand.findById(id);
  if (!existBrand) {
    return next(new ErrorHandler("Product brand not found!", 404));
  }
  let updateData = {};
  if (name) {
    updateData.name = name;
  }

  await Brand.updateOne({ _id: id }, { $set: updateData });
  return res.status(200).json({
    success: true,
    message: "Product brand updated successfully!",
  });
});

// ==> get all product brands  <==
exports.getAllBrand = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;

  const resData = await Brand.aggregate([
    {
      $facet: {
        brands: [
          { $match: { status: "active" } },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (resData[0].brands.length === 0) {
    return res.status(200).json({
      success: true,
      brands: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    brands: resData[0].brands,
    total: resData[0].total[0].count,
  });
});

// ==> get a product brand  <==
exports.getSingleBrand = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Brand id is requried", 400));
  }
  const existBrand = await Brand.findOne({ _id: id, status: "active" });
  if (!existBrand) {
    return next(new ErrorHandler("Brand not found!", 404));
  }
  return res.status(200).json({
    success: true,
    brand: existBrand,
  });
});

// ==> delete a product brand  <==
exports.deleteBrand = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Brand id is requried");
  }
  const existBrand = await Brand.findById(id);
  if (!existBrand) {
    return next(new ErrorHandler("Brand not found!", 404));
  }
  await existBrand.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Brand deleted successfully!",
  });
});

// ==> active / inactive a product brand <==
exports.activeInactiveBrand = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Brand id is requried");
  }
  const { status } = req.body;

  const existBrand = await Brand.findById(id);
  if (!existBrand) {
    return next(new ErrorHandler("Brand not found!", 404));
  }

  await Brand.updateOne(
    {
      _id: id,
    },
    { $set: { status } }
  );
  return res.status(200).json({
    success: true,
    message: "Brand status updated!",
  });
});
