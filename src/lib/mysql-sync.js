/**
 * mysql-sync.js
 * Fire-and-forget helpers that mirror MongoDB writes to MySQL via Prisma.
 * Every function swallows its own errors so MongoDB ops are never blocked.
 */

const prisma = require("./prisma");

const toId = (v) => (v ? v.toString() : null);

function safe(label, fn) {
  return Promise.resolve()
    .then(fn)
    .catch((err) => console.error(`[mysql-sync] ${label}:`, err.message));
}

const plain = (doc) => (doc?.toObject ? doc.toObject() : doc);

// ── User ──────────────────────────────────────────────────────────────────────

function _userFields(d) {
  return {
    name: d.name,
    email: d.email,
    password: d.password,
    phone: d.phone || null,
    image: d.image || "",
    status: d.status || "active",
    role: d.role || "owner",
    provider: d.provider || "credentials",
    isVerified: d.isVerified ?? false,
    bio: d.bio || null,
    businessName: d.businessName || null,
    contactNumber: d.contactNumber || null,
    addressLine1: d.address?.address_line1 || null,
    addressLine2: d.address?.address_line2 || null,
    city: d.address?.city || null,
    state: d.address?.state || null,
    postalCode: d.address?.postal_code || null,
    country: d.address?.country || null,
    facebook: d.socialLinks?.facebook || null,
    instagram: d.socialLinks?.instagram || null,
    twitter: d.socialLinks?.twitter || null,
    linkedin: d.socialLinks?.linkedin || null,
    refreshToken: d.refreshToken || null,
    emailVerifyToken: d.emailVerifyToken || null,
    emailVerifyExpire: d.emailVerifyExpire || null,
    resetPasswordToken: d.resetPasswordToken || null,
    resetPasswordExpire: d.resetPasswordExpire || null,
  };
}

function syncUser(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _userFields(d);
  return safe(`syncUser:${id}`, () =>
    prisma.user.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteUser(mongoId) {
  return safe(`deleteUser:${mongoId}`, () =>
    prisma.user.delete({ where: { id: mongoId } })
  );
}

// ── Shop ──────────────────────────────────────────────────────────────────────

function _shopFields(d) {
  return {
    ownerId: toId(d.ownerId),
    name: d.name,
    slug: d.slug,
    logo: d.logo || "",
    contactNumber: d.contactNumber || null,
    addressLine1: d.address?.address_line1 || null,
    addressLine2: d.address?.address_line2 || null,
    city: d.address?.city || null,
    state: d.address?.state || null,
    postalCode: d.address?.postal_code || null,
    country: d.address?.country || null,
    facebook: d.socialLinks?.facebook || null,
    instagram: d.socialLinks?.instagram || null,
    headerText: d.receiptConfig?.headerText || null,
    footerText: d.receiptConfig?.footerText || "Thank you for your purchase!",
    showLogo: d.receiptConfig?.showLogo ?? true,
    accentColor: d.receiptConfig?.accentColor || "#005C72",
    status: d.status || "active",
  };
}

function syncShop(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _shopFields(d);
  return safe(`syncShop:${id}`, () =>
    prisma.shop.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteShop(mongoId) {
  return safe(`deleteShop:${mongoId}`, () =>
    prisma.shop.delete({ where: { id: mongoId } })
  );
}

// ── ShopMember ────────────────────────────────────────────────────────────────

function _shopMemberFields(d) {
  return {
    shopId: toId(d.shopId),
    userId: toId(d.userId),
    role: d.role || "moderator",
    canCreateProduct: d.permissions?.canCreateProduct ?? true,
    canCreateInvoice: d.permissions?.canCreateInvoice ?? true,
    canViewReports: d.permissions?.canViewReports ?? false,
    canManageOrders: d.permissions?.canManageOrders ?? true,
    invitedBy: toId(d.invitedBy),
    status: d.status || "active",
  };
}

function syncShopMember(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _shopMemberFields(d);
  return safe(`syncShopMember:${id}`, () =>
    prisma.shopMember.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteShopMember(mongoId) {
  return safe(`deleteShopMember:${mongoId}`, () =>
    prisma.shopMember.delete({ where: { id: mongoId } })
  );
}

// ── Category ──────────────────────────────────────────────────────────────────

function _categoryFields(d) {
  return {
    name: d.name,
    slug: d.slug,
    image: d.image || "",
    parentId: toId(d.parentId),
    status: d.status || "active",
  };
}

function syncCategory(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _categoryFields(d);
  return safe(`syncCategory:${id}`, () =>
    prisma.category.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteCategory(mongoId) {
  return safe(`deleteCategory:${mongoId}`, () =>
    prisma.category.delete({ where: { id: mongoId } })
  );
}

// ── Brand ─────────────────────────────────────────────────────────────────────

function _brandFields(d) {
  return {
    name: d.name,
    image: d.image || null,
    status: d.status || "active",
  };
}

function syncBrand(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _brandFields(d);
  return safe(`syncBrand:${id}`, () =>
    prisma.brand.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteBrand(mongoId) {
  return safe(`deleteBrand:${mongoId}`, () =>
    prisma.brand.delete({ where: { id: mongoId } })
  );
}

// ── Product ───────────────────────────────────────────────────────────────────

function _productFields(d) {
  return {
    name: d.name,
    shopId: toId(d.shopId),
    slug: d.slug,
    varientId: toId(d.varientId),
    brandId: toId(d.brandId),
    description: d.description || "",
    price: d.price ?? 0,
    previousPrice: d.previousPrice ?? null,
    extraPrice: d.extraPrice ?? null,
    buyingPrice: d.buyingPrice ?? null,
    stock: d.stock ?? 0,
    sold: d.sold ?? 0,
    rating: d.rating ?? 0,
    location: d.location || "Dhaka",
    featured: d.featured ?? false,
    freeDelivery: d.freeDelivery ?? false,
    isDemo: d.isDemo ?? false,
    status: d.status || "active",
  };
}

function syncProduct(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _productFields(d);
  return safe(`syncProduct:${id}`, () =>
    prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteProduct(mongoId) {
  return safe(`deleteProduct:${mongoId}`, () =>
    prisma.product.delete({ where: { id: mongoId } })
  );
}

// ── ProductImage ──────────────────────────────────────────────────────────────

function _productImageFields(d) {
  return {
    productId: toId(d.productId),
    image: d.image,
  };
}

function syncProductImage(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _productImageFields(d);
  return safe(`syncProductImage:${id}`, () =>
    prisma.productImage.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteProductImage(mongoId) {
  return safe(`deleteProductImage:${mongoId}`, () =>
    prisma.productImage.delete({ where: { id: mongoId } })
  );
}

// ── Varient ───────────────────────────────────────────────────────────────────

function _varientFields(d) {
  return {
    productId: toId(d.productId),
    sku: d.sku,
    price: d.price ?? 0,
    stock: d.stock ?? 0,
    image: d.image || "",
  };
}

function syncVarient(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _varientFields(d);
  return safe(`syncVarient:${id}`, () =>
    prisma.varient.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteVarient(mongoId) {
  return safe(`deleteVarient:${mongoId}`, () =>
    prisma.varient.delete({ where: { id: mongoId } })
  );
}

// ── VarientAttribute ──────────────────────────────────────────────────────────

function _varientAttributeFields(d) {
  return { name: d.name, value: d.value };
}

function syncVarientAttribute(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _varientAttributeFields(d);
  return safe(`syncVarientAttribute:${id}`, () =>
    prisma.varientAttribute.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteVarientAttribute(mongoId) {
  return safe(`deleteVarientAttribute:${mongoId}`, () =>
    prisma.varientAttribute.delete({ where: { id: mongoId } })
  );
}

// ── Customer ──────────────────────────────────────────────────────────────────

function _customerFields(d) {
  return {
    shopId: toId(d.shopId),
    ownerId: toId(d.ownerId),
    createdBy: toId(d.createdBy),
    name: d.name || "",
    phone: d.phone || "",
    email: d.email || "",
    address: d.address || "",
    totalInvoices: d.totalInvoices ?? 0,
    totalSpent: d.totalSpent ?? 0,
  };
}

function syncCustomer(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _customerFields(d);
  return safe(`syncCustomer:${id}`, () =>
    prisma.customer.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteCustomer(mongoId) {
  return safe(`deleteCustomer:${mongoId}`, () =>
    prisma.customer.delete({ where: { id: mongoId } })
  );
}

// ── Invoice ───────────────────────────────────────────────────────────────────

function _invoiceFields(d) {
  return {
    shopId: toId(d.shopId),
    ownerId: toId(d.ownerId),
    orderId: toId(d.orderId),
    createdBy: toId(d.createdBy),
    invoiceNumber: d.invoiceNumber,
    invoiceDate: d.invoiceDate || d.createdAt,
    customerId: toId(d.customerId),
    customerName: d.customerName || "",
    customerPhone: d.customerPhone || "",
    customerEmail: d.customerEmail || "",
    customerAddress: d.customerAddress || "",
    subtotal: d.subtotal ?? 0,
    tax: d.tax ?? 0,
    discountType: d.discountType || "flat",
    discount: d.discount ?? 0,
    discountAmount: d.discountAmount ?? 0,
    advanceAmount: d.advanceAmount ?? 0,
    deliveryCharge: d.deliveryCharge ?? 0,
    isDeliveryPaid: d.isDeliveryPaid ?? false,
    grandTotal: d.grandTotal ?? 0,
    notes: d.notes || null,
    status: d.status || "draft",
    is_deleted: d.is_deleted ?? false,
  };
}

function syncInvoice(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _invoiceFields(d);
  const items = (d.items || []).map((item) => ({
    invoiceId: id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
  }));

  return safe(`syncInvoice:${id}`, async () => {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.upsert({ where: { id }, update: data, create: { id, ...data } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      if (items.length) await tx.invoiceItem.createMany({ data: items });
    });
  });
}

function deleteInvoice(mongoId) {
  return safe(`deleteInvoice:${mongoId}`, async () => {
    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: mongoId } });
      await tx.invoice.delete({ where: { id: mongoId } });
    });
  });
}

// ── BillingCycle ──────────────────────────────────────────────────────────────

function _billingCycleFields(d) {
  return {
    name: d.name,
    durationInMonths: d.durationInMonths,
    discountAmount: d.discountAmount ?? 0,
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 0,
    deactivatedAt: d.deactivatedAt || null,
  };
}

function syncBillingCycle(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _billingCycleFields(d);
  return safe(`syncBillingCycle:${id}`, () =>
    prisma.billingCycle.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteBillingCycle(mongoId) {
  return safe(`deleteBillingCycle:${mongoId}`, () =>
    prisma.billingCycle.delete({ where: { id: mongoId } })
  );
}

// ── SubscriptionPlan ──────────────────────────────────────────────────────────

function _subscriptionPlanFields(d) {
  return {
    name: d.name,
    slug: d.slug,
    description: d.description || "",
    price: d.price ?? 0,
    maxShops: d.maxShops ?? 1,
    maxModeratorsPerShop: d.maxModeratorsPerShop ?? 0,
    maxProductsPerShop: d.maxProductsPerShop ?? 10,
    maxInvoicesPerMonth: d.maxInvoicesPerMonth ?? 20,
    featReceiptCustom: d.features?.receiptCustomization ?? false,
    featExportPdf: d.features?.exportPdf ?? false,
    featAnalytics: d.features?.analytics ?? false,
    isActive: d.isActive ?? true,
    sortOrder: d.sortOrder ?? 0,
    deactivatedAt: d.deactivatedAt || null,
  };
}

function syncSubscriptionPlan(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _subscriptionPlanFields(d);
  return safe(`syncSubscriptionPlan:${id}`, () =>
    prisma.subscriptionPlan.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteSubscriptionPlan(mongoId) {
  return safe(`deleteSubscriptionPlan:${mongoId}`, () =>
    prisma.subscriptionPlan.delete({ where: { id: mongoId } })
  );
}

// ── UserSubscription ──────────────────────────────────────────────────────────

function _userSubscriptionFields(d) {
  return {
    userId: toId(d.userId),
    planId: toId(d.planId),
    billingCycleId: toId(d.billingCycleId),
    status: d.status || "pending",
    paymentMethod: d.paymentMethod || "free",
    paymentReference: d.paymentReference || "",
    paymentAmount: d.paymentAmount ?? 0,
    startDate: d.startDate || null,
    endDate: d.endDate || null,
    approvedBy: toId(d.approvedBy),
    approvedAt: d.approvedAt || null,
    rejectionReason: d.rejectionReason || "",
  };
}

function syncUserSubscription(doc) {
  const d = plain(doc);
  const id = toId(d._id);
  const data = _userSubscriptionFields(d);
  return safe(`syncUserSubscription:${id}`, () =>
    prisma.userSubscription.upsert({ where: { id }, update: data, create: { id, ...data } })
  );
}

function deleteUserSubscription(mongoId) {
  return safe(`deleteUserSubscription:${mongoId}`, () =>
    prisma.userSubscription.delete({ where: { id: mongoId } })
  );
}

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  syncUser, deleteUser,
  syncShop, deleteShop,
  syncShopMember, deleteShopMember,
  syncCategory, deleteCategory,
  syncBrand, deleteBrand,
  syncProduct, deleteProduct,
  syncProductImage, deleteProductImage,
  syncVarient, deleteVarient,
  syncVarientAttribute, deleteVarientAttribute,
  syncCustomer, deleteCustomer,
  syncInvoice, deleteInvoice,
  syncBillingCycle, deleteBillingCycle,
  syncSubscriptionPlan, deleteSubscriptionPlan,
  syncUserSubscription, deleteUserSubscription,
};
