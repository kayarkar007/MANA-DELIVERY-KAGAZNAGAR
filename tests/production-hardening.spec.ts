import { test, expect, type Page } from "@playwright/test";
const TEST_LOCATION = {
    latitude: 19.3316,
    longitude: 79.4831,
};

const credentials = {
    user: {
        email: "playwright.user@localu.com",
        password: "Localu@2026!",
    },
    admin: {
        email: "playwright.admin@localu.com",
        password: "Localu@2026!",
    },
};

async function login(page: Page, email: string, password: string, destination: RegExp) {
    await page.goto("/login");
    await page.getByRole("button", { name: /email/i }).click().catch(() => {});
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(destination, { timeout: 20000 });
}

test.describe("Production hardening regressions", () => {
    test("Guest users cannot create orders directly through the API", async ({ request }) => {
        const response = await request.post("/api/orders", {
            data: {
                type: "product",
                customerName: "Guest",
                customerPhone: "9999999999",
                address: "Unauthorized Street",
                latitude: TEST_LOCATION.latitude,
                longitude: TEST_LOCATION.longitude,
                items: [{ productId: "507f191e810c19729de860ea", quantity: 1 }],
                paymentMethod: "cod",
            },
        });

        expect(response.status()).toBe(401);
        await expect(response.json()).resolves.toMatchObject({
            success: false,
        });
    });

    test("Authenticated users cannot bypass payment with a partial wallet order", async ({ page }) => {
        await login(page, credentials.user.email, credentials.user.password, /\/$/);

        const result = await page.evaluate(async () => {
            const productsResponse = await fetch("/api/products?categorySlug=playwright-groceries");
            const productsPayload = await productsResponse.json();
            const product = productsPayload.data?.find((item: { name?: string }) => item.name === "Playwright Test Apples");

            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "product",
                    customerName: "Payment Guard Test",
                    customerPhone: "9876500001",
                    address: "Playwright Colony, Kagaznagar",
                    latitude: TEST_LOCATION.latitude,
                    longitude: TEST_LOCATION.longitude,
                    items: [{ productId: product?._id, quantity: 1 }],
                    paymentMethod: "wallet",
                    walletUsed: 0,
                }),
            });

            return { status: orderResponse.status, body: await orderResponse.json() };
        });

        expect(result.status).toBe(400);
        expect(result.body).toMatchObject({ success: false, error: "Invalid payment method" });
    });

    test("Admins are redirected away from the rider portal", async ({ page }) => {
        await login(page, credentials.admin.email, credentials.admin.password, /\/admin$/);

        await page.goto("/rider", { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(/\/admin$/);
        await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
        await expect(page.locator('[aria-label="Notifications"]:visible').first()).toBeVisible({ timeout: 15000 });
    });

    test("Notification drawer stays inside the viewport on small screens", async ({ page }) => {
        await login(page, credentials.user.email, credentials.user.password, /\/$/);

        for (const width of [320, 360, 375]) {
            await page.setViewportSize({ width, height: 800 });
            await page.goto("/");

            const bell = page.locator('[aria-label="Notifications"]').first();
            await bell.click();

            const panel = page.getByTestId("notification-panel");
            await expect(panel).toBeVisible();

            const box = await panel.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);

            await bell.click();
        }
    });
});
