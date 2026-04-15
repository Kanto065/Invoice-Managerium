// ==>internal import<==
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ErrorHandler = require("../helper/error.helper");

const authCheck = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check if the header is present and starts with 'Bearer'
    let access_token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token part
      access_token = authHeader.split(" ")[1];
    }
    if (!access_token) {
      return next(new ErrorHandler("Unauthenticated!", 401));
    }
    const { email } = jwt.verify(access_token, process.env.JWT_SECRET_KEY);

    // exist user in database query
    const existUser = await User.findOne({ email });
    if (!existUser) {
      return next(new ErrorHandler("User not found", 404));
    }
    req.user = existUser;
    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Unauthenticated!", 401));
  }
};

const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req?.user?.role)) {
      return next(new ErrorHandler(`Unauthorized!`, 401));
    }
    next();
  };
};
module.exports = { authCheck, roleCheck };
