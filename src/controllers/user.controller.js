// ==> external import <==
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ==> internal import <==
const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const User = require("../models/user.model");
const ErrorHandler = require("../helper/error.helper");
const {
  refreshJWT,
  createJWT,
  generateNewAccessToken,
  getResetPasswordToken,
} = require("../utils");
const {
  forgetPasswordMailTemplate,
} = require("../views/forgetPasswordMailTemplate");
const { getEmailVerificationToken } = require("../utils");
const { verifyMailTemplate } = require("../views/verifyMailTemplate");
const mail = require("../helper/mail.helper");

// ==> register a new user <==
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existUser = await User.findOne({ email });
  if (existUser) {
    return next(new ErrorHandler("User already exist!", 409));
  }

  //   password hashing
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashPassword,
    phone: phone,
  });

  // send verification email
  const token = await getEmailVerificationToken(newUser);
  const verifyUrl = `${process.env.CLIENT_URL}/user/verify/${token}`;

  try {
    await mail({
      email: email,
      subject: `[${process.env.APP_NAME}] Verify your email`,
      body: verifyMailTemplate(verifyUrl),
    });
  } catch (error) {
    newUser.emailVerifyToken = undefined;
    newUser.emailVerifyExpire = undefined;
    await newUser.save();
    return next(new ErrorHandler("Faild to sent email!", 500));
  }
  return res.status(201).json({
    success: true,
    message: `A verification email sent to ${email}!`,
  });
});

// ==> send verification mail <==
exports.sendVerificationMail = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({
    email: "shudipto345@gmail.com",
    isVerified: false,
  });
  if (!user) {
    return next(new ErrorHandler("User not found!", 400));
  }
  // send verification email
  const token = await getEmailVerificationToken(user);
  const verifyUrl = `${process.env.CLIENT_URL}/user/verify/${token}`;

  try {
    await mail({
      email: user?.email,
      subject: `[${process.env.APP_NAME}] Verify your email`,
      body: verifyMailTemplate(verifyUrl),
    });
  } catch (error) {
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save();
    return next(new ErrorHandler("Faild to sent email!", 500));
  }
  return res.status(201).json({
    success: true,
    message: `A verification email sent to ${user?.email}!`,
  });
});

// ==> verify email <==
exports.verifyEmail = catchAsyncError(async (req, res, next) => {
  // Creating token hash
  const verifyToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const existUser = await User.findOne({
    emailVerifyToken: verifyToken,
    emailVerifyExpire: { $gt: Date.now() },
  });

  if (!existUser) {
    return next(
      new ErrorHandler(
        "Email verify token is invalid or has been expired!",
        400
      )
    );
  }

  existUser.emailVerifyToken = null;
  existUser.emailVerifyExpire = null;
  existUser.isVerified = true;
  await existUser.save();

  return res.status(200).json({
    success: true,
    message: "Email verified successfully!!",
  });
});

// ==> credential login a user <==
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const existUser = await User.findOne({ email });
  if (!existUser) {
    return next(new ErrorHandler("User not found!", 404));
  }

  //   password matching
  const isPassMatched = await bcrypt.compare(password, existUser.password);

  if (!isPassMatched) {
    return next(new ErrorHandler("Invalid credential!", 404));
  }

  //   create a refresh token
  let refreshToken = refreshJWT(email, existUser.role);
  await User.updateOne(
    { email },
    {
      $set: {
        refreshToken,
      },
    }
  );

  const updatedUser = await User.findOne(
    { email },
    {
      password: 0,
      __v: 0,
      emailVerifyExpire: 0,
      emailVerifyToken: 0,
      resetPasswordExpire: 0,
      resetPasswordToken: 0,
      refreshToken: 0,
    }
  );

  //   create a access token
  let access_token = createJWT(email, existUser.role);
  res.cookie(process.env.REFRESH_COOKIE_NAME, refreshToken, {
    maxAge:
      Date.now() + 1000 * 60 * 60 * 24 * process.env.REFRESH_COOKIE_EXPIRES,
    httpOnly: true,
    secure: process.env.NODE_END === "production" ? true : false,
    sameSite: "Lax",
  });

  return res.status(200).json({
    success: true,
    user: updatedUser,
    access_token,
    message: "Login successfull!",
  });
});

// ==> credential login a admin <==
exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const existUser = await User.findOne({ email });
  if (!existUser) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (existUser?.role !== "admin") {
    return next(new ErrorHandler("Unauthorized!", 403));
  }
  //   password matching
  const isPassMatched = await bcrypt.compare(password, existUser.password);

  if (!isPassMatched) {
    return next(new ErrorHandler("Invalid credential!", 401));
  }

  //   create a refresh token
  let refreshToken = refreshJWT(email, existUser.role);
  await User.updateOne(
    { email },
    {
      $set: {
        refreshToken,
      },
    }
  );

  const updatedUser = await User.findOne(
    { email },
    {
      password: 0,
      __v: 0,
      emailVerifyExpire: 0,
      emailVerifyToken: 0,
      resetPasswordExpire: 0,
      resetPasswordToken: 0,
      refreshToken: 0,
    }
  );

  //   create a access token
  let access_token = createJWT(email, existUser.role);
  res.cookie(process.env.REFRESH_COOKIE_NAME, refreshToken, {
    maxAge:
      Date.now() + 1000 * 60 * 60 * 24 * process.env.REFRESH_COOKIE_EXPIRES,
    httpOnly: true,
    secure: process.env.NODE_END === "production" ? true : false,
    sameSite: "Lax",
  });

  return res.status(200).json({
    success: true,
    user: updatedUser,
    access_token,
    message: "Login successfull!",
  });
});

// ==> logined user details <==
exports.loggedInUser = catchAsyncError(async (req, res, next) => {
  const existUser = await User.findOne(
    { email: req?.user?.email },
    {
      password: 0,
      __v: 0,
      emailVerifyExpire: 0,
      emailVerifyToken: 0,
      resetPasswordExpire: 0,
      resetPasswordToken: 0,
      refreshToken: 0,
    }
  );
  if (!existUser) {
    return next(new ErrorHandler("User not found!", 404));
  }
  return res.status(200).json({
    success: true,
    user: existUser,
  });
});

// ==> refresh access token <==
exports.refreshAccessToken = catchAsyncError(async (req, res, next) => {
  const access_token = await generateNewAccessToken(req, res, next);

  return res.status(200).json({
    success: true,
    access_token,
  });
});

// ==> logout user <==
exports.logoutUser = catchAsyncError(async (req, res, next) => {
  const existUser = await User.findOne({ email: req?.user?.email });
  if (!existUser) {
    return next(new ErrorHandler("User not found!", 404));
  }
  await User.updateOne(
    { email: existUser?.email },
    { $set: { refreshToken: null } }
  );

  res.clearCookie(process.env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_END === "production" ? true : false,
    sameSite: "Lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out!",
  });
});

// ==> update user profile <==
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  let { name, phone, bio, address, socialLinks } = req.body;
  const userId = req.user._id;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  let updatedData = {};
  if (name) updatedData.name = name || user.name;
  if (phone) updatedData.phone = phone || user.phone;
  if (bio !== undefined) updatedData.bio = bio;
  if (address) {
    updatedData.address = {
      ...user.address,
      ...address,
    };
  }
  if (socialLinks) {
    updatedData.socialLinks = {
      ...user.socialLinks,
      ...socialLinks,
    };
  }

  if (req.file && user?.provider === "credentials") {
    if (user?.image) {
      const existFilePath = path.join(
        __dirname,
        "../uploads/image/" + user.image
      );
      fs.access(existFilePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(existFilePath, (err) => {
            if (err) {
              return next(new ErrorHandler("User avatar not deleted!", 400));
            }
          });
        }
      });
    }
    updatedData.image = req.file.filename;
  }
  await User.updateOne({ _id: userId }, { $set: updatedData });

  const updatedUser = await User.findOne(
    { _id: userId },
    {
      password: 0,
      __v: 0,
      emailVerifyExpire: 0,
      emailVerifyToken: 0,
      resetPasswordExpire: 0,
      resetPasswordToken: 0,
      refreshToken: 0,
    }
  );

  return res.status(200).json({
    success: true,
    user: updatedUser,
    message:
      req.file && user?.provider !== "credentials"
        ? "Not Credential user! Not allowed to update profile picture!"
        : "Profile updated successfully!",
  });
});

// ==> update avatar image <==
exports.updateAvatar = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found! ", 404));
  }

  if (user?.provider !== "credentials") {
    return next(
      new ErrorHandler(
        "Not Credential user! Not allowed to update profile picture!",
        400
      )
    );
  }
  if (req.file) {
    // removing existing file
    if (user.image) {
      const existFilePath = path.join(
        __dirname,
        "../uploads/image/" + user.image
      );
      fs.access(existFilePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(existFilePath, (err) => {
            if (err) {
              return next(new ErrorHandler("User avatar not deleted!", 400));
            }
          });
        }
      });
    }

    // adding new file
    await User.updateOne(
      { _id: req.user._id },
      { $set: { image: req.file.filename } }
    );
    const updatedUser = await User.findOne(
      { _id: userId },
      {
        password: 0,
        __v: 0,
        emailVerifyExpire: 0,
        emailVerifyToken: 0,
        resetPasswordExpire: 0,
        resetPasswordToken: 0,
        refreshToken: 0,
      }
    );
    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Avatar updated successfully!",
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Avatar not found!",
    });
  }
});

//  ==> update password <==
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req?.user?._id);

  if (user !== "credentials") {
    return next(
      new ErrorHandler(
        "Not credential user! Not allowed to update password!",
        400
      )
    );
  }
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is invalid!", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("Password does not match!", 400));
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password updated successfully!",
  });
});

// ==> forgot password <==
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const existUser = await User.findOne({ email });

  if (!existUser) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (existUser?.provider !== "credentials") {
    return next(
      new ErrorHandler(
        "Not credential user! Not allowed to reset password!",
        400
      )
    );
  }
  // Get reset password token
  const resetToken = await getResetPasswordToken(existUser);
  const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await mail({
      email: existUser.email,
      subject: `[${process.env.APP_NAME}] Reset Your Password`,
      body: forgetPasswordMailTemplate(resetPasswordUrl),
    });
    return res.status(200).json({
      message: `An email sent to ${existUser.email}!`,
    });
  } catch (error) {
    existUser.resetPasswordToken = undefined;
    existUser.resetPasswordExpire = undefined;
    await existUser.save();
    return next(new ErrorHandler(error.message, 500));
  }
});

// ==> reset password <==
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }
  // Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const existUser = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!existUser) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired!",
        400
      )
    );
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);
  existUser.password = hashPassword;
  existUser.resetPasswordToken = null;
  existUser.resetPasswordExpire = null;
  await existUser.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully!!",
  });
});

// ==> all users <==
exports.allUsers = catchAsyncError(async (req, res, next) => {
  // Get pagination parameters from query
  const pageno = req?.query?.page ? Number(req?.query?.page) : 1;
  const perpage = req?.query?.limit ? Number(req.query?.limit) : 15;
  const skip = (pageno - 1) * perpage;

  const resData = await User.aggregate([
    {
      $facet: {
        users: [
          {
            $project: {
              password: 0,
              __v: 0,
              emailVerifyExpire: 0,
              emailVerifyToken: 0,
              resetPasswordExpire: 0,
              resetPasswordToken: 0,
              refreshToken: 0,
            },
          },
          { $skip: skip },
          { $limit: perpage },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  if (resData[0].users.length === 0) {
    return res.status(200).json({
      success: true,
      users: [],
      total: 0,
    });
  }
  return res.status(200).json({
    success: true,
    users: resData[0].users,
    total: resData[0].total[0].count,
  });
});

// ==> single user <==
exports.singleUser = catchAsyncError(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId, {
    password: 0,
    __v: 0,
    emailVerifyExpire: 0,
    emailVerifyToken: 0,
    resetPasswordExpire: 0,
    resetPasswordToken: 0,
    refreshToken: 0,
  });
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }
  return res.status(200).json({
    success: true,
    users: user,
  });
});

// ==> delete user <==
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  // removing existing file
  if (user?.image) {
    const existFilePath = path.join(
      __dirname,
      "../uploads/image/" + user?.image
    );
    fs.access(existFilePath, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(existFilePath, (err) => {
          if (err) {
            return next(new ErrorHandler("User avatar not deleted!", 400));
          }
        });
      }
    });
  }
  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});

// ==> block/unblock a user <==
exports.blockUnblockUser = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found! ", 401));
  }

  await User.updateOne({ _id: req?.params?.id }, { $set: { status } });

  return res.status(200).json({
    success: true,
    message: status === "active" ? "User is unblocked!" : "User is blocked!",
  });
});

// ==> Google OAuth <==
exports.googleAuth = catchAsyncError(async (req, res, next) => {
  const { credential } = req.body;
  if (!credential) {
    return next(new ErrorHandler("No Google credential provided", 400));
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    return next(new ErrorHandler("Invalid Google token", 401));
  }
  const payload = ticket.getPayload();
  if (!payload?.email) {
    return next(new ErrorHandler("Google account has no email", 400));
  }
  // Find or create user
  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      image: payload.picture,
      isVerified: true,
      provider: "google",
      password: crypto.randomBytes(32).toString("hex"), // random password
    });
  } else {
    // Update profile image if changed
    if (payload.picture && user.image !== payload.picture) {
      user.image = payload.picture;
      await user.save();
    }
  }
  // Generate JWT
  const access_token = createJWT(user.email, user.role);
  return res.status(200).json({
    success: true,
    user,
    access_token,
    message: "Google login successful",
  });
});
