// ==>external import<==
const express = require("express");
const shippingAddressRouter = express.Router();

// ==>internal import<==
const { authCheck } = require("../middlewares/auth.middleware");
const ShippingAddressController = require("../controllers/shipping-address.controller");
const ShippingAddressDTO = require("../validation/shipping-address.dto");
const dtoValidate = require("../middlewares/validate.middleware");

shippingAddressRouter
  .route("/create")
  .post(
    authCheck,
    dtoValidate(ShippingAddressDTO.createShippingAddressSchema),
    ShippingAddressController.createShippingAddress
  );

shippingAddressRouter
  .route("/all")
  .get(authCheck, ShippingAddressController.getAllShippingAddress);

shippingAddressRouter
  .route("/:id")
  .get(authCheck, ShippingAddressController.getSingleShippingAddress)
  .put(
    authCheck,
    dtoValidate(ShippingAddressDTO.updateShippingAddressSchema),
    ShippingAddressController.updateShippingAddress
  )
  .delete(authCheck, ShippingAddressController.deleteShippingAddress);

module.exports = shippingAddressRouter;
