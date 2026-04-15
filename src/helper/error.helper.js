const logger = require("../config/logger.config");

class ErrorHandler extends Error {
  constructor(message, statusCode, stack = "") {
    super(message);
    logger.error(`${message}`);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
module.exports = ErrorHandler;
