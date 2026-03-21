import { test, expect } from '@playwright/test';

test.describe('Authentication Security Flow', () => {
    test('Should automatically block weak passwords and enforce regex pattern', async ({ page }) => {
        // Go to signup page
        await page.goto('/signup');
        
        // Check if loading state vanishes
        await page.waitForTimeout(1000);

        // Fill non-password details
        await page.fill('input[placeholder="John Doe"]', 'Playwright Tester');
        await page.fill('input[placeholder="you@example.com"]', 'playwright@localu.com');
        await page.fill('input[placeholder="+91 9876543210"]', '9876543210');

        // Test Weak Password
        await page.locator('input[type="password"]').first().fill('weak123');
        await page.locator('input[type="password"]').nth(1).fill('weak123');

        const submitBtn = page.getByRole('button', { name: /Sign Up/i });
        
        // The button should be explicitly disabled because 'weak123' fails the Regex requirement.
        await expect(submitBtn).toBeDisabled();

        // Test Strong Password (Passes 1 Uppercase, 1 Lowercase, 1 Number, 1 Symbol, >8 Chars)
        await page.locator('input[type="password"]').first().fill('Localu@2026!');
        await page.locator('input[type="password"]').nth(1).fill('Localu@2026!');

        // Check if the strength checklist updates dynamically to green validation classes
        await expect(page.locator('text=At least 8 characters').locator('xpath=..').locator('svg').first()).toHaveClass(/text-green-500/);
        
        // Wait for state updates to unleash the submit button
        await page.waitForTimeout(500);
        
        // Button should now be enabled and ready, proving the security works.
        await expect(submitBtn).toBeEnabled();
    });
});
