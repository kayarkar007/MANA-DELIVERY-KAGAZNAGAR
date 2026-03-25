import { test, expect } from '@playwright/test';

test.describe('Core E-Commerce Cart Flow', () => {
    test('Unauthenticated user is redirected to login when adding a product', async ({ page }) => {
        await page.goto('/');

        await page.waitForTimeout(3000);

        const addBtn = page.getByRole('button', { name: /Add/i }).first();

        if (await addBtn.isVisible()) {
            await addBtn.click();
            await expect(page).toHaveURL(/.*login/);
        }
    });

    test('Checkout Boundary Security Guard', async ({ page }) => {
        // Attempt an unauthorized bypass directly to sensitive checkout
        await page.goto('/checkout');
        
        // The robust routing interceptors should catch and bounce to the login portal.
        await expect(page).toHaveURL(/.*login/);
    });
});
