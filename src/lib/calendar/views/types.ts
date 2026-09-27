import type { Component } from 'svelte';
import type { CalendarFormatters } from '../core/format.js';
import type { DisplayOccurrence } from '../types.js';

export interface ViewRangeContext {
	locale: string;
	weekStartsOn: number;
	hiddenDays: readonly number[];
	formatters: CalendarFormatters;
}

/** Props every view component receives. The rest comes from `getCalendarContext()`. */
export interface CalendarViewProps {
	/** Focus date (wall clock). */
	date: Date;
	/** Visible wall-clock range, `end` exclusive. */
	range: { start: Date; end: Date };
	/** Occurrences overlapping `range`, already in display time. */
	occurrences: DisplayOccurrence[];
	/** Id of the view definition being rendered. */
	viewId: string;
}

/**
 * Describes one calendar view. The calendar asks the definition which range
 * to load and how to page; the component just renders. Add your own (a
 * timeline, a Gantt-style chart…) by passing it in the `views` prop.
 */
export interface CalendarViewDefinition {
	id: string;
	/** Name in the view switcher. */
	label: string;
	icon?: Component;
	/** Single-key shortcut, e.g. `w`. */
	shortcut?: string;
	/** Visible wall-clock range for a focus date, `end` exclusive. */
	range(date: Date, context: ViewRangeContext): { start: Date; end: Date };
	/** The focus date one page forward (`1`) or back (`-1`). */
	step(date: Date, direction: 1 | -1, context: ViewRangeContext): Date;
	/** Toolbar heading for the visible range. */
	title(range: { start: Date; end: Date }, context: ViewRangeContext): string;
	component: Component<CalendarViewProps>;
	/** Keep out of the view switcher, while still reachable via `view`. */
	hidden?: boolean;
}
