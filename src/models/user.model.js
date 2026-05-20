const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    email: {
      required: true,
      unique: true,
      type: String,
    },
    password: {
      required: true,
      type: String,
    },
    phone: {
      required: false,
      type: String,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      required: true,
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    role: {
      required: true,
      type: String,
      enum: ["admin", "owner"],
      default: "owner",
    },
    provider: {
      required: true,
      type: String,
      default: "credentials",
    },
    isVerified: {
      required: true,
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    bio: {
      type: String,
      default: "",
    },
    businessName: {
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
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    refreshToken: String,
    emailVerifyToken: String,
    emailVerifyExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncUser, deleteUser } = require("../lib/mysql-sync");

userSchema.post("save", function (doc) { syncUser(doc); });

userSchema.post("findOneAndUpdate", function (doc) { if (doc) syncUser(doc); });

userSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
userSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncUser(doc);
});

userSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
userSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteUser(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const User = mongoose.models.users ?? mongoose.model("users", userSchema);
module.exports = User;
