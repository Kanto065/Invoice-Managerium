// ==>external import<==
const express = require("express");
const settingRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const { toggleShutdown } = require("../controllers/setting.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const SettingSchema = require("../validation/setting.dto");

settingRouter
  .route("/shutdown")
  .post(
    authCheck,
    roleCheck("admin"),
    dtoValidate(SettingSchema.toggleShutdownSchema),
    toggleShutdown
  );

module.exports = settingRouter;
