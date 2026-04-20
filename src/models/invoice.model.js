const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
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
        orderId: {
            type: mongoose.Types.ObjectId,
            ref: "orders",
            default: null,
        },
        createdBy: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },

        invoiceNumber: {
            required: true,
            type: String,
            unique: true,
        },
        invoiceDate: {
            type: Date,
            default: Date.now,
        },

        customerId: {
            type: mongoose.Types.ObjectId,
            ref: "customers",
            default: null,
        },

        // ── Customer info snapshot ──
        customerName: {
            type: String,
            default: "",
        },
        customerPhone: {
            type: String,
            default: "",
        },
        customerEmail: {
            type: String,
            default: "",
        },
        customerAddress: {
            type: String,
            default: "",
        },

        // ── Line items ──
        items: [
            {
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                unitPrice: { type: Number, required: true },
                total: { type: Number, required: true },
            },
        ],

        // ── Totals ──
        subtotal: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        discountType: {
            type: String,
            enum: ["flat", "percentage"],
            default: "flat",
        },
        discount: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        advanceAmount: {
            type: Number,
            default: 0,
        },
        deliveryCharge: {
            type: Number,
            default: 0,
        },
        isDeliveryPaid: {
            type: Boolean,
            default: false,
        },
        grandTotal: {
            type: Number,
            default: 0,
        },

        notes: {
            type: String,
            default: "",
        },
        status: {
            required: true,
            type: String,
            enum: ["draft", "issued", "paid", "void", "printed"],
            default: "draft",
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for per-shop invoice lookups
invoiceSchema.index({ shopId: 1, createdAt: -1 });

const Invoice =
    mongoose.models.invoices ?? mongoose.model("invoices", invoiceSchema);
module.exports = Invoice;
