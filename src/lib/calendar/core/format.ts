/**
 * Cached `Intl` formatters. Creating a `DateTimeFormat` is expensive and views
 * format hundreds of labels per render, so every (locale, options) pair is
 * built once. All inputs are wall-clock dates (see `timezone.ts`), which is
 * why no `timeZone` option is ever passed.
 */
import { addDays, addMinutes, isSameDay, minutesOfDay } from './date.js';

const cache = new Map<string, Intl.DateTimeFormat>();

export function dateFormatter(
	locale: string,
	options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
	const key = `${locale}|${JSON.stringify(options)}`;
	let fmt = cache.get(key);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat(locale, options);
		cache.set(key, fmt);
	}
	return fmt;
}

/** Whether `locale` uses a 12-hour clock by default. */
export function localeUses12Hour(locale: string): boolean {
	try {
		const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
		const cycle = fmt.resolvedOptions().hourCycle;
		if (cycle) return cycle === 'h11' || cycle === 'h12';
		return fmt.formatToParts(new Date(2024, 0, 1, 13)).some((p) => p.type === 'dayPeriod');
	} catch {
		return false;
	}
}

/** First day of the week for `locale`, `0` = Sunday. Falls back to Sunday. */
export function localeWeekStart(locale: string): number {
	try {
		const loc = new Intl.Locale(locale) as Intl.Locale & {
			getWeekInfo?: () => { firstDay: number };
			weekInfo?: { firstDay: number };
		};
		const info = loc.getWeekInfo?.() ?? loc.weekInfo;
		if (info?.firstDay) return info.firstDay % 7;
	} catch {
		// fall through
	}
	return 0;
}

export interface CalendarFormatters {
	/** `9:30 AM` / `09:30`. Drops `:00` in 12-hour mode when `compact`. */
	time(date: Date, compact?: boolean): string;
	/** `9:30 – 10:15 AM` */
	timeRange(start: Date, end: Date): string;
	/** Hour gutter label, e.g. `9 AM` / `09:00`. */
	hour(date: Date): string;
	/** `Sat 26` style column header parts. */
	weekdayShort(date: Date): string;
	weekdayNarrow(date: Date): string;
	weekdayLong(date: Date): string;
	dayOfMonth(date: Date): string;
	/** `September 2026` */
	monthYear(date: Date): string;
	/** `Sep` */
	monthShort(date: Date): string;
	/** `Saturday, September 26, 2026` */
	fullDate(date: Date): string;
	/** `Sat, Sep 26` */
	mediumDate(date: Date): string;
	/** `Sep 26, 2026` */
	shortDate(date: Date): string;
	/** Full sentence for screen readers, e.g. `Saturday, September 26, 9:30 – 10:00 AM`. */
	occurrenceLabel(start: Date, end: Date, allDay: boolean): string;
	/** `45 min`, `1 hr 30 min`, `2 days` */
	duration(minutes: number): string;
	/** `in 5 min`, `2 hr ago` */
	relative(date: Date, now: Date): string;
}

export function createFormatters(locale: string, hour12: boolean): CalendarFormatters {
	const timeFull = dateFormatter(locale, { hour: 'numeric', minute: '2-digit', hour12 });
	const timeHourOnly = dateFormatter(locale, { hour: 'numeric', hour12 });
	const hourLabel = hour12
		? timeHourOnly
		: dateFormatter(locale, { hour: '2-digit', minute: '2-digit', hour12 });
	const weekdayShort = dateFormatter(locale, { weekday: 'short' });
	const weekdayNarrow = dateFormatter(locale, { weekday: 'narrow' });
	const weekdayLong = dateFormatter(locale, { weekday: 'long' });
	const dayOfMonth = dateFormatter(locale, { day: 'numeric' });
	const monthYear = dateFormatter(locale, { month: 'long', year: 'numeric' });
	const monthShort = dateFormatter(locale, { month: 'short' });
	const fullDate = dateFormatter(locale, { dateStyle: 'full' });
	const mediumDate = dateFormatter(locale, { weekday: 'short', month: 'short', day: 'numeric' });
	const shortDate = dateFormatter(locale, { dateStyle: 'medium' });
	const longDateNoYear = dateFormatter(locale, { weekday: 'long', month: 'long', day: 'numeric' });
	const rtf = (() => {
		try {
			return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
		} catch {
			return null;
		}
	})();

	const time = (date: Date, compact = false) =>
		compact && hour12 && date.getMinutes() === 0
			? timeHourOnly.format(date)
			: timeFull.format(date);

	const timeRange = (start: Date, end: Date) => {
		try {
			return timeFull.formatRange(start, end);
		} catch {
			return `${timeFull.format(start)} – ${timeFull.format(end)}`;
		}
	};

	const duration = (minutes: number) => {
		const m = Math.round(minutes);
		if (m >= 24 * 60 && m % (24 * 60) === 0) {
			const days = m / (24 * 60);
			return `${days} ${days === 1 ? 'day' : 'days'}`;
		}
		const h = Math.floor(m / 60);
		const rest = m % 60;
		if (!h) return `${rest} min`;
		return rest ? `${h} hr ${rest} min` : `${h} hr`;
	};

	return {
		time,
		timeRange,
		hour: (date) => hourLabel.format(date),
		weekdayShort: (date) => weekdayShort.format(date),
		weekdayNarrow: (date) => weekdayNarrow.format(date),
		weekdayLong: (date) => weekdayLong.format(date),
		dayOfMonth: (date) => dayOfMonth.format(date),
		monthYear: (date) => monthYear.format(date),
		monthShort: (date) => monthShort.format(date),
		fullDate: (date) => fullDate.format(date),
		mediumDate: (date) => mediumDate.format(date),
		shortDate: (date) => shortDate.format(date),
		occurrenceLabel(start, end, allDay) {
			if (allDay) {
				const last = addDays(end, -1);
				return isSameDay(start, last) || last < start
					? `${longDateNoYear.format(start)}, all day`
					: `${longDateNoYear.format(start)} to ${longDateNoYear.format(last)}, all day`;
			}
			if (
				isSameDay(start, end) ||
				(minutesOfDay(end) === 0 && isSameDay(start, addMinutes(end, -1)))
			) {
				return `${longDateNoYear.format(start)}, ${timeRange(start, end)}`;
			}
			return `${longDateNoYear.format(start)} ${time(start)} to ${longDateNoYear.format(end)} ${time(end)}`;
		},
		duration,
		relative(date, now) {
			const diffMin = Math.round((date.getTime() - now.getTime()) / 60_000);
			if (!rtf) return duration(Math.abs(diffMin));
			if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
			const diffHr = Math.round(diffMin / 60);
			if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
			return rtf.format(Math.round(diffHr / 24), 'day');
		}
	};
}

/** Formats a range title like `Sep 21 – 27, 2026`, collapsing shared parts. */
export function formatDateRange(locale: string, start: Date, endInclusive: Date): string {
	const sameYear = start.getFullYear() === endInclusive.getFullYear();
	const fmt = dateFormatter(locale, { month: 'short', day: 'numeric', year: 'numeric' });
	try {
		return fmt.formatRange(start, endInclusive);
	} catch {
		const left = dateFormatter(
			locale,
			sameYear ? { month: 'short', day: 'numeric' } : { dateStyle: 'medium' }
		);
		return `${left.format(start)} – ${fmt.format(endInclusive)}`;
	}
}
