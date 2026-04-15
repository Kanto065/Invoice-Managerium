// ==>external import<==
const express = require("express");
const productImageRouter = express.Router();

// ==>internal import<==
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");
const ProductImageController = require("../controllers/product-image.controller");
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const dtoValidate = require("../middlewares/validate.middleware");
const ProductDTO = require("../validation/product.dto");

productImageRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imageUpload.single("image"),
    dtoValidate(ProductDTO.productImageUploadSchema),
    ProductImageController.createProductImage
  );
productImageRouter
  .route("/all")
  .get(
    authCheck,
    roleCheck("admin"),
    ProductImageController.getAllProductImages
  );
productImageRouter
  .route("/:id")
  .get(
    authCheck,
    roleCheck("admin"),
    ProductImageController.getSingleProductImage
  )
  .put(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imageUpload.single("image"),
    ProductImageController.updateProductImage
  )
  .delete(
    authCheck,
    roleCheck("admin"),
    ProductImageController.deleteProductImage
  );

module.exports = productImageRouter;
