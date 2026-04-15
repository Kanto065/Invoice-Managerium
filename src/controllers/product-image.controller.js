// ==> external import <==
const path = require("path");
const fs = require("fs");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const ProductImage = require("../models/product-image.model");
const ErrorHandler = require("../helper/error.helper");
const ProductImages = require("../models/product-image.model");
const Product = require("../models/product.model");

// ==> create a product image <==
exports.createProductImage = catchAsyncError(async (req, res, next) => {
  const { productId } = req.body;

  if (!req.file) {
    return next(new ErrorHandler("Image not found!", 400));
  }

  const existProduct = await Product.findById(productId);
  if (!existProduct) {
    // removing existing file
    const existFilePath = path.join(
      __dirname,
      "../uploads/image/",
      req.file.filename
    );
    fs.access(existFilePath, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(existFilePath, (err) => {
          if (err) {
            return next(new ErrorHandler("Product image not deleted!", 400));
          }
        });
      }
    });
    return next(new ErrorHandler("Product not found!", 404));
  }
  // adding new file
  await ProductImage.create({
    productId: productId,
    image: req.file.filename,
  });

  return res.status(201).json({
    success: true,
    message: `Product image uploaded successfully!`,
  });
});

// ==> update a product image  <==
exports.updateProductImage = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;

  if (!id) {
    return next(new ErrorHandler("Product image id is required!", 400));
  }

  if (!req.file) {
    return next(new ErrorHandler("Product image not found!", 400));
  }
  const existImage = await ProductImage.findById(id);
  if (!existImage) {
    return next(new ErrorHandler("Product image not found!", 400));
  }
  // removing existing file
  const existFilePath = path.join(
    __dirname,
    "../uploads/image/",
    existImage.image
  );
  fs.access(existFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(existFilePath, (err) => {
        if (err) {
          return next(new ErrorHandler("Product image not deleted!", 400));
        }
      });
    }
  });

  // adding new file
  await ProductImage.updateOne(
    { _id: id },
    { $set: { image: req.file.filename } }
  );
  return res.status(200).json({
    success: true,
    message: "Product image updated successfully!",
  });
});

// ==> get all product images with product info  <==
exports.getAllProductImages = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;

  const resData = await ProductImages.aggregate([
    // join product collection
    {
      $lookup: {
        from: "products", // collection name in MongoDB (make sure this matches your actual name)
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    // flatten product array
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

    // paginate with $facet
    {
      $facet: {
        images: [{ $skip: skip }, { $limit: perpage }],
        total: [{ $count: "count" }],
      },
    },
  ]);

  // handle empty result
  if (!resData.length || resData[0].images.length === 0) {
    return res.status(200).json({
      success: true,
      images: [],
      total: 0,
    });
  }

  return res.status(200).json({
    success: true,
    images: resData[0].images,
    total: resData[0].total[0]?.count || 0,
  });
});

// ==> get a product image  <==
exports.getSingleProductImage = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Product image id is requried");
  }
  const existProductImage = await ProductImage.findById(id);
  if (!existProductImage) {
    return next(new ErrorHandler("Product image not found!", 404));
  }
  return res.status(200).json({
    success: true,
    image: existProductImage,
  });
});

// ==> delete a product image  <==
exports.deleteProductImage = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Product image id is requried");
  }
  const existProductImage = await ProductImage.findById(id);
  const totalProductImages = await ProductImage.find({
    productId: existProductImage?.productId,
  });
  if (totalProductImages?.length < 2) {
    return next(new ErrorHandler("Product image must be at least one!", 404));
  }
  if (!existProductImage) {
    return next(new ErrorHandler("Product image not found!", 404));
  }

  // removing existing file
  const existFilePath = path.join(
    __dirname,
    "../uploads/image/",
    existProductImage.image
  );
  fs.access(existFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(existFilePath, (err) => {
        if (err) {
          return next(new ErrorHandler("Product image not deleted!", 400));
        }
      });
    }
  });
  await existProductImage.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Product image deleted successfully!",
  });
});
