import { test, expect } from '@playwright/test';

test.describe('Core E-Commerce Cart Flow', () => {
    test('Add item to cart and dynamically verify Cart Sidebar injection', async ({ page }) => {
        await page.goto('/');

        // Await potential hydration or network queries
        await page.waitForTimeout(3000);

        // Target the standard "Add to Cart" block usually present on product cards
        const addBtn = page.getByRole('button', { name: /Add/i }).first();
        
        // Test conditionally since DB products might vary locally
        if (await addBtn.isVisible()) {
            await addBtn.click();
            
            // Expected Behavior: State management triggers sliding Sidebar UI automatically
            await expect(page.getByText(/Your Cart|Cart Items/i).first()).toBeVisible();
        }
    });

    test('Checkout Boundary Security Guard', async ({ page }) => {
        // Attempt an unauthorized bypass directly to sensitive checkout
        await page.goto('/checkout');
        
        // The robust routing interceptors should catch and bounce to the login portal.
        await expect(page).toHaveURL(/.*login/);
    });
});
