import { describe, expect, it } from 'vitest';
import {
	describeRecurrence,
	expandRecurrence,
	formatRRule,
	matchRecurrencePreset,
	parseRRule,
	recurrencePresets,
	truncateRule,
	type RecurrenceRule
} from './recurrence.js';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const keys = (dates: Date[]) =>
	dates.map(
		(x) =>
			`${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()} ${x.getHours()}:${String(x.getMinutes()).padStart(2, '0')}`
	);

function expand(
	rule: string | RecurrenceRule,
	start: Date,
	rangeStart: Date,
	rangeEnd: Date,
	extra = {}
) {
	const parsed = typeof rule === 'string' ? parseRRule(rule)! : rule;
	return keys(expandRecurrence(start, parsed, { rangeStart, rangeEnd, ...extra }));
}

describe('parseRRule / formatRRule', () => {
	it('parses every supported part and round-trips', () => {
		const rule = parseRRule(
			'RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=2TU,-1FR;BYMONTH=1,6;COUNT=10;WKST=SU'
		)!;
		expect(rule).toEqual({
			freq: 'MONTHLY',
			interval: 2,
			byDay: [
				{ day: 'TU', nth: 2 },
				{ day: 'FR', nth: -1 }
			],
			byMonth: [1, 6],
			count: 10,
			weekStart: 'SU'
		});
		expect(formatRRule(rule)).toBe(
			'FREQ=MONTHLY;INTERVAL=2;BYDAY=2TU,-1FR;BYMONTH=1,6;WKST=SU;COUNT=10'
		);
	});

	it('reads a date-only UNTIL as the end of that local day', () => {
		const rule = parseRRule('FREQ=DAILY;UNTIL=20261001')!;
		expect(rule.until).toEqual(new Date(2026, 9, 1, 23, 59, 59, 999));
	});

	it('reads a UTC UNTIL as an instant', () => {
		expect(parseRRule('FREQ=DAILY;UNTIL=20261001T120000Z')!.until).toEqual(
			new Date(Date.UTC(2026, 9, 1, 12))
		);
	});

	it('returns null without a valid FREQ and ignores junk parts', () => {
		expect(parseRRule('INTERVAL=2')).toBeNull();
		expect(parseRRule('FREQ=HOURLY')).toBeNull();
		expect(parseRRule('FREQ=WEEKLY;BYDAY=XX,MO;FOO=BAR')).toEqual({
			freq: 'WEEKLY',
			byDay: [{ day: 'MO' }]
		});
	});
});

describe('expandRecurrence', () => {
	it('expands a daily series, keeping the wall-clock time', () => {
		expect(expand('FREQ=DAILY', d(2026, 9, 1, 9, 30), d(2026, 9, 3), d(2026, 9, 6))).toEqual([
			'2026-9-3 9:30',
			'2026-9-4 9:30',
			'2026-9-5 9:30'
		]);
	});

	it('honours INTERVAL when jumping far into the future', () => {
		const out = expand('FREQ=DAILY;INTERVAL=3', d(2026, 1, 1, 8), d(2026, 12, 1), d(2026, 12, 8));
		// 2026-01-01 + 3n days: Dec 1 is day 334 → 334 % 3 = 1, so Dec 3 and Dec 6.
		expect(out).toEqual(['2026-12-3 8:00', '2026-12-6 8:00']);
	});

	it('expands weekly on several weekdays', () => {
		expect(
			expand('FREQ=WEEKLY;BYDAY=MO,WE,FR', d(2026, 9, 21, 10), d(2026, 9, 21), d(2026, 9, 28))
		).toEqual(['2026-9-21 10:00', '2026-9-23 10:00', '2026-9-25 10:00']);
	});

	it('expands bi-weekly relative to the week of the series start', () => {
		const out = expand(
			'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU',
			d(2026, 9, 1, 9),
			d(2026, 9, 1),
			d(2026, 10, 1)
		);
		expect(out).toEqual(['2026-9-1 9:00', '2026-9-15 9:00', '2026-9-29 9:00']);
	});

	it('supports ordinal weekdays in a month, including the last one', () => {
		expect(
			expand('FREQ=MONTHLY;BYDAY=2TU', d(2026, 1, 13, 9), d(2026, 1, 1), d(2026, 4, 1))
		).toEqual(['2026-1-13 9:00', '2026-2-10 9:00', '2026-3-10 9:00']);
		expect(
			expand('FREQ=MONTHLY;BYDAY=-1FR', d(2026, 1, 30, 16), d(2026, 1, 1), d(2026, 4, 1))
		).toEqual(['2026-1-30 16:00', '2026-2-27 16:00', '2026-3-27 16:00']);
	});

	it('skips months that lack the day instead of clamping (RFC 5545)', () => {
		expect(expand('FREQ=MONTHLY', d(2026, 1, 31, 9), d(2026, 1, 1), d(2026, 6, 1))).toEqual([
			'2026-1-31 9:00',
			'2026-3-31 9:00',
			'2026-5-31 9:00'
		]);
	});

	it('supports negative BYMONTHDAY', () => {
		expect(
			expand('FREQ=MONTHLY;BYMONTHDAY=-1', d(2026, 1, 31), d(2026, 1, 1), d(2026, 4, 1))
		).toEqual(['2026-1-31 0:00', '2026-2-28 0:00', '2026-3-31 0:00']);
	});

	it('handles BYSETPOS (last weekday of the month)', () => {
		const rule = 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1';
		expect(expand(rule, d(2026, 1, 30, 17), d(2026, 1, 1), d(2026, 4, 1))).toEqual([
			'2026-1-30 17:00',
			'2026-2-27 17:00',
			'2026-3-31 17:00'
		]);
	});

	it('expands yearly series, skipping Feb 29 in common years', () => {
		expect(expand('FREQ=YEARLY', d(2024, 2, 29), d(2024, 1, 1), d(2029, 1, 1))).toEqual([
			'2024-2-29 0:00',
			'2028-2-29 0:00'
		]);
		expect(
			expand('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH', d(2026, 11, 26), d(2026, 1, 1), d(2028, 1, 1))
		).toEqual(['2026-11-26 0:00', '2027-11-25 0:00']);
	});

	it('stops at COUNT, counted from the series start even for later ranges', () => {
		expect(expand('FREQ=DAILY;COUNT=5', d(2026, 9, 1, 9), d(2026, 9, 4), d(2026, 9, 30))).toEqual([
			'2026-9-4 9:00',
			'2026-9-5 9:00'
		]);
	});

	it('counts excluded dates toward COUNT', () => {
		expect(
			expand('FREQ=DAILY;COUNT=3', d(2026, 9, 1, 9), d(2026, 9, 1), d(2026, 9, 30), {
				exdates: [d(2026, 9, 2, 9)]
			})
		).toEqual(['2026-9-1 9:00', '2026-9-3 9:00']);
	});

	it('stops at UNTIL inclusively', () => {
		const rule: RecurrenceRule = { freq: 'DAILY', until: d(2026, 9, 3, 9) };
		expect(expand(rule, d(2026, 9, 1, 9), d(2026, 9, 1), d(2026, 9, 30))).toEqual([
			'2026-9-1 9:00',
			'2026-9-2 9:00',
			'2026-9-3 9:00'
		]);
	});

	it('includes an occurrence that started before the range but overlaps it', () => {
		const out = expand('FREQ=DAILY', d(2026, 9, 1, 23), d(2026, 9, 3), d(2026, 9, 4), {
			duration: 2 * 3_600_000
		});
		expect(out).toEqual(['2026-9-2 23:00', '2026-9-3 23:00']);
	});

	it('never returns occurrences before the series start', () => {
		expect(
			expand('FREQ=WEEKLY;BYDAY=MO,FR', d(2026, 9, 23, 9), d(2026, 9, 21), d(2026, 9, 28))
		).toEqual(['2026-9-25 9:00']);
	});

	it('respects the limit', () => {
		expect(
			expand('FREQ=DAILY', d(2026, 1, 1), d(2026, 1, 1), d(2027, 1, 1), { limit: 3 })
		).toHaveLength(3);
	});
});

describe('describeRecurrence', () => {
	it('describes common rules in plain English', () => {
		expect(describeRecurrence({ freq: 'DAILY' })).toBe('Daily');
		expect(
			describeRecurrence({ freq: 'WEEKLY', interval: 2, byDay: [{ day: 'MO' }, { day: 'WE' }] })
		).toBe('Every 2 weeks on Monday and Wednesday');
		expect(describeRecurrence(parseRRule('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')!)).toBe(
			'Every weekday (Monday to Friday)'
		);
		expect(describeRecurrence(parseRRule('FREQ=MONTHLY;BYDAY=-1FR;COUNT=6')!)).toBe(
			'Monthly on the last Friday, 6 times'
		);
		expect(describeRecurrence({ freq: 'YEARLY' }, { start: d(2026, 9, 26) })).toBe(
			'Annually on September 26'
		);
	});
});

describe('presets', () => {
	it('builds presets from the start date and matches rules back to them', () => {
		const start = d(2026, 9, 26); // 4th and last Saturday of Sep 2026
		const ids = recurrencePresets(start).map((p) => p.id);
		expect(ids).toEqual([
			'none',
			'daily',
			'weekly',
			'weekdays',
			'monthly-nth',
			'monthly-last',
			'monthly-day',
			'yearly'
		]);
		expect(matchRecurrencePreset(null, start)).toBe('none');
		expect(matchRecurrencePreset(parseRRule('FREQ=WEEKLY;BYDAY=SA'), start)).toBe('weekly');
		expect(matchRecurrencePreset(parseRRule('FREQ=WEEKLY;INTERVAL=3'), start)).toBe('custom');
	});
});

describe('truncateRule', () => {
	it('ends a series just before a given occurrence, dropping COUNT', () => {
		const rule = truncateRule({ freq: 'DAILY', count: 10 }, d(2026, 9, 1, 9), d(2026, 9, 5, 9))!;
		expect(rule.count).toBeUndefined();
		expect(rule.until).toEqual(new Date(d(2026, 9, 5, 9).getTime() - 1000));
		expect(truncateRule({ freq: 'DAILY' }, d(2026, 9, 1), d(2026, 9, 1))).toBeNull();
	});
});
