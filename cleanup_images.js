require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

const ProductImages = require("./src/models/product-image.model");
const Category = require("./src/models/category.model");
const Brand = require("./src/models/brand.model");
const Varient = require("./src/models/varient.model");
const User = require("./src/models/user.model");
const Shop = require("./src/models/shop.model");

async function cleanup() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URL);
  
  const uploadDir = path.join(__dirname, "src/uploads/image");
  
  console.log("Reading upload directory...");
  const files = await fs.readdir(uploadDir);
  
  console.log("Gathering used filenames from database...");
  const pImages = await ProductImages.find({}, "image");
  const cImages = await Category.find({}, "image");
  const bImages = await Brand.find({}, "image");
  const vImages = await Varient.find({}, "image");
  const users = await User.find({}, "image");
  const shops = await Shop.find({}, "logo");
  
  const validSet = new Set([
     "product_placeholder.png", 
     "default-product.png", // keeping as backup just in case
     ".gitkeep",
     "" // empty strings in db
  ]);
  
  pImages.forEach(p => p.image && validSet.add(p.image));
  cImages.forEach(c => c.image && validSet.add(c.image));
  bImages.forEach(b => b.image && validSet.add(b.image));
  vImages.forEach(v => v.image && validSet.add(v.image));
  users.forEach(u => u.image && validSet.add(u.image));
  shops.forEach(s => s.logo && validSet.add(s.logo));
  
  let deletedCount = 0;
  
  console.log("Starting deletion...");
  for (const file of files) {
    if (!validSet.has(file)) {
      try {
        await fs.unlink(path.join(uploadDir, file));
        console.log(`Deleted orphan image: ${file}`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${file}: ${err.message}`);
      }
    }
  }
  
  console.log(`Cleanup complete! Deleted ${deletedCount} unused images.`);
  process.exit(0);
}

cleanup().catch((err) => {
    console.error(err);
    process.exit(1);
});
