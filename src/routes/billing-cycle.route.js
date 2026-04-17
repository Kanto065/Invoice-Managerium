const express = require("express");
const billingCycleRouter = express.Router();

const BillingCycleController = require("../controllers/billing-cycle.controller");
const BillingCycleDTO = require("../validation/billing-cycle.dto");
const { authCheck, roleCheck } = require("../middlewares/auth.middleware");
const dtoValidate = require("../middlewares/validate.middleware");

// Routes
billingCycleRouter.route("/all").get(BillingCycleController.getAllBillingCycles); // Public read

billingCycleRouter
    .route("/create")
    .post(
        authCheck,
        roleCheck("admin"),
        dtoValidate(BillingCycleDTO.createBillingCycleSchema),
        BillingCycleController.createBillingCycle
    );

billingCycleRouter
    .route("/:id")
    .put(
        authCheck,
        roleCheck("admin"),
        dtoValidate(BillingCycleDTO.updateBillingCycleSchema),
        BillingCycleController.updateBillingCycle
    )
    .delete(authCheck, roleCheck("admin"), BillingCycleController.deleteBillingCycle);

billingCycleRouter
    .route("/active-inactive/:id")
    .put(
        authCheck,
        roleCheck("admin"),
        dtoValidate(BillingCycleDTO.activeInactiveBillingCycleSchema),
        BillingCycleController.activeInactiveBillingCycle
    );

module.exports = billingCycleRouter;
