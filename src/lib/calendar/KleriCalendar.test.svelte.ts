import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KleriCalendar from './KleriCalendar.svelte';
import { CalendarStore } from './store/calendar-store.svelte.js';
import { createMemoryProvider } from './providers/memory.js';
import type { ProviderEvent } from './types.js';

// A fixed Wednesday keeps every assertion independent of the day the suite runs.
const FOCUS = new Date(2026, 8, 23, 12);
const at = (day: number, h: number, m = 0) => new Date(2026, 8, day, h, m);

function setup(props: Record<string, unknown> = {}, events?: ProviderEvent[]) {
	const provider = createMemoryProvider({
		calendars: [
			{ id: 'work', name: 'Work', color: '#239190', primary: true },
			{ id: 'feed', name: 'Holidays', readOnly: true }
		],
		self: { email: 'me@kleri.org' },
		events: events ?? [
			{
				id: 'review',
				calendarId: 'work',
				title: 'Design review',
				start: at(23, 10),
				end: at(23, 11),
				location: 'Studio 3'
			},
			{
				id: 'standup',
				calendarId: 'work',
				title: 'Stand-up',
				start: at(21, 9, 30),
				end: at(21, 9, 45),
				recurrence: { freq: 'DAILY', count: 5 }
			},
			{
				id: 'offsite',
				calendarId: 'work',
				title: 'Offsite',
				start: new Date(2026, 8, 24),
				end: new Date(2026, 8, 26),
				allDay: true
			},
			{
				id: 'invite',
				calendarId: 'work',
				title: 'Planning',
				start: at(24, 15),
				end: at(24, 16),
				attendees: [
					{ email: 'boss@kleri.org', organizer: true, response: 'accepted' },
					{ email: 'me@kleri.org', response: 'needsAction' }
				]
			}
		]
	});
	const store = new CalendarStore({ providers: [provider], autoLoad: true, refreshOnFocus: false });
	const result = render(KleriCalendar, {
		props: { store, date: FOCUS, locale: 'en-US', weekStartsOn: 0, ...props }
	});
	return { ...result, store, provider };
}

/** Queries scoped to the active view (the sidebar's mini month repeats day names). */
const view = () => within(document.querySelector<HTMLElement>('[data-view]')!);

async function ready(store: CalendarStore) {
	await store.whenIdle();
	await waitFor(() => expect(document.querySelector('[data-view]')).not.toBeNull());
}

afterEach(() => {
	cleanup();
	localStorage.clear();
});

describe('KleriCalendar', () => {
	it('renders the week with its title, day headers and events', async () => {
		const { store } = setup();
		await ready(store);

		expect(screen.getByRole('heading', { level: 2, name: 'September 2026' })).toBeInTheDocument();
		expect(
			view().getByRole('button', { name: 'Wednesday, September 23, 2026' })
		).toBeInTheDocument();
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: /^Design review, Wednesday, September 23/ })
			).toBeInTheDocument()
		);
		// A five-instance daily series expands into the visible week.
		expect(screen.getAllByRole('button', { name: /^Stand-up,/ })).toHaveLength(5);
		// Multi-day all-day events render once in the all-day strip.
		expect(screen.getAllByRole('button', { name: /^Offsite,/ })).toHaveLength(1);
	});

	it('marks unanswered invitations for styling', async () => {
		const { store } = setup();
		await ready(store);
		const invite = await screen.findByRole('button', { name: /^Planning,/ });
		expect(invite).toHaveAttribute('data-response', 'needsAction');
	});

	it('pages forward and back from the toolbar', async () => {
		const onRangeChange = vi.fn();
		const { store } = setup({ onRangeChange });
		await ready(store);

		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		await waitFor(() =>
			expect(view().getByRole('button', { name: 'Sunday, September 27, 2026' })).toBeInTheDocument()
		);
		expect(onRangeChange).toHaveBeenLastCalledWith(
			expect.objectContaining({
				start: new Date(2026, 8, 27),
				end: new Date(2026, 9, 4),
				view: 'week'
			})
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
		await waitFor(() =>
			expect(view().getByRole('button', { name: 'Sunday, September 20, 2026' })).toBeInTheDocument()
		);
	});

	it('switches views with keyboard shortcuts', async () => {
		const { store } = setup();
		await ready(store);

		await fireEvent.keyDown(document.body, { key: 'm' });
		const grid = await screen.findByRole('grid', { name: 'September 2026' });
		expect(within(grid).getAllByRole('gridcell').length).toBeGreaterThanOrEqual(35);

		await fireEvent.keyDown(document.body, { key: 'a' });
		await waitFor(() => expect(document.querySelector('[data-view="agenda"]')).not.toBeNull());

		await fireEvent.keyDown(document.body, { key: 'd' });
		await waitFor(() => expect(document.querySelector('[data-view="day"]')).not.toBeNull());
	});

	it('moves focus through the month grid with arrow keys', async () => {
		const { store } = setup({ view: 'month' });
		await ready(store);
		const cell = await screen.findByRole('gridcell', { name: 'Wednesday, September 23, 2026' });
		expect(cell).toHaveAttribute('tabindex', '0');
		cell.focus();
		await fireEvent.keyDown(cell, { key: 'ArrowRight' });
		await waitFor(() =>
			expect(document.activeElement).toHaveAccessibleName('Thursday, September 24, 2026')
		);
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
		await waitFor(() =>
			expect(document.activeElement).toHaveAccessibleName('Thursday, October 1, 2026')
		);
	});

	it('filters events with the search box', async () => {
		const { store } = setup();
		await ready(store);
		await fireEvent.click(screen.getByRole('button', { name: 'Search events' }));
		const input = await screen.findByRole('searchbox', { name: 'Search events' });
		await fireEvent.input(input, { target: { value: 'studio' } });
		await waitFor(() =>
			expect(screen.queryAllByRole('button', { name: /^Stand-up,/ })).toHaveLength(0)
		);
		expect(screen.getByRole('button', { name: /^Design review,/ })).toBeInTheDocument();
	});

	it('shows an empty agenda with a call to action', async () => {
		const { store } = setup({ view: 'agenda' }, []);
		await ready(store);
		expect(await screen.findByText('Nothing scheduled')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'New event' })).toBeInTheDocument();
	});

	it('hides every create affordance when read-only', async () => {
		const { store } = setup({ readOnly: true });
		await ready(store);
		expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
		const review = await screen.findByRole('button', { name: /^Design review,/ });
		expect(review.className).toContain('cursor-pointer');
	});

	it('lists sources and toggles calendar visibility from the sidebar', async () => {
		const { store } = setup();
		await ready(store);
		const work = screen.getByRole('checkbox', { name: 'Work' });
		expect(work).toHaveAttribute('aria-checked', 'true');
		await fireEvent.click(work);
		expect(work).toHaveAttribute('aria-checked', 'false');
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: /^Design review,/ })).not.toBeInTheDocument()
		);
	});

	it('opens the scheduling dialog with the C shortcut and validates it', async () => {
		const { store } = setup();
		await ready(store);
		await fireEvent.keyDown(document.body, { key: 'c' });
		const dialog = await screen.findByRole('dialog', { name: 'New event' });
		expect(within(dialog).getByRole('textbox', { name: 'Title' })).toBeInTheDocument();
		expect(within(dialog).getByText('Does not repeat')).toBeInTheDocument();
		expect(within(dialog).getByRole('combobox', { name: 'Guests' })).toBeInTheDocument();
	});

	it('creates an event from the dialog', async () => {
		const onEventCreated = vi.fn();
		const { store, provider } = setup({ onEventCreated });
		await ready(store);
		await fireEvent.keyDown(document.body, { key: 'c' });
		const dialog = await screen.findByRole('dialog', { name: 'New event' });
		await fireEvent.input(within(dialog).getByRole('textbox', { name: 'Title' }), {
			target: { value: 'Launch party' }
		});
		await fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
		await waitFor(() => expect(onEventCreated).toHaveBeenCalledOnce());
		expect(provider.getSnapshot().events.some((e) => e.title === 'Launch party')).toBe(true);

		// Confirmation toast with undo. Dismiss it and let its exit transition
		// finish, so teardown doesn't cancel a running animation.
		const notifications = screen.getByRole('region', { name: 'Notifications' });
		const toast = within(notifications).getByRole('status');
		expect(toast).toHaveTextContent('Event created');
		expect(within(toast).getByRole('button', { name: 'Undo' })).toBeInTheDocument();
		await fireEvent.click(within(toast).getByRole('button', { name: 'Close' }));
		await waitFor(() =>
			expect(within(notifications).queryByRole('status')).not.toBeInTheDocument()
		);
	});
});
