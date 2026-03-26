import { test, expect, type BrowserContext, type Page } from "@playwright/test";

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
const runId = `${Date.now()}`;
const customerName = `Playwright User ${runId.slice(-6)}`;
const customerPhone = "9876500001";
const topupAmount = "250";
const topupSubject = `Wallet top-up request - Rs ${topupAmount}`;
const reviewComment = `Playwright review ${runId.slice(-6)}`;

let orderId = "";
let deliveryOtp = "";
let shortOrderId = "";

async function attachPopupCloser(context: BrowserContext) {
    context.on("page", async (popup) => {
        await popup.waitForLoadState("domcontentloaded").catch(() => {});
        const url = popup.url();
        if (url.startsWith("https://wa.me/")) {
            await popup.close().catch(() => {});
        }
    });
}

async function login(page: Page, email: string, password: string, destination: RegExp) {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(destination, { timeout: 20000 });
    // Wait for session to be fully hydrated before proceeding
    await expect.poll(
        async () => {
            const res = await page.request.get("/api/auth/session");
            const data = await res.json();
            return !!data?.user?.email;
        },
        { timeout: 15000, intervals: [500, 1000] }
    ).toBe(true);
}

test.describe.serial("Role-based end-to-end coverage", () => {
    test.setTimeout(180000);

    test("User portal: wishlist, checkout, wallet ticket, and profile visibility", async ({ browser }) => {
        const context = await browser.newContext();
        await attachPopupCloser(context);

        const page = await context.newPage();
        await login(page, credentials.user.email, credentials.user.password, /\/$/);

        await page.goto(`/category/${categorySlug}`);
        const wishlistButton = page.getByRole("button", { name: new RegExp(`Add ${productName} to wishlist`, "i") });
        const wishlistResponse = page.waitForResponse((response) =>
            response.url().includes("/api/wishlist") && response.request().method() === "POST"
        );
        await wishlistButton.click();
        const wishlistData = await (await wishlistResponse).json();
        expect(wishlistData.success).toBeTruthy();

        await page.goto("/profile/wishlist");
        await expect(page.getByText(productName)).toBeVisible({ timeout: 15000 });

        const wishlistCard = page.locator("article, div").filter({ hasText: productName }).first();
        await wishlistCard.getByRole("button", { name: /add to cart/i }).click();

        await page.goto("/checkout");
        await expect(page.getByRole("heading", { name: /confirm your order/i })).toBeVisible({ timeout: 20000 });

        const inputs = page.locator("input");
        await inputs.nth(0).fill(customerName);
        await inputs.nth(1).fill(customerPhone);
        await page.locator("textarea").first().fill("Plot 101, Playwright Colony, Kagaznagar");

        const orderResponsePromise = page.waitForResponse((response) =>
            response.url().includes("/api/orders") && response.request().method() === "POST"
        );

        await page.getByRole("button", { name: /^place order$/i }).click();
        const orderResponse = await orderResponsePromise;
        const orderData = await orderResponse.json();

        expect(orderData.success).toBeTruthy();
        orderId = orderData.data._id;
        deliveryOtp = orderData.data.deliveryOtp;
        shortOrderId = orderId.slice(-6).toUpperCase();

        await expect(page).toHaveURL(/\/profile$/, { timeout: 20000 });
        await expect(page.getByText(`#ORD-${shortOrderId}`)).toBeVisible({ timeout: 20000 });
        await expect(page.getByText(deliveryOtp)).toBeVisible();

        await page.goto("/profile/wallet");
        await expect(page.getByText("Wallet Balance")).toBeVisible({ timeout: 20000 });
        await page.locator('input[placeholder="Enter top-up amount"]').fill(topupAmount);
        await page.locator('input[placeholder="Enter UTR / transaction reference"]').fill(`UTR${runId.slice(-8)}`);
        await page.getByRole("button", { name: /submit top-up request/i }).click();

        await page.goto("/profile/tickets");
        await expect(page.getByText(topupSubject)).toBeVisible({ timeout: 15000 });

        await context.close();
    });

    test("Admin portal: dashboard modules, rider assignment, and support queue", async ({ browser }) => {
        const context = await browser.newContext();
        await attachPopupCloser(context);

        const page = await context.newPage();
        await login(page, credentials.admin.email, credentials.admin.password, /\/admin$/);

        await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();

        await page.goto("/admin/users");
        await expect(page.getByRole("heading", { name: /user management/i })).toBeVisible();
        await page.getByPlaceholder("Search users").fill(credentials.user.email);
        await page.getByRole("button", { name: /^search$/i }).click();
        // Retry search if the user row doesn't appear
        const userCell = page.getByRole("cell", { name: credentials.user.email });
        if (!(await userCell.isVisible())) {
            await page.waitForTimeout(2000);
            await page.getByRole("button", { name: /^search$/i }).click();
        }
        await expect(userCell).toBeVisible({ timeout: 15000 });

        await page.goto("/admin/products");
        await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
        await page.getByPlaceholder("Search by product name or description").fill(productName);
        const productSearchResponse = page.waitForResponse((response) =>
            response.url().includes("/api/products?") && response.request().method() === "GET"
        );
        await page.getByRole("button", { name: /^search$/i }).click();
        await productSearchResponse;
        await expect(page.getByRole("row").filter({ hasText: productName }).first()).toBeVisible({ timeout: 15000 });

        await page.goto("/admin/categories");
        await expect(page.getByRole("heading", { name: /categories/i })).toBeVisible();
        await expect(page.getByRole("table").getByRole("row").filter({ hasText: "Playwright Groceries" }).first()).toBeVisible({ timeout: 15000 });

        await page.goto("/admin/orders");
        await page.waitForTimeout(1000);
        await page.getByPlaceholder("Search by customer, phone, txn, promo, address").fill(customerPhone);
        await page.getByRole("button", { name: /^search$/i }).click();
        await expect(page.getByText(`#${shortOrderId}`)).toBeVisible({ timeout: 20000 });

        const orderCard = page.locator('div[class*="shadow-sm"]').filter({ hasText: customerPhone }).filter({ hasText: shortOrderId }).first();
        const assignSelect = orderCard.getByRole("combobox").nth(0);
        await expect.poll(async () => {
            return assignSelect.locator("option").evaluateAll((options) =>
                options.map((option) => option.textContent?.trim() || "")
            );
        }, { timeout: 15000 }).toContain("Playwright Rider - Off Duty");
        const riderValue = await assignSelect.locator("option").evaluateAll((options) => {
            const match = options.find((option) => option.textContent?.includes("Playwright Rider")) as HTMLOptionElement | undefined;
            return match?.value || "";
        });
        const assignResponse = page.waitForResponse((response) =>
            response.url().includes(`/api/orders/${orderId}`) && response.request().method() === "PATCH"
        );
        expect(riderValue).toBeTruthy();
        await assignSelect.selectOption(riderValue);
        await assignResponse;
        await expect(orderCard.getByText(/delivery:\s*assigned/i)).toBeVisible({ timeout: 15000 });

        await page.goto("/admin/support");
        await expect(page.getByRole("heading", { name: /support tickets/i })).toBeVisible();
        await page.getByPlaceholder("Search tickets").fill(topupSubject);
        await page.getByRole("button", { name: /^search$/i }).click();
        await expect(page.getByText(topupSubject)).toBeVisible({ timeout: 15000 });

        await context.close();
    });

    test("Rider portal: duty, shift, accept order, dispatch, and deliver with OTP", async ({ browser }) => {
        const context = await browser.newContext({
            geolocation: { latitude: 17.385, longitude: 78.4867 },
            permissions: ["geolocation"],
        });
        await attachPopupCloser(context);

        const page = await context.newPage();
        await login(page, credentials.rider.email, credentials.rider.password, /\/rider$/);

        const startDutyButton = page.getByRole("button", { name: /start duty/i });
        await expect(startDutyButton).toBeEnabled({ timeout: 20000 });
        await startDutyButton.click();
        await expect(page.getByRole("button", { name: /stop duty/i })).toBeVisible({ timeout: 20000 });

        await page.getByRole("button", { name: /start shift/i }).click();
        await expect(page.getByText(/shift active|on break/i)).toBeVisible({ timeout: 15000 });

        const orderCard = page.locator("div").filter({ hasText: customerName }).filter({ hasText: shortOrderId }).first();
        await expect(orderCard).toBeVisible({ timeout: 20000 });

        const acceptResponse = page.waitForResponse((response) =>
            response.url().includes("/api/rider/orders") && response.request().method() === "PATCH"
        );
        await orderCard.getByRole("button", { name: /accept order/i }).click();
        await acceptResponse;

        const pickedUpResponse = page.waitForResponse((response) =>
            response.url().includes("/api/rider/orders") && response.request().method() === "PATCH"
        );
        await orderCard.getByRole("button", { name: /picked up/i }).click();
        await pickedUpResponse;

        const outForDeliveryResponse = page.waitForResponse((response) =>
            response.url().includes("/api/rider/orders") && response.request().method() === "PATCH"
        );
        await orderCard.getByRole("button", { name: /out for delivery/i }).click();
        await outForDeliveryResponse;

        await orderCard.getByPlaceholder("----").fill(deliveryOtp);
        const deliveredResponse = page.waitForResponse((response) =>
            response.url().includes("/api/rider/orders") && response.request().method() === "PATCH"
        );
        await orderCard.getByRole("button", { name: /verify & deliver/i }).click();
        await deliveredResponse;

        await expect(orderCard).toBeHidden({ timeout: 20000 });
        await context.close();
    });

    test("Post-delivery follow-up: user review and admin moderation", async ({ browser }) => {
        const userContext = await browser.newContext();
        await attachPopupCloser(userContext);

        const userPage = await userContext.newPage();
        await login(userPage, credentials.user.email, credentials.user.password, /\/$/);

        await userPage.goto("/profile");
        await expect(userPage.getByText(`#ORD-${shortOrderId}`)).toBeVisible({ timeout: 20000 });
        await expect(userPage.getByText(/^delivered$/i).first()).toBeVisible();

        const reviewResponse = userPage.waitForResponse((response) =>
            response.url().includes("/api/reviews") && response.request().method() === "POST"
        );
        await userPage.getByRole("button", { name: /rate experience/i }).click();
        await userPage.getByPlaceholder("Describe your delivery experience...").fill(reviewComment);
        await userPage.getByRole("button", { name: /publish review/i }).click();
        await reviewResponse;
        await expect(userPage.getByText(/review submitted successfully/i)).toBeVisible({ timeout: 15000 });
        await userContext.close();

        const adminContext = await browser.newContext();
        await attachPopupCloser(adminContext);

        const adminPage = await adminContext.newPage();
        await login(adminPage, credentials.admin.email, credentials.admin.password, /\/admin$/);

        await adminPage.goto("/admin/reviews");
        await expect(adminPage.getByRole("heading", { name: /reviews/i })).toBeVisible();
        await expect(adminPage.getByText(reviewComment)).toBeVisible({ timeout: 15000 });
        await adminPage.getByRole("button", { name: /hide/i }).first().click();
        await expect(adminPage.getByText(/review updated/i)).toBeVisible({ timeout: 15000 });

        await adminPage.goto("/admin/support");
        await adminPage.getByPlaceholder("Search tickets").fill(topupSubject);
        await adminPage.getByRole("button", { name: /^search$/i }).click();
        await expect(adminPage.getByText(topupSubject)).toBeVisible({ timeout: 15000 });
        const ticketCard = adminPage.locator('div[class*="shadow-sm"]').filter({ hasText: topupSubject }).first();
        const resolveResponse = adminPage.waitForResponse((response) =>
            response.url().includes("/api/support-tickets/") && response.request().method() === "PATCH"
        );
        const fetchResponse = adminPage.waitForResponse((response) =>
            response.url().includes("/api/support-tickets?") && response.request().method() === "GET"
        );
        await ticketCard.getByRole("button", { name: /mark resolved/i }).click();
        await resolveResponse;
        await fetchResponse;
        await expect(ticketCard.locator("span").filter({ hasText: /^resolved$/i }).first()).toBeVisible({ timeout: 15000 });

        await adminContext.close();
    });
});
