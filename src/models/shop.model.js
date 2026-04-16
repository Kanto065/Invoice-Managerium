const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
    {
        ownerId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        name: {
            required: true,
            type: String,
        },
        slug: {
            required: true,
            type: String,
            unique: true,
        },

        logo: {
            type: String,
            default: "",
        },
        contactNumber: {
            type: String,
            default: "",
        },

        address: {
            address_line1: { type: String, default: "" },
            address_line2: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            postal_code: { type: String, default: "" },
            country: { type: String, default: "" },
        },

        socialLinks: {
            facebook: { type: String, default: "" },
            instagram: { type: String, default: "" },
        },

        // ── Receipt branding ──
        receiptConfig: {
            headerText: { type: String, default: "" },
            footerText: { type: String, default: "Thank you for your purchase!" },
            showLogo: { type: Boolean, default: true },
            accentColor: { type: String, default: "#005C72" },
        },

        status: {
            required: true,
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

// Index for finding shops by owner
shopSchema.index({ ownerId: 1 });

const Shop = mongoose.models.shops ?? mongoose.model("shops", shopSchema);
module.exports = Shop;
