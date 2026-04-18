const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        shopId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "shops",
        },
        ownerId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        createdBy: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        name: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            default: "",
        },
        address: {
            type: String,
            default: "",
        },
        // For future CRM features
        totalInvoices: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// We don't enforce unique phone across the whole DB, but rather unique per shop, 
// though we handle that logic in the controller to avoid strict DB errors for walk-in (no phone) customers.

const Customer = mongoose.model("customers", customerSchema);
module.exports = Customer;
