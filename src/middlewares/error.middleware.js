const ErrorHandler = require("../helper/error.helper");

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Log the error
  console.error(err);

  // Check if headers already sent
  if (res.headersSent) {
    return next(
      new ErrorHandler("Error! Headers already sent to the client", 400)
    );
  }

  // Handle specific known errors
  if (err.name === "CastError") {
    message = `Resource not found. Invalid: ${err.path}`;
    statusCode = 400;
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue).join(", ");
    message = `Duplicate field value entered: ${duplicateField}`;
    statusCode = 400;
  }

  if (err.name === "JsonWebTokenError") {
    message = "Json Web Token is invalid. Try again.";
    statusCode = 400;
  }

  if (err.name === "TokenExpiredError") {
    message = "Json Web Token has expired. Please log in again.";
    statusCode = 400;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorMiddleware };
