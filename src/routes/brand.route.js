// ==>external import<==
const express = require("express");
const brandRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");
const BrandController = require("../controllers/brand.controller");
const BrandDTO = require("../validation/brand.dto");
const dtoValidate = require("../middlewares/validate.middleware");

brandRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    dtoValidate(BrandDTO.createBrandSchema),
    BrandController.createBrand
  );
brandRouter.route("/all").get(BrandController.getAllBrand);
brandRouter
  .route("/:id")
  .get(authCheck, roleCheck("admin"), BrandController.getSingleBrand)
  .put(
    authCheck,
    roleCheck("admin"),
    dtoValidate(BrandDTO.updateBrandSchema),
    BrandController.updateBrand
  )
  .delete(authCheck, roleCheck("admin"), BrandController.deleteBrand);

brandRouter
  .route("/active-inactive/:id")
  .put(
    authCheck,
    roleCheck("admin"),
    dtoValidate(BrandDTO.activeInactiveBrandSchema),
    BrandController.activeInactiveBrand
  );

module.exports = brandRouter;
