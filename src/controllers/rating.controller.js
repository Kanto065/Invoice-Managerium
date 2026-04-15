// ==> external import <==
const mongoose = require("mongoose");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Rating = require("../models/rating.model");
const Product = require("../models/product.model");
const ErrorHandler = require("../helper/error.helper");

// ==> create a product rating <==
exports.createProductRating = catchAsyncError(async (req, res, next) => {
  const { productId, rating, review } = req.body;
  const userId = req.user._id;

  const existProduct = await Product.findById(productId);

  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 400));
  }
  const existRating = await Rating.findOne({ productId, userId });
  if (existRating) {
    return next(new ErrorHandler("You have already rated this product!", 200));
  }

  await Rating.create({
    productId,
    userId,
    rating,
    review,
  });

  const totalRatedUsers = await Rating.find({ productId, status: "active" });

  let totalRating = totalRatedUsers.reduce((acc, val) => {
    return (acc += parseFloat(val.rating));
  }, 0);

  let avgrating = (totalRating / totalRatedUsers.length).toFixed(1);
  await Product.updateOne({ _id: productId }, { $set: { rating: avgrating } });

  return res.status(201).json({
    success: true,
    message: `Rating added successfully!`,
  });
});

// ==> get all product rating  <==
exports.getAllProductRating = catchAsyncError(async (req, res, next) => {
  const pageno = req.query.page ? Number(req.query.page) : 1;
  const perpage = req.query.limit ? Number(req.query.limit) : 10;
  const skip = (pageno - 1) * perpage;

  const resData = await Rating.aggregate([
    {
      $facet: {
        ratings: [
          {
            $match: {
              status: "active",
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
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              _id: 1,
              rating: 1,
              review: 1,
              createdAt: 1,
              "user.name": 1,
              "user.email": 1,
              "product.name": 1,
              "product.image": 1,
            },
          },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [
          {
            $match: {
              status: "active",
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  if (resData[0].ratings.length === 0) {
    return res.status(200).json({
      success: true,
      rating: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    rating: resData[0].ratings,
    total: resData[0].total[0].count,
  });
});

// ==> get single product rating  <==
exports.getSingleProductRating = catchAsyncError(async (req, res, next) => {
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req?.query?.limit) : 10;
  const skip = (pageno - 1) * perpage;
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Product id is required!", 400));
  }
  const resData = await Rating.aggregate([
    {
      $facet: {
        ratings: [
          {
            $match: {
              productId: new mongoose.Types.ObjectId(id),
              status: "active",
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
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              _id: 1,
              rating: 1,
              review: 1,
              createdAt: 1,
              "user.name": 1,
              "user.email": 1,
              "user.image": 1,
              "product.name": 1,
              "product.image": 1,
            },
          },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [
          {
            $match: {
              productId: new mongoose.Types.ObjectId(id),
              status: "active",
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  if (resData[0].ratings.length === 0) {
    return res.status(200).json({
      success: true,
      rating: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    rating: resData[0].ratings,
    total: resData[0].total[0].count,
  });
});

// ==> active / inactive a rating <==
exports.activeInactiveRating = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;

  const id = req.params.id;
  if (!id) {
    return new ErrorHandler("Rating id is requried!");
  }
  const existRating = await Rating.findById(id);
  if (!existRating) {
    return next(new ErrorHandler("Rating not found!", 404));
  }

  await Rating.updateOne(
    {
      _id: id,
    },
    { $set: { status } }
  );
  return res.status(200).json({
    success: true,
    message: "Rating status updated!",
  });
});

// ==> delete a rating <==
exports.deleteRating = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const { productId } = req.body;
  if (!id) {
    return new ErrorHandler("Rating id is requried!");
  }

  const existProduct = await Product.findById(productId);
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 400));
  }
  const existRating = await Rating.findById(id);
  if (!existRating) {
    return next(new ErrorHandler("Rating not found!", 404));
  }

  await existRating.deleteOne();

  const totalRatedUsers = await Rating.find({ productId, status: "active" });
  if (totalRatedUsers.length > 0) {
    let totalRating = totalRatedUsers.reduce((acc, val) => {
      return (acc += parseFloat(val.rating));
    }, 0);

    let avgrating = (totalRating / totalRatedUsers.length).toFixed(1);
    await Product.updateOne(
      { _id: productId },
      { $set: { rating: avgrating } }
    );
  } else {
    await Product.updateOne({ _id: productId }, { $set: { rating: 0 } });
  }

  return res.status(200).json({
    success: true,
    message: "Rating deleted successfully!",
  });
});
