/**
 * Date arithmetic on local wall-clock `Date`s. Every function returns a new
 * `Date` and works through the local calendar fields (`setDate`, `setHours`),
 * so adding a day across a DST change keeps the time of day intact.
 */

export const MINUTES_PER_DAY = 24 * 60;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

/** `0` = Sunday … `6` = Saturday, matching `Date#getDay`. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export function addWeeks(date: Date, weeks: number): Date {
	return addDays(date, weeks * 7);
}

/** Adds months, clamping the day so 31 Jan + 1 month is 28/29 Feb, not 3 Mar. */
export function addMonths(date: Date, months: number): Date {
	const d = new Date(date);
	const day = d.getDate();
	d.setDate(1);
	d.setMonth(d.getMonth() + months);
	d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
	return d;
}

export function addYears(date: Date, years: number): Date {
	return addMonths(date, years * 12);
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function startOfWeek(date: Date, weekStartsOn: number = 0): Date {
	const d = startOfDay(date);
	const diff = (d.getDay() - weekStartsOn + 7) % 7;
	return addDays(d, -diff);
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonthExclusive(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Whole calendar days from `a` to `b`, immune to DST (a 23h day still counts as 1). */
export function differenceInCalendarDays(b: Date, a: Date): number {
	const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
	const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	return Math.round((utcB - utcA) / MS_PER_DAY);
}

export function differenceInMinutes(b: Date, a: Date): number {
	return Math.round((b.getTime() - a.getTime()) / MS_PER_MINUTE);
}

/** Minutes elapsed since local midnight. */
export function minutesOfDay(date: Date): number {
	return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/** The given day at `minutes` past midnight. `24 * 60` yields the next midnight. */
export function atMinutes(day: Date, minutes: number): Date {
	const d = startOfDay(day);
	d.setHours(0, Math.round(minutes), 0, 0);
	return d;
}

/** Each day from `start` up to, but excluding, `end`. */
export function eachDay(start: Date, end: Date): Date[] {
	const days: Date[] = [];
	for (let d = startOfDay(start); d < end; d = addDays(d, 1)) days.push(d);
	return days;
}

/** Half-open interval overlap: touching intervals do not overlap. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
	return aStart < bEnd && bStart < aEnd;
}

export function clampDate(date: Date, min: Date, max: Date): Date {
	if (date < min) return new Date(min);
	if (date > max) return new Date(max);
	return date;
}

export function minDate(a: Date, b: Date): Date {
	return a < b ? a : b;
}

export function maxDate(a: Date, b: Date): Date {
	return a > b ? a : b;
}

/** Rounds to the nearest multiple of `step` minutes. */
export function snapMinutes(
	minutes: number,
	step: number,
	mode: 'round' | 'floor' | 'ceil' = 'round'
) {
	const fn = mode === 'floor' ? Math.floor : mode === 'ceil' ? Math.ceil : Math.round;
	return fn(minutes / step) * step;
}

/** The next wall-clock time at or after `date` that falls on a `step`-minute boundary. */
export function ceilToStep(date: Date, step: number): Date {
	const minutes = snapMinutes(minutesOfDay(date), step, 'ceil');
	return atMinutes(date, minutes);
}

/** `YYYY-MM-DD` from the local calendar fields. */
export function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Parses `YYYY-MM-DD` (or the date part of an ISO string) as a local midnight. */
export function fromDateKey(key: string): Date {
	const [y, m, d] = key.slice(0, 10).split('-').map(Number);
	return new Date(y, m - 1, d);
}

/** `HH:mm` from minutes past midnight, e.g. `570` → `09:30`. */
export function minutesToTimeKey(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = Math.round(minutes % 60);
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Minutes past midnight from `HH:mm`. Returns `NaN` for malformed input. */
export function timeKeyToMinutes(key: string): number {
	const match = /^(\d{1,2}):(\d{2})$/.exec(key.trim());
	if (!match) return Number.NaN;
	return Number(match[1]) * 60 + Number(match[2]);
}

/** ISO-8601 week number (weeks start Monday, week 1 contains 4 Jan). */
export function isoWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const day = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
}

/** Every visible weekday in week order, e.g. `[1,2,3,4,5,6,0]` for Monday starts. */
export function weekdayOrder(weekStartsOn: number, hiddenDays: readonly number[] = []): number[] {
	const order: number[] = [];
	for (let i = 0; i < 7; i++) {
		const day = (weekStartsOn + i) % 7;
		if (!hiddenDays.includes(day)) order.push(day);
	}
	return order;
}

export function isValidDate(value: unknown): value is Date {
	return value instanceof Date && !Number.isNaN(value.getTime());
}
