// ==> external import <==
const express = require("express");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

// ==> internal import <==
const corsOption = require("./config/cors.config");
const { errorMiddleware } = require("./middlewares/error.middleware");
const userRouter = require("./routes/user.route");
const categoryRouter = require("./routes/category.route");
const brandRouter = require("./routes/brand.route");
const productRouter = require("./routes/product.route");
const productImageRouter = require("./routes/product-image.route");
const ratingRouter = require("./routes/rating.route");
const cartRouter = require("./routes/cart.route");
const discountRouter = require("./routes/discount.route");
const settingRouter = require("./routes/setting.route");
const shippingRouter = require("./routes/shipping.route");
const shippingAddressRouter = require("./routes/shipping-address.route");
const orderRouter = require("./routes/order.route");
const varientRouter = require("./routes/varient.route");
const varientAttributrRouter = require("./routes/varient-attribute.route");
const shopRouter = require("./routes/shop.route");
const subscriptionRouter = require("./routes/subscription.route");
const invoiceRouter = require("./routes/invoice.route");
const billingCycleRouter = require("./routes/billing-cycle.route");
const { default: mongoose } = require("mongoose");

// ==> middlewares <==
// Apply CORS middleware first to handle preflight requests
app.use(cors(corsOption));

// Add CORS headers to all responses as a fallback
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://nanuvaierrosonakothon.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    "https://memobook.shop",
    "https://www.memobook.shop",
  ];
  const origin = req.headers.origin;

  // Allow requests with no origin (like direct browser access, Postman, curl)
  if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use(cookieParser());

// Serve static files from the uploads directory
app.use(express.static(path.join(__dirname, "uploads")));

// ==> test route <==
app.get("/api/hello", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Hello from Invoice Managerium Backend!",
    timestamp: new Date().toISOString(),
    data: {
      server: "Invoice Managerium Backend",
      status: "running",
      port: process.env.PORT,
    },
  });
});

app.get("/test", async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    return res.send("✅ Connected to MongoDB Atlas");
  } catch (err) {
    return res.send("❌ MongoDB connection failed: " + err.message);
  }
});
// ==> setting route <==
app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/product", productRouter);
app.use("/api/product-image", productImageRouter);
app.use("/api/varient", varientRouter);
app.use("/api/varient-attribute", varientAttributrRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/cart", cartRouter);
app.use("/api/discount", discountRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/shipping-address", shippingAddressRouter);
app.use("/api/order", orderRouter);
app.use("/api/setting", settingRouter);
app.use("/api/shop", shopRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/billing-cycle", billingCycleRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/*", (_req, res, _next) => {
  return res.status(400).json({
    success: false,
    message: "Route not found!",
  });
});

// error middleware
app.use(errorMiddleware);

module.exports = app;
