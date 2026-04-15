// ==>external import<==
const express = require("express");
const varientRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const VarientController = require("../controllers/varient.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const VarientDTO = require("../validation/varient.dto");
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");

varientRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.avatarUpload.single("image"),
    dtoValidate(VarientDTO.createVarientSchema),
    VarientController.createVarient
  );
varientRouter
  .route("/all")
  .get(authCheck, roleCheck("admin"), VarientController.getAllVarients);

varientRouter
  .route("/:id")
  .get(authCheck, roleCheck("admin"), VarientController.getSingleVarient)
  .put(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imageUpload.single("image"),
    dtoValidate(VarientDTO.updateVarientSchema),
    VarientController.updateVarient
  )
  .delete(authCheck, roleCheck("admin"), VarientController.deleteVarient);

module.exports = varientRouter;
