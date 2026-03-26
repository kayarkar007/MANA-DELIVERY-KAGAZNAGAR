import { test, expect, type Page } from "@playwright/test";

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
                latitude: 17.385,
                longitude: 78.4867,
                items: [{ productId: "507f191e810c19729de860ea", quantity: 1 }],
                paymentMethod: "cod",
            },
        });

        expect(response.status()).toBe(401);
        await expect(response.json()).resolves.toMatchObject({
            success: false,
        });
    });

    test("Admins are redirected away from the rider portal", async ({ page }) => {
        await login(page, credentials.admin.email, credentials.admin.password, /\/admin$/);

        await page.goto("/rider");
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

            const panel = page.getByText("Notifications").locator('xpath=ancestor::div[contains(@class,"z-50")][1]');
            await expect(panel).toBeVisible();

            const box = await panel.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(0);
            expect(box!.x + box!.width).toBeLessThanOrEqual(width);

            await bell.click();
        }
    });
});
