const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Invoice = require("../models/invoice.model");
const Shop = require("../models/shop.model");
const ShopMember = require("../models/shop-member.model");
const UserSubscription = require("../models/user-subscription.model");
const SubscriptionPlan = require("../models/subscription-plan.model");
const Customer = require("../models/customer.model");
const ErrorHandler = require("../helper/error.helper");

/* ── Helpers ── */

// Check if user is an active member (owner or moderator) of a shop
async function assertShopAccess(shopId, userId) {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new ErrorHandler("Shop not found!", 404);

  const isOwner = shop.ownerId.toString() === userId.toString();
  if (isOwner) return shop;

  const member = await ShopMember.findOne({
    shopId,
    userId,
    status: "active",
  });
  if (!member) throw new ErrorHandler("Access denied to this shop!", 403);

  return shop;
}

// Get current month invoice count for a shop
async function getMonthlyInvoiceCount(shopId) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return Invoice.countDocuments({ shopId, createdAt: { $gte: start }, is_deleted: false });
}

// Get user's active subscription limits
async function getUserLimits(ownerId) {
  const sub = await UserSubscription.findOne({
    userId: ownerId,
    status: "active",
  }).populate("planId");

  if (!sub?.planId) {
    return { maxInvoicesPerMonth: 20 };
  }
  return { maxInvoicesPerMonth: sub.planId.maxInvoicesPerMonth };
}

// Generate next invoice number for a shop: INV-YYYY-XXXX
async function generateInvoiceNumber(shopId) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await Invoice.findOne(
    { shopId, invoiceNumber: { $regex: `^${prefix}` }, is_deleted: false },
    { invoiceNumber: 1 },
    { sort: { createdAt: -1 } }
  );

  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split("-");
    seq = (parseInt(parts[parts.length - 1], 10) || 0) + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Invoice CRUD                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ===> Create invoice <===
exports.createInvoice = catchAsyncError(async (req, res, next) => {
  const { shopId } = req.params;
  const userId = req.user._id;

  const shop = await assertShopAccess(shopId, userId).catch((e) =>
    next(e)
  );
  if (!shop) return;

  // Monthly invoice limit check
  const limits = await getUserLimits(shop.ownerId);
  if (limits.maxInvoicesPerMonth !== -1) {
    const monthCount = await getMonthlyInvoiceCount(shopId);
    if (monthCount >= limits.maxInvoicesPerMonth) {
      return next(
        new ErrorHandler(
          `Monthly invoice limit reached (${limits.maxInvoicesPerMonth}). Upgrade your plan.`,
          403
        )
      );
    }
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    items,
    discountType = "flat",
    discount = 0,
    tax = 0,
    notes = "",
    status = "issued",
  } = req.body;

  // Compute totals server-side to avoid tampering
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * discount) / 100;
  } else {
    discountAmount = discount;
  }

  const grandTotal = subtotal - discountAmount + tax;

  const invoiceNumber = await generateInvoiceNumber(shopId);

  let customerId = null;
  if (customerPhone || customerName) {
    // Upsert customer by phone (or name if no phone is provided for this shop)
    const query = customerPhone ? { shopId, phone: customerPhone } : { shopId, name: customerName };
    const customer = await Customer.findOneAndUpdate(
      query,
      {
        $set: {
          ownerId: shop.ownerId,
          createdBy: userId,
          name: customerName || "",
          phone: customerPhone || "",
          email: customerEmail || "",
          address: customerAddress || "",
        },
        $inc: {
          totalInvoices: 1,
          totalSpent: grandTotal,
        }
      },
      { new: true, upsert: true }
    );
    customerId = customer._id;
  }

  const invoice = await Invoice.create({
    shopId,
    ownerId: shop.ownerId,
    createdBy: userId,
    invoiceNumber,
    customerId,
    customerName: customerName || "",
    customerPhone: customerPhone || "",
    customerEmail: customerEmail || "",
    customerAddress: customerAddress || "",
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    })),
    subtotal,
    discountType,
    discount,
    discountAmount,
    tax,
    grandTotal,
    notes,
    status,
  });

  return res.status(201).json({
    success: true,
    invoice,
    message: "Invoice created successfully!",
  });
});

// ===> List invoices for a shop <===
exports.listInvoices = catchAsyncError(async (req, res, next) => {
  const { shopId } = req.params;
  const userId = req.user._id;

  await assertShopAccess(shopId, userId).catch((e) => next(e));

  const { page = 1, limit = 20, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { shopId, is_deleted: false };
  if (status) filter.status = status;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("createdBy", "name email"),
    Invoice.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    invoices,
    total,
    page: Number(page),
  });
});

// ===> Get single invoice <===
exports.getInvoice = catchAsyncError(async (req, res, next) => {
  const { shopId, invoiceId } = req.params;
  const userId = req.user._id;

  await assertShopAccess(shopId, userId).catch((e) => next(e));

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    shopId,
    is_deleted: false,
  }).populate("createdBy", "name email");

  if (!invoice) {
    return next(new ErrorHandler("Invoice not found!", 404));
  }

  return res.status(200).json({
    success: true,
    invoice,
  });
});

// ===> Update invoice status <===
exports.updateInvoiceStatus = catchAsyncError(async (req, res, next) => {
  const { shopId, invoiceId } = req.params;
  const userId = req.user._id;

  const shop = await assertShopAccess(shopId, userId).catch((e) => next(e));
  if (!shop) return;

  const invoice = await Invoice.findOne({ _id: invoiceId, shopId, is_deleted: false });
  if (!invoice) {
    return next(new ErrorHandler("Invoice not found!", 404));
  }

  const { status } = req.body;
  const allowed = ["draft", "issued", "paid", "void", "printed"];
  if (!allowed.includes(status)) {
    return next(new ErrorHandler("Invalid status!", 400));
  }

  invoice.status = status;
  await invoice.save();

  return res.status(200).json({
    success: true,
    invoice,
    message: `Invoice marked as ${status}.`,
  });
});

// ===> Delete (void) invoice <===
exports.deleteInvoice = catchAsyncError(async (req, res, next) => {
  const { shopId, invoiceId } = req.params;
  const userId = req.user._id;

  const shop = await assertShopAccess(shopId, userId).catch((e) => next(e));
  if (!shop) return;

  // Only owner can delete
  if (shop.ownerId.toString() !== userId.toString()) {
    return next(new ErrorHandler("Only the shop owner can delete invoices!", 403));
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, shopId },
    { is_deleted: true },
    { new: true }
  );
  if (!invoice) {
    return next(new ErrorHandler("Invoice not found!", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Invoice deleted!",
  });
});

// ===> Invoice stats for a shop <===
exports.invoiceStats = catchAsyncError(async (req, res, next) => {
  const { shopId } = req.params;
  const userId = req.user._id;

  await assertShopAccess(shopId, userId).catch((e) => next(e));

  const [total, paid, issued, draft, revenue] = await Promise.all([
    Invoice.countDocuments({ shopId, is_deleted: false }),
    Invoice.countDocuments({ shopId, status: "paid", is_deleted: false }),
    Invoice.countDocuments({ shopId, status: "issued", is_deleted: false }),
    Invoice.countDocuments({ shopId, status: "draft", is_deleted: false }),
    Invoice.aggregate([
      { 
        $match: { 
          shopId: require("mongoose").Types.ObjectId.createFromHexString(shopId), 
          status: "paid",
          is_deleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    stats: {
      total,
      paid,
      issued,
      draft,
      revenue: revenue[0]?.total || 0,
    },
  });
});
