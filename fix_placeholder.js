require("dotenv").config();
const mongoose = require("mongoose");
const ProductImages = require("./src/models/product-image.model");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URL);
  
  const result = await ProductImages.updateMany(
    { image: "default-product.png" },
    { $set: { image: "27696f38-c9c2-4184-8fec-9ca0a227e8c9.png" } }
  );
  
  console.log(`Updated ${result.modifiedCount} images.`);
  process.exit(0);
}

fix().catch(console.error);
