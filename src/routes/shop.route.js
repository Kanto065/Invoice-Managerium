const express = require("express");
const shopRouter = express.Router();

const { authCheck } = require("../middlewares/auth.middleware");
const ShopController = require("../controllers/shop.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const ShopDTO = require("../validation/shop.dto");

// Shop CRUD (owner)
shopRouter
    .route("/")
    .post(authCheck, dtoValidate(ShopDTO.createShopSchema), ShopController.createShop)
    .get(authCheck, ShopController.myShops);

shopRouter
    .route("/:id")
    .get(authCheck, ShopController.getShop)
    .put(authCheck, dtoValidate(ShopDTO.updateShopSchema), ShopController.updateShop)
    .delete(authCheck, ShopController.deleteShop);

// Shop members
shopRouter
    .route("/:id/members")
    .get(authCheck, ShopController.listMembers)
    .post(authCheck, ShopController.addMember);

shopRouter
    .route("/:id/members/:userId")
    .delete(authCheck, ShopController.removeMember);

module.exports = shopRouter;
