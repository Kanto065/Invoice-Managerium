// ==>external import<==
const express = require("express");
const categoryRouter = express.Router();

// ==>internal import<==
const fileUploadMiddleware = require("../middlewares/file-upload.middleware");
const CategoryController = require("../controllers/category.controller");
const CategoryDTO = require("../validation/category.dto");
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const dtoValidate = require("../middlewares/validate.middleware");

categoryRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imageUpload.single("image"),
    dtoValidate(CategoryDTO.createCategorySchema),
    CategoryController.createCategory
  );

categoryRouter.route("/flat-all").get(CategoryController.getFlatAllCategory);
categoryRouter.route("/all").get(CategoryController.getAllCategory);
categoryRouter
  .route("/parent/all")
  .get(CategoryController.getAllParentCategory);
categoryRouter
  .route(`/child/all/:id`)
  .get(CategoryController.getAllChildCategory);
categoryRouter
  .route(`/discounts`)
  .get(CategoryController.getAllCategoryDiscount);

categoryRouter
  .route("/active-inactive/:id")
  .put(
    authCheck,
    roleCheck("admin"),
    dtoValidate(CategoryDTO.activeInactiveCategorySchema),
    CategoryController.activeInactiveCategory
  );

categoryRouter
  .route("/:id")
  .get(CategoryController.getSingleCategory)
  .put(
    authCheck,
    roleCheck("admin"),
    fileUploadMiddleware.imageUpload.single("image"),
    dtoValidate(CategoryDTO.updateCategorySchema),
    CategoryController.updateCategory
  )
  .delete(authCheck, roleCheck("admin"), CategoryController.deleteCategory);

module.exports = categoryRouter;
