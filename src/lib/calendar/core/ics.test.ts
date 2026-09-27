import { describe, expect, it } from 'vitest';
import {
	detectConference,
	escapeText,
	foldLine,
	googleCalendarUrl,
	icsFileName,
	outlookCalendarUrl,
	parseDuration,
	parseICS,
	serializeICS,
	unescapeText
} from './ics.js';
import type { CalendarEvent } from '../types.js';

const FEED = [
	'BEGIN:VCALENDAR',
	'VERSION:2.0',
	'PRODID:-//Test//EN',
	'X-WR-CALNAME:Team\\, Offsite',
	'X-APPLE-CALENDAR-COLOR:#239190FF',
	'BEGIN:VTIMEZONE',
	'TZID:America/New_York',
	'BEGIN:STANDARD',
	'DTSTART:19701101T020000',
	'TZOFFSETFROM:-0400',
	'TZOFFSETTO:-0500',
	'END:STANDARD',
	'END:VTIMEZONE',
	'BEGIN:VEVENT',
	'UID:standup@test',
	'DTSTART;TZID=America/New_York:20260921T090000',
	'DTEND;TZID=America/New_York:20260921T091500',
	'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
	'EXDATE;TZID=America/New_York:20260923T090000,20260924T090000',
	'SUMMARY:Stand-up',
	'DESCRIPTION:Daily sync.\\nJoin: https://meet.google.com/abc-defg-hij',
	'ORGANIZER;CN="Lee, Ada":mailto:ada@example.com',
	'ATTENDEE;CN=Grace;PARTSTAT=ACCEPTED:mailto:grace@example.com',
	'ATTENDEE;ROLE=OPT-PARTICIPANT;PARTSTAT=TENTATIVE:mailto:alan@example.com',
	'BEGIN:VALARM',
	'TRIGGER:-PT10M',
	'ACTION:DISPLAY',
	'END:VALARM',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'UID:standup@test',
	'RECURRENCE-ID;TZID=America/New_York:20260922T090000',
	'DTSTART;TZID=America/New_York:20260922T100000',
	'DTEND;TZID=America/New_York:20260922T101500',
	'SUMMARY:Stand-up (moved)',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'UID:offsite@test',
	'DTSTART;VALUE=DATE:20261005',
	'DTEND;VALUE=DATE:20261008',
	'SUMMARY:Offsite',
	'TRANSP:TRANSPARENT',
	'LOCATION:Lisbon',
	'END:VEVENT',
	'BEGIN:VEVENT',
	'UID:long@test',
	'DTSTART:20261001T140000Z',
	'DURATION:PT1H30M',
	'SUMMARY:A very long title that will need to be folded because it is much longer than seventy five octets',
	'STATUS:TENTATIVE',
	'END:VEVENT',
	'END:VCALENDAR'
].join('\r\n');

describe('parseICS', () => {
	const parsed = parseICS(FEED, { calendarId: 'feed' });

	it('reads calendar-level properties', () => {
		expect(parsed.name).toBe('Team, Offsite');
		expect(parsed.color).toBe('#239190');
		expect(parsed.events).toHaveLength(4);
	});

	it('reads a recurring event with zones, exclusions, people and alarms', () => {
		const standup = parsed.events.find((e) => e.id === 'standup@test')!;
		expect(standup.start.toISOString()).toBe('2026-09-21T13:00:00.000Z');
		expect(standup.end.toISOString()).toBe('2026-09-21T13:15:00.000Z');
		expect(standup.timeZone).toBe('America/New_York');
		expect(standup.recurrence?.freq).toBe('WEEKLY');
		expect(standup.exdates?.map((x) => x.toISOString())).toEqual([
			'2026-09-23T13:00:00.000Z',
			'2026-09-24T13:00:00.000Z'
		]);
		expect(standup.description).toBe('Daily sync.\nJoin: https://meet.google.com/abc-defg-hij');
		expect(standup.conference).toEqual({
			url: 'https://meet.google.com/abc-defg-hij',
			kind: 'google-meet',
			label: 'Google Meet'
		});
		expect(standup.organizer).toEqual({ email: 'ada@example.com', name: 'Lee, Ada' });
		expect(standup.attendees).toEqual([
			{ email: 'grace@example.com', name: 'Grace', response: 'accepted' },
			{ email: 'alan@example.com', response: 'tentative', optional: true }
		]);
		expect(standup.reminders).toEqual([10]);
	});

	it('links overrides to their series', () => {
		const moved = parsed.events.find((e) => e.title === 'Stand-up (moved)')!;
		expect(moved.recurringEventId).toBe('standup@test');
		expect(moved.originalStart?.toISOString()).toBe('2026-09-22T13:00:00.000Z');
		expect(moved.id).not.toBe('standup@test');
	});

	it('reads all-day ranges, transparency and durations', () => {
		const offsite = parsed.events.find((e) => e.id === 'offsite@test')!;
		expect(offsite.allDay).toBe(true);
		expect(offsite.start).toEqual(new Date(2026, 9, 5));
		expect(offsite.end).toEqual(new Date(2026, 9, 8));
		expect(offsite.transparency).toBe('free');
		const long = parsed.events.find((e) => e.id === 'long@test')!;
		expect(long.end.toISOString()).toBe('2026-10-01T15:30:00.000Z');
		expect(long.status).toBe('tentative');
	});

	it('defaults the end of events without DTEND', () => {
		const out = parseICS(
			'BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:x\nDTSTART;VALUE=DATE:20260926\nEND:VEVENT\nEND:VCALENDAR'
		);
		expect(out.events[0].end).toEqual(new Date(2026, 8, 27));
	});

	it('skips events without a start', () => {
		expect(
			parseICS('BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:x\nEND:VEVENT\nEND:VCALENDAR').events
		).toEqual([]);
	});
});

describe('parseICS robustness', () => {
	const noUid = [
		'BEGIN:VCALENDAR',
		'BEGIN:VEVENT',
		'DTSTART:20260926T090000Z',
		'DTEND:20260926T100000Z',
		'SUMMARY:No UID',
		'COLOR:red;background:url(https://evil.test)',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	it('gives events without a UID the same id on every parse', () => {
		const first = parseICS(noUid).events[0];
		const second = parseICS(noUid).events[0];
		expect(first.id).toBe(second.id);
	});

	it('drops colors that are not plain CSS colors', () => {
		expect(parseICS(noUid).events[0].color).toBeUndefined();
	});
});

describe('serializeICS', () => {
	it('writes a date-only UNTIL for all-day series', () => {
		const text = serializeICS(
			[
				{
					id: 'bday',
					calendarId: 'c',
					title: 'Birthday',
					start: new Date(2026, 8, 26),
					end: new Date(2026, 8, 27),
					allDay: true,
					recurrence: { freq: 'YEARLY', until: new Date(2030, 8, 26, 23, 59, 59) }
				}
			],
			{ now: new Date(Date.UTC(2026, 0, 1)) }
		);
		expect(text).toContain('RRULE:FREQ=YEARLY;UNTIL=20300926\r\n');
	});

	const event: CalendarEvent = {
		id: 'evt-1',
		calendarId: 'cal',
		title: 'Planning; Q4, kickoff',
		start: new Date(Date.UTC(2026, 8, 28, 14)),
		end: new Date(Date.UTC(2026, 8, 28, 15)),
		description: 'Line one\nLine two',
		location: 'Room 4',
		conference: { url: 'https://zoom.us/j/123', kind: 'zoom' },
		recurrence: { freq: 'WEEKLY', count: 4 },
		organizer: { email: 'ada@example.com', name: 'Ada' },
		attendees: [{ email: 'grace@example.com', response: 'accepted', optional: true }],
		reminders: [10, 60]
	};

	it('produces a document that parses back to the same event', () => {
		const text = serializeICS([event], { name: 'Export', now: new Date(Date.UTC(2026, 8, 1)) });
		expect(text).toContain('SUMMARY:Planning\\; Q4\\, kickoff');
		expect(text).toContain('DTSTART:20260928T140000Z');
		expect(text).toContain('RRULE:FREQ=WEEKLY;COUNT=4');
		expect(text).toContain('TRIGGER:-PT1H');
		expect(text.endsWith('\r\n')).toBe(true);

		const back = parseICS(text).events[0];
		expect(back.title).toBe(event.title);
		expect(back.start).toEqual(event.start);
		expect(back.end).toEqual(event.end);
		expect(back.description).toBe(event.description);
		expect(back.recurrence).toEqual(event.recurrence);
		expect(back.conference?.url).toBe('https://zoom.us/j/123');
		expect(back.attendees?.[0]).toMatchObject({
			email: 'grace@example.com',
			response: 'accepted',
			optional: true
		});
		expect(back.reminders).toEqual([10, 60]);
	});

	it('writes all-day events as dates', () => {
		const text = serializeICS([
			{
				...event,
				allDay: true,
				start: new Date(2026, 9, 5),
				end: new Date(2026, 9, 8),
				recurrence: undefined
			}
		]);
		expect(text).toContain('DTSTART;VALUE=DATE:20261005');
		expect(text).toContain('DTEND;VALUE=DATE:20261008');
	});

	it('folds long lines at 75 octets without splitting characters', () => {
		const line = `SUMMARY:${'é'.repeat(80)}`;
		const folded = foldLine(line);
		for (const part of folded.split('\r\n'))
			expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
		expect(folded.replace(/\r\n /g, '')).toBe(line);
	});
});

describe('helpers', () => {
	it('escapes and unescapes text', () => {
		const raw = 'a,b;c\\d\ne';
		expect(unescapeText(escapeText(raw))).toBe(raw);
	});

	it('parses durations', () => {
		expect(parseDuration('-PT15M')).toBe(-15);
		expect(parseDuration('P1DT2H')).toBe(1560);
		expect(parseDuration('P2W')).toBe(20160);
		expect(parseDuration('bogus')).toBeNull();
	});

	it('detects conference links in free text', () => {
		expect(
			detectConference(undefined, 'Join https://teams.microsoft.com/l/meetup-join/19%3a123 now')
				?.kind
		).toBe('teams');
		expect(detectConference('https://acme.zoom.us/j/99?pwd=x')?.kind).toBe('zoom');
		expect(detectConference('Room 4')).toBeUndefined();
	});

	it('builds add-to-calendar links and file names', () => {
		const e = {
			title: 'Demo',
			start: new Date(Date.UTC(2026, 8, 28, 14)),
			end: new Date(Date.UTC(2026, 8, 28, 15))
		};
		expect(googleCalendarUrl(e)).toContain('dates=20260928T140000Z%2F20260928T150000Z');
		expect(outlookCalendarUrl(e)).toContain('startdt=2026-09-28T14%3A00%3A00.000Z');
		expect(icsFileName('Q4 planning: kickoff!')).toBe('Q4-planning-kickoff.ics');
		expect(icsFileName('   ')).toBe('event.ics');
	});
});
