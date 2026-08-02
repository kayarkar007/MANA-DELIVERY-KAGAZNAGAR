import { test, expect } from "@playwright/test";
const TEST_LOCATION = {
    latitude: 19.3316,
    longitude: 79.4831,
};

const credentials = {
  admin: {
    email: "playwright.admin@localu.com",
    password: "Localu@2026!",
  },
  rider: {
    email: "playwright.rider@localu.com",
    password: "Localu@2026!",
  },
  user: {
    email: "playwright.user@localu.com",
    password: "Localu@2026!",
  },
};

test.describe("Mobile App API & E2E Workflow Verification", () => {
  let adminToken = "";
  let riderToken = "";
  let vendorToken = "";

  test("Mobile Auth API — JWT token generation for Admin, Rider, and Vendor", async ({ request }) => {
    // 1. Admin login via mobile endpoint
    const adminLoginRes = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "email",
        email: credentials.admin.email,
        password: credentials.admin.password,
      },
    });
    expect(adminLoginRes.ok()).toBeTruthy();
    const adminData = await adminLoginRes.json();
    expect(adminData.success).toBeTruthy();
    expect(adminData.token).toBeTruthy();
    expect(adminData.user.role).toBe("admin");
    adminToken = adminData.token;

    // 2. Rider login via mobile endpoint
    const riderLoginRes = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "email",
        email: credentials.rider.email,
        password: credentials.rider.password,
      },
    });
    expect(riderLoginRes.ok()).toBeTruthy();
    const riderData = await riderLoginRes.json();
    expect(riderData.success).toBeTruthy();
    expect(riderData.token).toBeTruthy();
    expect(riderData.user.role).toBe("rider");
    riderToken = riderData.token;

    // 3. User login via mobile endpoint
    const userLoginRes = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "email",
        email: credentials.user.email,
        password: credentials.user.password,
      },
    });
    expect(userLoginRes.ok()).toBeTruthy();
    const userData = await userLoginRes.json();
    expect(userData.success).toBeTruthy();
    expect(userData.token).toBeTruthy();
  });

  test("Mobile Admin API — Bearer JWT access to analytics, orders, users, riders", async ({ request }) => {
    // Admin login
    const loginRes = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "email",
        email: credentials.admin.email,
        password: credentials.admin.password,
      },
    });
    const { token } = await loginRes.json();

    const authHeader = { Authorization: `Bearer ${token}` };

    // 1. Admin analytics
    const analyticsRes = await request.get("/api/admin/analytics", { headers: authHeader });
    expect(analyticsRes.ok()).toBeTruthy();
    const analyticsData = await analyticsRes.json();
    expect(analyticsData.success).toBeTruthy();

    // 2. Admin users list
    const usersRes = await request.get("/api/admin/users?limit=10", { headers: authHeader });
    expect(usersRes.ok()).toBeTruthy();
    const usersData = await usersRes.json();
    expect(usersData.success).toBeTruthy();

    // 3. Admin riders list
    const ridersRes = await request.get("/api/admin/riders", { headers: authHeader });
    expect(ridersRes.ok()).toBeTruthy();
    const ridersData = await ridersRes.json();
    expect(ridersData.success).toBeTruthy();
  });

  test("Mobile Rider API — Bearer JWT access to active orders, shift & location", async ({ request }) => {
    // Rider login
    const loginRes = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "email",
        email: credentials.rider.email,
        password: credentials.rider.password,
      },
    });
    const { token } = await loginRes.json();

    const authHeader = { Authorization: `Bearer ${token}` };

    // 1. Rider active orders
    const ordersRes = await request.get("/api/rider/orders", { headers: authHeader });
    expect(ordersRes.ok()).toBeTruthy();
    const ordersData = await ordersRes.json();
    expect(ordersData.success).toBeTruthy();

    // 2. Rider shift status
    const shiftRes = await request.get("/api/rider/shift", { headers: authHeader });
    expect(shiftRes.ok()).toBeTruthy();

    // 3. Update rider location
    const locRes = await request.post("/api/rider/location", {
      headers: authHeader,
      data: TEST_LOCATION,
    });
    expect(locRes.ok()).toBeTruthy();
  });

  test("Mobile Security — Unauthorized requests without Bearer JWT are rejected", async ({ request }) => {
    const unauthVendor = await request.get("/api/vendor/shop");
    expect([401, 403]).toContain(unauthVendor.status());

    const unauthRider = await request.get("/api/rider/orders");
    expect([401, 403]).toContain(unauthRider.status());

    const legacyPhoneLogin = await request.post("/api/auth/mobile-login", {
      data: {
        loginType: "phone",
        phone: "+919999999999",
        userId: "507f1f77bcf86cd799439011",
      },
    });
    expect(legacyPhoneLogin.status()).toBe(400);
  });
});
