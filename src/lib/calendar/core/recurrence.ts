/**
 * RFC 5545 recurrence rules: the subset every mainstream calendar produces.
 *
 * Supported parts: FREQ (DAILY/WEEKLY/MONTHLY/YEARLY), INTERVAL, COUNT, UNTIL,
 * BYDAY (with ordinals such as `2MO` or `-1FR`), BYMONTHDAY (negative counts
 * from the month's end), BYMONTH, BYSETPOS and WKST. Expansion happens in
 * local wall-clock time, so a 09:00 series stays at 09:00 across DST changes.
 */
import {
	addDays,
	addMonths,
	daysInMonth,
	differenceInCalendarDays,
	startOfDay,
	startOfWeek,
	toDateKey
} from './date.js';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type WeekdayCode = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

/** Indexed like `Date#getDay`: `WEEKDAY_CODES[0]` is Sunday. */
export const WEEKDAY_CODES: readonly WeekdayCode[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export interface ByDay {
	day: WeekdayCode;
	/** Ordinal within the month/year: `1` first, `-1` last. Omit for "every". */
	nth?: number;
}

export interface RecurrenceRule {
	freq: RecurrenceFrequency;
	/** @default 1 */
	interval?: number;
	/** Total occurrences, counted from the series start (exclusions included). */
	count?: number;
	/** Last allowed occurrence start, inclusive. */
	until?: Date;
	byDay?: ByDay[];
	byMonthDay?: number[];
	/** 1-12 */
	byMonth?: number[];
	bySetPos?: number[];
	/** @default 'MO' */
	weekStart?: WeekdayCode;
}

const FREQUENCIES: readonly RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const MAX_PERIODS = 100_000;

export function weekdayIndex(code: WeekdayCode): number {
	return WEEKDAY_CODES.indexOf(code);
}

function parseIntList(value: string): number[] {
	return value
		.split(',')
		.map((v) => Number.parseInt(v, 10))
		.filter((n) => Number.isFinite(n) && n !== 0);
}

/** Parses an iCalendar basic date/date-time (`20261231`, `20261231T090000Z`). */
export function parseICalDateTime(value: string): Date | null {
	const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
	if (!m) return null;
	const [, y, mo, d, h, mi, s, z] = m;
	if (h === undefined) return new Date(Number(y), Number(mo) - 1, Number(d));
	const args = [
		Number(y),
		Number(mo) - 1,
		Number(d),
		Number(h),
		Number(mi),
		Number(s ?? 0)
	] as const;
	return z ? new Date(Date.UTC(...args)) : new Date(...args);
}

/** Formats an instant as an iCalendar UTC date-time, e.g. `20261231T235959Z`. */
export function formatICalUtc(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}

/**
 * Parses an RRULE value, with or without the `RRULE:` prefix. Returns `null`
 * for anything without a supported `FREQ`, so callers can ignore bad input.
 */
export function parseRRule(input: string): RecurrenceRule | null {
	const body = input.trim().replace(/^RRULE:/i, '');
	const rule: Partial<RecurrenceRule> = {};
	for (const part of body.split(';')) {
		const [rawKey, rawValue] = part.split('=');
		if (!rawKey || rawValue === undefined) continue;
		const key = rawKey.trim().toUpperCase();
		const value = rawValue.trim().toUpperCase();
		switch (key) {
			case 'FREQ':
				if ((FREQUENCIES as readonly string[]).includes(value)) {
					rule.freq = value as RecurrenceFrequency;
				}
				break;
			case 'INTERVAL': {
				const n = Number.parseInt(value, 10);
				if (n > 1) rule.interval = n;
				break;
			}
			case 'COUNT': {
				const n = Number.parseInt(value, 10);
				if (n > 0) rule.count = n;
				break;
			}
			case 'UNTIL': {
				const date = parseICalDateTime(value);
				if (date) {
					// A date-only UNTIL includes that whole local day.
					if (value.length === 8) date.setHours(23, 59, 59, 999);
					rule.until = date;
				}
				break;
			}
			case 'BYDAY': {
				const days: ByDay[] = [];
				for (const token of value.split(',')) {
					const m = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(token.trim());
					if (!m) continue;
					const nth = m[1] ? Number.parseInt(m[1], 10) : undefined;
					days.push(nth ? { day: m[2] as WeekdayCode, nth } : { day: m[2] as WeekdayCode });
				}
				if (days.length) rule.byDay = days;
				break;
			}
			case 'BYMONTHDAY': {
				const list = parseIntList(value).filter((n) => n >= -31 && n <= 31);
				if (list.length) rule.byMonthDay = list;
				break;
			}
			case 'BYMONTH': {
				const list = parseIntList(value).filter((n) => n >= 1 && n <= 12);
				if (list.length) rule.byMonth = list;
				break;
			}
			case 'BYSETPOS': {
				const list = parseIntList(value);
				if (list.length) rule.bySetPos = list;
				break;
			}
			case 'WKST':
				if ((WEEKDAY_CODES as readonly string[]).includes(value)) {
					rule.weekStart = value as WeekdayCode;
				}
				break;
		}
	}
	return rule.freq ? (rule as RecurrenceRule) : null;
}

/**
 * Serializes a rule to an RRULE value (without the `RRULE:` prefix). RFC 5545
 * wants UNTIL to match DTSTART's type, so pass `dateOnlyUntil` for all-day
 * series: `UNTIL=20261231` instead of a UTC date-time.
 */
export function formatRRule(
	rule: RecurrenceRule,
	options: { dateOnlyUntil?: boolean } = {}
): string {
	const parts = [`FREQ=${rule.freq}`];
	if (rule.interval && rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
	if (rule.byDay?.length) {
		parts.push(`BYDAY=${rule.byDay.map((d) => `${d.nth ?? ''}${d.day}`).join(',')}`);
	}
	if (rule.byMonthDay?.length) parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
	if (rule.byMonth?.length) parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
	if (rule.bySetPos?.length) parts.push(`BYSETPOS=${rule.bySetPos.join(',')}`);
	if (rule.weekStart && rule.weekStart !== 'MO') parts.push(`WKST=${rule.weekStart}`);
	if (rule.count) parts.push(`COUNT=${rule.count}`);
	else if (rule.until) {
		const until = options.dateOnlyUntil
			? toDateKey(rule.until).replace(/-/g, '')
			: formatICalUtc(rule.until);
		parts.push(`UNTIL=${until}`);
	}
	return parts.join(';');
}

export function isSameRule(
	a: RecurrenceRule | null | undefined,
	b: RecurrenceRule | null | undefined
) {
	if (!a || !b) return !a && !b;
	return formatRRule(a) === formatRRule(b);
}

/** Days of a month matching `specs`, as day-of-month numbers. */
function byDayInMonth(year: number, month: number, specs: ByDay[]): number[] {
	const dim = daysInMonth(year, month);
	const firstWeekday = new Date(year, month, 1).getDay();
	const out: number[] = [];
	for (const spec of specs) {
		const wd = weekdayIndex(spec.day);
		const first = 1 + ((wd - firstWeekday + 7) % 7);
		const matches: number[] = [];
		for (let d = first; d <= dim; d += 7) matches.push(d);
		if (spec.nth === undefined) out.push(...matches);
		else {
			const pick = spec.nth > 0 ? matches[spec.nth - 1] : matches[matches.length + spec.nth];
			if (pick !== undefined) out.push(pick);
		}
	}
	return out;
}

/** Dates of a year matching `specs` with ordinals counted across the whole year. */
function byDayInYear(year: number, specs: ByDay[]): Date[] {
	const out: Date[] = [];
	for (const spec of specs) {
		const wd = weekdayIndex(spec.day);
		const jan1 = new Date(year, 0, 1);
		const first = addDays(jan1, (wd - jan1.getDay() + 7) % 7);
		const matches: Date[] = [];
		for (let d = first; d.getFullYear() === year; d = addDays(d, 7)) matches.push(d);
		if (spec.nth === undefined) out.push(...matches);
		else {
			const pick = spec.nth > 0 ? matches[spec.nth - 1] : matches[matches.length + spec.nth];
			if (pick) out.push(pick);
		}
	}
	return out;
}

function resolveMonthDays(year: number, month: number, list: number[]): number[] {
	const dim = daysInMonth(year, month);
	return list.map((n) => (n > 0 ? n : dim + n + 1)).filter((n) => n >= 1 && n <= dim);
}

function intersect(a: number[], b: number[]): number[] {
	const set = new Set(b);
	return a.filter((n) => set.has(n));
}

/** Candidate days of one month, before BYSETPOS. */
function monthCandidates(year: number, month: number, rule: RecurrenceRule, dtstart: Date): Date[] {
	let days: number[];
	if (rule.byMonthDay && rule.byDay) {
		days = intersect(
			resolveMonthDays(year, month, rule.byMonthDay),
			byDayInMonth(year, month, rule.byDay)
		);
	} else if (rule.byMonthDay) {
		days = resolveMonthDays(year, month, rule.byMonthDay);
	} else if (rule.byDay) {
		days = byDayInMonth(year, month, rule.byDay);
	} else {
		const d = dtstart.getDate();
		days = d <= daysInMonth(year, month) ? [d] : [];
	}
	return days.map((d) => new Date(year, month, d));
}

function periodStart(dtstart: Date, rule: RecurrenceRule, offset: number): Date {
	switch (rule.freq) {
		case 'DAILY':
			return addDays(startOfDay(dtstart), offset);
		case 'WEEKLY':
			return addDays(startOfWeek(dtstart, weekdayIndex(rule.weekStart ?? 'MO')), offset * 7);
		case 'MONTHLY':
			return addMonths(new Date(dtstart.getFullYear(), dtstart.getMonth(), 1), offset);
		case 'YEARLY':
			return new Date(dtstart.getFullYear() + offset, 0, 1);
	}
}

/** Sorted candidate days (midnights) of the period starting at `start`. */
function periodCandidates(start: Date, rule: RecurrenceRule, dtstart: Date): Date[] {
	let days: Date[] = [];
	switch (rule.freq) {
		case 'DAILY': {
			const matchesDay =
				!rule.byDay || rule.byDay.some((d) => weekdayIndex(d.day) === start.getDay());
			const matchesMonthDay =
				!rule.byMonthDay ||
				resolveMonthDays(start.getFullYear(), start.getMonth(), rule.byMonthDay).includes(
					start.getDate()
				);
			if (matchesDay && matchesMonthDay) days = [start];
			break;
		}
		case 'WEEKLY': {
			const wkst = weekdayIndex(rule.weekStart ?? 'MO');
			const weekdays = rule.byDay ? rule.byDay.map((d) => weekdayIndex(d.day)) : [dtstart.getDay()];
			days = [...new Set(weekdays)].map((wd) => addDays(start, (wd - wkst + 7) % 7));
			break;
		}
		case 'MONTHLY':
			days = monthCandidates(start.getFullYear(), start.getMonth(), rule, dtstart);
			break;
		case 'YEARLY': {
			const year = start.getFullYear();
			if (rule.byDay && !rule.byMonth && !rule.byMonthDay) {
				days = byDayInYear(year, rule.byDay);
			} else {
				const months = rule.byMonth ? rule.byMonth.map((m) => m - 1) : [dtstart.getMonth()];
				for (const month of months) days.push(...monthCandidates(year, month, rule, dtstart));
			}
			break;
		}
	}

	if (rule.byMonth && rule.freq !== 'YEARLY') {
		days = days.filter((d) => rule.byMonth!.includes(d.getMonth() + 1));
	}

	days.sort((a, b) => a.getTime() - b.getTime());
	const unique = days.filter((d, i) => i === 0 || d.getTime() !== days[i - 1].getTime());

	if (!rule.bySetPos?.length) return unique;
	const picked: Date[] = [];
	for (const pos of rule.bySetPos) {
		const d = pos > 0 ? unique[pos - 1] : unique[unique.length + pos];
		if (d && !picked.includes(d)) picked.push(d);
	}
	return picked.sort((a, b) => a.getTime() - b.getTime());
}

/** How many whole interval-steps can be skipped before `target` without missing anything. */
function skippableSteps(
	dtstart: Date,
	rule: RecurrenceRule,
	target: Date,
	interval: number
): number {
	if (target <= dtstart) return 0;
	let periods: number;
	switch (rule.freq) {
		case 'DAILY':
			periods = differenceInCalendarDays(target, dtstart);
			break;
		case 'WEEKLY': {
			const wkst = weekdayIndex(rule.weekStart ?? 'MO');
			periods = Math.floor(
				differenceInCalendarDays(startOfWeek(target, wkst), startOfWeek(dtstart, wkst)) / 7
			);
			break;
		}
		case 'MONTHLY':
			periods =
				(target.getFullYear() - dtstart.getFullYear()) * 12 +
				target.getMonth() -
				dtstart.getMonth();
			break;
		case 'YEARLY':
			periods = target.getFullYear() - dtstart.getFullYear();
			break;
	}
	return Math.max(0, Math.floor(periods / interval) - 1);
}

export interface ExpandOptions {
	/** Occurrences overlapping `[rangeStart, rangeEnd)` are returned. */
	rangeStart: Date;
	rangeEnd: Date;
	/** Length of each occurrence in ms, used for the overlap test. @default 0 */
	duration?: number;
	/** Occurrence starts to leave out (EXDATE, or instances overridden elsewhere). */
	exdates?: readonly Date[];
	/** Hard cap on returned occurrences. @default 2000 */
	limit?: number;
}

/** Start times of every occurrence of the series overlapping the range. */
export function expandRecurrence(
	dtstart: Date,
	rule: RecurrenceRule,
	options: ExpandOptions
): Date[] {
	const { rangeStart, rangeEnd, duration = 0, exdates = [], limit = 2000 } = options;
	const interval = Math.max(1, rule.interval ?? 1);
	const excluded = new Set(exdates.map((d) => d.getTime()));
	const results: Date[] = [];

	const [h, mi, s, ms] = [
		dtstart.getHours(),
		dtstart.getMinutes(),
		dtstart.getSeconds(),
		dtstart.getMilliseconds()
	];

	// COUNT is measured from the series start, so only uncounted series may
	// jump straight to the requested range.
	const earliest = new Date(rangeStart.getTime() - duration);
	let step = rule.count ? 0 : skippableSteps(dtstart, rule, earliest, interval);
	let produced = 0;

	for (let guard = 0; guard < MAX_PERIODS; guard++, step++) {
		const start = periodStart(dtstart, rule, step * interval);
		if (start >= rangeEnd) break;
		if (rule.until && start > rule.until) break;

		for (const day of periodCandidates(start, rule, dtstart)) {
			const occurrence = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, s, ms);
			if (occurrence < dtstart) continue;
			if (rule.until && occurrence > rule.until) return results;
			if (rule.count && produced >= rule.count) return results;
			produced++;
			if (occurrence >= rangeEnd) return results;
			if (excluded.has(occurrence.getTime())) continue;

			const end = occurrence.getTime() + duration;
			const inRange = duration > 0 ? end > rangeStart.getTime() : occurrence >= rangeStart;
			if (inRange) {
				results.push(occurrence);
				if (results.length >= limit) return results;
			}
		}
	}
	return results;
}

// ---------------------------------------------------------------------------
// Human-readable descriptions and presets for the editor
// ---------------------------------------------------------------------------

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

function ordinal(nth: number): string {
	if (nth === -1) return 'last';
	if (nth < -1) return `${ORDINALS[-nth - 1] ?? `${-nth}th`} to last`;
	return ORDINALS[nth - 1] ?? `${nth}th`;
}

function weekdayName(code: WeekdayCode, locale: string, style: 'long' | 'short' = 'long'): string {
	// 7 Jan 2024 was a Sunday.
	const date = new Date(2024, 0, 7 + weekdayIndex(code));
	return new Intl.DateTimeFormat(locale, { weekday: style }).format(date);
}

function listFormat(items: string[], locale: string): string {
	try {
		return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
	} catch {
		return items.join(', ');
	}
}

const WEEKDAYS_MON_FRI = ['MO', 'TU', 'WE', 'TH', 'FR'];

export function isWeekdaysRule(rule: RecurrenceRule): boolean {
	return (
		rule.freq === 'WEEKLY' &&
		(rule.interval ?? 1) === 1 &&
		rule.byDay?.length === 5 &&
		rule.byDay.every((d) => d.nth === undefined && WEEKDAYS_MON_FRI.includes(d.day))
	);
}

/** Which occurrence of its weekday a date is within its month, e.g. `{ nth: 4, last: true }`. */
export function weekdayOrdinalInMonth(date: Date): { nth: number; last: boolean } {
	const nth = Math.ceil(date.getDate() / 7);
	const last = date.getDate() + 7 > daysInMonth(date.getFullYear(), date.getMonth());
	return { nth, last };
}

/** English description, e.g. "Every 2 weeks on Monday and Wednesday, 10 times". */
export function describeRecurrence(
	rule: RecurrenceRule,
	options: { locale?: string; start?: Date } = {}
): string {
	const locale = options.locale ?? 'en-US';
	const interval = rule.interval ?? 1;
	const unit = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' }[rule.freq];
	const single = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Annually' }[
		rule.freq
	];

	let text: string;
	if (isWeekdaysRule(rule)) {
		text = 'Every weekday (Monday to Friday)';
	} else {
		text = interval === 1 ? single : `Every ${interval} ${unit}s`;
		if (rule.freq === 'WEEKLY' && rule.byDay?.length) {
			text += ` on ${listFormat(
				rule.byDay.map((d) => weekdayName(d.day, locale)),
				locale
			)}`;
		} else if ((rule.freq === 'MONTHLY' || rule.freq === 'YEARLY') && rule.byDay?.length) {
			const parts = rule.byDay.map((d) =>
				d.nth
					? `the ${ordinal(d.nth)} ${weekdayName(d.day, locale)}`
					: `every ${weekdayName(d.day, locale)}`
			);
			text += ` on ${listFormat(parts, locale)}`;
			if (rule.freq === 'YEARLY' && rule.byMonth?.length) {
				const months = rule.byMonth.map((m) =>
					new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, m - 1, 1))
				);
				text += ` of ${listFormat(months, locale)}`;
			}
		} else if (rule.freq === 'MONTHLY' && rule.byMonthDay?.length) {
			const days = rule.byMonthDay.map((d) => (d === -1 ? 'the last day' : `day ${d}`));
			text += ` on ${listFormat(days, locale)}`;
		} else if (rule.freq === 'YEARLY' && options.start) {
			text += ` on ${new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(options.start)}`;
		}
	}

	if (rule.count) text += rule.count === 1 ? ', once' : `, ${rule.count} times`;
	else if (rule.until) {
		text += `, until ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(rule.until)}`;
	}
	return text;
}

export interface RecurrencePreset {
	id:
		| 'none'
		| 'daily'
		| 'weekly'
		| 'weekdays'
		| 'monthly-nth'
		| 'monthly-last'
		| 'monthly-day'
		| 'yearly';
	label: string;
	rule: RecurrenceRule | null;
}

/** The quick choices offered by the editor's "Repeat" select, tailored to `start`. */
export function recurrencePresets(start: Date, locale = 'en-US'): RecurrencePreset[] {
	const code = WEEKDAY_CODES[start.getDay()];
	const { nth, last } = weekdayOrdinalInMonth(start);
	const presets: RecurrencePreset[] = [
		{ id: 'none', label: 'Does not repeat', rule: null },
		{ id: 'daily', label: 'Daily', rule: { freq: 'DAILY' } },
		{
			id: 'weekly',
			label: `Weekly on ${weekdayName(code, locale)}`,
			rule: { freq: 'WEEKLY', byDay: [{ day: code }] }
		},
		{
			id: 'weekdays',
			label: 'Every weekday (Monday to Friday)',
			rule: { freq: 'WEEKLY', byDay: WEEKDAYS_MON_FRI.map((day) => ({ day: day as WeekdayCode })) }
		}
	];
	if (nth <= 4) {
		presets.push({
			id: 'monthly-nth',
			label: `Monthly on the ${ordinal(nth)} ${weekdayName(code, locale)}`,
			rule: { freq: 'MONTHLY', byDay: [{ day: code, nth }] }
		});
	}
	if (last) {
		presets.push({
			id: 'monthly-last',
			label: `Monthly on the last ${weekdayName(code, locale)}`,
			rule: { freq: 'MONTHLY', byDay: [{ day: code, nth: -1 }] }
		});
	}
	presets.push(
		{
			id: 'monthly-day',
			label: `Monthly on day ${start.getDate()}`,
			rule: { freq: 'MONTHLY', byMonthDay: [start.getDate()] }
		},
		{
			id: 'yearly',
			label: `Annually on ${new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(start)}`,
			rule: { freq: 'YEARLY' }
		}
	);
	return presets;
}

/** Id of the preset equal to `rule`, or `'custom'`. */
export function matchRecurrencePreset(
	rule: RecurrenceRule | null | undefined,
	start: Date,
	locale?: string
): RecurrencePreset['id'] | 'custom' {
	const match = recurrencePresets(start, locale).find((p) => isSameRule(p.rule, rule ?? null));
	return match?.id ?? 'custom';
}

/**
 * Ends `rule` just before `occurrenceStart`, used to cut a series short.
 * Returns `null` when nothing of the series would remain.
 */
export function truncateRule(
	rule: RecurrenceRule,
	dtstart: Date,
	occurrenceStart: Date
): RecurrenceRule | null {
	if (occurrenceStart <= dtstart) return null;
	const next: RecurrenceRule = { ...rule, until: new Date(occurrenceStart.getTime() - 1000) };
	delete next.count;
	return next;
}
