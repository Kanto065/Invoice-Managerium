const fs = require("fs").promises;
const path = require("path");

const ProductImages = require("../models/product-image.model");
const Category = require("../models/category.model");
const Brand = require("../models/brand.model");
const Varient = require("../models/varient.model");
const User = require("../models/user.model");
const Shop = require("../models/shop.model");

async function cleanupOrphanImages() {
  const uploadDir = path.join(__dirname, "..", "uploads", "image");
  try {
      const files = await fs.readdir(uploadDir);
      
      const [pImages, cImages, bImages, vImages, users, shops] = await Promise.all([
         ProductImages.find({}, "image"),
         Category.find({}, "image"),
         Brand.find({}, "image"),
         Varient.find({}, "image"),
         User.find({}, "image"),
         Shop.find({}, "logo")
      ]);
      
      const validSet = new Set([
         "product_placeholder.png", 
         "default-product.png",
         ".gitkeep",
         "" 
      ]);
      
      pImages.forEach(p => p.image && validSet.add(p.image));
      cImages.forEach(c => c.image && validSet.add(c.image));
      bImages.forEach(b => b.image && validSet.add(b.image));
      vImages.forEach(v => v.image && validSet.add(v.image));
      users.forEach(u => u.image && validSet.add(u.image));
      shops.forEach(s => s.logo && validSet.add(s.logo));
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (!validSet.has(file)) {
          try {
            await fs.unlink(path.join(uploadDir, file));
            deletedCount++;
          } catch (err) { }
        }
      }
      if(deletedCount > 0) console.log(`[CRON] Cleaned up ${deletedCount} unused images.`);
  } catch(e) {
      console.error("[CRON] Image Cleanup Error:", e);
  }
}

module.exports = { cleanupOrphanImages };
