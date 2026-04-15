// ==>external import<==
const express = require("express");
const cartRouter = express.Router();

// ==>internal import<==
const CartController = require("../controllers/cart.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const CartDTO = require("../validation/cart.dto");
const { authCheck } = require("../middlewares/auth.middleware");

cartRouter
  .route("/add")
  .post(dtoValidate(CartDTO.addToCartSchema), CartController.addToCart);

cartRouter.route("/clear").delete(CartController.clearCart);
cartRouter
  .route("/merge")
  .post(dtoValidate(CartDTO.mergeGuestCartSchema), CartController.mergeCart);

cartRouter.route("/all").get(CartController.getCart);
cartRouter
  .route("/apply-coupon")
  .post(
    authCheck,
    dtoValidate(CartDTO.applyCartCouponSchema),
    CartController.applyCoupon
  );

cartRouter
  .route("/:id")
  .put(
    dtoValidate(CartDTO.changeCartQuantitySchema),
    CartController.updateCartQuantity
  )
  .delete(CartController.removeItemFromCart);
module.exports = cartRouter;
