const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ErrorHandler = require("../helper/error.helper");

// Generating a unique email verification token
async function getEmailVerificationToken(user) {
  // generating a token
  const token = crypto.randomBytes(20).toString("hex");

  // hashing and adding to userSchema
  user.emailVerifyToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  user.emailVerifyExpire =
    Date.now() + process.env.VARIFICATION_EMAIL_EXPIRE * 60 * 1000;
  await user.save();
  return token;
}

// creating a refresh token
function refreshJWT(email) {
  const token = jwt.sign(
    {
      email: email,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.REFRESH_JWT_TOKEN_EXPIRE,
    }
  );
  return token;
}

// creating a access token
function createJWT(email) {
  const token = jwt.sign(
    {
      email: email,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_TOKEN_EXPIRE,
    }
  );
  return token;
}
// creating a new access token with refresh token
async function generateNewAccessToken(req, res, next) {
  const refreshToken = req.cookies[process.env.REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return next(new ErrorHandler("Refresh token missing!", 403));
  }
  const user = await User.findOne({ refreshToken });

  if (!user) {
    return next(new ErrorHandler("Invalid refresh token!", 403));
  }

  try {
    const { email } = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

    const access_token = createJWT(email);
    return access_token;
  } catch (error) {
    return next(new ErrorHandler("Invalid refresh token!", 403));
  }
}

// Generating reset password token
async function getResetPasswordToken(user) {
  // generating 4-digit OTP
  const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
  // hashing and adding to userSchema
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire =
    Date.now() + 1000 * 60 * (process.env.RESET_PASSWORD_EXPIRE || 10);
  await user.save();
  return resetToken;
}

// from flat categories create nested category
function nestCategories(categories) {
  // Initialize the map with each category
  const modifiedCategories = categories.map((category) => ({
    ...category?._doc,
    subcategories: [], // Add a subcategories array to each category
  }));

  // Create a map for efficient lookups
  const categoryMap = new Map();

  // Populate the map with the categories by their IDs
  modifiedCategories.forEach((category) => {
    categoryMap.set(category._id.toString(), category);
  });

  // Initialize an array to hold the root categories
  const rootCategories = [];

  // Build the nested structure
  modifiedCategories.forEach((category) => {
    if (category.parentId) {
      // If the category has a parent, add it to the parent's subcategories
      const parentCategory = categoryMap.get(category.parentId.toString());
      if (parentCategory) {
        parentCategory.subcategories.push(category);
      }
    } else {
      // If no parentId, this is a root category
      rootCategories.push(category);
    }
  });

  return rootCategories;
}

// check if discount is valid
function isValidDate(startDate, endDate) {
  if (!startDate || !endDate) return false;

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= now && end >= now;
}
function applyDiscounts(
  item,
  productDiscounts,
  tierDiscounts,
  categoryDiscounts
) {
  const { price, extraPrice, quantity } = item;
  const original = price * quantity;
  let final = original;
  let payableQty = quantity;
  const applied = [];

  // 1️⃣ Product Discounts
  for (const d of productDiscounts) {
    if (!isValidDate(d.startDate, d.endDate)) continue;

    if (d.method === "percentage") {
      final -= (final * d.value) / 100;
      applied.push(`${d.value}% Off`);
    } else if (d.method === "flat") {
      final -= d.value * quantity;
      applied.push(`${d.value} Off per item`);
    } else if (d.method === "bogo" && d.minQty && quantity >= d.minQty) {
      // Example: Buy 2 get 1 free → minQty = 2, value = 1
      // const groupSize = d.minQty + d.value;
      // const freeItems = Math.floor(qty / groupSize) * d.value;
      // payableQty = qty - freeItems;
      // console.log(payableQty);
      // // final = price * payableQty;
      // applied.push(`BOGO: Buy ${d.minQty} Get ${d.value} Free`);
    }
  }

  // 3️⃣ Category Discounts
  for (const d of categoryDiscounts) {
    if (!isValidDate(d.startDate, d.endDate)) continue;
    if (d.method === "percentage") {
      final -= (final * d.value) / 100;
      applied.push(`Category ${d.value}% Off per item`);
    } else if (d.method === "flat") {
      final -= d.value * payableQty;
      applied.push(`Category ${d.value} tk Off per item`);
    }
  }

  // 2️⃣ Tier Discounts (based on quantity)
  const tier = tierDiscounts
    .filter((d) => isValidDate(d.startDate, d.endDate))
    .sort((a, b) => b.min - a.min) // highest min first
    .find((d) => payableQty >= d.min);
  if (tier) {
    final -= payableQty * tier.value;
    applied.push(`Bulk Discount: ${tier.value}tk Off (min ${tier.min})`);
  }
  return {
    original,
    final: Math.max(final + (extraPrice ?? 0), 0),
    applied,
    savings: original - final,
  };
}

module.exports = {
  getEmailVerificationToken,
  refreshJWT,
  createJWT,
  generateNewAccessToken,
  getResetPasswordToken,
  nestCategories,
  applyDiscounts,
  isValidDate,
};
