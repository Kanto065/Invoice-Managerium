// ==> external import <==
const express = require("express");
const userRouter = express.Router();

// ==> internal import <==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");
const UserController = require("../controllers/user.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const UserDTO = require("../validation/user.dto");

// ==> user routes <==
userRouter
  .route("/register")
  .post(dtoValidate(UserDTO.createUserSchema), UserController.registerUser);

// userRouter.route("/send-verify-mail").post(UserController.sendVerificationMail);

userRouter.route("/verify/:token").post(UserController.verifyEmail);

userRouter
  .route("/login")
  .post(dtoValidate(UserDTO.loginUserSchema), UserController.loginUser);
userRouter
  .route("/admin-login")
  .post(dtoValidate(UserDTO.loginUserSchema), UserController.adminLogin);

userRouter.route("/google").post(UserController.googleAuth);

userRouter.route("/").get(authCheck, UserController.loggedInUser);

userRouter
  .route("/refresh-access-token")
  .post(UserController.refreshAccessToken);

userRouter.route("/logout").post(authCheck, UserController.logoutUser);

userRouter
  .route("/update-profile")
  .put(
    authCheck,
    fileUploadMiddleware.avatarUpload.single("avatar"),
    dtoValidate(UserDTO.updateUserProfileSchema),
    UserController.updateProfile
  );

userRouter
  .route("/update-avatar")
  .put(
    authCheck,
    fileUploadMiddleware.avatarUpload.single("avatar"),
    UserController.updateAvatar
  );

userRouter
  .route("/update-password")
  .put(
    authCheck,
    dtoValidate(UserDTO.updateUserPasswordSchema),
    UserController.updatePassword
  );

userRouter
  .route("/forget-password")
  .post(
    dtoValidate(UserDTO.formgetPasswordSchema),
    UserController.forgotPassword
  );
userRouter
  .route("/reset-password/:token")
  .post(
    dtoValidate(UserDTO.resetUserPasswordSchema),
    UserController.resetPassword
  );

userRouter
  .route("/all")
  .get(authCheck, roleCheck("admin"), UserController.allUsers);

userRouter
  .route("/block-unblock/:id")
  .put(
    authCheck,
    roleCheck("admin"),
    dtoValidate(UserDTO.blockUnblockUserSchema),
    UserController.blockUnblockUser
  );

userRouter
  .route("/:id")
  .get(authCheck, roleCheck("admin"), UserController.singleUser)
  .delete(authCheck, roleCheck("admin"), UserController.deleteUser);

module.exports = userRouter;
