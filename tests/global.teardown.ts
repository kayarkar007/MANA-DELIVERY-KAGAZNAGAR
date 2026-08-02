import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
const TEST_CATEGORY_SLUG = "playwright-groceries";
const TEST_PRODUCT_NAME = "Playwright Test Apples";
const TEST_USER_EMAILS = [
    "playwright.user@localu.com",
    "playwright.admin@localu.com",
    "playwright.rider@localu.com",
];

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getTestDatabaseUri() {
    const databaseUri = process.env.MONGODB_TEST_URI;
    if (!databaseUri) {
        throw new Error("MONGODB_TEST_URI is required for Playwright cleanup.");
    }

    const databaseName = new URL(databaseUri).pathname.replace(/^\/+/, "");
    if (!/(^|[-_])test$/i.test(databaseName)) {
        throw new Error("MONGODB_TEST_URI must target a database ending in -test or _test.");
    }

    return databaseUri;
}

export default async function globalTeardown() {
    await mongoose.connect(getTestDatabaseUri());

    try {
        const database = mongoose.connection.db;
        if (!database) return;

        const users = await database.collection("users")
            .find({ email: { $in: TEST_USER_EMAILS } }, { projection: { _id: 1 } })
            .toArray();
        const userIds = users.map((user) => user._id);
        const userIdValues = [...userIds, ...userIds.map((userId) => userId.toString())];

        await Promise.all([
            database.collection("orders").deleteMany({ userId: { $in: userIdValues } }),
            database.collection("reviews").deleteMany({ userId: { $in: userIdValues } }),
            database.collection("supporttickets").deleteMany({ userId: { $in: userIdValues } }),
            database.collection("notifications").deleteMany({ recipientId: { $in: userIdValues } }),
            database.collection("wallettransactions").deleteMany({ userId: { $in: userIdValues } }),
            database.collection("wishlists").deleteMany({ userId: { $in: userIdValues } }),
            database.collection("ridershifts").deleteMany({ riderId: { $in: userIdValues } }),
            database.collection("riderpayouts").deleteMany({ riderId: { $in: userIdValues } }),
            database.collection("products").deleteMany({ name: TEST_PRODUCT_NAME }),
            database.collection("categories").deleteMany({ slug: TEST_CATEGORY_SLUG }),
            database.collection("users").deleteMany({ email: { $in: TEST_USER_EMAILS } }),
        ]);
    } finally {
        await mongoose.disconnect();
    }
}
