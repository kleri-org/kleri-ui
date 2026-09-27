import { createContext, type Snippet } from 'svelte';
import type { CalendarStore } from './store/calendar-store.svelte.js';
import type { CalendarFormatters } from './core/format.js';
import type { ZonedClock } from './core/timezone.js';
import type { CalendarLabels } from './labels.js';
import type { DisplayOccurrence, WorkingHours } from './types.js';

/**
 * Everything a view needs from the calendar that hosts it. Custom views (a
 * timeline, a chart…) read the same context, so they get drag-to-move,
 * details popovers and scheduling for free by calling `actions`.
 */

/** A wall-clock range in the display time zone. */
export interface WallRange {
	start: Date;
	end: Date;
	allDay: boolean;
}

export interface ResolvedCalendarConfig {
	locale: string;
	/** `0` = Sunday. */
	weekStartsOn: number;
	hour12: boolean;
	/** Weekdays hidden from multi-day views, `0` = Sunday. */
	hiddenDays: number[];
	workingHours: WorkingHours | null;
	/** Snap step for drag, resize and the editor's time lists, in minutes. */
	slotDuration: number;
	/** Pixel height of one hour in time grids. */
	hourHeight: number;
	/** First and last hour rendered by time grids (0-24). */
	dayStartHour: number;
	dayEndHour: number;
	/** Length of events created by a single click, in minutes. */
	defaultEventDuration: number;
	/** Hour time grids scroll to when they open (unless now is visible). */
	scrollToHour: number;
	readOnly: boolean;
	showWeekNumbers: boolean;
	dimPastEvents: boolean;
	clock: ZonedClock;
}

export interface EventContentArgs {
	occurrence: DisplayOccurrence;
	/** Which view is rendering, e.g. `week` or `month`. */
	view: string;
	/** The block is too small for more than one line. */
	compact: boolean;
}

export interface CalendarActions {
	/** Focus a date, optionally switching view. */
	navigate(date: Date, view?: string): void;
	/** Show the details popover for an occurrence, anchored to `anchor`. */
	open(occurrence: DisplayOccurrence, anchor: HTMLElement): void;
	/**
	 * Start creating an event over a wall-clock range. With an anchor (or the
	 * draft ghost) the quick-create popover opens; otherwise the full editor.
	 */
	create(range: WallRange, options?: { anchor?: HTMLElement | null; full?: boolean }): void;
	/** Move/resize to new wall-clock times. Asks for a scope on recurring events. */
	move(occurrence: DisplayOccurrence, start: Date, end: Date, allDay?: boolean): Promise<void>;
	remove(occurrence: DisplayOccurrence): Promise<void>;
	/** Open the full editor for an existing occurrence. */
	edit(occurrence: DisplayOccurrence): void;
	canModify(occurrence: DisplayOccurrence): boolean;
	/** Show a ghost where an event is about to be created (`null` clears it). */
	setDraft(range: WallRange | null): void;
	/** Say something to screen readers via the calendar's live region. */
	announce(message: string): void;
}

export interface CalendarContext {
	readonly store: CalendarStore;
	readonly config: ResolvedCalendarConfig;
	readonly labels: CalendarLabels;
	readonly formatters: CalendarFormatters;
	/** Current wall-clock time, updated every 30 seconds. */
	readonly now: Date;
	/** Local midnight of `now`. */
	readonly today: Date;
	/** Key of the occurrence whose details are open. */
	readonly selectedKey: string | null;
	/** Event being created, rendered as a ghost by views. */
	readonly draft: WallRange | null;
	readonly eventContent?: Snippet<[EventContentArgs]>;
	readonly actions: CalendarActions;
}

export const [getCalendarContext, setCalendarContext] = createContext<CalendarContext>();
