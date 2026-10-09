import { test, expect } from '@playwright/test';
import { gotoHydrated } from './helpers';

test.describe('KleriButton', () => {
	test.beforeEach(async ({ page }) => {
		await gotoHydrated(page, '/components/button');
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

		// Success message appears in the preview button
		const successButton = page.locator('#kleri-button').getByRole('button', { name: 'Success!' });
		await expect(successButton).toBeVisible({ timeout: 3000 });

		// After the default timeout (2000ms), the success state reverts
		await expect(successButton).not.toBeVisible({ timeout: 5000 });
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

		// Custom message appears in the preview button
		await expect(page.locator('#kleri-button').getByRole('button', { name: 'Done!' })).toBeVisible({
			timeout: 3000
		});
	});
});

test.describe('KleriUtilityButton', () => {
	test.beforeEach(async ({ page }) => {
		await gotoHydrated(page, '/components/button');
		await page.locator('#kleri-utility-button').scrollIntoViewIfNeeded();
	});

	test('renders with tooltip on hover', async ({ page }) => {
		const utilityButton = page
			.locator('#kleri-utility-button')
			.getByRole('button', { name: 'Utility' });
		await expect(utilityButton).toBeVisible();

		// Scoped to the tooltip itself: the same text also appears in the page's
		// code-preview block, so a bare getByText matched that instead and passed
		// whether or not the tooltip ever opened.
		const tooltip = page.getByRole('tooltip');
		await expect(tooltip).toBeHidden();

		// Hover to trigger bits-ui tooltip
		await utilityButton.hover();

		await expect(tooltip).toBeVisible({ timeout: 3000 });
		await expect(tooltip).toHaveText('Click to perform action');
	});
});

test.describe('KleriSwitch', () => {
	test.beforeEach(async ({ page }) => {
		await gotoHydrated(page, '/components/input');
		await page.locator('#kleri-switch').scrollIntoViewIfNeeded();
	});

	test('toggles on click', async ({ page }) => {
		const switchSection = page.locator('#kleri-switch');

		const switchEl = switchSection.getByRole('switch', {
			name: 'Email me the cause list each morning'
		});
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
		await gotoHydrated(page, '/components/input');
		await page.locator('#kleri-input').scrollIntoViewIfNeeded();
	});

	test('accepts typed input', async ({ page }) => {
		const input = page.locator('#kleri-input').getByLabel('Client name');
		await expect(input).toBeVisible();

		await input.fill('Meera Iyer');
		await expect(input).toHaveValue('Meera Iyer');
	});

	test('supports password type toggle', async ({ page }) => {
		// Pick "password" in the Type toggle group of PropControls
		await page
			.locator('#kleri-input')
			.getByRole('group', { name: 'Type' })
			.getByRole('radio', { name: 'password' })
			.click();

		const input = page.locator('#kleri-input').getByLabel('Client name', { exact: true });
		await expect(input).toHaveAttribute('type', 'password');
	});

	test('shows and announces an error message', async ({ page }) => {
		const section = page.locator('#kleri-input');
		await section.getByLabel('Error message').fill('Enter at least two characters.');

		const field = section.getByLabel('Client name', { exact: true });
		await expect(field).toHaveAttribute('aria-invalid', 'true');
		await expect(field).toHaveAccessibleDescription('Enter at least two characters.');
	});
});
test.describe('KleriTextarea', () => {
	test.beforeEach(async ({ page }) => {
		await gotoHydrated(page, '/components/input');
		await page.locator('#kleri-textarea').scrollIntoViewIfNeeded();
	});

	test('accepts typed input', async ({ page }) => {
		const textarea = page.locator('#kleri-textarea').getByLabel('Matter notes', { exact: true });
		await expect(textarea).toBeVisible();

		await textarea.fill('Adjourned to 14 November.');
		await expect(textarea).toHaveValue('Adjourned to 14 November.');
	});

	test('shows and announces an error message', async ({ page }) => {
		const section = page.locator('#kleri-textarea');
		await section.getByLabel('Error message').fill('Enter at least two characters.');

		const field = section.getByLabel('Matter notes', { exact: true });
		await expect(field).toHaveAttribute('aria-invalid', 'true');
		await expect(field).toHaveAccessibleDescription('Enter at least two characters.');
	});
});

test.describe('KleriTooltip', () => {
	test.beforeEach(async ({ page }) => {
		await gotoHydrated(page, '/components/tooltip');
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
		await gotoHydrated(page, '/components/tooltip');

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
		await gotoHydrated(page, '/components/tooltip');

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
