const mongoose = require("mongoose");

const shopMemberSchema = new mongoose.Schema(
    {
        shopId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "shops",
        },
        userId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        role: {
            required: true,
            type: String,
            enum: ["owner", "moderator"],
            default: "moderator",
        },

        permissions: {
            canCreateProduct: { type: Boolean, default: true },
            canCreateInvoice: { type: Boolean, default: true },
            canViewReports: { type: Boolean, default: false },
            canManageOrders: { type: Boolean, default: true },
        },

        invitedBy: {
            type: mongoose.Types.ObjectId,
            ref: "users",
            default: null,
        },
        status: {
            required: true,
            type: String,
            enum: ["active", "revoked"],
            default: "active",
        },
    },
    { timestamps: true }
);

// Compound index — a user can only be a member of a shop once
shopMemberSchema.index({ shopId: 1, userId: 1 }, { unique: true });

const ShopMember =
    mongoose.models.shop_members ??
    mongoose.model("shop_members", shopMemberSchema);
module.exports = ShopMember;
