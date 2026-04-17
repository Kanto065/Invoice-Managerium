require("dotenv").config();
const mongoose = require("mongoose");
const VarientAttribute = require("./src/models/varient-attribut.model");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URL);
  const sizes = ["S", "M", "L", "XL"];
  
  for (const size of sizes) {
    const exist = await VarientAttribute.findOne({ name: "Size", value: size });
    if (!exist) {
      await VarientAttribute.create({ name: "Size", value: size });
      console.log(`Created size ${size}`);
    } else {
      console.log(`Size ${size} already exists`);
    }
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
