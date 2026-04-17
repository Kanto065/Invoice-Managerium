const mongoose = require("mongoose");
require("dotenv").config();
const slugify = require("slugify");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB...");

        const Product = mongoose.model("products", new mongoose.Schema({
            name: String,
            slug: String,
            varientId: mongoose.Schema.Types.ObjectId,
            description: String,
            price: Number,
            buyingPrice: Number,
            stock: Number,
            status: String,
            isDemo: Boolean,
            location: String
        }));

        const ProductImage = mongoose.model("productimages", new mongoose.Schema({
            productId: mongoose.Schema.Types.ObjectId,
            image: String
        }));

        // Clean existing demo products
        await Product.deleteMany({ isDemo: true });
        
        const varientId = "69e28ab72d298535becfbf2b"; // From our check
        
        const demoProducts = [
            { name: "Wireless Bluetooth Headphones", price: 2500, buyingPrice: 1800, stock: 15, desc: "High-quality wireless headphones with noise cancellation." },
            { name: "Leather Men's Wallet", price: 1200, buyingPrice: 600, stock: 45, desc: "Genuine leather wallet with multiple card slots." },
            { name: "Solid State Drive (SSD) 500GB", price: 4500, buyingPrice: 3800, stock: 10, desc: "Fast data transfer and reliable internal storage." },
            { name: "Smart Fitness Watch", price: 3200, buyingPrice: 2100, stock: 20, desc: "Track your health and activities with this smart watch." },
            { name: "Ergonomic Office Chair", price: 8500, buyingPrice: 5500, stock: 5, desc: "Comfortable chair for long working hours." },
            { name: "Stainless Steel Water Bottle", price: 800, buyingPrice: 350, stock: 100, desc: "Eco-friendly durable water bottle." },
            { name: "Mechanical Gaming Keyboard", price: 3800, buyingPrice: 2500, stock: 12, desc: "RGB backlit mechanical keyboard for gamers." },
            { name: "USB-C Multiport Hub", price: 1500, buyingPrice: 900, stock: 30, desc: "Expand your connectivity with this 5-in-1 hub." },
            { name: "Portable Power Bank 20000mAh", price: 2000, buyingPrice: 1200, stock: 25, desc: "Charge your devices on the go." },
            { name: "Premium Coffee Beans 500g", price: 1500, buyingPrice: 850, stock: 50, desc: "Freshly roasted Arabica coffee beans." }
        ];

        console.log("Seeding 10 demo products...");

        for (const p of demoProducts) {
            const product = await Product.create({
                name: p.name,
                slug: slugify(p.name, { lower: true }),
                varientId: new mongoose.Types.ObjectId(varientId),
                description: p.desc,
                price: p.price,
                buyingPrice: p.buyingPrice,
                stock: p.stock,
                status: "active",
                isDemo: true,
                location: "Dhaka"
            });

            await ProductImage.create({
                productId: product._id,
                image: "product_placeholder.png"
            });
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
