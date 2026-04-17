require("dotenv").config();
const mongoose = require("mongoose");
const ProductImages = require("./src/models/product-image.model");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URL);
  
  const result = await ProductImages.updateMany(
    { image: "default-product.png" },
    { $set: { image: "product_placeholder.png" } }
  );
  
  console.log(`Updated ${result.modifiedCount} images.`);
  process.exit(0);
}

fix().catch(console.error);
