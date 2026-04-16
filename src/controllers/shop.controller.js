const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const Shop = require("../models/shop.model");
const ShopMember = require("../models/shop-member.model");
const UserSubscription = require("../models/user-subscription.model");
const SubscriptionPlan = require("../models/subscription-plan.model");
const ErrorHandler = require("../helper/error.helper");

// Helper: generate slug from shop name
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .concat("-", Date.now().toString(36));
}

// Helper: get active subscription limits for a user
async function getUserLimits(userId) {
    const sub = await UserSubscription.findOne({
        userId,
        status: "active",
    }).populate("planId");

    if (!sub || !sub.planId) {
        // Fall back to free plan defaults
        return { maxShops: 1, maxModeratorsPerShop: 0, maxProductsPerShop: 10 };
    }
    return {
        maxShops: sub.planId.maxShops,
        maxModeratorsPerShop: sub.planId.maxModeratorsPerShop,
        maxProductsPerShop: sub.planId.maxProductsPerShop,
    };
}

// ===> Create a shop <===
exports.createShop = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;
    const { name, contactNumber, address, socialLinks } = req.body;

    // Check subscription limits
    const limits = await getUserLimits(userId);
    const existingShopCount = await Shop.countDocuments({ ownerId: userId });

    if (existingShopCount >= limits.maxShops) {
        return next(
            new ErrorHandler(
                `You've reached your shop limit (${limits.maxShops}). Upgrade your plan to add more.`,
                403
            )
        );
    }

    const slug = slugify(name);

    const shop = await Shop.create({
        ownerId: userId,
        name,
        slug,
        contactNumber: contactNumber || "",
        address: address || {},
        socialLinks: socialLinks || {},
    });

    // Auto-add owner as a shop member
    await ShopMember.create({
        shopId: shop._id,
        userId,
        role: "owner",
        invitedBy: userId,
    });

    return res.status(201).json({
        success: true,
        shop,
        message: "Shop created successfully!",
    });
});

// ===> List my shops <===
exports.myShops = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;

    // Shops I own
    const ownedShops = await Shop.find({ ownerId: userId });

    // Shops I'm a member of (as moderator)
    const memberships = await ShopMember.find({
        userId,
        role: "moderator",
        status: "active",
    });
    const memberShopIds = memberships.map((m) => m.shopId);
    const memberShops = await Shop.find({ _id: { $in: memberShopIds } });

    return res.status(200).json({
        success: true,
        ownedShops,
        memberShops,
    });
});

// ===> Get single shop <===
exports.getShop = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    // Check access: must be owner or active member
    const userId = req.user._id.toString();
    if (shop.ownerId.toString() !== userId) {
        const member = await ShopMember.findOne({
            shopId: shop._id,
            userId: req.user._id,
            status: "active",
        });
        if (!member) {
            return next(new ErrorHandler("You don't have access to this shop!", 403));
        }
    }

    return res.status(200).json({
        success: true,
        shop,
    });
});

// ===> Update shop <===
exports.updateShop = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    // Only owner can update
    if (shop.ownerId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only the shop owner can update!", 403));
    }

    const { name, contactNumber, address, socialLinks, receiptConfig } = req.body;

    const updateData = {};
    if (name) {
        updateData.name = name;
        updateData.slug = slugify(name);
    }
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (address) updateData.address = { ...shop.address.toObject(), ...address };
    if (socialLinks)
        updateData.socialLinks = { ...shop.socialLinks.toObject(), ...socialLinks };
    if (receiptConfig)
        updateData.receiptConfig = {
            ...shop.receiptConfig.toObject(),
            ...receiptConfig,
        };

    await Shop.updateOne({ _id: shop._id }, { $set: updateData });
    const updated = await Shop.findById(shop._id);

    return res.status(200).json({
        success: true,
        shop: updated,
        message: "Shop updated successfully!",
    });
});

// ===> Delete shop <===
exports.deleteShop = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only the shop owner can delete!", 403));
    }

    // Remove all members
    await ShopMember.deleteMany({ shopId: shop._id });
    await shop.deleteOne();

    return res.status(200).json({
        success: true,
        message: "Shop deleted successfully!",
    });
});

// ===> Add moderator to shop <===
exports.addMember = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only the shop owner can add members!", 403));
    }

    // Check moderator limit
    const limits = await getUserLimits(req.user._id);
    const currentMods = await ShopMember.countDocuments({
        shopId: shop._id,
        role: "moderator",
        status: "active",
    });

    if (currentMods >= limits.maxModeratorsPerShop) {
        return next(
            new ErrorHandler(
                `Moderator limit reached (${limits.maxModeratorsPerShop}). Upgrade to add more.`,
                403
            )
        );
    }

    const { userId, permissions } = req.body;

    // Check if already a member
    const existing = await ShopMember.findOne({
        shopId: shop._id,
        userId,
    });
    if (existing) {
        return next(new ErrorHandler("User is already a member of this shop!", 409));
    }

    const member = await ShopMember.create({
        shopId: shop._id,
        userId,
        role: "moderator",
        permissions: permissions || {},
        invitedBy: req.user._id,
    });

    return res.status(201).json({
        success: true,
        member,
        message: "Moderator added successfully!",
    });
});

// ===> Remove member from shop <===
exports.removeMember = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    if (shop.ownerId.toString() !== req.user._id.toString()) {
        return next(
            new ErrorHandler("Only the shop owner can remove members!", 403)
        );
    }

    const member = await ShopMember.findOne({
        shopId: shop._id,
        userId: req.params.userId,
        role: "moderator",
    });

    if (!member) {
        return next(new ErrorHandler("Member not found!", 404));
    }

    await member.deleteOne();

    return res.status(200).json({
        success: true,
        message: "Member removed successfully!",
    });
});

// ===> List shop members <===
exports.listMembers = catchAsyncError(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(new ErrorHandler("Shop not found!", 404));
    }

    const members = await ShopMember.find({ shopId: shop._id }).populate(
        "userId",
        "name email phone image"
    );

    return res.status(200).json({
        success: true,
        members,
    });
});
