// ==>external import<==
const express = require("express");
const orderRouter = express.Router();

// ==>internal import<==
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const OrderController = require("../controllers/order.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const OrderDTO = require("../validation/order.dto");

orderRouter
  .route("/create")
  .post(
    dtoValidate(OrderDTO.createOrderSchema),
    authCheck,
    OrderController.createOrder
  );

orderRouter.route("/myorder").get(authCheck, OrderController.getMyOrders);

orderRouter
  .route("/all")
  .get(authCheck, roleCheck("admin"), OrderController.getAllOrders);
orderRouter
  .route("/monthly-sales")
  .get(authCheck, roleCheck("admin"), OrderController.getMonthlySales);
orderRouter
  .route("/profit-summery")
  .get(authCheck, roleCheck("admin"), OrderController.getProfitSummary);
orderRouter
  .route("/stock-overview")
  .get(authCheck, roleCheck("admin"), OrderController.getStockOverview);

orderRouter
  .route("/:id")
  .get(authCheck, OrderController.getSingleOrder)
  .put(
    dtoValidate(OrderDTO.changeOrderStatusSchema),
    authCheck,
    roleCheck("admin"),
    OrderController.changeOrderStatus
  )
  .delete(authCheck, roleCheck("admin"), OrderController.deleteOrder);

module.exports = orderRouter;
