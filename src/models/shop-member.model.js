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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncShopMember, deleteShopMember } = require("../lib/mysql-sync");

shopMemberSchema.post("save", function (doc) { syncShopMember(doc); });

shopMemberSchema.post("findOneAndUpdate", function (doc) { if (doc) syncShopMember(doc); });

shopMemberSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
shopMemberSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncShopMember(doc);
});

shopMemberSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
shopMemberSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteShopMember(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const ShopMember =
    mongoose.models.shop_members ??
    mongoose.model("shop_members", shopMemberSchema);
module.exports = ShopMember;
