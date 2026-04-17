// ==> external import <==
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Category = require("../models/category.model");
const ErrorHandler = require("../helper/error.helper");
const { nestCategories } = require("../utils");

// ==> create a product category <==
exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name, parentId } = req.body;

  const existCategory = await Category.findOne({ name, parentId });
  if (existCategory) {
    return next(new ErrorHandler("Category already exist!", 400));
  }

  if (!req.file) {
    return next(new ErrorHandler("Category image not found!", 400));
  }

  // adding new file
  await Category.create({
    name,
    slug: slugify(name, { lower: true }),
    image: req.file.filename,
    parentId: parentId ? parentId : null,
  });

  return res.status(201).json({
    success: true,
    message: `One category created successfully!`,
  });
});

// ==> update a product category  <==
exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const { name, parentId } = req.body;
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Category id is required", 400));
  }
  const existCategory = await Category.findById(req?.params?.id);
  if (!existCategory) {
    return next(new ErrorHandler("Product category not found!", 404));
  }
  let updateData = {};
  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true });
  }
  if (parentId) {
    updateData.parentId = parentId;
  }
  if (req.file) {
    if (existCategory.image) {
      // removing existing file
      const existFilePath = path.join(
        __dirname,
        "../uploads/image/",
        existCategory.image
      );
      fs.access(existFilePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(existFilePath, (err) => {
            if (err) {
              return next(
                new ErrorHandler("Product category image not deleted!", 400)
              );
            }
          });
        }
      });
    }

    // adding new file
    updateData.image = req.file.filename;
  }
  await Category.updateOne({ _id: id }, { $set: updateData });

  return res.status(200).json({
    success: true,
    message: "Product category updated successfully!",
  });
});

// ==> get all flat product categories  <==
exports.getFlatAllCategory = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find({
    status: "active",
  });

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      categories: [],
    });
  }
  return res.status(200).json({
    success: true,
    categories,
  });
});

// ==> get all product categories  <==
exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find({
    status: "active",
  });

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      categories: [],
    });
  }
  const nested = nestCategories([...categories]);
  return res.status(200).json({
    success: true,
    categories: nested,
  });
});

// ==> get all parent categories  <==
exports.getAllParentCategory = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find({
    status: "active",
    parentId: null,
  });

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      categories: [],
    });
  }
  return res.status(200).json({
    success: true,
    categories,
  });
});
// ==> get all child categories  <==
exports.getAllChildCategory = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const categories = await Category.find({
    status: "active",
    parentId: id,
  });

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      categories: [],
    });
  }
  return res.status(200).json({
    success: true,
    categories,
  });
});

// ==> get a product category  <==
exports.getSingleCategory = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Category id is required", 400));
  }
  const existCategory = await Category.findOne({ _id: id, status: "active" });
  if (!existCategory) {
    return next(new ErrorHandler("Category not found!", 404));
  }
  return res.status(200).json({
    success: true,
    category: existCategory,
  });
});

// ==> get all category discounts  <==
exports.getAllCategoryDiscount = catchAsyncError(async (req, res, next) => {
  const now = new Date();

  const discountCategories = await Category.aggregate([
    // 🔹 Join with categorydiscounts
    {
      $lookup: {
        from: "categorydiscounts",
        localField: "_id",
        foreignField: "categoryId",
        as: "categoryDiscounts",
      },
    },
    {
      $unwind: {
        path: "$categoryDiscounts",
        preserveNullAndEmptyArrays: false,
      },
    }, // ensure only categories with discounts

    // 🔹 Join with discounts
    {
      $lookup: {
        from: "discounts",
        localField: "categoryDiscounts.discountId",
        foreignField: "_id",
        as: "discountDetails",
      },
    },
    {
      $match: {
        "discountDetails.startDate": { $lte: now },
        "discountDetails.endDate": { $gte: now },
      },
    },
    { $unwind: { path: "$discountDetails", preserveNullAndEmptyArrays: true } },

    // 🔹 Add merged discount field
    {
      $addFields: {
        discount: {
          method: "$categoryDiscounts.method",
          value: "$categoryDiscounts.value",
          info: "$discountDetails",
        },
      },
    },

    // 🔹 Lookup first product of this category with its first image
    {
      $lookup: {
        from: "products",
        let: { catId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$categoryId", "$$catId"] } } },
          { $limit: 1 },
          {
            $lookup: {
              from: "productimages",
              localField: "_id",
              foreignField: "productId",
              as: "images",
            },
          },
          {
            $addFields: {
              firstImage: { $arrayElemAt: ["$images", 0] },
            },
          },
          { $project: { firstImage: 1 } },
        ],
        as: "firstProduct",
      },
    },
    {
      $addFields: {
        firstProductImage: { $arrayElemAt: ["$firstProduct.firstImage", 0] },
      },
    },

    {
      $project: {
        categoryDiscounts: 0,
        discountDetails: 0,
        firstProduct: 0,
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    discountCategories,
  });
});

// ==> delete a product category  <==
exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Category id is required", 400));
  }
  const existCategory = await Category.findById(id);
  if (!existCategory) {
    return next(new ErrorHandler("Category not found!", 404));
  }
  // removing existing file
  const existFilePath = path.join(
    __dirname,
    "../uploads/image/",
    existCategory.image
  );
  fs.access(existFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(existFilePath, (err) => {
        if (err) {
          return next(new ErrorHandler("Category image not deleted!", 400));
        }
      });
    }
  });
  await existCategory.deleteOne();
  await Category.updateMany(
    {
      parentId: id,
    },
    {
      $set: {
        parentId: null,
      },
    }
  );
  return res.status(200).json({
    success: true,
    message: "Category deleted successfully!",
  });
});

// ==> active / inactive a product category <==
exports.activeInactiveCategory = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return next(new ErrorHandler("Category id is required", 400));
  }
  const { status } = req.body;
  const existCategory = await Category.findById(id);
  if (!existCategory) {
    return next(new ErrorHandler("Category not found!", 404));
  }

  await Category.updateOne(
    {
      _id: id,
    },
    { $set: { status } }
  );
  return res.status(200).json({
    success: true,
    message: "Category status updated!",
  });
});
