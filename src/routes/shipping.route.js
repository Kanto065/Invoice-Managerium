// ==>external import<==
const express = require("express");
const shippingRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const ShippingController = require("../controllers/shipping.controller");
const ShippingDTO = require("../validation/shipping.dto");
const dtoValidate = require("../middlewares/validate.middleware");

shippingRouter
  .route("/create")
  .post(
    authCheck,
    roleCheck("admin"),
    dtoValidate(ShippingDTO.createShippingSchema),
    ShippingController.createShipping
  );
shippingRouter.route("/all").get(ShippingController.getAllShipping);
shippingRouter.route("/divisions").get(ShippingController.getDivisions);
shippingRouter
  .route("/:id")
  .get(authCheck, roleCheck("admin"), ShippingController.getSingleShipping)
  .put(
    authCheck,
    roleCheck("admin"),
    dtoValidate(ShippingDTO.updateShippingSchema),
    ShippingController.updateShipping
  )
  .delete(authCheck, roleCheck("admin"), ShippingController.deleteShipping);

module.exports = shippingRouter;
