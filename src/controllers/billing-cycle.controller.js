const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const BillingCycle = require("../models/billing-cycle.model");
const ErrorHandler = require("../helper/error.helper");

// ===> Create Billing Cycle <===
exports.createBillingCycle = catchAsyncError(async (req, res, next) => {
    const { name, durationInMonths, discountAmount, isActive, sortOrder } = req.body;

    const existCycle = await BillingCycle.findOne({ name });
    if (existCycle) {
        return next(new ErrorHandler("A billing cycle with this name already exists!", 409));
    }

    const billingCycle = await BillingCycle.create({
        name,
        durationInMonths,
        discountAmount: discountAmount || 0,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
    });

    return res.status(201).json({
        success: true,
        billingCycle,
        message: "Billing cycle created successfully!",
    });
});

// ===> Get All Billing Cycles <===
exports.getAllBillingCycles = catchAsyncError(async (req, res, next) => {
    const { activeOnly } = req.query;
    let filter = {};
    if (activeOnly === "true") {
        filter.isActive = true;
    }
    const billingCycles = await BillingCycle.find(filter).sort({ sortOrder: 1 });
    return res.status(200).json({
        success: true,
        billingCycles,
    });
});

// ===> Update Billing Cycle <===
exports.updateBillingCycle = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const cycle = await BillingCycle.findById(id);
    if (!cycle) {
        return next(new ErrorHandler("Billing cycle not found!", 404));
    }

    const updateData = { ...req.body };
    await BillingCycle.updateOne({ _id: id }, { $set: updateData });
    
    return res.status(200).json({
        success: true,
        message: "Billing cycle updated successfully!",
    });
});

// ===> Delete Billing Cycle <===
exports.deleteBillingCycle = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const cycle = await BillingCycle.findById(id);
    if (!cycle) {
        return next(new ErrorHandler("Billing cycle not found!", 404));
    }

    await cycle.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Billing cycle deleted successfully!",
    });
});

// ===> Active/Inactive Billing Cycle <===
exports.activeInactiveBillingCycle = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updateData = { isActive };
    if (!isActive) {
        updateData.deactivatedAt = new Date();
    } else {
        updateData.deactivatedAt = null;
    }

    await BillingCycle.updateOne({ _id: id }, { $set: updateData });
    return res.status(200).json({
        success: true,
        message: "Billing cycle status updated!",
    });
});
