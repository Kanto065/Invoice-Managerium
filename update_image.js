require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/user.model");

const updateAdminImage = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB!");

        // Find the admin user (refat@admin.com or admin@example.com)
        const adminEmail = "refat@admin.com";
        const user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log(`User ${adminEmail} not found!`);
            process.exit(1);
        }

        user.image = "admin-rifat.jpeg";
        await user.save();

        console.log(`Successfully updated image for ${adminEmail} to admin-rifat.jpeg`);

        // Also try to update admin@example.com if needed
        const otherAdmin = await User.findOne({ email: "admin@example.com" });
        if (otherAdmin) {
            otherAdmin.image = "admin-rifat.jpeg";
            await otherAdmin.save();
            console.log(`Successfully updated image for admin@example.com to admin-rifat.jpeg`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error updating admin image:", error);
        process.exit(1);
    }
};

updateAdminImage();
