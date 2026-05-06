import { test, expect } from '@playwright/test';

test.describe('KleriButton', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/components/button');
	});

	test('renders with default text', async ({ page }) => {
		const button = page.getByRole('button', { name: 'Click me' });
		await expect(button).toBeVisible();
	});

	test('success state triggered via PropControls and auto-reverts', async ({ page }) => {
		// Toggle "Show Success" in PropControls (scoped to the KleriButton section)
		const showSuccessToggle = page
			.locator('#kleri-button')
			.getByRole('switch', { name: 'Show Success' });
		await showSuccessToggle.click();

		// Success message appears in the button
		await expect(page.getByText('Success!')).toBeVisible({ timeout: 3000 });

		// After the default timeout (2000ms), the success state reverts
		await expect(page.getByText('Success!')).not.toBeVisible({ timeout: 5000 });
	});

	test('disabled button state', async ({ page }) => {
		// Toggle "Disabled" in PropControls
		const disabledToggle = page.locator('#kleri-button').getByRole('switch', { name: 'Disabled' });
		await disabledToggle.click();

		const button = page.getByRole('button', { name: 'Click me' });
		await expect(button).toBeDisabled();
	});

	test('success message can be customised via PropControls', async ({ page }) => {
		// Change "Success Message" string input
		const successMsgInput = page.locator('#kleri-button').getByLabel('Success Message');
		await successMsgInput.fill('Done!');

		// Toggle "Show Success"
		const showSuccessToggle = page
			.locator('#kleri-button')
			.getByRole('switch', { name: 'Show Success' });
		await showSuccessToggle.click();

		// Custom message appears
		await expect(page.getByText('Done!')).toBeVisible({ timeout: 3000 });
	});
});

test.describe('KleriUtilityButton', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/components/button');
		await page.locator('#kleri-utility-button').scrollIntoViewIfNeeded();
	});

	test('renders with tooltip on hover', async ({ page }) => {
		const utilityButton = page
			.locator('#kleri-utility-button')
			.getByRole('button', { name: 'Utility' });
		await expect(utilityButton).toBeVisible();

		// Hover to trigger bits-ui tooltip
		await utilityButton.hover();

		const tooltipContent = page.getByText('Click to perform action');
		await expect(tooltipContent).toBeVisible({ timeout: 3000 });
	});
});

test.describe('KleriSwitch', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/components/input');
		await page.locator('#kleri-switch').scrollIntoViewIfNeeded();
	});

	test('toggles on click', async ({ page }) => {
		const switchSection = page.locator('#kleri-switch');

		// The preview KleriSwitch has aria-label="Toggle switch" (default prop)
		const switchEl = switchSection.getByRole('switch', { name: 'Toggle switch' });
		await expect(switchEl).toBeVisible();

		// Initial state: not checked
		expect(await switchEl.isChecked()).toBe(false);

		// Click to toggle on
		await switchEl.click();
		expect(await switchEl.isChecked()).toBe(true);

		// Click to toggle off
		await switchEl.click();
		expect(await switchEl.isChecked()).toBe(false);
	});
});

test.describe('KleriInput', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/components/input');
		await page.locator('#kleri-input').scrollIntoViewIfNeeded();
	});

	test('accepts typed input', async ({ page }) => {
		const input = page.locator('#kleri-input').getByLabel('Email');
		await expect(input).toBeVisible();

		await input.fill('test@example.com');
		await expect(input).toHaveValue('test@example.com');
	});

	test('supports password type toggle', async ({ page }) => {
		// Change type to password via PropControls string input
		const typeInput = page.locator('#kleri-input').getByLabel('Type');
		await typeInput.fill('password');

		const input = page.locator('#kleri-input').getByLabel('Email');
		await expect(input).toHaveAttribute('type', 'password');
	});

	test('shake animation triggers on error', async ({ page }) => {
		// Toggle "Shake" in PropControls boolean switch
		const shakeToggle = page.locator('#kleri-input').getByRole('switch', { name: 'Shake' });
		await shakeToggle.click();

		// Error state is visible
		await expect(page.locator('#kleri-input').getByText('Invalid input')).toBeVisible({
			timeout: 3000
		});
	});
});

test.describe('KleriTooltip', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/components/tooltip');
	});

	test('shows tooltip content on hover', async ({ page }) => {
		const trigger = page.getByRole('button', { name: 'Hover me' });
		await expect(trigger).toBeVisible();

		// Hover the trigger
		await trigger.hover();

		// bits-ui renders tooltip with content
		const tooltip = page.getByRole('tooltip');
		await expect(tooltip).toBeVisible({ timeout: 3000 });
		await expect(tooltip).toContainText('Tooltip content');
	});

	test('hides tooltip on mouse leave', async ({ page }) => {
		const trigger = page.getByRole('button', { name: 'Hover me' });

		await trigger.hover();
		const tooltip = page.getByRole('tooltip');
		await expect(tooltip).toBeVisible({ timeout: 3000 });

		// Move mouse far away
		await page.mouse.move(0, 0);
		await page.waitForTimeout(500);
		await expect(tooltip).not.toBeVisible({ timeout: 3000 });
	});
});

test.describe('PropControls', () => {
	test('boolean toggle switches reflect live in the component', async ({ page }) => {
		await page.goto('/components/tooltip');

		// Find the "Show Arrow" toggle in PropControls
		const arrowToggle = page.getByRole('switch', { name: /arrow/i });
		await expect(arrowToggle).toBeVisible();

		// Toggle arrow on, then hover to verify tooltip still works
		await arrowToggle.click();

		const trigger = page.getByRole('button', { name: 'Hover me' });
		await trigger.hover();
		const tooltip = page.getByRole('tooltip');
		await expect(tooltip).toBeVisible({ timeout: 3000 });
	});

	test('string prop edits update live preview', async ({ page }) => {
		await page.goto('/components/tooltip');

		// Change tooltip text in PropControls
		const textInput = page.getByLabel('Tooltip Text');
		await textInput.fill('Updated content');

		// Hover to see updated content
		const trigger = page.getByRole('button', { name: 'Hover me' });
		await trigger.hover();
		const tooltip = page.getByRole('tooltip');
		await expect(tooltip).toContainText('Updated content', { timeout: 3000 });
	});
});
