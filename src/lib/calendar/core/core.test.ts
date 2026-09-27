import { describe, expect, it } from 'vitest';
import {
	addDays,
	addMonths,
	ceilToStep,
	differenceInCalendarDays,
	eachDay,
	fromDateKey,
	isoWeekNumber,
	snapMinutes,
	startOfWeek,
	timeKeyToMinutes,
	toDateKey,
	weekdayOrder
} from './date.js';
import { countHiddenPerDay, layoutDaySpans, layoutTimeGrid } from './layout.js';
import { findAvailableSlots, findConflicts, mergeIntervals } from './availability.js';
import { createZonedClock, getTimeZoneOffset, zonedPartsToInstant } from './timezone.js';
import { createFormatters, formatDateRange, localeUses12Hour, localeWeekStart } from './format.js';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

describe('date helpers', () => {
	it('adds months with day clamping', () => {
		expect(toDateKey(addMonths(d(2026, 1, 31), 1))).toBe('2026-02-28');
		expect(toDateKey(addMonths(d(2024, 1, 31), 1))).toBe('2024-02-29');
		expect(toDateKey(addMonths(d(2026, 3, 31), -1))).toBe('2026-02-28');
	});

	it('finds week starts for any first weekday', () => {
		expect(toDateKey(startOfWeek(d(2026, 9, 26), 0))).toBe('2026-09-20');
		expect(toDateKey(startOfWeek(d(2026, 9, 26), 1))).toBe('2026-09-21');
		expect(toDateKey(startOfWeek(d(2026, 9, 20), 1))).toBe('2026-09-14');
	});

	it('counts calendar days regardless of time of day', () => {
		expect(differenceInCalendarDays(d(2026, 9, 27, 0, 30), d(2026, 9, 26, 23, 30))).toBe(1);
		expect(differenceInCalendarDays(d(2026, 12, 31), d(2026, 1, 1))).toBe(364);
	});

	it('enumerates days half-open', () => {
		expect(eachDay(d(2026, 9, 26, 15), d(2026, 9, 29)).map(toDateKey)).toEqual([
			'2026-09-26',
			'2026-09-27',
			'2026-09-28'
		]);
	});

	it('snaps and ceils to steps', () => {
		expect(snapMinutes(37, 15)).toBe(30);
		expect(snapMinutes(38, 15)).toBe(45);
		expect(snapMinutes(31, 15, 'floor')).toBe(30);
		expect(ceilToStep(d(2026, 9, 26, 9, 1), 30)).toEqual(d(2026, 9, 26, 9, 30));
		expect(ceilToStep(d(2026, 9, 26, 9, 30), 30)).toEqual(d(2026, 9, 26, 9, 30));
	});

	it('round-trips date keys and parses time keys', () => {
		expect(fromDateKey('2026-09-26')).toEqual(d(2026, 9, 26));
		expect(timeKeyToMinutes('09:45')).toBe(585);
		expect(timeKeyToMinutes('nope')).toBeNaN();
	});

	it('computes ISO week numbers and visible weekday order', () => {
		expect(isoWeekNumber(d(2026, 1, 1))).toBe(1);
		expect(isoWeekNumber(d(2026, 9, 26))).toBe(39);
		expect(weekdayOrder(1, [0, 6])).toEqual([1, 2, 3, 4, 5]);
		expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});
});

describe('layoutTimeGrid', () => {
	const range = (item: { s: number; e: number }) => ({ start: item.s, end: item.e });

	it('gives non-overlapping items the full width', () => {
		const out = layoutTimeGrid(
			[
				{ s: 0, e: 60 },
				{ s: 60, e: 120 }
			],
			range
		);
		expect(out.map((p) => [p.left, p.width])).toEqual([
			[0, 1],
			[0, 1]
		]);
	});

	it('splits overlapping items into columns', () => {
		const out = layoutTimeGrid(
			[
				{ s: 0, e: 120 },
				{ s: 30, e: 90 },
				{ s: 60, e: 150 }
			],
			range
		);
		expect(out.map((p) => p.columns)).toEqual([3, 3, 3]);
		expect(out.map((p) => p.column)).toEqual([0, 1, 2]);
	});

	it('reuses freed columns and expands items into empty columns', () => {
		const items = [
			{ s: 0, e: 60 },
			{ s: 0, e: 180 },
			{ s: 90, e: 120 }
		];
		const out = layoutTimeGrid(items, range);
		const byStart = (s: number, e: number) => out.find((p) => p.item.s === s && p.item.e === e)!;
		expect(byStart(0, 180).column).toBe(0);
		expect(byStart(0, 60).column).toBe(1);
		// Column 1 is free again at 90, so the late item takes it.
		expect(byStart(90, 120).column).toBe(1);
	});

	it('expands an item right when the neighbouring column is free for its duration', () => {
		const items = [
			{ s: 0, e: 60 },
			{ s: 0, e: 60 },
			{ s: 0, e: 60 },
			{ s: 60, e: 120 },
			{ s: 30, e: 120 }
		];
		const out = layoutTimeGrid(items, range);
		// Four columns are needed at 30-60; the late item reuses column 0 and
		// widens across the two columns that are free after 60, up to the 30-120 one.
		const late = out.find((p) => p.item.s === 60)!;
		expect(late.columns).toBe(4);
		expect(late.column).toBe(0);
		expect(late.width).toBe(3 / 4);
	});

	it('applies a minimum visual duration', () => {
		const out = layoutTimeGrid(
			[
				{ s: 0, e: 5 },
				{ s: 10, e: 20 }
			],
			range,
			{ minDuration: 30 }
		);
		expect(out[0].height).toBe(30);
		expect(out[0].columns).toBe(2);
	});
});

describe('layoutDaySpans', () => {
	const days = eachDay(d(2026, 9, 20), d(2026, 9, 27));
	const range = (i: { start: Date; end: Date }) => i;

	it('stacks overlapping multi-day items into lanes', () => {
		const items = [
			{ start: d(2026, 9, 21), end: d(2026, 9, 24) },
			{ start: d(2026, 9, 22), end: d(2026, 9, 23) },
			{ start: d(2026, 9, 24), end: d(2026, 9, 25) }
		];
		const { spans, laneCount } = layoutDaySpans(items, days, range);
		expect(laneCount).toBe(2);
		expect(spans.map((s) => [s.startIndex, s.endIndex, s.lane])).toEqual([
			[1, 3, 0],
			[2, 2, 1],
			[4, 4, 0]
		]);
	});

	it('flags items continuing outside the row and clips them', () => {
		const { spans } = layoutDaySpans([{ start: d(2026, 9, 18), end: d(2026, 9, 30) }], days, range);
		expect(spans[0]).toMatchObject({
			startIndex: 0,
			endIndex: 6,
			continuesBefore: true,
			continuesAfter: true
		});
	});

	it('handles rows with hidden days', () => {
		const weekdays = days.filter((x) => x.getDay() !== 0 && x.getDay() !== 6);
		const { spans } = layoutDaySpans(
			[{ start: d(2026, 9, 25, 9), end: d(2026, 9, 25, 10) }],
			weekdays,
			range
		);
		expect(spans[0]).toMatchObject({ startIndex: 4, endIndex: 4 });
	});

	it('counts hidden items per day', () => {
		const items = Array.from({ length: 4 }, () => ({ start: d(2026, 9, 22), end: d(2026, 9, 23) }));
		const { spans } = layoutDaySpans(items, days, range);
		expect(countHiddenPerDay(spans, 7, 2)).toEqual([0, 0, 2, 0, 0, 0, 0]);
	});
});

describe('availability', () => {
	it('merges overlapping and touching intervals', () => {
		const merged = mergeIntervals([
			{ start: d(2026, 9, 28, 10), end: d(2026, 9, 28, 11) },
			{ start: d(2026, 9, 28, 9), end: d(2026, 9, 28, 10) },
			{ start: d(2026, 9, 28, 13), end: d(2026, 9, 28, 14) }
		]);
		expect(merged.map((i) => [i.start.getHours(), i.end.getHours()])).toEqual([
			[9, 11],
			[13, 14]
		]);
	});

	it('suggests the earliest free working-hour slots', () => {
		const slots = findAvailableSlots({
			busy: [
				{ start: d(2026, 9, 28, 9), end: d(2026, 9, 28, 10, 30) },
				{ start: d(2026, 9, 28, 11), end: d(2026, 9, 28, 12) }
			],
			from: d(2026, 9, 28),
			until: d(2026, 9, 30),
			duration: 30,
			now: d(2026, 9, 1),
			limit: 3
		});
		expect(slots.map((s) => `${s.start.getHours()}:${s.start.getMinutes()}`)).toEqual([
			'10:30',
			'12:0',
			'12:30'
		]);
	});

	it('skips non-working days and respects maxPerDay', () => {
		const slots = findAvailableSlots({
			busy: [],
			from: d(2026, 9, 26), // Saturday
			until: d(2026, 10, 3),
			duration: 60,
			now: d(2026, 9, 1),
			maxPerDay: 1,
			limit: 2
		});
		expect(slots.map((s) => toDateKey(s.start))).toEqual(['2026-09-28', '2026-09-29']);
		expect(slots[0].start.getHours()).toBe(9);
	});

	it('never suggests slots in the past', () => {
		const slots = findAvailableSlots({
			busy: [],
			from: d(2026, 9, 28),
			until: d(2026, 9, 29),
			duration: 30,
			now: d(2026, 9, 28, 14, 10),
			limit: 1
		});
		expect(slots[0].start).toEqual(d(2026, 9, 28, 14, 30));
	});

	it('reports conflicting attendees', () => {
		const busy = { a: [{ start: d(2026, 9, 28, 9), end: d(2026, 9, 28, 10) }], b: [] };
		expect(findConflicts(busy, d(2026, 9, 28, 9, 30), d(2026, 9, 28, 10, 30))).toEqual(['a']);
	});
});

describe('timezone', () => {
	it('computes offsets across DST', () => {
		expect(getTimeZoneOffset(new Date(Date.UTC(2026, 0, 15, 12)), 'America/New_York')).toBe(-300);
		expect(getTimeZoneOffset(new Date(Date.UTC(2026, 6, 15, 12)), 'America/New_York')).toBe(-240);
		expect(getTimeZoneOffset(new Date(Date.UTC(2026, 6, 15, 12)), 'Asia/Kolkata')).toBe(330);
	});

	it('converts wall-clock parts in a zone to instants', () => {
		const instant = zonedPartsToInstant(
			{ year: 2026, month: 9, day: 26, hour: 9, minute: 0, second: 0 },
			'Asia/Tokyo'
		);
		expect(instant.toISOString()).toBe('2026-09-26T00:00:00.000Z');
		// 02:30 doesn't exist on 8 Mar 2026 in New York; it resolves forward.
		const gap = zonedPartsToInstant(
			{ year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0 },
			'America/New_York'
		);
		expect(gap.toISOString()).toBe('2026-03-08T07:30:00.000Z');
		// 01:30 happens twice on 1 Nov 2026 in New York; the first (EDT) wins.
		const repeat = zonedPartsToInstant(
			{ year: 2026, month: 11, day: 1, hour: 1, minute: 30, second: 0 },
			'America/New_York'
		);
		expect(repeat.toISOString()).toBe('2026-11-01T05:30:00.000Z');
	});

	it('round-trips through a zoned clock', () => {
		const clock = createZonedClock('Asia/Kolkata');
		const instant = new Date(Date.UTC(2026, 8, 26, 3, 30));
		const wall = clock.toWall(instant);
		expect([wall.getHours(), wall.getMinutes()]).toEqual([9, 0]);
		expect(clock.toInstant(wall).getTime()).toBe(instant.getTime());
	});

	it('is the identity without a zone', () => {
		const clock = createZonedClock();
		const now = new Date();
		expect(clock.isSystem).toBe(true);
		expect(clock.toWall(now).getTime()).toBe(now.getTime());
	});
});

describe('format', () => {
	it('detects locale conventions', () => {
		expect(localeUses12Hour('en-US')).toBe(true);
		expect(localeUses12Hour('en-GB')).toBe(false);
		expect(localeWeekStart('en-GB')).toBe(1);
	});

	it('formats times, durations and ranges', () => {
		const f = createFormatters('en-US', true);
		expect(f.time(d(2026, 9, 26, 9), true)).toBe('9 AM');
		expect(f.time(d(2026, 9, 26, 9, 30))).toBe('9:30 AM');
		expect(f.duration(90)).toBe('1 hr 30 min');
		expect(f.duration(2 * 1440)).toBe('2 days');
		expect(f.occurrenceLabel(d(2026, 9, 26), d(2026, 9, 27), true)).toBe(
			'Saturday, September 26, all day'
		);
		expect(formatDateRange('en-US', d(2026, 9, 21), d(2026, 9, 27))).toMatch(
			/Sep 21\s*–\s*27, 2026/
		);
		const g = createFormatters('en-GB', false);
		expect(g.time(d(2026, 9, 26, 14, 5))).toBe('14:05');
		expect(g.hour(d(2026, 9, 26, 9))).toBe('09:00');
		expect(addDays(d(2026, 9, 26), 1).getDate()).toBe(27);
	});
});
