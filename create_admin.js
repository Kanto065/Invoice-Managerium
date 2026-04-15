require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/user.model");
const bcrypt = require("bcryptjs");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB.");

        const email = "refat@admin.com";
        const password = "refat@admin7434";

        const hashPassword = await bcrypt.hash(password, 10);

        const existUser = await User.findOne({ email });

        if (existUser) {
            existUser.role = "admin";
            existUser.password = hashPassword; // Reset password
            await existUser.save();
            console.log(`Updated existing user ${email} to admin.`);
        } else {
            await User.create({
                name: "Super Admin",
                email,
                password: hashPassword,
                phone: "00000000000",
                role: "admin",
                isVerified: true,
            });
            console.log(`Created new admin user ${email}.`);
        }

        console.log("\n--- ADMIN CREDENTIALS ---");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("--------------------------\n");

    } catch (err) {
        console.error("Error creating admin:", err);
    } finally {
        mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

createAdmin();
