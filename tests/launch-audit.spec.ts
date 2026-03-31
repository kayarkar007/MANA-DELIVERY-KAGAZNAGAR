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
    rider: {
        email: "playwright.rider@localu.com",
        password: "Localu@2026!",
    },
};

const productName = "Playwright Test Apples";
const categorySlug = "playwright-groceries";

async function login(page: Page, email: string, password: string, destination: RegExp) {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(destination, { timeout: 20000 });
}

async function apiJson(page: Page, url: string, method = "GET", data?: unknown) {
    return page.evaluate(async ({ url, method, data }) => {
        const response = await fetch(url, {
            method,
            headers: data ? { "Content-Type": "application/json" } : undefined,
            body: data ? JSON.stringify(data) : undefined,
        });

        return {
            ok: response.ok,
            status: response.status,
            body: await response.json(),
        };
    }, { url, method, data });
}

async function getPlaywrightProductId(page: Page) {
    const response = await apiJson(page, `/api/products?adminView=1&search=${encodeURIComponent(productName)}`);
    expect(response.ok).toBeTruthy();
    expect(response.body.success).toBeTruthy();
    expect(response.body.data?.length).toBeGreaterThan(0);
    return response.body.data[0]._id as string;
}

async function setProductHidden(page: Page, productId: string, isHidden: boolean) {
    const response = await apiJson(page, `/api/products/${productId}`, "PUT", { isHidden });
    expect(response.ok).toBeTruthy();
    expect(response.body).toMatchObject({ success: true });
}

async function getUnreadCount(page: Page) {
    const response = await apiJson(page, "/api/notifications?limit=50");
    expect(response.ok).toBeTruthy();
    expect(response.body.success).toBeTruthy();
    return Number(response.body.unreadCount || 0);
}

test.describe.serial("Launch audit regressions", () => {
    test.setTimeout(180000);

    test("hidden products stay blocked from guest adminView access and disappear from user surfaces", async ({ browser, request }) => {
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await login(adminPage, credentials.admin.email, credentials.admin.password, /\/admin$/);

        const productId = await getPlaywrightProductId(adminPage);
        await setProductHidden(adminPage, productId, false);

        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();
        await login(userPage, credentials.user.email, credentials.user.password, /\/$/);

        const wishlistAdd = await apiJson(userPage, "/api/wishlist", "POST", { productId });
        expect(wishlistAdd.ok).toBeTruthy();
        expect(wishlistAdd.body.success).toBeTruthy();

        await setProductHidden(adminPage, productId, true);

        const guestAdminView = await request.get(`/api/products?adminView=1&search=${encodeURIComponent(productName)}`);
        expect([401, 403]).toContain(guestAdminView.status());

        const guestSearch = await request.get(`/api/products?search=${encodeURIComponent(productName)}`);
        expect(guestSearch.ok()).toBeTruthy();
        await expect(guestSearch.json()).resolves.toMatchObject({
            success: true,
            data: [],
        });

        const categoryProducts = await apiJson(userPage, `/api/products?categorySlug=${encodeURIComponent(categorySlug)}`);
        expect(categoryProducts.ok).toBeTruthy();
        expect((categoryProducts.body.data || []).some((product: any) => product._id === productId)).toBeFalsy();

        const searchProducts = await apiJson(userPage, `/api/products/search?q=${encodeURIComponent(productName)}`);
        expect(searchProducts.ok).toBeTruthy();
        expect((searchProducts.body.data || []).some((product: any) => product._id === productId)).toBeFalsy();

        const wishlistDetails = await apiJson(userPage, "/api/wishlist/details");
        expect(wishlistDetails.ok).toBeTruthy();
        expect((wishlistDetails.body.data || []).some((product: any) => product._id === productId)).toBeFalsy();

        await setProductHidden(adminPage, productId, false);
        await adminContext.close();
        await userContext.close();
    });

    test("notification drawer stays accessible on narrow mobile viewports", async ({ page }) => {
        await login(page, credentials.user.email, credentials.user.password, /\/$/);

        for (const width of [320, 360, 375]) {
            await page.setViewportSize({ width, height: 800 });
            await page.goto("/");

            const bell = page.locator('[aria-label="Notifications"]:visible').first();
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

    test("repeating the same admin and rider updates does not duplicate notifications", async ({ browser }) => {
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();
        await login(adminPage, credentials.admin.email, credentials.admin.password, /\/admin$/);

        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();
        await login(userPage, credentials.user.email, credentials.user.password, /\/$/);

        const riderContext = await browser.newContext();
        const riderPage = await riderContext.newPage();
        await login(riderPage, credentials.rider.email, credentials.rider.password, /\/rider$/);

        const productId = await getPlaywrightProductId(adminPage);
        await setProductHidden(adminPage, productId, false);

        const productResponse = await apiJson(userPage, `/api/products?search=${encodeURIComponent(productName)}`);
        const product = productResponse.body.data[0];
        expect(product?._id).toBeTruthy();

        const orderResponse = await apiJson(userPage, "/api/orders", "POST", {
                type: "product",
                customerName: "Launch Audit User",
                customerPhone: "9876500001",
                address: "Plot 101, Playwright Colony, Kagaznagar",
                latitude: 17.385,
                longitude: 78.4867,
                items: [{ productId: product._id, quantity: 1 }],
                paymentMethod: "cod",
        });
        expect(orderResponse.ok).toBeTruthy();
        expect(orderResponse.body.success).toBeTruthy();
        const orderId = orderResponse.body.data._id as string;

        const riderLookup = await apiJson(adminPage, `/api/admin/users?search=${encodeURIComponent(credentials.rider.email)}`);
        const rider = (riderLookup.body.data || []).find((candidate: any) => candidate.email === credentials.rider.email);
        expect(rider?._id).toBeTruthy();

        const unreadBeforeAssignment = await getUnreadCount(userPage);

        const firstAssign = await apiJson(adminPage, `/api/orders/${orderId}`, "PATCH", { riderId: rider._id });
        expect(firstAssign.ok).toBeTruthy();

        await expect.poll(async () => getUnreadCount(userPage), { timeout: 15000 }).toBe(unreadBeforeAssignment + 1);

        const secondAssign = await apiJson(adminPage, `/api/orders/${orderId}`, "PATCH", { riderId: rider._id });
        expect(secondAssign.ok).toBeTruthy();

        await userPage.waitForTimeout(1000);
        expect(await getUnreadCount(userPage)).toBe(unreadBeforeAssignment + 1);

        const unreadBeforeAccept = await getUnreadCount(userPage);

        const firstAccept = await apiJson(riderPage, "/api/rider/orders", "PATCH", { orderId, deliveryStatus: "accepted" });
        expect(firstAccept.ok).toBeTruthy();

        await expect.poll(async () => getUnreadCount(userPage), { timeout: 15000 }).toBe(unreadBeforeAccept + 1);

        const secondAccept = await apiJson(riderPage, "/api/rider/orders", "PATCH", { orderId, deliveryStatus: "accepted" });
        expect(secondAccept.ok).toBeTruthy();

        await userPage.waitForTimeout(1000);
        expect(await getUnreadCount(userPage)).toBe(unreadBeforeAccept + 1);

        await adminContext.close();
        await userContext.close();
        await riderContext.close();
    });
});
