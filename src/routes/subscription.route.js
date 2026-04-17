const express = require("express");
const subscriptionRouter = express.Router();

const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const SubController = require("../controllers/subscription.controller");
const dtoValidate = require("../middlewares/validate.middleware");
const SubDTO = require("../validation/subscription.dto");

// ── Public: list available plans ──
subscriptionRouter.route("/plans").get(SubController.listPlans);

// ── User: purchase + view my subscription ──
subscriptionRouter
    .route("/purchase")
    .post(
        authCheck,
        dtoValidate(SubDTO.purchaseSubscriptionSchema),
        SubController.purchasePlan
    );

subscriptionRouter.route("/my").get(authCheck, SubController.mySubscription);

// ── Admin: plan CRUD ──
subscriptionRouter
    .route("/admin/plans")
    .post(
        authCheck,
        roleCheck("admin"),
        dtoValidate(SubDTO.createPlanSchema),
        SubController.createPlan
    );

subscriptionRouter
    .route("/admin/plans/:id")
    .get(authCheck, roleCheck("admin"), SubController.getPlan)
    .put(
        authCheck,
        roleCheck("admin"),
        dtoValidate(SubDTO.updatePlanSchema),
        SubController.updatePlan
    )
    .delete(authCheck, roleCheck("admin"), SubController.deletePlan);

subscriptionRouter
    .route("/admin/plans/active-inactive/:id")
    .put(authCheck, roleCheck("admin"), SubController.activeInactivePlan);

// ── Admin: manage subscriptions ──
subscriptionRouter
    .route("/admin/subscriptions")
    .get(authCheck, roleCheck("admin"), SubController.listSubscriptions);

subscriptionRouter
    .route("/admin/subscriptions/:id")
    .put(
        authCheck,
        roleCheck("admin"),
        dtoValidate(SubDTO.approveSubscriptionSchema),
        SubController.handleSubscription
    );

// ── Admin: stats ──
subscriptionRouter
    .route("/admin/stats")
    .get(authCheck, roleCheck("admin"), SubController.subscriptionStats);

module.exports = subscriptionRouter;
