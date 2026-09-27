/**
 * Pure layout algorithms shared by the views. They know nothing about the DOM:
 * time grids get fractional column positions, day rows get lane indices.
 */

export interface TimeRange {
	/** Minutes from the top of the column. */
	start: number;
	end: number;
}

export interface PositionedItem<T> {
	item: T;
	/** Minutes from the top of the column. */
	top: number;
	/** Minutes tall (at least `minDuration`). */
	height: number;
	/** Fraction of the column width, 0-1. */
	left: number;
	width: number;
	column: number;
	columns: number;
}

interface Entry<T> {
	item: T;
	start: number;
	end: number;
	column: number;
}

/**
 * Lays out overlapping timed items side by side. Items that overlap
 * transitively form a cluster that shares the column count; each item then
 * widens into any free columns to its right, so a short meeting next to a
 * long one doesn't stay needlessly narrow.
 *
 * `minDuration` is the shortest visual height: a 5-minute event still occupies
 * `minDuration` minutes of space, and is laid out as if it did.
 */
export function layoutTimeGrid<T>(
	items: readonly T[],
	getRange: (item: T) => TimeRange,
	options: { minDuration?: number } = {}
): PositionedItem<T>[] {
	const minDuration = options.minDuration ?? 20;
	const entries: Entry<T>[] = items
		.map((item) => {
			const { start, end } = getRange(item);
			return { item, start, end: Math.max(end, start + minDuration), column: 0 };
		})
		.sort((a, b) => a.start - b.start || b.end - a.end);

	const result: PositionedItem<T>[] = [];
	let cluster: Entry<T>[] = [];
	let columnEnds: number[] = [];
	let clusterEnd = -Infinity;

	const flush = () => {
		const columns = columnEnds.length;
		for (const entry of cluster) {
			let span = 1;
			for (let c = entry.column + 1; c < columns; c++) {
				const blocked = cluster.some(
					(other) => other.column === c && other.start < entry.end && entry.start < other.end
				);
				if (blocked) break;
				span++;
			}
			result.push({
				item: entry.item,
				top: entry.start,
				height: entry.end - entry.start,
				left: entry.column / columns,
				width: span / columns,
				column: entry.column,
				columns
			});
		}
		cluster = [];
		columnEnds = [];
		clusterEnd = -Infinity;
	};

	for (const entry of entries) {
		if (entry.start >= clusterEnd && cluster.length) flush();
		let column = columnEnds.findIndex((end) => end <= entry.start);
		if (column === -1) {
			column = columnEnds.length;
			columnEnds.push(entry.end);
		} else {
			columnEnds[column] = entry.end;
		}
		entry.column = column;
		cluster.push(entry);
		clusterEnd = Math.max(clusterEnd, entry.end);
	}
	if (cluster.length) flush();
	return result;
}

export interface SpanItem<T> {
	item: T;
	/** Index of the first visible day the item covers. */
	startIndex: number;
	/** Index of the last visible day the item covers (inclusive). */
	endIndex: number;
	lane: number;
	/** The item started before the first visible day. */
	continuesBefore: boolean;
	/** The item ends after the last visible day. */
	continuesAfter: boolean;
}

export interface SpanLayout<T> {
	spans: SpanItem<T>[];
	laneCount: number;
}

/**
 * Stacks multi-day items into lanes across a row of days (a month-view week
 * or a time grid's all-day strip). `days` are local midnights and need not be
 * contiguous — hidden weekends are simply absent. Each day covers
 * `[day, next midnight)`.
 */
export function layoutDaySpans<T>(
	items: readonly T[],
	days: readonly Date[],
	getRange: (item: T) => { start: Date; end: Date }
): SpanLayout<T> {
	if (!days.length) return { spans: [], laneCount: 0 };
	const dayStarts = days.map((d) => d.getTime());
	const dayEnds = days.map((d) => {
		const next = new Date(d);
		next.setDate(next.getDate() + 1);
		return next.getTime();
	});

	const placed: Omit<SpanItem<T>, 'lane'>[] = [];
	for (const item of items) {
		const { start, end } = getRange(item);
		const s = start.getTime();
		// Zero-length items still occupy the day they start on.
		const e = Math.max(end.getTime(), s + 1);
		let first = -1;
		let last = -1;
		for (let i = 0; i < days.length; i++) {
			if (s < dayEnds[i] && e > dayStarts[i]) {
				if (first === -1) first = i;
				last = i;
			}
		}
		if (first === -1) continue;
		placed.push({
			item,
			startIndex: first,
			endIndex: last,
			continuesBefore: s < dayStarts[0],
			continuesAfter: e > dayEnds[days.length - 1]
		});
	}

	placed.sort(
		(a, b) =>
			a.startIndex - b.startIndex ||
			b.endIndex - b.startIndex - (a.endIndex - a.startIndex) ||
			Number(b.continuesBefore) - Number(a.continuesBefore)
	);

	const lanes: boolean[][] = [];
	const spans: SpanItem<T>[] = placed.map((span) => {
		let lane = 0;
		for (; ; lane++) {
			const row = (lanes[lane] ??= []);
			let free = true;
			for (let i = span.startIndex; i <= span.endIndex; i++) {
				if (row[i]) {
					free = false;
					break;
				}
			}
			if (free) {
				for (let i = span.startIndex; i <= span.endIndex; i++) row[i] = true;
				break;
			}
		}
		return { ...span, lane };
	});

	return { spans, laneCount: lanes.length };
}

/** Per day index, how many spans sit in lanes at or beyond `visibleLanes`. */
export function countHiddenPerDay<T>(
	spans: readonly SpanItem<T>[],
	dayCount: number,
	visibleLanes: number
) {
	const hidden = new Array<number>(dayCount).fill(0);
	for (const span of spans) {
		if (span.lane < visibleLanes) continue;
		for (let i = span.startIndex; i <= span.endIndex; i++) hidden[i]++;
	}
	return hidden;
}
