// ==> external import <==

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Setting = require("../models/setting.model");
const ErrorHandler = require("../helper/error.helper");

// ==> toggle site shutdown <==
exports.toggleShutdown = catchAsyncError(async (req, res, next) => {
  const { shutdown } = req.body;

  const existSetting = await Setting.find();

  if (existSetting.length > 0) {
    await Setting.updateOne(
      { _id: existSetting[0]._id },
      { $set: { shutdown } }
    );
    return res.status(200).json({
      success: true,
      message: shutdown === "up" ? `Site is up!` : `Site is down!`,
    });
  } else {
    await Setting.create({ shutdown });
    return res.status(201).json({
      success: true,
      message: shutdown === "up" ? `Site is up!` : `Site is down!`,
    });
  }
});
