import type { TimeInterval, WorkingHours } from '../types.js';
import { addDays, addMinutes, atMinutes, ceilToStep, maxDate, startOfDay } from './date.js';
import { createZonedClock, type ZonedClock } from './timezone.js';

export const DEFAULT_WORKING_HOURS: WorkingHours = {
	start: 9 * 60,
	end: 17 * 60,
	days: [1, 2, 3, 4, 5]
};

/** Sorts and merges overlapping or touching intervals. */
export function mergeIntervals(intervals: readonly TimeInterval[]): TimeInterval[] {
	const sorted = intervals
		.filter((i) => i.end > i.start)
		.map((i) => ({ start: new Date(i.start), end: new Date(i.end) }))
		.sort((a, b) => a.start.getTime() - b.start.getTime());
	const merged: TimeInterval[] = [];
	for (const interval of sorted) {
		const last = merged[merged.length - 1];
		if (last && interval.start <= last.end) {
			if (interval.end > last.end) last.end = interval.end;
		} else {
			merged.push(interval);
		}
	}
	return merged;
}

/** Whether `[start, end)` overlaps any of `busy`. */
export function isBusy(busy: readonly TimeInterval[], start: Date, end: Date): boolean {
	return busy.some((b) => b.start < end && start < b.end);
}

export interface FindSlotsOptions {
	/** Busy time of everyone involved, in any order. */
	busy: readonly TimeInterval[];
	/** Search window, as instants. */
	from: Date;
	until: Date;
	/** Meeting length in minutes. */
	duration: number;
	/** Candidate starts fall on multiples of this many minutes. @default 30 */
	step?: number;
	/** Only suggest times inside these hours, evaluated in the clock's zone. */
	workingHours?: WorkingHours | null;
	clock?: ZonedClock;
	/** Nothing earlier than this is suggested. @default now */
	now?: Date;
	/** @default 5 */
	limit?: number;
	/** Spread suggestions over several days. @default Infinity */
	maxPerDay?: number;
}

/** The earliest free slots where nobody is busy. */
export function findAvailableSlots(options: FindSlotsOptions): TimeInterval[] {
	const {
		duration,
		step = 30,
		workingHours = DEFAULT_WORKING_HOURS,
		clock = createZonedClock(),
		now = new Date(),
		limit = 5,
		maxPerDay = Number.POSITIVE_INFINITY
	} = options;
	const busy = mergeIntervals(options.busy);
	const slots: TimeInterval[] = [];
	if (duration <= 0 || options.until <= options.from) return slots;

	const wallFrom = clock.toWall(maxDate(options.from, now));
	const wallUntil = clock.toWall(options.until);

	for (
		let day = startOfDay(wallFrom);
		day < wallUntil && slots.length < limit;
		day = addDays(day, 1)
	) {
		if (workingHours && !workingHours.days.includes(day.getDay())) continue;
		const dayStart = workingHours ? atMinutes(day, workingHours.start) : day;
		const dayEnd = workingHours ? atMinutes(day, workingHours.end) : addDays(day, 1);
		let cursor = ceilToStep(maxDate(dayStart, wallFrom), step);
		let perDay = 0;

		while (addMinutes(cursor, duration) <= dayEnd && cursor < wallUntil && perDay < maxPerDay) {
			const start = clock.toInstant(cursor);
			const end = addMinutes(start, duration);
			if (end > options.until) break;
			const blocker = busy.find((b) => b.start < end && start < b.end);
			if (!blocker) {
				slots.push({ start, end });
				perDay++;
				if (slots.length >= limit) break;
				cursor = addMinutes(cursor, Math.max(step, duration));
			} else {
				// Jump past the blocking interval instead of probing every step inside it.
				cursor = ceilToStep(maxDate(addMinutes(cursor, step), clock.toWall(blocker.end)), step);
			}
		}
	}
	return slots;
}

/** Emails whose busy time overlaps `[start, end)`. */
export function findConflicts(
	busyByEmail: Readonly<Record<string, readonly TimeInterval[]>>,
	start: Date,
	end: Date
): string[] {
	return Object.entries(busyByEmail)
		.filter(([, busy]) => isBusy(busy, start, end))
		.map(([email]) => email);
}
