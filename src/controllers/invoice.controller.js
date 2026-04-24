const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Invoice = require("../models/invoice.model");
const Shop = require("../models/shop.model");
const ShopMember = require("../models/shop-member.model");
const UserSubscription = require("../models/user-subscription.model");
const SubscriptionPlan = require("../models/subscription-plan.model");
const Customer = require("../models/customer.model");
const ErrorHandler = require("../helper/error.helper");
const mail = require("../helper/mail.helper");
const invoiceMailTemplate = require("../views/invoiceMailTemplate");

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

// Get current 24-hour invoice count for a shop
async function getDailyInvoiceCount(shopId) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return Invoice.countDocuments({ shopId, createdAt: { $gte: twentyFourHoursAgo }, is_deleted: false });
}

// Check if user reached the print limit (20 prints per 24 hours for free plan)
async function isPrintLimitReached(shopId, ownerId) {
  const userSub = await UserSubscription.findOne({ userId: ownerId, status: "active" }).populate("planId");
  const isFreePlan = !userSub || userSub?.planId?.price === 0;

  if (isFreePlan) {
    const dailyPrintedCount = await Invoice.countDocuments({
      shopId,
      status: "printed",
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      is_deleted: false
    });
    return dailyPrintedCount >= 20;
  }
  return false;
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

// Generate next invoice number: IN-MMYY-XXXX where XXXX is random alphanumeric
async function generateInvoiceNumber() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const prefix = `IN-${mm}${yy}-`;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const fullId = `${prefix}${suffix}`;

  // Safety check: ensure global uniqueness across the entire database
  const exists = await Invoice.findOne({ invoiceNumber: fullId });
  if (exists) {
    return generateInvoiceNumber(); // Collision occurred, retry recursively
  }

  return fullId;
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

  // 2.1 Invoice limit check
  const userSub = await UserSubscription.findOne({ userId: shop.ownerId, status: "active" }).populate("planId");
  const isFreePlan = !userSub || userSub?.planId?.price === 0;

  if (isFreePlan) {
    // Free plan: 20 invoices per 24 hours
    const dailyCount = await getDailyInvoiceCount(shopId);
    if (dailyCount >= 20) {
      return next(
        new ErrorHandler(
          "Daily invoice limit reached (20 invoices max per 24 hours for free plan). Please upgrade your plan.",
          403
        )
      );
    }
  } else {
    // Paid plan: Monthly limit
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
    advanceAmount = 0,
    deliveryCharge = 0,
    isDeliveryPaid = false,
    notes = "",
    status = "issued",
    date,
  } = req.body;

  // Print limit check
  if (status === "printed") {
    if (await isPrintLimitReached(shopId, shop.ownerId)) {
      return next(new ErrorHandler("Daily print limit reached (20 prints max per 24 hours for free plan). Please upgrade your plan.", 403));
    }
  }

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

  const effectiveDeliveryCharge = isDeliveryPaid ? 0 : Number(deliveryCharge);
  const grandTotal = subtotal - discountAmount + tax + effectiveDeliveryCharge - Number(advanceAmount);

  const invoiceNumber = await generateInvoiceNumber();

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
    advanceAmount,
    deliveryCharge,
    isDeliveryPaid,
    grandTotal,
    notes,
    status,
    invoiceDate: date ? new Date(date) : undefined,
  });

  // Background send email if customer email exists
  if (invoice.customerEmail) {
    mail({
      email: invoice.customerEmail,
      subject: `Purchase Receipt from ${shop.name} - #${invoice.invoiceNumber}`,
      body: invoiceMailTemplate({ shop, invoice }),
    }).catch((err) => console.log("Email sending failed:", err));
  }

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

  const { page = 1, limit = 20, status, date } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { shopId, is_deleted: false };
  if (status) filter.status = status;

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.invoiceDate = { $gte: start, $lte: end };
  }

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

// ===> Update invoice <===
exports.updateInvoice = catchAsyncError(async (req, res, next) => {
  const { shopId, invoiceId } = req.params;
  const userId = req.user._id;

  const shop = await assertShopAccess(shopId, userId).catch((e) => next(e));
  if (!shop) return;

  const invoice = await Invoice.findOne({ _id: invoiceId, shopId, is_deleted: false });
  if (!invoice) {
    return next(new ErrorHandler("Invoice not found!", 404));
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    items,
    discountType,
    discount,
    tax,
    advanceAmount,
    deliveryCharge,
    isDeliveryPaid,
    notes,
    status,
    date,
  } = req.body;

  // Print limit check
  if (status === "printed" && invoice.status !== "printed") {
    if (await isPrintLimitReached(shopId, shop.ownerId)) {
      return next(new ErrorHandler("Daily print limit reached (20 prints max per 24 hours for free plan). Please upgrade your plan.", 403));
    }
  }

  if (customerName !== undefined) invoice.customerName = customerName;
  if (customerPhone !== undefined) invoice.customerPhone = customerPhone;
  if (customerEmail !== undefined) invoice.customerEmail = customerEmail;
  if (customerAddress !== undefined) invoice.customerAddress = customerAddress;
  if (notes !== undefined) invoice.notes = notes;
  if (status !== undefined) invoice.status = status;
  if (date !== undefined) invoice.invoiceDate = new Date(date);
  if (items) {
    invoice.items = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    }));
  }

  if (discountType !== undefined) invoice.discountType = discountType;
  if (discount !== undefined) invoice.discount = discount;
  if (tax !== undefined) invoice.tax = tax;
  if (advanceAmount !== undefined) invoice.advanceAmount = advanceAmount;
  if (deliveryCharge !== undefined) invoice.deliveryCharge = deliveryCharge;
  if (isDeliveryPaid !== undefined) invoice.isDeliveryPaid = isDeliveryPaid;

  // Recompute totals
  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  invoice.subtotal = subtotal;

  let discountAmount = 0;
  if (invoice.discountType === "percentage") {
    discountAmount = (subtotal * invoice.discount) / 100;
  } else {
    discountAmount = invoice.discount;
  }
  invoice.discountAmount = discountAmount;

  const effectiveDeliveryCharge = invoice.isDeliveryPaid ? 0 : (Number(invoice.deliveryCharge) || 0);
  invoice.grandTotal = subtotal - discountAmount + (invoice.tax || 0) + effectiveDeliveryCharge - (Number(invoice.advanceAmount) || 0);

  await invoice.save();

  // Background send email if customer email exists
  if (invoice.customerEmail) {
    mail({
      email: invoice.customerEmail,
      subject: `Purchase Receipt from ${shop.name} - #${invoice.invoiceNumber}`,
      body: invoiceMailTemplate({ shop, invoice }),
    }).catch((err) => console.log("Email sending failed:", err));
  }

  return res.status(200).json({
    success: true,
    invoice,
    message: "Invoice updated successfully!",
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

  // Print limit check for free plan
  if (status === "printed" && invoice.status !== "printed") {
    if (await isPrintLimitReached(shopId, shop.ownerId)) {
      return next(new ErrorHandler("Daily print limit reached (20 prints max per 24 hours for free plan). Please upgrade your plan.", 403));
    }
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
