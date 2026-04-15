// ==>external import<==
const express = require("express");
const varientAttributrRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const VarientAttributeController = require("../controllers/varient-attribute.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const VarientAttributeDTO = require("../validation/varient-attribute.dto");

varientAttributrRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    dtoValidate(VarientAttributeDTO.createVarientAttributeSchema),
    VarientAttributeController.createVarientAttribute
  );
varientAttributrRouter
  .route("/all")
  .get(
    authCheck,
    roleCheck("admin"),
    VarientAttributeController.getAllVarientAttributes
  );

varientAttributrRouter
  .route("/:id")
  .delete(
    authCheck,
    roleCheck("admin"),
    VarientAttributeController.deleteVarientAttributes
  );

module.exports = varientAttributrRouter;
