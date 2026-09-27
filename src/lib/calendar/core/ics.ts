/**
 * iCalendar (RFC 5545) import and export. Covers what real feeds contain:
 * line folding, text escaping, quoted parameters, `TZID` zones (resolved via
 * `Intl`), all-day dates, `DURATION`, `RRULE`/`EXDATE`, `RECURRENCE-ID`
 * overrides, attendees, organizers, alarms and conference links.
 */
import type {
	AttendeeResponse,
	CalendarAttendee,
	CalendarConference,
	CalendarEvent,
	CalendarPerson,
	ConferenceKind,
	ProviderEvent
} from '../types.js';
import { addDays, toDateKey } from './date.js';
import { formatICalUtc, formatRRule, parseRRule } from './recurrence.js';
import { safeColor } from './safe.js';
import { isValidTimeZone, zonedPartsToInstant } from './timezone.js';

export interface ParsedCalendar {
	/** `X-WR-CALNAME` */
	name?: string;
	/** `X-WR-CALDESC` */
	description?: string;
	/** `COLOR` / `X-APPLE-CALENDAR-COLOR` */
	color?: string;
	/** `X-WR-TIMEZONE` */
	timeZone?: string;
	events: ProviderEvent[];
}

interface ContentLine {
	name: string;
	params: Record<string, string>;
	value: string;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function unfold(text: string): string[] {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\n[ \t]/g, '')
		.split('\n')
		.filter((line) => line.trim() !== '');
}

/** Splits on `separator`, ignoring separators inside double quotes. */
function splitOutsideQuotes(input: string, separator: string, limit = Infinity): string[] {
	const parts: string[] = [];
	let current = '';
	let quoted = false;
	for (const char of input) {
		if (char === '"') quoted = !quoted;
		if (char === separator && !quoted && parts.length < limit - 1) {
			parts.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	parts.push(current);
	return parts;
}

function parseContentLine(line: string): ContentLine | null {
	const [head, ...rest] = splitOutsideQuotes(line, ':', 2);
	if (!rest.length) return null;
	const [name, ...rawParams] = splitOutsideQuotes(head, ';');
	const params: Record<string, string> = {};
	for (const raw of rawParams) {
		const eq = raw.indexOf('=');
		if (eq === -1) continue;
		params[raw.slice(0, eq).toUpperCase()] = raw.slice(eq + 1).replace(/^"|"$/g, '');
	}
	return { name: name.toUpperCase(), params, value: rest[0] };
}

export function unescapeText(value: string): string {
	return value.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

export function escapeText(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r?\n/g, '\\n');
}

interface ParsedDate {
	date: Date;
	allDay: boolean;
	timeZone?: string;
}

function parseDateValue(
	value: string,
	params: Record<string, string>,
	fallbackZone?: string
): ParsedDate | null {
	const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
	if (!m) return null;
	const [, y, mo, d, h, mi, s, z] = m;
	if (params.VALUE === 'DATE' || h === undefined) {
		return { date: new Date(Number(y), Number(mo) - 1, Number(d)), allDay: true };
	}
	const parts = {
		year: Number(y),
		month: Number(mo),
		day: Number(d),
		hour: Number(h),
		minute: Number(mi),
		second: Number(s ?? 0)
	};
	if (z) {
		return {
			date: new Date(
				Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
			),
			allDay: false
		};
	}
	const zone = params.TZID && isValidTimeZone(params.TZID) ? params.TZID : fallbackZone;
	if (zone && isValidTimeZone(zone)) {
		return { date: zonedPartsToInstant(parts, zone), allDay: false, timeZone: zone };
	}
	// Floating time: the same wall clock everywhere, so read it as local.
	return {
		date: new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
		allDay: false
	};
}

/** ISO 8601 duration (`-PT15M`, `P1DT2H`, `P2W`) in minutes. */
export function parseDuration(value: string): number | null {
	const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
		value.trim()
	);
	if (!m) return null;
	const [, sign, w, d, h, mi, s] = m;
	const minutes =
		Number(w ?? 0) * 7 * 1440 +
		Number(d ?? 0) * 1440 +
		Number(h ?? 0) * 60 +
		Number(mi ?? 0) +
		Number(s ?? 0) / 60;
	return sign === '-' ? -minutes : minutes;
}

function formatDuration(minutes: number): string {
	const abs = Math.abs(minutes);
	const d = Math.floor(abs / 1440);
	const h = Math.floor((abs % 1440) / 60);
	const m = Math.round(abs % 60);
	let out = `${minutes < 0 ? '-' : ''}P`;
	if (d) out += `${d}D`;
	if (h || m || !d) out += `T${h ? `${h}H` : ''}${m || (!h && !d) ? `${m}M` : ''}`;
	return out;
}

const PARTSTAT: Record<string, AttendeeResponse> = {
	'NEEDS-ACTION': 'needsAction',
	ACCEPTED: 'accepted',
	DECLINED: 'declined',
	TENTATIVE: 'tentative'
};

function parsePerson(line: ContentLine): CalendarPerson | null {
	const email = line.value.replace(/^mailto:/i, '').trim();
	if (!email) return null;
	return line.params.CN ? { email, name: line.params.CN } : { email };
}

const CONFERENCE_PATTERNS: [RegExp, ConferenceKind, string][] = [
	[/https:\/\/meet\.google\.com\/[a-z0-9-?=&]+/i, 'google-meet', 'Google Meet'],
	[/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"]+/i, 'teams', 'Microsoft Teams'],
	[/https:\/\/teams\.live\.com\/meet\/[^\s<>"]+/i, 'teams', 'Microsoft Teams'],
	[/https:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/[jw]\/[^\s<>"]+/i, 'zoom', 'Zoom']
];

export const CONFERENCE_LABELS: Record<ConferenceKind, string> = {
	'google-meet': 'Google Meet',
	teams: 'Microsoft Teams',
	zoom: 'Zoom',
	other: 'Video call'
};

/** Finds a known video-meeting link inside free text (description, location…). */
export function detectConference(...texts: (string | undefined)[]): CalendarConference | undefined {
	for (const text of texts) {
		if (!text) continue;
		for (const [pattern, kind, label] of CONFERENCE_PATTERNS) {
			const match = pattern.exec(text);
			if (match) return { url: match[0], kind, label };
		}
	}
	return undefined;
}

function hexColor(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const v = value.trim();
	// Apple writes `#RRGGBBAA`; drop the alpha.
	if (/^#[0-9a-f]{8}$/i.test(v)) return v.slice(0, 7);
	return safeColor(v);
}

/** A short, stable hash, so events without a UID keep the same id on every refresh. */
function hashText(value: string): string {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) hash = (Math.imul(hash, 33) ^ value.charCodeAt(i)) | 0;
	return (hash >>> 0).toString(36);
}

/** Parses an iCalendar document. Events carry `calendarId` from `options`. */
export function parseICS(text: string, options: { calendarId?: string } = {}): ParsedCalendar {
	const calendarId = options.calendarId ?? 'ics';
	const lines = unfold(text)
		.map(parseContentLine)
		.filter((line): line is ContentLine => line !== null);
	const result: ParsedCalendar = { events: [] };

	// Pass 1: calendar-level properties. They may appear after the events, but
	// X-WR-TIMEZONE decides how floating event times are read, so it goes first.
	let depth = 0;
	for (const line of lines) {
		if (line.name === 'BEGIN') depth++;
		else if (line.name === 'END') depth--;
		else if (depth === 1) {
			if (line.name === 'X-WR-CALNAME' || line.name === 'NAME')
				result.name = unescapeText(line.value);
			else if (line.name === 'X-WR-CALDESC') result.description = unescapeText(line.value);
			else if (line.name === 'X-WR-TIMEZONE' && isValidTimeZone(line.value))
				result.timeZone = line.value;
			else if (line.name === 'COLOR' || line.name === 'X-APPLE-CALENDAR-COLOR') {
				result.color = hexColor(line.value);
			}
		}
	}

	// Pass 2: events and their alarms.
	const stack: string[] = [];
	let props: ContentLine[] = [];
	let reminders: number[] = [];
	for (const line of lines) {
		if (line.name === 'BEGIN') {
			const component = line.value.toUpperCase();
			stack.push(component);
			if (component === 'VEVENT') {
				props = [];
				reminders = [];
			}
			continue;
		}
		if (line.name === 'END') {
			if (stack.pop() === 'VEVENT') {
				const event = buildEvent(props, reminders, calendarId, result.timeZone);
				if (event) result.events.push(event);
			}
			continue;
		}
		const top = stack[stack.length - 1];
		if (top === 'VEVENT') {
			props.push(line);
		} else if (
			top === 'VALARM' &&
			stack[stack.length - 2] === 'VEVENT' &&
			line.name === 'TRIGGER'
		) {
			const minutes = line.params.VALUE === 'DATE-TIME' ? null : parseDuration(line.value);
			if (minutes !== null && minutes <= 0) reminders.push(Math.round(-minutes));
		}
	}
	return result;
}

function buildEvent(
	props: ContentLine[],
	reminders: number[],
	calendarId: string,
	calendarZone: string | undefined
): ProviderEvent | null {
	const get = (name: string) => props.find((p) => p.name === name);
	const all = (name: string) => props.filter((p) => p.name === name);

	const dtstartLine = get('DTSTART');
	if (!dtstartLine) return null;
	const start = parseDateValue(dtstartLine.value, dtstartLine.params, calendarZone);
	if (!start) return null;

	let end: Date;
	const dtendLine = get('DTEND');
	const durationLine = get('DURATION');
	const parsedEnd = dtendLine
		? parseDateValue(dtendLine.value, dtendLine.params, calendarZone)
		: null;
	if (parsedEnd && parsedEnd.date >= start.date) end = parsedEnd.date;
	else if (durationLine && parseDuration(durationLine.value) !== null) {
		end = new Date(start.date.getTime() + parseDuration(durationLine.value)! * 60_000);
		if (start.allDay) end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
	} else end = start.allDay ? addDays(start.date, 1) : new Date(start.date);

	const summary = get('SUMMARY');
	const uid =
		get('UID')?.value ||
		`${formatICalUtc(start.date)}-${hashText(`${dtstartLine.value}|${summary?.value ?? ''}`)}`;
	const description = get('DESCRIPTION') ? unescapeText(get('DESCRIPTION')!.value) : undefined;
	const location = get('LOCATION') ? unescapeText(get('LOCATION')!.value) : undefined;
	const url = get('URL')?.value;

	const event: ProviderEvent = {
		id: uid,
		calendarId,
		title: summary ? unescapeText(summary.value) : '',
		start: start.date,
		end,
		allDay: start.allDay
	};
	if (start.timeZone) event.timeZone = start.timeZone;
	if (description) event.description = description;
	if (location) event.location = location;
	if (url) event.url = url;

	const conferenceLine = get('CONFERENCE') ?? get('X-GOOGLE-CONFERENCE');
	event.conference = conferenceLine
		? (detectConference(conferenceLine.value) ?? {
				url: conferenceLine.value,
				kind: 'other',
				label: conferenceLine.params.LABEL
			})
		: detectConference(location, description, url);
	if (!event.conference) delete event.conference;

	const rrule = get('RRULE');
	if (rrule) {
		const rule = parseRRule(rrule.value);
		if (rule) event.recurrence = rule;
	}

	const exdates: Date[] = [];
	for (const line of all('EXDATE')) {
		for (const value of line.value.split(',')) {
			const parsed = parseDateValue(value, line.params, calendarZone);
			if (parsed) exdates.push(parsed.date);
		}
	}
	if (exdates.length) event.exdates = exdates;

	const recurrenceId = get('RECURRENCE-ID');
	if (recurrenceId) {
		const original = parseDateValue(recurrenceId.value, recurrenceId.params, calendarZone);
		if (original) {
			event.recurringEventId = uid;
			event.originalStart = original.date;
			event.id = `${uid}::${original.date.getTime()}`;
		}
	}

	const status = get('STATUS')?.value.toUpperCase();
	if (status === 'CANCELLED') event.status = 'cancelled';
	else if (status === 'TENTATIVE') event.status = 'tentative';
	else if (status === 'CONFIRMED') event.status = 'confirmed';

	if (get('TRANSP')?.value.toUpperCase() === 'TRANSPARENT') event.transparency = 'free';

	const color = hexColor(get('COLOR')?.value);
	if (color) event.color = color;

	const organizerLine = get('ORGANIZER');
	const organizer = organizerLine ? parsePerson(organizerLine) : null;
	if (organizer) event.organizer = organizer;

	const attendees: CalendarAttendee[] = [];
	for (const line of all('ATTENDEE')) {
		const person = parsePerson(line);
		if (!person) continue;
		const attendee: CalendarAttendee = { ...person };
		const response = PARTSTAT[line.params.PARTSTAT?.toUpperCase() ?? ''];
		if (response) attendee.response = response;
		if (line.params.ROLE?.toUpperCase() === 'OPT-PARTICIPANT') attendee.optional = true;
		if (organizer && organizer.email.toLowerCase() === person.email.toLowerCase())
			attendee.organizer = true;
		attendees.push(attendee);
	}
	if (attendees.length) event.attendees = attendees;
	if (reminders.length) event.reminders = [...new Set(reminders)].sort((a, b) => a - b);

	return event;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function byteLength(text: string): number {
	return encoder ? encoder.encode(text).length : text.length;
}

/** Folds a content line at 75 octets without splitting a character. */
export function foldLine(line: string): string {
	if (byteLength(line) <= 75) return line;
	const out: string[] = [];
	let current = '';
	let currentBytes = 0;
	for (const char of line) {
		const size = byteLength(char);
		// Continuation lines start with a space, which counts toward the limit.
		const limit = out.length === 0 ? 75 : 74;
		if (currentBytes + size > limit) {
			out.push(current);
			current = '';
			currentBytes = 0;
		}
		current += char;
		currentBytes += size;
	}
	out.push(current);
	return out.join('\r\n ');
}

function quoteParam(value: string): string {
	return /[;:,"]/.test(value) ? `"${value.replace(/"/g, "'")}"` : value;
}

function formatDateProp(name: string, date: Date, allDay: boolean): string {
	return allDay
		? `${name};VALUE=DATE:${toDateKey(date).replace(/-/g, '')}`
		: `${name}:${formatICalUtc(date)}`;
}

const RESPONSE_TO_PARTSTAT: Record<AttendeeResponse, string> = {
	needsAction: 'NEEDS-ACTION',
	accepted: 'ACCEPTED',
	declined: 'DECLINED',
	tentative: 'TENTATIVE'
};

export interface SerializeOptions {
	/** `X-WR-CALNAME` */
	name?: string;
	/** @default '-//Kleri//Kleri UI Calendar//EN' */
	prodId?: string;
	/** `REQUEST` for invitations, `PUBLISH` for plain exports. @default 'PUBLISH' */
	method?: 'PUBLISH' | 'REQUEST' | 'CANCEL';
	/** `DTSTAMP` of every event. @default now */
	now?: Date;
}

/** Serializes events into an iCalendar document with CRLF line endings. */
export function serializeICS(
	events: readonly CalendarEvent[],
	options: SerializeOptions = {}
): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${options.prodId ?? '-//Kleri//Kleri UI Calendar//EN'}`,
		'CALSCALE:GREGORIAN',
		`METHOD:${options.method ?? 'PUBLISH'}`
	];
	if (options.name) lines.push(`X-WR-CALNAME:${escapeText(options.name)}`);
	const stamp = formatICalUtc(options.now ?? new Date());

	for (const event of events) {
		const allDay = Boolean(event.allDay);
		const uid = event.recurringEventId ?? event.id;
		lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`);
		lines.push(
			formatDateProp('DTSTART', event.start, allDay),
			formatDateProp('DTEND', event.end, allDay)
		);
		if (event.recurringEventId && event.originalStart) {
			lines.push(formatDateProp('RECURRENCE-ID', event.originalStart, allDay));
		}
		lines.push(`SUMMARY:${escapeText(event.title)}`);
		if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
		if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
		if (event.conference) {
			const label = event.conference.label ?? CONFERENCE_LABELS[event.conference.kind ?? 'other'];
			lines.push(
				`CONFERENCE;VALUE=URI;FEATURE=VIDEO;LABEL=${quoteParam(label)}:${event.conference.url}`
			);
		}
		if (event.url) lines.push(`URL:${event.url}`);
		if (event.status) lines.push(`STATUS:${event.status.toUpperCase()}`);
		lines.push(`TRANSP:${event.transparency === 'free' ? 'TRANSPARENT' : 'OPAQUE'}`);
		if (event.color) lines.push(`COLOR:${event.color}`);
		if (event.recurrence) {
			lines.push(`RRULE:${formatRRule(event.recurrence, { dateOnlyUntil: allDay })}`);
		}
		if (event.exdates?.length) {
			lines.push(
				allDay
					? `EXDATE;VALUE=DATE:${event.exdates.map((d) => toDateKey(d).replace(/-/g, '')).join(',')}`
					: `EXDATE:${event.exdates.map(formatICalUtc).join(',')}`
			);
		}
		if (event.organizer) {
			const cn = event.organizer.name ? `;CN=${quoteParam(event.organizer.name)}` : '';
			lines.push(`ORGANIZER${cn}:mailto:${event.organizer.email}`);
		}
		for (const attendee of event.attendees ?? []) {
			const params = [
				attendee.name ? `CN=${quoteParam(attendee.name)}` : null,
				`ROLE=${attendee.optional ? 'OPT-PARTICIPANT' : 'REQ-PARTICIPANT'}`,
				`PARTSTAT=${RESPONSE_TO_PARTSTAT[attendee.response ?? 'needsAction']}`,
				'RSVP=TRUE'
			].filter(Boolean);
			lines.push(`ATTENDEE;${params.join(';')}:mailto:${attendee.email}`);
		}
		for (const minutes of event.reminders ?? []) {
			lines.push(
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				'DESCRIPTION:Reminder',
				`TRIGGER:${formatDuration(-minutes)}`,
				'END:VALARM'
			);
		}
		lines.push('END:VEVENT');
	}
	lines.push('END:VCALENDAR');
	return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Offers an iCalendar document as a file download. Browser only. */
export function downloadICS(content: string, filename = 'event.ics'): void {
	if (typeof document === 'undefined') return;
	const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	// Some browsers start the download asynchronously; give them time to read the blob.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A safe file name for an event's `.ics` export. */
export function icsFileName(title: string): string {
	const base = title
		.trim()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return `${base || 'event'}.ics`;
}

// ---------------------------------------------------------------------------
// "Add to calendar" deep links
// ---------------------------------------------------------------------------

/** Link that opens Google Calendar's "new event" form prefilled with `event`. */
export function googleCalendarUrl(
	event: Pick<
		CalendarEvent,
		'title' | 'start' | 'end' | 'allDay' | 'description' | 'location' | 'recurrence'
	>
): string {
	const fmt = (d: Date) => (event.allDay ? toDateKey(d).replace(/-/g, '') : formatICalUtc(d));
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: event.title,
		dates: `${fmt(event.start)}/${fmt(event.end)}`
	});
	if (event.description) params.set('details', event.description);
	if (event.location) params.set('location', event.location);
	if (event.recurrence) {
		params.set('recur', `RRULE:${formatRRule(event.recurrence, { dateOnlyUntil: event.allDay })}`);
	}
	return `https://calendar.google.com/calendar/render?${params}`;
}

/** Link that opens Outlook on the web's compose form prefilled with `event`. */
export function outlookCalendarUrl(
	event: Pick<CalendarEvent, 'title' | 'start' | 'end' | 'allDay' | 'description' | 'location'>,
	host: 'outlook.live.com' | 'outlook.office.com' = 'outlook.live.com'
): string {
	const params = new URLSearchParams({
		path: '/calendar/action/compose',
		rru: 'addevent',
		subject: event.title,
		startdt: event.allDay ? toDateKey(event.start) : event.start.toISOString(),
		enddt: event.allDay ? toDateKey(event.end) : event.end.toISOString()
	});
	if (event.allDay) params.set('allday', 'true');
	if (event.description) params.set('body', event.description);
	if (event.location) params.set('location', event.location);
	return `https://${host}/calendar/0/deeplink/compose?${params}`;
}
