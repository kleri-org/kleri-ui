import { test, expect, type Page } from '@playwright/test';
import { gotoHydrated } from './helpers';

/**
 * The demo seeds meetings relative to the current week, so these tests stick
 * to things that are true every week (daily stand-ups, a free Saturday
 * afternoon) instead of fixed dates.
 */

async function openCalendar(page: Page) {
	await gotoHydrated(page, '/components/calendar');
	await page.evaluate(() => localStorage.clear());
	const calendar = page.locator('[data-kleri-calendar]');
	await expect(calendar.locator('[data-view="week"]')).toBeVisible();
	// Wait for the demo provider's simulated latency.
	await expect(calendar.getByRole('button', { name: /^Daily stand-up,/ }).first()).toBeAttached();
	return calendar;
}

/** Narrow viewports start with the calendar's sidebar collapsed; open it like a user would. */
async function showSidebar(page: Page) {
	const calendar = page.locator('[data-kleri-calendar]');
	const work = calendar.getByRole('checkbox', { name: 'Work' });
	if (!(await work.isVisible())) {
		await calendar.getByRole('button', { name: 'Toggle sidebar' }).click();
	}
	await expect(work).toBeVisible();
	return work;
}

test.describe('Calendar', () => {
	test('renders the week with recurring meetings and the sidebar', async ({ page }) => {
		const calendar = await openCalendar(page);

		await expect(calendar.getByRole('heading', { level: 2, name: /\d{4}/ })).toBeVisible();
		// Monday–Friday stand-ups expand from one recurring series.
		await expect(calendar.getByRole('button', { name: /^Daily stand-up,/ })).toHaveCount(5);
		await expect(await showSidebar(page)).toHaveAttribute('aria-checked', 'true');
	});

	test('switches between views with keyboard shortcuts', async ({ page }) => {
		const calendar = await openCalendar(page);

		await page.keyboard.press('m');
		await expect(calendar.locator('[data-view="month"]')).toBeVisible();
		await expect(
			calendar
				.getByRole('grid')
				.filter({ hasNot: page.locator('table') })
				.first()
		).toBeVisible();

		await page.keyboard.press('a');
		await expect(calendar.locator('[data-view="agenda"]')).toBeVisible();

		await page.keyboard.press('d');
		await expect(calendar.locator('[data-view="day"]')).toBeVisible();

		await page.keyboard.press('t');
		await page.keyboard.press('w');
		await expect(calendar.locator('[data-view="week"]')).toBeVisible();
	});

	test('hiding a calendar removes its events', async ({ page }) => {
		const calendar = await openCalendar(page);
		const work = await showSidebar(page);
		await work.click();
		await expect(calendar.getByRole('button', { name: /^Daily stand-up,/ })).toHaveCount(0);
		await work.click();
		await expect(calendar.getByRole('button', { name: /^Daily stand-up,/ })).toHaveCount(5);
	});

	test('opens event details from the grid', async ({ page, isMobile }) => {
		const calendar = await openCalendar(page);
		const standup = calendar.getByRole('button', { name: /^Daily stand-up,/ }).first();
		if (isMobile) {
			// The preview site's fixed nav leaves the calendar a sliver on phones, so
			// use the keyboard path (also what screen-reader users rely on).
			await standup.focus();
			await page.keyboard.press('Enter');
		} else {
			await standup.click();
		}
		const details = page
			.locator('[data-popover-content], [data-bits-floating-content-wrapper]')
			.last();
		await expect(details.getByRole('heading', { name: 'Daily stand-up' })).toBeVisible();
		await expect(details.getByRole('link', { name: /Join with Google Meet/ })).toBeVisible();
		await expect(details.getByText(/Every weekday/)).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(details.getByRole('heading', { name: 'Daily stand-up' })).toBeHidden();
	});

	test('E opens the editor from the details popover', async ({ page }) => {
		const calendar = await openCalendar(page);
		const standup = calendar.getByRole('button', { name: /^Daily stand-up,/ }).first();
		await standup.focus();
		await page.keyboard.press('Enter');
		const details = page
			.locator('[data-popover-content], [data-bits-floating-content-wrapper]')
			.last();
		await expect(details.getByRole('heading', { name: 'Daily stand-up' })).toBeVisible();
		// Focus sits inside the portaled popover, outside the calendar's own tree.
		await page.keyboard.press('e');
		await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
	});

	test('drag on the grid, name it, and save', async ({ page, isMobile }) => {
		test.skip(isMobile, 'Touch input only taps; dragging is a pointer feature');
		const calendar = await openCalendar(page);
		const grid = calendar.locator('[data-view] .kleri-scrollbar').first();
		await grid.evaluate((el) => (el.scrollTop = 14 * 52));

		// Saturday is the last column in a Sunday-first week and has no demo meetings at 16:00.
		const saturday = calendar.locator('[data-day-index="6"]');
		const box = (await saturday.boundingBox())!;
		const x = box.x + box.width / 2;
		const hour = 52;
		await page.mouse.move(x, box.y + 16 * hour + 4);
		await page.mouse.down();
		await page.mouse.move(x, box.y + 16.5 * hour, { steps: 4 });
		await page.mouse.move(x, box.y + 17 * hour - 4, { steps: 4 });
		await page.mouse.up();

		const title = page.getByRole('textbox', { name: 'Title' });
		await expect(title).toBeFocused();
		await title.fill('E2E focus block');
		await page.keyboard.press('Enter');

		const created = calendar.getByRole('button', { name: /^E2E focus block, Saturday/ });
		await expect(created).toBeVisible();
		await expect(created).toHaveAccessibleName(/4:00\s*–\s*5:00\s*PM/);
		await expect(page.getByRole('status').filter({ hasText: 'Event created' })).toBeVisible();
	});

	test('schedules a meeting with guests and suggested times', async ({ page }) => {
		const calendar = await openCalendar(page);
		await page.keyboard.press('c');

		const dialog = page.getByRole('dialog', { name: 'New event' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('textbox', { name: 'Title' }).fill('Roadmap sync');

		const guests = dialog.getByRole('combobox', { name: 'Guests' });
		await guests.fill('grace');
		await expect(dialog.getByRole('option', { name: /Grace Hopper/ })).toBeVisible();
		await page.keyboard.press('Enter');
		await expect(dialog.getByText('Grace Hopper')).toBeVisible();
		await expect(dialog.getByText('Suggested times')).toBeVisible();

		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByRole('status').filter({ hasText: 'Event created' })).toBeVisible();

		await page.keyboard.press('a');
		await expect(calendar.getByRole('button', { name: /^Roadmap sync,/ }).first()).toBeAttached();
	});
});
