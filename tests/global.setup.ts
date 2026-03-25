import path from "node:path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import type { FullConfig } from "@playwright/test";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in .env.local");
}

const userSchema = new Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    whatsapp: String,
    address: String,
    savedAddresses: [
        {
            label: String,
            address: String,
            lat: Number,
            lng: Number,
        },
    ],
    role: String,
    walletBalance: Number,
    isVerified: Boolean,
    verifyOtp: String,
    verifyOtpExpiry: Date,
    resetToken: String,
    resetTokenExpiry: Date,
    isOnDuty: Boolean,
    dutyStatus: String,
    currentLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date,
    },
    currentShiftStartedAt: Date,
    lastShiftEndedAt: Date,
    currentBreakStartedAt: Date,
    totalBreakMinutes: Number,
}, { timestamps: true });

const categorySchema = new Schema({
    name: String,
    slug: { type: String, unique: true },
    type: String,
    image: String,
}, { timestamps: true });

const productSchema = new Schema({
    name: String,
    description: String,
    price: Number,
    unit: String,
    categorySlug: String,
    inStock: Boolean,
    stockQuantity: Number,
    lowStockThreshold: Number,
    image: String,
}, { timestamps: true });

const orderSchema = new Schema({
    userId: String,
    riderId: String,
    customerName: String,
    customerPhone: String,
    items: Array,
    status: String,
    deliveryStatus: String,
}, { timestamps: true });

const reviewSchema = new Schema({
    userId: String,
    orderId: String,
    comment: String,
}, { timestamps: true });

const supportTicketSchema = new Schema({
    userId: String,
    customerName: String,
    subject: String,
}, { timestamps: true });

const notificationSchema = new Schema({
    recipientId: String,
}, { timestamps: true });

const walletTransactionSchema = new Schema({
    userId: String,
}, { timestamps: true });

const wishlistSchema = new Schema({
    userId: String,
    productIds: [String],
}, { timestamps: true });

const riderShiftSchema = new Schema({
    riderId: String,
}, { timestamps: true });

const riderPayoutSchema = new Schema({
    riderId: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
const SupportTicket = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
const Wishlist = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
const RiderShift = mongoose.models.RiderShift || mongoose.model("RiderShift", riderShiftSchema);
const RiderPayout = mongoose.models.RiderPayout || mongoose.model("RiderPayout", riderPayoutSchema);

const TEST_CATEGORY = {
    name: "Playwright Groceries",
    slug: "playwright-groceries",
    type: "product",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
};

const TEST_PRODUCT = {
    name: "Playwright Test Apples",
    description: "Deterministic product used for end-to-end checkout validation.",
    price: 149,
    unit: "1 kg",
    categorySlug: TEST_CATEGORY.slug,
    inStock: true,
    stockQuantity: 999,
    lowStockThreshold: 5,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=800",
};

const TEST_USERS = {
    user: {
        name: "Playwright User",
        email: "playwright.user@localu.com",
        password: "Localu@2026!",
        whatsapp: "9876500001",
        address: "Plot 101, Playwright Colony, Kagaznagar",
        savedAddresses: [
            {
                label: "Home",
                address: "Plot 101, Playwright Colony, Kagaznagar",
                lat: 17.385,
                lng: 78.4867,
            },
        ],
        role: "user",
        walletBalance: 1200,
    },
    admin: {
        name: "Playwright Admin",
        email: "playwright.admin@localu.com",
        password: "Localu@2026!",
        whatsapp: "9876500002",
        address: "Admin Hub, Kagaznagar",
        savedAddresses: [],
        role: "admin",
        walletBalance: 0,
    },
    rider: {
        name: "Playwright Rider",
        email: "playwright.rider@localu.com",
        password: "Localu@2026!",
        whatsapp: "9876500003",
        address: "Rider Hub, Kagaznagar",
        savedAddresses: [],
        role: "rider",
        walletBalance: 0,
    },
};

async function upsertUser(input: typeof TEST_USERS.user) {
    const password = await bcrypt.hash(input.password, 10);

    await User.updateOne(
        { email: input.email },
        {
            $set: {
                name: input.name,
                email: input.email,
                password,
                whatsapp: input.whatsapp,
                address: input.address,
                savedAddresses: input.savedAddresses,
                role: input.role,
                walletBalance: input.walletBalance,
                isVerified: true,
                verifyOtp: undefined,
                verifyOtpExpiry: undefined,
                resetToken: undefined,
                resetTokenExpiry: undefined,
                isOnDuty: false,
                dutyStatus: "offline",
                currentLocation: undefined,
                currentShiftStartedAt: undefined,
                lastShiftEndedAt: undefined,
                currentBreakStartedAt: undefined,
                totalBreakMinutes: 0,
            },
        },
        { upsert: true }
    );

    return User.findOne({ email: input.email }).select("_id email role name");
}

export default async function globalSetup(_: FullConfig) {
    await mongoose.connect(MONGODB_URI as string);

    try {
        const [user, admin, rider] = await Promise.all([
            upsertUser(TEST_USERS.user),
            upsertUser(TEST_USERS.admin),
            upsertUser(TEST_USERS.rider),
        ]);

        await Category.updateOne(
            { slug: TEST_CATEGORY.slug },
            { $set: TEST_CATEGORY },
            { upsert: true }
        );

        await Product.updateOne(
            { name: TEST_PRODUCT.name },
            { $set: TEST_PRODUCT },
            { upsert: true }
        );

        const userId = user?._id?.toString();
        const adminId = admin?._id?.toString();
        const riderId = rider?._id?.toString();

        if (!userId || !adminId || !riderId) {
            throw new Error("Failed to prepare Playwright role accounts");
        }

        await Promise.all([
            Order.deleteMany({ userId }),
            Review.deleteMany({ userId }),
            SupportTicket.deleteMany({ userId }),
            Notification.deleteMany({ recipientId: { $in: [userId, adminId, riderId] } }),
            WalletTransaction.deleteMany({ userId }),
            Wishlist.deleteMany({ userId }),
            RiderShift.deleteMany({ riderId }),
            RiderPayout.deleteMany({ riderId }),
        ]);

        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    walletBalance: TEST_USERS.user.walletBalance,
                    address: TEST_USERS.user.address,
                    savedAddresses: TEST_USERS.user.savedAddresses,
                },
            }
        );

        await User.updateOne(
            { _id: riderId },
            {
                $set: {
                    isOnDuty: false,
                    dutyStatus: "offline",
                    currentLocation: undefined,
                    currentShiftStartedAt: undefined,
                    lastShiftEndedAt: undefined,
                    currentBreakStartedAt: undefined,
                    totalBreakMinutes: 0,
                },
            }
        );
    } finally {
        await mongoose.disconnect();
    }
}
