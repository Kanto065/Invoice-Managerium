require("dotenv").config();
const mongoose = require("mongoose");
const ProductImages = require("./src/models/product-image.model");

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ Connected to MongoDB");

        const newPlaceholder = "27696f38-c9c2-4184-8fec-9ca0a227e8c9.png";
        const oldPlaceholders = ["product_placeholder.png", "upcoming", "upcomming"];

        console.log(`🚀 Migrating old placeholders: ${oldPlaceholders.join(", ")} -> ${newPlaceholder}`);

        const result = await ProductImages.updateMany(
            { image: { $in: oldPlaceholders } },
            { $set: { image: newPlaceholder } }
        );

        console.log(`✅ Successfully updated ${result.modifiedCount} image records.`);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
