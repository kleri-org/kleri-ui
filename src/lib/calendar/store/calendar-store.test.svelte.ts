import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarStore } from './calendar-store.svelte.js';
import { createMemoryProvider } from '../providers/memory.js';
import { CalendarProviderError, type CalendarProvider } from '../providers/types.js';
import type { ProviderEvent } from '../types.js';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const WEEK = [d(2026, 9, 20), d(2026, 9, 27)] as const;

const seed: ProviderEvent[] = [
	{
		id: 'standup',
		calendarId: 'work',
		title: 'Stand-up',
		start: d(2026, 9, 21, 9),
		end: d(2026, 9, 21, 9, 15),
		recurrence: { freq: 'DAILY', count: 5 }
	},
	{
		id: 'review',
		calendarId: 'work',
		title: 'Review',
		start: d(2026, 9, 22, 14),
		end: d(2026, 9, 22, 15)
	},
	{
		id: 'gym',
		calendarId: 'personal',
		title: 'Gym',
		start: d(2026, 9, 23, 7),
		end: d(2026, 9, 23, 8)
	}
];

function setup(extra: Partial<ConstructorParameters<typeof CalendarStore>[0]> = {}) {
	const provider = createMemoryProvider({
		calendars: [
			{ id: 'work', name: 'Work', primary: true, color: '#239190' },
			{ id: 'personal', name: 'Personal' }
		],
		events: seed
	});
	const store = new CalendarStore({
		providers: [provider],
		autoLoad: true,
		refreshOnFocus: false,
		...extra
	});
	store.setRange(...WEEK);
	return { store, provider };
}

let stores: CalendarStore[] = [];
afterEach(() => {
	for (const s of stores) s.destroy();
	stores = [];
	localStorage.clear();
});

async function ready(extra?: Parameters<typeof setup>[0]) {
	const ctx = setup(extra);
	stores.push(ctx.store);
	await ctx.store.whenIdle();
	return ctx;
}

describe('CalendarStore', () => {
	it('namespaces calendars and loads the visible range', async () => {
		const { store } = await ready();
		expect(store.calendars.map((c) => c.id)).toEqual(['local/work', 'local/personal']);
		expect(store.calendars[1].color).toBeTruthy();
		expect(store.sources[0].status).toBe('ready');
		const titles = store.occurrences(...WEEK).map((o) => o.event.title);
		expect(titles.filter((t) => t === 'Stand-up')).toHaveLength(5);
		expect(titles).toContain('Review');
		expect(titles).toContain('Gym');
	});

	it('hides calendars and persists visibility', async () => {
		const { store } = await ready({ persistKey: 'kleri-cal-test' });
		store.setVisible('local/personal', false);
		expect(store.occurrences(...WEEK).some((o) => o.event.title === 'Gym')).toBe(false);
		expect(JSON.parse(localStorage.getItem('kleri-cal-test')!).hidden).toEqual(['local/personal']);

		const again = new CalendarStore({ persistKey: 'kleri-cal-test', autoLoad: false });
		expect(again.isVisible('local/personal')).toBe(false);
		store.showOnly('local/personal');
		expect(store.occurrences(...WEEK).every((o) => o.calendar.id === 'local/personal')).toBe(true);
	});

	it('creates events optimistically and replaces the temp copy', async () => {
		const { store } = await ready();
		const promise = store.createEvent('local/work', {
			title: 'New',
			start: d(2026, 9, 24, 10),
			end: d(2026, 9, 24, 11)
		});
		const pending = store.occurrences(...WEEK).find((o) => o.event.title === 'New')!;
		expect(pending.pending).toBe(true);
		expect(store.isSaving).toBe(true);
		const created = await promise;
		const saved = store.occurrences(...WEEK).find((o) => o.event.title === 'New')!;
		expect(saved.event.id).toBe(created.id);
		expect(saved.pending).toBe(false);
		expect(created.calendarId).toBe('local/work');
	});

	it('moves a single instance of a client-expanded series', async () => {
		const { store, provider } = await ready();
		const wednesday = store
			.occurrences(...WEEK)
			.find((o) => o.event.title === 'Stand-up' && o.start.getDate() === 23)!;
		await store.moveOccurrence(wednesday, d(2026, 9, 23, 11), d(2026, 9, 23, 11, 15), {
			scope: 'this'
		});
		await store.whenIdle();
		const standups = store.occurrences(...WEEK).filter((o) => o.event.title === 'Stand-up');
		expect(standups).toHaveLength(5);
		expect(standups.find((o) => o.start.getDate() === 23)!.start.getHours()).toBe(11);
		expect(
			provider.getSnapshot().events.filter((e) => e.recurringEventId === 'standup')
		).toHaveLength(1);
	});

	it('rolls back and reports when the provider refuses an edit', async () => {
		const onError = vi.fn();
		const { store, provider } = await ready({ onError });
		provider.updateEvent = async () => {
			throw new CalendarProviderError('Nope', { code: 'conflict' });
		};
		const review = store.occurrences(...WEEK).find((o) => o.event.title === 'Review')!;
		const move = store.moveOccurrence(review, d(2026, 9, 22, 16), d(2026, 9, 22, 17));
		expect(
			store
				.occurrences(...WEEK)
				.find((o) => o.event.title === 'Review')!
				.start.getHours()
		).toBe(16);
		await expect(move).rejects.toMatchObject({ code: 'conflict' });
		expect(
			store
				.occurrences(...WEEK)
				.find((o) => o.event.title === 'Review')!
				.start.getHours()
		).toBe(14);
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({ operation: 'update', message: 'Nope' })
		);
		expect(store.errors).toHaveLength(1);
	});

	it('deletes one instance or the whole series', async () => {
		const { store } = await ready();
		const standups = () => store.occurrences(...WEEK).filter((o) => o.event.title === 'Stand-up');
		await store.deleteOccurrence(standups()[1], 'this');
		await store.whenIdle();
		expect(standups()).toHaveLength(4);
		await store.deleteOccurrence(standups()[0], 'all');
		await store.whenIdle();
		expect(standups()).toHaveLength(0);
	});

	it('discards responses that arrive after the range moved on', async () => {
		let resolveSlow!: (events: ProviderEvent[]) => void;
		const slow: CalendarProvider = {
			id: 'slow',
			kind: 'custom',
			label: 'Slow',
			capabilities: { write: false, freeBusy: false, recurrence: 'provider' },
			listCalendars: async () => [{ id: 'c', name: 'C' }],
			listEvents: ({ start }) =>
				start < d(2026, 9, 25)
					? new Promise((resolve) => (resolveSlow = resolve))
					: Promise.resolve([
							{
								id: 'late',
								calendarId: 'c',
								title: 'Fresh',
								start: d(2026, 10, 12, 9),
								end: d(2026, 10, 12, 10)
							}
						])
		};
		const store = new CalendarStore({
			providers: [slow],
			autoLoad: true,
			prefetchDays: 0,
			refreshOnFocus: false
		});
		stores.push(store);
		store.setRange(...WEEK);
		await vi.waitFor(() => expect(resolveSlow).toBeTypeOf('function'));
		store.setRange(d(2026, 10, 11), d(2026, 10, 18));
		await vi.waitFor(() =>
			expect(store.occurrences(d(2026, 10, 11), d(2026, 10, 18))).toHaveLength(1)
		);
		resolveSlow([
			{
				id: 'stale',
				calendarId: 'c',
				title: 'Stale',
				start: d(2026, 9, 21, 9),
				end: d(2026, 9, 21, 10)
			}
		]);
		await store.whenIdle();
		expect(store.occurrences(d(2026, 9, 1), d(2026, 11, 1)).map((o) => o.event.title)).toEqual([
			'Fresh'
		]);
	});

	it('marks a source unauthorized and asks for re-auth on auth failures', async () => {
		const onAuthRequired = vi.fn();
		const broken: CalendarProvider = {
			id: 'google:me',
			kind: 'google',
			label: 'Google',
			capabilities: { write: true, freeBusy: true, recurrence: 'provider' },
			listCalendars: async () => {
				throw new CalendarProviderError('Token expired', { code: 'auth', status: 401 });
			},
			listEvents: async () => []
		};
		const store = new CalendarStore({
			providers: [broken],
			autoLoad: true,
			onAuthRequired,
			refreshOnFocus: false
		});
		stores.push(store);
		await store.whenIdle();
		expect(store.sources[0]).toMatchObject({ status: 'unauthorized', error: 'Token expired' });
		expect(onAuthRequired).toHaveBeenCalledWith(broken);
		expect(store.supportsFreeBusy).toBe(false);
	});

	it('merges free/busy answers from every capable source', async () => {
		const { store } = await ready();
		const extra: CalendarProvider = {
			id: 'extra',
			kind: 'custom',
			label: 'Extra',
			capabilities: { write: false, freeBusy: true, recurrence: 'provider' },
			listCalendars: async () => [],
			listEvents: async () => [],
			getFreeBusy: async () => ({
				'a@x.com': [{ start: d(2026, 9, 22, 9, 30), end: d(2026, 9, 22, 11) }]
			})
		};
		store.addProvider(extra);
		const busy = await store.getFreeBusy(['a@x.com'], d(2026, 9, 22), d(2026, 9, 23));
		expect(busy['a@x.com']).toHaveLength(1);
	});

	it('removes providers with their calendars and events', async () => {
		const { store } = await ready();
		store.removeProvider('local');
		expect(store.calendars).toEqual([]);
		expect(store.occurrences(...WEEK)).toEqual([]);
		expect(() => store.addProvider(createMemoryProvider({ id: 'dup' }))).not.toThrow();
		expect(() => store.addProvider(createMemoryProvider({ id: 'dup' }))).toThrow(
			/already connected/
		);
	});

	it('moves one instance of a series to another calendar without touching the rest', async () => {
		const { store } = await ready();
		const standups = () => store.occurrences(...WEEK).filter((o) => o.event.title === 'Stand-up');
		const third = standups()[2];
		await store.changeCalendar(
			third,
			'local/personal',
			{ title: 'Stand-up', start: third.start, end: third.end, recurrence: third.event.recurrence },
			'this'
		);
		await store.whenIdle();
		const after = standups();
		expect(after.filter((o) => o.calendar.id === 'local/work')).toHaveLength(4);
		const moved = after.filter((o) => o.calendar.id === 'local/personal');
		expect(moved).toHaveLength(1);
		expect(moved[0].recurring).toBe(false);
	});

	it('moves a whole series to another calendar from its first occurrence', async () => {
		const { store } = await ready();
		const standups = () => store.occurrences(...WEEK).filter((o) => o.event.title === 'Stand-up');
		const third = standups()[2];
		await store.changeCalendar(
			third,
			'local/personal',
			{ title: 'Stand-up', start: third.start, end: third.end, recurrence: third.event.recurrence },
			'all'
		);
		await store.whenIdle();
		const after = standups();
		expect(after).toHaveLength(5);
		expect(after.every((o) => o.calendar.id === 'local/personal')).toBe(true);
		expect(after[0].start).toEqual(d(2026, 9, 21, 9));
	});

	it('never yields two occurrences with the same key', async () => {
		const { store } = await ready();
		const twin: CalendarProvider = {
			id: 'feed',
			kind: 'ics',
			label: 'Feed',
			capabilities: { write: false, freeBusy: false, recurrence: 'client' },
			listCalendars: async () => [{ id: 'f', name: 'F' }],
			listEvents: async () =>
				[1, 2].map((n) => ({
					id: 'same-uid',
					calendarId: 'f',
					title: `Copy ${n}`,
					start: d(2026, 9, 24, 9),
					end: d(2026, 9, 24, 10)
				}))
		};
		store.addProvider(twin);
		await store.whenIdle();
		const keys = store.occurrences(...WEEK).map((o) => o.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('ignores unsafe calendar and event colors', async () => {
		const provider = createMemoryProvider({
			calendars: [{ id: 'c', name: 'C', color: 'red;background:url(https://evil.test)' }],
			events: [
				{
					id: 'e',
					calendarId: 'c',
					title: 'E',
					start: d(2026, 9, 22, 9),
					end: d(2026, 9, 22, 10),
					color: 'url(https://evil.test)'
				}
			]
		});
		const store = new CalendarStore({
			providers: [provider],
			autoLoad: true,
			refreshOnFocus: false
		});
		stores.push(store);
		store.setRange(...WEEK);
		await store.whenIdle();
		const [occurrence] = store.occurrences(...WEEK);
		expect(occurrence.calendar.color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(occurrence.color).toBe(occurrence.calendar.color);
	});

	it('refuses to edit an event that is still being created', async () => {
		const { store } = await ready();
		const creating = store.createEvent('local/work', {
			title: 'Draft',
			start: d(2026, 9, 24, 10),
			end: d(2026, 9, 24, 11)
		});
		const temp = store.occurrences(...WEEK).find((o) => o.event.title === 'Draft')!;
		await expect(store.deleteOccurrence(temp)).rejects.toMatchObject({ code: 'conflict' });
		await creating;
	});

	it('picks a writable default calendar', async () => {
		const { store } = await ready();
		expect(store.defaultCalendar?.id).toBe('local/work');
		expect(store.canEdit(store.occurrences(...WEEK)[0])).toBe(true);
	});
});
