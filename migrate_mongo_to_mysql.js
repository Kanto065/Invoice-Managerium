/**
 * migrate_mongo_to_mysql.js
 *
 * One-shot script: reads all collections from MongoDB and inserts them into MySQL via Prisma.
 * Safe to re-run — uses upsert (skipDuplicates / updateOrCreate) so existing rows are skipped.
 *
 * Usage:
 *   1. Fill in DATABASE_URL in .env with your real MySQL host
 *   2. Run:  node migrate_mongo_to_mysql.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { PrismaClient } = require("./src/generated/prisma");

// ── Mongoose models ──────────────────────────────────────────────────────────
const User = require("./src/models/user.model");
const Shop = require("./src/models/shop.model");
const ShopMember = require("./src/models/shop-member.model");
const Category = require("./src/models/category.model");
const Brand = require("./src/models/brand.model");
const Product = require("./src/models/product.model");
const Varient = require("./src/models/varient.model");
const VarientAttribute = require("./src/models/varient-attribut.model");
const Customer = require("./src/models/customer.model");
const Invoice = require("./src/models/invoice.model");
const BillingCycle = require("./src/models/billing-cycle.model");
const SubscriptionPlan = require("./src/models/subscription-plan.model");
const UserSubscription = require("./src/models/user-subscription.model");
const ProductImage = require("./src/models/product-image.model");

const prisma = new PrismaClient();

const id = (objectId) => (objectId ? objectId.toString() : null);

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[migrate] ${msg}`);
}

function warn(msg) {
  console.warn(`[migrate] SKIP: ${msg}`);
}

async function upsertSafe(label, fn) {
  try {
    await fn();
  } catch (e) {
    warn(`${label} — ${e.message?.split("\n")[0]}`);
  }
}

// ── Per-collection migrators ─────────────────────────────────────────────────

async function migrateUsers() {
  const docs = await User.find({}).lean();
  log(`Users: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`User ${id(d._id)}`, () => prisma.user.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Users done.`);
}

async function migrateBillingCycles() {
  const docs = await BillingCycle.find({}).lean();
  log(`BillingCycles: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`BillingCycle ${id(d._id)}`, () => prisma.billingCycle.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        name: d.name,
        durationInMonths: d.durationInMonths,
        discountAmount: d.discountAmount ?? 0,
        isActive: d.isActive ?? true,
        sortOrder: d.sortOrder ?? 0,
        deactivatedAt: d.deactivatedAt || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`BillingCycles done.`);
}

async function migrateSubscriptionPlans() {
  const docs = await SubscriptionPlan.find({}).lean();
  log(`SubscriptionPlans: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`SubscriptionPlan ${id(d._id)}`, () => prisma.subscriptionPlan.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`SubscriptionPlans done.`);
}

async function migrateShops() {
  const docs = await Shop.find({}).lean();
  log(`Shops: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Shop ${id(d._id)}`, () => prisma.shop.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        ownerId: id(d.ownerId),
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Shops done.`);
}

async function migrateShopMembers() {
  const docs = await ShopMember.find({}).lean();
  log(`ShopMembers: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`ShopMember ${id(d._id)}`, () => prisma.shopMember.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        shopId: id(d.shopId),
        userId: id(d.userId),
        role: d.role || "moderator",
        canCreateProduct: d.permissions?.canCreateProduct ?? true,
        canCreateInvoice: d.permissions?.canCreateInvoice ?? true,
        canViewReports: d.permissions?.canViewReports ?? false,
        canManageOrders: d.permissions?.canManageOrders ?? true,
        invitedBy: id(d.invitedBy),
        status: d.status || "active",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`ShopMembers done.`);
}

async function migrateCategories() {
  const docs = await Category.find({}).lean();
  log(`Categories: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Category ${id(d._id)}`, () => prisma.category.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        name: d.name,
        slug: d.slug,
        image: d.image || "",
        parentId: id(d.parentId),
        status: d.status || "active",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Categories done.`);
}

async function migrateBrands() {
  const docs = await Brand.find({}).lean();
  log(`Brands: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Brand ${id(d._id)}`, () => prisma.brand.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        name: d.name,
        image: d.image || null,
        status: d.status || "active",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Brands done.`);
}

async function migrateProducts() {
  const docs = await Product.find({}).lean();
  log(`Products: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Product ${id(d._id)}`, () => prisma.product.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        name: d.name,
        shopId: id(d.shopId),
        slug: d.slug,
        varientId: id(d.varientId),
        brandId: id(d.brandId),
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Products done.`);
}

async function migrateProductImages() {
  const docs = await ProductImage.find({}).lean();
  log(`ProductImages: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`ProductImage ${id(d._id)}`, () => prisma.productImage.upsert({
      where: { id: id(d._id) },
      update: {
        productId: id(d.productId),
        image: d.image,
        updatedAt: d.updatedAt,
      },
      create: {
        id: id(d._id),
        productId: id(d.productId),
        image: d.image,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`ProductImages done.`);
}

async function migrateVarients() {
  const docs = await Varient.find({}).lean();
  log(`Varients: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Varient ${id(d._id)}`, () => prisma.varient.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        productId: id(d.productId),
        sku: d.sku,
        price: d.price ?? 0,
        stock: d.stock ?? 0,
        image: d.image || "",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Varients done.`);
}

async function migrateVarientAttributes() {
  const docs = await VarientAttribute.find({}).lean();
  log(`VarientAttributes: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`VarientAttribute ${id(d._id)}`, () => prisma.varientAttribute.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        name: d.name,
        value: d.value,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`VarientAttributes done.`);
}

async function migrateCustomers() {
  const docs = await Customer.find({}).lean();
  log(`Customers: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`Customer ${id(d._id)}`, () => prisma.customer.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        shopId: id(d.shopId),
        ownerId: id(d.ownerId),
        createdBy: id(d.createdBy),
        name: d.name || "",
        phone: d.phone || "",
        email: d.email || "",
        address: d.address || "",
        totalInvoices: d.totalInvoices ?? 0,
        totalSpent: d.totalSpent ?? 0,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`Customers done.`);
}

async function migrateInvoices() {
  const docs = await Invoice.find({}).lean();
  log(`Invoices: ${docs.length}`);
  for (const d of docs) {
    const invoiceId = id(d._id);
    await upsertSafe(`Invoice ${invoiceId}`, () => prisma.invoice.upsert({
      where: { id: invoiceId },
      update: {},
      create: {
        id: invoiceId,
        shopId: id(d.shopId),
        ownerId: id(d.ownerId),
        orderId: id(d.orderId),
        createdBy: id(d.createdBy),
        invoiceNumber: d.invoiceNumber,
        invoiceDate: d.invoiceDate || d.createdAt,
        customerId: id(d.customerId),
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        items: {
          create: (d.items || []).map((item) => ({
            id: id(item._id) || undefined,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    }));
  }
  log(`Invoices done.`);
}

async function migrateUserSubscriptions() {
  const docs = await UserSubscription.find({}).lean();
  log(`UserSubscriptions: ${docs.length}`);
  for (const d of docs) {
    await upsertSafe(`UserSubscription ${id(d._id)}`, () => prisma.userSubscription.upsert({
      where: { id: id(d._id) },
      update: {},
      create: {
        id: id(d._id),
        userId: id(d.userId),
        planId: id(d.planId),
        billingCycleId: id(d.billingCycleId),
        status: d.status || "pending",
        paymentMethod: d.paymentMethod || "free",
        paymentReference: d.paymentReference || "",
        paymentAmount: d.paymentAmount ?? 0,
        startDate: d.startDate || null,
        endDate: d.endDate || null,
        approvedBy: id(d.approvedBy),
        approvedAt: d.approvedAt || null,
        rejectionReason: d.rejectionReason || "",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    }));
  }
  log(`UserSubscriptions done.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URL);
  log("MongoDB connected.");

  log("Connecting to MySQL via Prisma...");
  await prisma.$connect();
  log("MySQL connected.");

  // Order matters: migrate parents before children
  await migrateUsers();
  await migrateBillingCycles();
  await migrateSubscriptionPlans();
  await migrateShops();
  await migrateCategories();
  await migrateBrands();
  await migrateProducts();
  await migrateProductImages();
  await migrateVarients();
  await migrateVarientAttributes();
  await migrateCustomers();
  await migrateInvoices();
  await migrateShopMembers();
  await migrateUserSubscriptions();

  log("All done!");
  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
