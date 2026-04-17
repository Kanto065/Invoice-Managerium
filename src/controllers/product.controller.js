// ==> external import <==
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const mongoose = require("mongoose");

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Product = require("../models/product.model");
const ProductImage = require("../models/product-image.model");
const Varient = require("../models/varient.model");
const ErrorHandler = require("../helper/error.helper");
const VarientAttribute = require("../models/varient-attribut.model");
const ProductImages = require("../models/product-image.model");
const UserSubscription = require("../models/user-subscription.model");
const Shop = require("../models/shop.model");

// ==> create a product <==
exports.createProduct = catchAsyncError(async (req, res, next) => {
  const {
    name,
    varientId,
    brandId,
    description,
    price,
    previousPrice,
    extraPrice,
    buyingPrice,
    location,
    stock,
    featured,
    shopId,
  } = req.body;
  // Removed image validation length check to allow zero images
  // Check if product already exists
  const existProduct = await Product.findOne({ name });
  if (existProduct) {
    await Product.updateOne(
      { _id: existProduct._id },
      { $set: { stock: existProduct.stock + stock } }
    );
    return res.status(200).json({
      succeeded: true,
      message: "Product already exists! Updated the stock.",
    });
  } else {
    // 1️⃣ Verify Shop Ownership
    const shop = await Shop.findById(shopId);
    if (!shop) return next(new ErrorHandler("Shop not found", 404));
    
    // Admin can create anywhere, owners only in their shops
    if (req.user.role !== "admin" && shop.ownerId.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You don't have permission to add products to this shop", 403));
    }

    // 2️⃣ Check Subscription Limits
    const userSub = await UserSubscription.findOne({ userId: shop.ownerId, status: "active" }).populate("planId");
    const maxProducts = userSub?.planId?.maxProductsPerShop ?? 5; // Default to free limit if no sub
    const currentCount = await Product.countDocuments({ shopId, isDemo: false });
    
    if (currentCount >= maxProducts) {
      return next(new ErrorHandler(`Product limit reached for this shop (${maxProducts} products max). Please upgrade your plan.`, 403));
    }

    let createData = {
      name,
      slug: slugify(name, { lower: true }),
      shopId,
      varientId,
      description,
      price,
      previousPrice: previousPrice ? previousPrice : null,
      extraPrice: extraPrice ? extraPrice : null,
      buyingPrice: buyingPrice ? buyingPrice : null,
      location,
      stock,
      featured: featured ? true : false,
    };
    if (brandId) createData.brandId = brandId;
    const newProduct = await Product.create(createData);

    if (req?.files?.length > 0) {
      for (let file of req?.files) {
        // adding new file
        await ProductImages.create({
          productId: newProduct?._id,
          image: file.filename,
        });
      }
    } else {
      // Put a default picture as placeholder
      await ProductImages.create({
        productId: newProduct?._id,
        image: "product_placeholder.png",
      });
    }

    return res.status(201).json({
      succeeded: true,
      message: "Product created successfully!",
    });
  }
});

// ==> update a product <==
exports.updateProduct = catchAsyncError(async (req, res, next) => {
  const {
    name,
    varientId,
    brandId,
    description,
    price,
    previousPrice,
    extraPrice,
    buyingPrice,
    stock,
    featured,
    location,
    freeDelivery,
    status,
  } = req.body;
  const existProduct = await Product.findById(id);
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  // 1️⃣ Verify Shop Ownership
  if (req.user.role !== "admin") {
    const shop = await Shop.findById(existProduct.shopId);
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You don't have permission to update this product", 403));
    }
  }

  let updateData = {};
  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true });
  }
  if (varientId) {
    updateData.varientId = varientId;
  }
  if (brandId) {
    updateData.brandId = brandId;
  }
  if (description) {
    updateData.description = description;
  }
  if (price) {
    updateData.price = price;
  }
  if (previousPrice) {
    updateData.previousPrice = previousPrice ? previousPrice : null;
  }
  if (extraPrice) {
    updateData.extraPrice = extraPrice ? extraPrice : null;
  }
  if (buyingPrice) {
    updateData.buyingPrice = buyingPrice ? buyingPrice : null;
  }
  if (featured) {
    updateData.featured = featured === "true" ? true : false;
  }
  if (location) {
    updateData.location = location;
  }
  if (stock) {
    updateData.stock = stock;
  }
  if (freeDelivery) {
    updateData.freeDelivery = freeDelivery === "true" ? true : false;
  }

  if (status) {
    updateData.status = status;
  }

  await Product.updateOne({ _id: id }, { $set: updateData });

  if (req?.files?.length) {
    // Image upload
    for (let file of req?.files) {
      // adding new file
      await ProductImages.create({
        productId: id,
        image: file.filename,
      });
    }
  }

  return res.status(200).json({
    succeeded: true,
    message: "Product updated successfully!",
  });
});

// ==> get all products <==
exports.getAllProduct = catchAsyncError(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Query params
  const { activeOnly, type, name, varient, location, demoOnly, shopId } = req.query;

  let match = {};

  if (demoOnly === "true") {
    match.isDemo = true;
  } else {
    if (!shopId) return next(new ErrorHandler("shopId is required", 400));
    match.shopId = new mongoose.Types.ObjectId(shopId);
    match.isDemo = false;
  }

  // 🔹 Base Filters
  if (activeOnly === "true") {
    match.status = "active";
  }
  // Location wise products
  if (location) {
    match.location = location;
  }

  // 🔹 Filter by Varient
  if (varient && mongoose.Types.ObjectId.isValid(varient)) {
    match.varientId = new mongoose.Types.ObjectId(varient);
  }

  // 🔹 Search by Name
  if (name) {
    match.name = { $regex: name, $options: "i" };
  }

  // 🔹 Sorting & Special Filters
  let sort = {};
  if (type === "featured") {
    match.featured = true;
  } else if (type === "new") {
    sort.createdAt = -1;
  } else if (type === "top-rated") {
    sort.rating = -1;
  } else if (type === "best-selling") {
    sort.sold = -1;
  }

  // 🔹 Related Products (category + brand + name)
  if (type === "related" && name) {
    match = {
      status: "active",
      $or: [
        { name: { $regex: name, $options: "i" } },
        ...(match.varientId ? [{ varientId: match.varientId }] : []),
        ...(match.brandId ? [{ brandId: match.brandId }] : []),
      ],
    };
  }

  // Common Lookups
  const lookups = [
    {
      $lookup: {
        from: "varientattributes",
        localField: "varientId",
        foreignField: "_id",
        as: "varient",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brand",
      },
    },
    {
      $lookup: {
        from: "productimages",
        localField: "_id",
        foreignField: "productId",
        as: "images",
      },
    },
    {
      $lookup: {
        from: "varients",
        localField: "_id",
        foreignField: "productId",
        as: "varients",
      },
    },
    // 🔹 Join with productdiscounts
    {
      $lookup: {
        from: "productdiscounts",
        localField: "_id",
        foreignField: "productId",
        as: "productDiscounts",
      },
    },
    {
      $unwind: { path: "$productDiscounts", preserveNullAndEmptyArrays: true },
    },
    // 🔹 Join with discounts
    {
      $lookup: {
        from: "discounts",
        localField: "productDiscounts.discountId",
        foreignField: "_id",
        as: "discountDetails",
      },
    },
    { $unwind: { path: "$discountDetails", preserveNullAndEmptyArrays: true } },
    // 🔹 tier discounts lookup
    {
      $lookup: {
        from: "tierproductdiscounts",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$productId", "$$productId"] },
            },
          },
          // join with tierDiscounts (min, value)
          {
            $lookup: {
              from: "tierdiscounts",
              localField: "tierId",
              foreignField: "_id",
              as: "tier",
            },
          },
          { $unwind: "$tier" },

          // join with discount (to get method, name, validity, etc.)
          {
            $lookup: {
              from: "discounts",
              localField: "discountId",
              foreignField: "_id",
              as: "parentDiscount",
            },
          },
          { $unwind: "$parentDiscount" },

          // shape each tier object
          {
            $project: {
              _id: 0,
              min: "$tier.min",
              value: "$tier.value",
              discountId: "$discountId",
              method: "$parentDiscount.method",
              name: "$parentDiscount.name",
              startDate: "$parentDiscount.startDate",
              endDate: "$parentDiscount.endDate",
            },
          },
        ],
        as: "tierDiscounts",
      },
    },
    // 🔹 Add merged discount field
    {
      $addFields: {
        discount: {
          method: "$productDiscounts.method",
          value: "$productDiscounts.value",
          info: "$discountDetails",
        },
      },
    },
    {
      $project: {
        productDiscounts: 0,
        discountDetails: 0,
      },
    },
  ];

  // Final Aggregation
  const resData = await Product.aggregate([
    {
      $facet: {
        products: [
          { $match: match },
          ...lookups,
          ...(type === "discount"
            ? [
              {
                $match: {
                  $or: [
                    { discount: { $ne: {} } }, // has direct discount
                    { tierDiscounts: { $exists: true, $ne: [] } }, // or has tier discounts
                  ],
                },
              },
            ]
            : []),
          ...(Object.keys(sort).length ? [{ $sort: sort }] : []),
          { $skip: skip },
          { $limit: limit },
        ],
        total: [
          { $match: match },
          ...lookups,
          ...(type === "discount"
            ? [
              {
                $match: {
                  $or: [
                    { discount: { $ne: {} } }, // has direct discount
                    { tierDiscounts: { $exists: true, $ne: [] } }, // or has tier discounts
                  ],
                },
              },
            ]
            : []),
          ...(Object.keys(sort).length ? [{ $sort: sort }] : []),
          { $count: "count" },
        ],
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    products: resData[0].products,
    total: resData[0].total[0]?.count || 0,
  });
});

// ==> get a product  <==
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Product id is requried!", 404));
  }
  const product = await Product.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        status: "active",
      },
    },
    {
      $lookup: {
        from: "varientattributes",
        localField: "varientId",
        foreignField: "_id",
        as: "varient",
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brand",
      },
    },
    {
      $lookup: {
        from: "productimages",
        localField: "_id",
        foreignField: "productId",
        as: "images",
      },
    },
    {
      $lookup: {
        from: "varients",
        localField: "_id",
        foreignField: "productId",
        as: "varients",
      },
    },
    // 🔹 Join with productdiscounts
    {
      $lookup: {
        from: "productdiscounts",
        localField: "_id",
        foreignField: "productId",
        as: "productDiscounts",
      },
    },
    {
      $unwind: { path: "$productDiscounts", preserveNullAndEmptyArrays: true },
    },
    // 🔹 Join with discounts
    {
      $lookup: {
        from: "discounts",
        localField: "productDiscounts.discountId",
        foreignField: "_id",
        as: "discountDetails",
      },
    },
    { $unwind: { path: "$discountDetails", preserveNullAndEmptyArrays: true } },
    // 🔹 tier discounts lookup
    {
      $lookup: {
        from: "tierproductdiscounts",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$productId", "$$productId"] },
            },
          },
          // join with tierDiscounts (min, value)
          {
            $lookup: {
              from: "tierdiscounts",
              localField: "tierId",
              foreignField: "_id",
              as: "tier",
            },
          },
          { $unwind: "$tier" },

          // join with discount (to get method, name, validity, etc.)
          {
            $lookup: {
              from: "discounts",
              localField: "discountId",
              foreignField: "_id",
              as: "parentDiscount",
            },
          },
          { $unwind: "$parentDiscount" },

          // shape each tier object
          {
            $project: {
              _id: 0,
              min: "$tier.min",
              value: "$tier.value",
              discountId: "$discountId",
              method: "$parentDiscount.method",
              name: "$parentDiscount.name",
              startDate: "$parentDiscount.startDate",
              endDate: "$parentDiscount.endDate",
            },
          },
        ],
        as: "tierDiscounts",
      },
    },
    // 🔹 Add merged discount field
    {
      $addFields: {
        discount: {
          method: "$productDiscounts.method",
          value: "$productDiscounts.value",
          info: "$discountDetails",
        },
      },
    },
    {
      $project: {
        productDiscounts: 0,
        discountDetails: 0,
      },
    },
  ]);
  if (product.length === 0) {
    return res.status(200).json({
      success: false,
      message: "Product not found!",
    });
  }
  return res.status(200).json({
    success: true,
    product: product[0],
  });
});

// ==> active / inactive a product <==
exports.activeInactiveProduct = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const id = req?.params?.id;
  if (!id) {
    return new ErrorHandler("Product id is requried!");
  }
  const existProduct = await Product.findById(id);
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  // 1️⃣ Verify Shop Ownership
  if (req.user.role !== "admin") {
    const shop = await Shop.findById(existProduct.shopId);
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You don't have permission to update this product", 403));
    }
  }

  await Product.updateOne(
    {
      _id: id,
    },
    { $set: { status } }
  );
  return res.status(200).json({
    success: true,
    message: "Product status updated!",
  });
});

// ==> delete a product <==
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const id = req?.params?.id;
  if (!id) {
    return next(new ErrorHandler("Product id is requried!", 400));
  }
  const existProduct = await Product.findById(id);
  if (!existProduct) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  // 1️⃣ Verify Shop Ownership
  if (req.user.role !== "admin") {
    const shop = await Shop.findById(existProduct.shopId);
    if (!shop || shop.ownerId.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You don't have permission to delete this product", 403));
    }
  }

  await existProduct.deleteOne();

  const productImages = await ProductImage.find({ productId: id });
  if (productImages.length > 0) {
    productImages.forEach(async (imageItem) => {
      // removing existing file
      const existFilePath = path.join(
        __dirname,
        "../uploads/image/",
        imageItem.image
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

      await ProductImage.deleteOne({
        _id: imageItem._id,
        productId: id,
      });
    });
  }

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully!",
  });
});
