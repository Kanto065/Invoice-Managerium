const mongoose = require("mongoose");
const ErrorHandler = require("./ErrorHandler");

exports.validateMongoId = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) {
    return new ErrorHandler("Invalid Id", 400);
  }
};
