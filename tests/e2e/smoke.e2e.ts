import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
	test('renders hero section with branding and CTA', async ({ page }) => {
		await page.goto('/');

		// Brand text is present
		await expect(page.getByText('Kleri')).toBeVisible();

		// Subtitle is present
		await expect(page.getByText('A handcrafted component library built with Svelte')).toBeVisible();

		// CTA link navigates to /components
		const cta = page.getByRole('link', { name: /explore components/i });
		await expect(cta).toBeVisible();

		await cta.click();
		await page.waitForURL('/components');
		await expect(page.getByText('13 Components')).toBeVisible();
	});
});

test.describe('Navigation', () => {
	test('sidebar lists all 7 component categories', async ({ page }) => {
		await page.goto('/components');

		const sidebar = page.locator('aside');
		await expect(sidebar).toBeVisible();

		const categories = ['Heading', 'Button', 'Input', 'Tooltip', 'Animation', 'Settings', 'Magic'];
		for (const name of categories) {
			await expect(sidebar.getByRole('link', { name, exact: true })).toBeVisible();
		}
	});

	test('each category link navigates to its route', async ({ page }) => {
		const routes = [
			{ name: 'Heading', path: '/components/heading' },
			{ name: 'Button', path: '/components/button' },
			{ name: 'Input', path: '/components/input' },
			{ name: 'Tooltip', path: '/components/tooltip' },
			{ name: 'Animation', path: '/components/animation' },
			{ name: 'Settings', path: '/components/settings' },
			{ name: 'Magic', path: '/components/magic' }
		];

		for (const { name, path } of routes) {
			await page.goto(path);
			await expect(page).toHaveURL(path);
			// Each category page has a top-level heading matching its name
			await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
		}
	});

	test('category cards on /components link to correct routes', async ({ page }) => {
		await page.goto('/components');

		// Cards are visible (intersection observer triggers after scroll)
		await page.waitForTimeout(600);

		const cardLinks = page.locator('section a[href^="/components/"]');
		const count = await cardLinks.count();
		expect(count).toBe(7);

		// Click each card and verify navigation
		const routes = [
			'href="/components/heading"',
			'href="/components/button"',
			'href="/components/input"',
			'href="/components/tooltip"',
			'href="/components/animation"',
			'href="/components/settings"',
			'href="/components/magic"'
		];
		for (const route of routes) {
			const link = page.locator(`section a[${route}]`);
			await expect(link).toBeVisible();
		}
	});

	test('breadcrumb navigation works', async ({ page }) => {
		await page.goto('/components/button');

		// Breadcrumb links
		const homeLink = page.getByRole('link', { name: 'Kleri UI', exact: true });
		await expect(homeLink).toBeVisible();

		const componentsLink = page.getByRole('link', { name: 'Components', exact: true });
		await expect(componentsLink).toBeVisible();

		// Click breadcrumb to go back
		await componentsLink.click();
		await page.waitForURL('/components');
		await expect(page).toHaveURL('/components');
	});

	test('sidebar logo links back to home', async ({ page }) => {
		await page.goto('/components');
		const logoLink = page.locator('aside a[href="/"]');
		await expect(logoLink).toBeVisible();

		await logoLink.click();
		await page.waitForURL('/');
		await expect(page).toHaveURL('/');
	});
});

test.describe('Deep linking', () => {
	test('hash-based deep link scrolls to component section', async ({ page }) => {
		await page.goto('/components/button#kleri-button');

		// The KleriButton section should be in view
		const section = page.locator('#kleri-button');
		await expect(section).toBeVisible();

		// The sidebar should highlight the active sub-item
		const activeSubItem = page.locator('aside a[href="/components/button#kleri-button"]');
		await expect(activeSubItem).toHaveClass(/text-kleri-green-2/);
	});

	test('all component sub-items have valid hash links', async ({ page }) => {
		await page.goto('/components/button');

		const subItemLinks = page.locator('aside ul ul a');
		const count = await subItemLinks.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const href = await subItemLinks.nth(i).getAttribute('href');
			expect(href).toMatch(/^\/components\/.+#.+$/);
		}
	});
});

test.describe('Responsive layout', () => {
	test('sidebar is visible on desktop viewports', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/components');
		await expect(page.locator('aside')).toBeVisible();
		// Main content area exists
		await expect(page.locator('main')).toBeVisible();
	});

	test('sidebar is visible on tablet viewports', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/components');
		await expect(page.locator('aside')).toBeVisible();
		await expect(page.locator('main')).toBeVisible();
	});

	test('page renders without sidebar on landing page', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('aside')).toHaveCount(0);
	});
});
