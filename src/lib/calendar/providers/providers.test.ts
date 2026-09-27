import { describe, expect, it, vi } from 'vitest';
import { createMemoryProvider } from './memory.js';
import { createGoogleCalendarProvider, fromGoogleEvent, toGoogleBody } from './google.js';
import { createMicrosoftCalendarProvider, fromGraphEvent, toGraphRecurrence } from './microsoft.js';
import { createIcsFeedProvider } from './ics-feed.js';
import { createHttpClient } from './http.js';
import { CalendarProviderError } from './types.js';
import type { ProviderEvent } from '../types.js';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		...init
	});
}

describe('createHttpClient', () => {
	it('refreshes the token once after a 401', async () => {
		const tokens = vi.fn(({ forceRefresh }: { forceRefresh: boolean }) =>
			forceRefresh ? 'fresh' : 'stale'
		);
		const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
			const auth = (init?.headers as Record<string, string>).Authorization;
			return auth === 'Bearer fresh'
				? jsonResponse({ ok: true })
				: new Response('{}', { status: 401 });
		});
		const http = createHttpClient({
			baseUrl: 'https://api.test',
			getAccessToken: tokens,
			fetch: fetchMock as never
		});
		await expect(http.request('/x')).resolves.toEqual({ ok: true });
		expect(tokens).toHaveBeenCalledTimes(2);
	});

	it('surfaces a persistent 401 as an auth error', async () => {
		const http = createHttpClient({
			baseUrl: 'https://api.test',
			getAccessToken: () => 't',
			fetch: (async () =>
				new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), {
					status: 401
				})) as never
		});
		await expect(http.request('/x')).rejects.toMatchObject({
			code: 'auth',
			status: 401,
			message: 'Invalid Credentials'
		});
	});

	it('retries 429s honouring Retry-After, then succeeds', async () => {
		let calls = 0;
		const http = createHttpClient({
			baseUrl: 'https://api.test',
			fetch: (async () => {
				calls++;
				return calls < 3
					? new Response('', { status: 429, headers: { 'Retry-After': '0' } })
					: jsonResponse({ n: calls });
			}) as never
		});
		await expect(http.request('/x')).resolves.toEqual({ n: 3 });
	});

	it('does not retry client errors and maps status codes', async () => {
		const fetchMock = vi.fn(async () => new Response('{}', { status: 403 }));
		const http = createHttpClient({ baseUrl: 'https://api.test', fetch: fetchMock as never });
		await expect(http.request('/x')).rejects.toMatchObject({ code: 'forbidden' });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe('memory provider', () => {
	const standup: ProviderEvent = {
		id: 'standup',
		calendarId: 'work',
		title: 'Stand-up',
		start: d(2026, 9, 21, 9),
		end: d(2026, 9, 21, 9, 15),
		recurrence: { freq: 'DAILY' }
	};

	function setup() {
		return createMemoryProvider({
			calendars: [
				{ id: 'work', name: 'Work' },
				{ id: 'holidays', name: 'Holidays', readOnly: true }
			],
			events: [standup],
			self: { email: 'me@example.com', name: 'Me' }
		});
	}

	it('creates events with the organizer set, and notifies subscribers', async () => {
		const provider = setup();
		const listener = vi.fn();
		provider.subscribe!(listener);
		const created = await provider.createEvent!('work', {
			title: 'Sync',
			start: d(2026, 9, 22, 10),
			end: d(2026, 9, 22, 11),
			attendees: [{ email: 'grace@example.com' }]
		});
		expect(created.organizer?.email).toBe('me@example.com');
		expect(created.attendees?.map((a) => a.email)).toEqual(['me@example.com', 'grace@example.com']);
		expect(created.attendees?.[0].self).toBe(true);
		expect(listener).toHaveBeenCalledOnce();
	});

	it('refuses writes to read-only calendars', async () => {
		const provider = setup();
		await expect(
			provider.createEvent!('holidays', { title: 'x', start: d(2026, 9, 1), end: d(2026, 9, 2) })
		).rejects.toBeInstanceOf(CalendarProviderError);
	});

	it('splits a single instance off a series as an override', async () => {
		const provider = setup();
		const occurrence = { start: d(2026, 9, 23, 9), end: d(2026, 9, 23, 9, 15) };
		await provider.updateEvent!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			changes: { start: d(2026, 9, 23, 10), end: d(2026, 9, 23, 10, 15) },
			scope: 'this',
			occurrence
		});
		const { events } = provider.getSnapshot();
		const master = events.find((e) => e.id === 'standup')!;
		const override = events.find((e) => e.recurringEventId === 'standup')!;
		expect(master.exdates).toEqual([occurrence.start]);
		expect(override.start).toEqual(d(2026, 9, 23, 10));
		expect(override.originalStart).toEqual(occurrence.start);
		expect(override.recurrence).toBeUndefined();
	});

	it('shifts a whole series and drops overrides when all events move', async () => {
		const provider = setup();
		const occurrence = { start: d(2026, 9, 23, 9), end: d(2026, 9, 23, 9, 15) };
		await provider.updateEvent!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			changes: { title: 'Override' },
			scope: 'this',
			occurrence
		});
		await provider.updateEvent!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			changes: { start: d(2026, 9, 25, 9, 30), end: d(2026, 9, 25, 10) },
			scope: 'all',
			occurrence: { start: d(2026, 9, 25, 9), end: d(2026, 9, 25, 9, 15) }
		});
		const { events } = provider.getSnapshot();
		expect(events).toHaveLength(1);
		expect(events[0].start).toEqual(d(2026, 9, 21, 9, 30));
		expect(events[0].end).toEqual(d(2026, 9, 21, 10));
		expect(events[0].exdates ?? []).toEqual([]);
	});

	it('deletes one instance via EXDATE, or the whole series', async () => {
		const provider = setup();
		const occurrence = { start: d(2026, 9, 24, 9), end: d(2026, 9, 24, 9, 15) };
		await provider.deleteEvent!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			scope: 'this',
			occurrence
		});
		expect(provider.getSnapshot().events[0].exdates).toEqual([occurrence.start]);
		await provider.deleteEvent!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			scope: 'all',
			occurrence
		});
		expect(provider.getSnapshot().events).toEqual([]);
	});

	it('answers free/busy from expanded series, ignoring free and declined time', async () => {
		const provider = createMemoryProvider({
			calendars: [{ id: 'work', name: 'Work' }],
			events: [
				{ ...standup, attendees: [{ email: 'grace@example.com', response: 'accepted' }] },
				{
					id: 'lunch',
					calendarId: 'work',
					title: 'Lunch',
					start: d(2026, 9, 22, 12),
					end: d(2026, 9, 22, 13),
					transparency: 'free',
					attendees: [{ email: 'grace@example.com' }]
				},
				{
					id: 'declined',
					calendarId: 'work',
					title: 'Nope',
					start: d(2026, 9, 22, 15),
					end: d(2026, 9, 22, 16),
					attendees: [{ email: 'grace@example.com', response: 'declined' }]
				}
			]
		});
		const busy = await provider.getFreeBusy!({
			emails: ['grace@example.com'],
			start: d(2026, 9, 22),
			end: d(2026, 9, 24)
		});
		expect(busy['grace@example.com'].map((b) => b.start)).toEqual([
			d(2026, 9, 22, 9),
			d(2026, 9, 23, 9)
		]);
	});

	it('records RSVPs for self', async () => {
		const provider = createMemoryProvider({
			calendars: [{ id: 'work', name: 'Work' }],
			events: [
				{
					...standup,
					recurrence: undefined,
					attendees: [{ email: 'me@example.com', response: 'needsAction' }]
				}
			],
			self: { email: 'me@example.com' }
		});
		const updated = await provider.respond!({
			calendarId: 'work',
			eventId: 'standup',
			event: standup,
			response: 'accepted'
		});
		expect(updated?.attendees?.[0]).toMatchObject({ response: 'accepted', self: true });
	});
});

describe('google provider', () => {
	it('maps API events, including Meet links, instances and all-day dates', () => {
		const event = fromGoogleEvent(
			{
				id: 'abc_20260928T140000Z',
				summary: 'Design review',
				start: { dateTime: '2026-09-28T14:00:00Z', timeZone: 'Europe/London' },
				end: { dateTime: '2026-09-28T15:00:00Z' },
				recurringEventId: 'abc',
				originalStartTime: { dateTime: '2026-09-28T14:00:00Z' },
				colorId: '7',
				conferenceData: {
					entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/xyz' }],
					conferenceSolution: { name: 'Google Meet', key: { type: 'hangoutsMeet' } }
				},
				organizer: { email: 'boss@example.com' },
				attendees: [
					{ email: 'me@example.com', self: true, responseStatus: 'tentative' },
					{ email: 'room@resource.calendar.google.com', resource: true }
				]
			},
			'primary'
		);
		expect(event).toMatchObject({
			id: 'abc_20260928T140000Z',
			title: 'Design review',
			recurringEventId: 'abc',
			color: '#039be5',
			timeZone: 'Europe/London',
			conference: { url: 'https://meet.google.com/xyz', kind: 'google-meet' },
			readOnly: true
		});
		expect(event.attendees).toEqual([
			{ email: 'me@example.com', self: true, response: 'tentative' }
		]);

		const allDay = fromGoogleEvent(
			{ id: 'x', start: { date: '2026-10-05' }, end: { date: '2026-10-08' } },
			'primary'
		);
		expect(allDay.allDay).toBe(true);
		expect(allDay.start).toEqual(new Date(2026, 9, 5));
	});

	it('keeps each reminder offset once and moves events in their own zone', () => {
		const event = fromGoogleEvent(
			{
				id: 'r',
				start: { dateTime: '2026-09-28T14:00:00Z', timeZone: 'America/New_York' },
				end: { dateTime: '2026-09-28T15:00:00Z' },
				reminders: {
					overrides: [
						{ method: 'email', minutes: 10 },
						{ method: 'popup', minutes: 10 },
						{ method: 'popup', minutes: 5 }
					]
				}
			},
			'primary'
		);
		expect(event.reminders).toEqual([5, 10]);
		const body = toGoogleBody({ start: new Date(Date.UTC(2026, 8, 29, 14)) }, event);
		expect(body.start).toMatchObject({ timeZone: 'America/New_York' });
	});

	it('builds bodies that request Meet and switch between timed and all-day', () => {
		const body = toGoogleBody({
			title: 'x',
			start: new Date(2026, 9, 5),
			end: new Date(2026, 9, 6),
			allDay: true,
			requestConference: 'google-meet',
			recurrence: { freq: 'WEEKLY' }
		});
		expect(body.start).toMatchObject({ date: '2026-10-05', dateTime: null });
		expect(body.recurrence).toEqual(['RRULE:FREQ=WEEKLY']);
		expect((body.conferenceData as { createRequest: unknown }).createRequest).toBeTruthy();
	});

	it('pages through events and skips cancelled ones', async () => {
		const fetchMock = vi.fn(async (url: string) => {
			const u = new URL(url);
			expect(u.searchParams.get('singleEvents')).toBe('true');
			if (!u.searchParams.get('pageToken')) {
				return jsonResponse({
					items: [
						{
							id: '1',
							status: 'confirmed',
							start: { date: '2026-10-01' },
							end: { date: '2026-10-02' }
						}
					],
					nextPageToken: 'p2'
				});
			}
			return jsonResponse({
				items: [
					{
						id: '2',
						status: 'cancelled',
						start: { date: '2026-10-01' },
						end: { date: '2026-10-02' }
					},
					{ id: '3', start: { date: '2026-10-03' }, end: { date: '2026-10-04' } }
				]
			});
		});
		const provider = createGoogleCalendarProvider({
			getAccessToken: () => 't',
			fetch: fetchMock as never
		});
		const events = await provider.listEvents({
			calendarId: 'primary',
			start: d(2026, 10, 1),
			end: d(2026, 11, 1)
		});
		expect(events.map((e) => e.id)).toEqual(['1', '3']);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('patches the series master with shifted times for "all events" edits', async () => {
		const calls: { method: string; url: string; body?: Record<string, { dateTime?: string }> }[] =
			[];
		const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
			calls.push({
				method: init?.method ?? 'GET',
				url,
				body: init?.body ? JSON.parse(init.body as string) : undefined
			});
			return jsonResponse({
				id: 'series',
				start: { dateTime: '2026-09-01T09:00:00Z' },
				end: { dateTime: '2026-09-01T09:30:00Z' }
			});
		});
		const provider = createGoogleCalendarProvider({
			getAccessToken: () => 't',
			fetch: fetchMock as never
		});
		const instance: ProviderEvent = {
			id: 'series_20260928',
			calendarId: 'primary',
			title: 'x',
			start: new Date('2026-09-28T09:00:00Z'),
			end: new Date('2026-09-28T09:30:00Z'),
			recurringEventId: 'series'
		};
		await provider.updateEvent!({
			calendarId: 'primary',
			eventId: instance.id,
			event: instance,
			changes: { start: new Date('2026-09-28T10:00:00Z'), end: new Date('2026-09-28T10:30:00Z') },
			scope: 'all',
			occurrence: { start: instance.start, end: instance.end }
		});
		const patch = calls.find((c) => c.method === 'PATCH')!;
		expect(patch.url).toContain('/events/series?');
		expect(patch.body?.start.dateTime).toBe('2026-09-01T10:00:00.000Z');
		expect(patch.body?.end.dateTime).toBe('2026-09-01T10:30:00.000Z');
	});
});

describe('microsoft provider', () => {
	it('maps Graph events with Teams links and self responses', () => {
		const event = fromGraphEvent(
			{
				id: 'AAMk',
				subject: 'Quarterly review',
				start: { dateTime: '2026-09-28T14:00:00.0000000', timeZone: 'X' },
				end: { dateTime: '2026-09-28T15:00:00.0000000', timeZone: 'X' },
				isOrganizer: false,
				showAs: 'free',
				responseStatus: { response: 'tentativelyAccepted' },
				onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/abc' },
				attendees: [
					{
						emailAddress: { address: 'me@example.com' },
						type: 'required',
						status: { response: 'none' }
					},
					{ emailAddress: { address: 'room@example.com' }, type: 'resource' }
				],
				seriesMasterId: 'master'
			},
			'cal',
			'me@example.com'
		);
		expect(event.start).toEqual(d(2026, 9, 28, 14));
		expect(event).toMatchObject({
			status: 'tentative',
			transparency: 'free',
			readOnly: true,
			recurringEventId: 'master',
			conference: { kind: 'teams' }
		});
		expect(event.attendees).toEqual([
			{ email: 'me@example.com', self: true, response: 'tentative' }
		]);
	});

	it('converts RRULEs into patterned recurrences', () => {
		const start = d(2026, 9, 25);
		expect(
			toGraphRecurrence({ freq: 'WEEKLY', byDay: [{ day: 'MO' }, { day: 'WE' }], count: 5 }, start)
		).toEqual({
			pattern: {
				type: 'weekly',
				interval: 1,
				daysOfWeek: ['monday', 'wednesday'],
				firstDayOfWeek: 'monday'
			},
			range: { type: 'numbered', startDate: '2026-09-25', numberOfOccurrences: 5 }
		});
		expect(
			toGraphRecurrence({ freq: 'MONTHLY', byDay: [{ day: 'FR', nth: -1 }] }, start).pattern
		).toEqual({
			type: 'relativeMonthly',
			interval: 1,
			daysOfWeek: ['friday'],
			index: 'last'
		});
		expect(() =>
			toGraphRecurrence({ freq: 'MONTHLY', bySetPos: [-1], byDay: [{ day: 'MO' }] }, start)
		).toThrow(CalendarProviderError);
	});

	it('sends the Prefer time zone header and follows nextLink', async () => {
		const seen: string[] = [];
		const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
			seen.push((init?.headers as Record<string, string>).Prefer);
			if (url.includes('page2')) return jsonResponse({ value: [] });
			return jsonResponse({
				value: [
					{ id: '1', name: 'Calendar', canEdit: true, isDefaultCalendar: true, color: 'lightTeal' }
				],
				'@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/calendars?page2'
			});
		});
		const provider = createMicrosoftCalendarProvider({
			getAccessToken: () => 't',
			fetch: fetchMock as never
		});
		const calendars = await provider.listCalendars();
		expect(calendars).toEqual([
			{ id: '1', name: 'Calendar', color: '#3fb5b0', readOnly: false, primary: true }
		]);
		expect(seen.every((h) => h.startsWith('outlook.timezone='))).toBe(true);
	});
});

describe('ics feed provider', () => {
	const text =
		'BEGIN:VCALENDAR\nX-WR-CALNAME:Holidays\nBEGIN:VEVENT\nUID:h1\nDTSTART;VALUE=DATE:20261225\nSUMMARY:Christmas\nEND:VEVENT\nEND:VCALENDAR';

	it('serves a static feed as one read-only calendar', async () => {
		const provider = createIcsFeedProvider({ text });
		expect(await provider.listCalendars()).toMatchObject([
			{ id: 'feed', name: 'Holidays', readOnly: true }
		]);
		const events = await provider.listEvents({
			calendarId: 'feed',
			start: d(2026, 12, 1),
			end: d(2027, 1, 1)
		});
		expect(events.map((e) => e.title)).toEqual(['Christmas']);
		expect(provider.capabilities.write).toBe(false);
	});

	it('fetches through the proxy, rewrites webcal and caches', async () => {
		const fetchMock = vi.fn(async (url: string) => new Response(url && text));
		const provider = createIcsFeedProvider({
			url: 'webcal://example.com/cal.ics',
			proxy: (url) => `/proxy?u=${encodeURIComponent(url)}`,
			fetch: fetchMock as never
		});
		await provider.listCalendars();
		await provider.listEvents({ calendarId: 'feed', start: d(2026, 1, 1), end: d(2027, 1, 1) });
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0][0]).toBe('/proxy?u=https%3A%2F%2Fexample.com%2Fcal.ics');
	});

	it('keeps serving later callers when an earlier caller aborts', async () => {
		let release!: (response: Response) => void;
		const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (release = resolve)));
		const provider = createIcsFeedProvider({
			url: 'https://x.test/a.ics',
			fetch: fetchMock as never
		});
		const range = { calendarId: 'feed', start: d(2026, 12, 1), end: d(2027, 1, 1) };
		const first = new AbortController();
		const aborted = provider.listEvents({ ...range, signal: first.signal });
		const second = provider.listEvents({ ...range, signal: new AbortController().signal });
		first.abort();
		await expect(aborted).rejects.toMatchObject({ code: 'aborted' });
		release(new Response(text));
		expect((await second).map((e) => e.title)).toEqual(['Christmas']);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('rejects responses that are not iCalendar', async () => {
		const provider = createIcsFeedProvider({
			url: 'https://x.test/a',
			fetch: (async () => new Response('<html>')) as never
		});
		await expect(provider.listCalendars()).rejects.toMatchObject({ code: 'invalid' });
	});
});
