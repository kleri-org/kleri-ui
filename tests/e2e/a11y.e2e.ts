import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility audits', () => {
	test('landing page has no critical a11y violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('components listing page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components');
		await page.waitForTimeout(600); // Wait for intersection observer animations

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('button component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/button');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('input component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/input');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('tooltip component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/tooltip');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('heading component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/heading');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('animation component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/animation');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('settings component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/settings');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('magic component page has no critical a11y violations', async ({ page }) => {
		await page.goto('/components/magic');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('interactive button success state maintains a11y compliance', async ({ page }) => {
		await page.goto('/components/button');

		// Trigger success state
		const button = page.getByRole('button', { name: 'Click me' });
		await button.click();
		await expect(page.getByText('Success!')).toBeVisible({ timeout: 3000 });

		// Audit during active state
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});
