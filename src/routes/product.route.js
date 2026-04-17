// ==>external import<==
const express = require("express");
const productRouter = express.Router();

// ==>internal import<==
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");
const { optimizeImages } = require("../middlewares/image-optimizer.middleware");
const ProductController = require("../controllers/product.controller");
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const dtoValidate = require("../middlewares/validate.middleware");
const ProductDTO = require("../validation/product.dto");

productRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imagesUpload.array("images", 10),
    optimizeImages,
    dtoValidate(ProductDTO.createProductSchema),
    ProductController.createProduct
  );
productRouter.route("/all").get(ProductController.getAllProduct);

productRouter
  .route("/:id")
  .put(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imagesUpload.array("images", 10),
    optimizeImages,
    dtoValidate(ProductDTO.updateProductSchema),
    ProductController.updateProduct
  )
  .get(ProductController.getSingleProduct)
  .delete(authCheck, roleCheck("admin"), ProductController.deleteProduct);

productRouter
  .route("/active-inactive/:id")
  .put(
    dtoValidate(ProductDTO.activeInactiveProductSchema),
    authCheck,
    roleCheck("admin"),
    ProductController.activeInactiveProduct
  );

module.exports = productRouter;
