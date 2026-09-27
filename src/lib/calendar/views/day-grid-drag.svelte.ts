import type { DisplayOccurrence } from '../types.js';
import { differenceInCalendarDays, fromDateKey } from '../core/date.js';

export type DayGridPreview =
	| { kind: 'create'; from: Date; to: Date }
	| { kind: 'move'; occurrence: DisplayOccurrence; dayDelta: number };

export interface DayGridDragOptions {
	/** Element holding the day cells. Every cell carries `data-date="YYYY-MM-DD"`. */
	container: () => HTMLElement | null;
	findOccurrence: (key: string) => DisplayOccurrence | undefined;
	canCreate: () => boolean;
	canMove: (occurrence: DisplayOccurrence) => boolean;
	/** A click (no drag) on empty space in a day. */
	onClickDay: (date: Date, cell: HTMLElement) => void;
	/** A drag across days on empty space. Both dates inclusive. */
	onCreateRange: (from: Date, to: Date) => void;
	onMove: (occurrence: DisplayOccurrence, dayDelta: number) => void;
	onOpen: (occurrence: DisplayOccurrence, element: HTMLElement) => void;
}

interface Gesture {
	kind: 'create' | 'move';
	pointerId: number;
	touch: boolean;
	x: number;
	y: number;
	moved: boolean;
	origin: Date;
	current: Date;
	element: HTMLElement;
	occurrence?: DisplayOccurrence;
}

const DRAG_THRESHOLD = 5;

/**
 * Pointer gestures for grids of day cells (month view, all-day strips):
 * click a day, drag across days to create a multi-day event, or drag an event
 * to another day. Touch input only taps, so scrolling keeps working.
 */
export class DayGridDrag {
	preview = $state<DayGridPreview | null>(null);
	#gesture: Gesture | null = null;
	#options: DayGridDragOptions;

	constructor(options: DayGridDragOptions) {
		this.#options = options;
	}

	/** Whether a drag is in progress (used to suppress hover affordances). */
	get active(): boolean {
		return this.preview !== null;
	}

	#dateAt(x: number, y: number): Date | null {
		const cells = this.#options.container()?.querySelectorAll<HTMLElement>('[data-date]') ?? [];
		for (const cell of cells) {
			const rect = cell.getBoundingClientRect();
			if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
				return fromDateKey(cell.dataset.date!);
			}
		}
		return null;
	}

	onpointerdown = (e: PointerEvent) => {
		if (e.button !== 0 || this.#gesture) return;
		const target = e.target as HTMLElement;
		if (target.closest('[data-no-drag]')) return;
		const cell = target.closest<HTMLElement>('[data-date]');
		const origin = cell ? fromDateKey(cell.dataset.date!) : this.#dateAt(e.clientX, e.clientY);
		if (!origin) return;

		const eventEl = target.closest<HTMLElement>('[data-event-key]');
		const occurrence = eventEl
			? this.#options.findOccurrence(eventEl.dataset.eventKey!)
			: undefined;
		if (eventEl && !occurrence) return;

		this.#gesture = {
			kind: occurrence ? 'move' : 'create',
			pointerId: e.pointerId,
			touch: e.pointerType === 'touch',
			x: e.clientX,
			y: e.clientY,
			moved: false,
			origin,
			current: origin,
			element: eventEl ?? cell ?? target,
			occurrence
		};
		if (!this.#gesture.touch) {
			// Keep the pointer even when it leaves the grid, and stop text selection.
			(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
			e.preventDefault();
		}
	};

	onpointermove = (e: PointerEvent) => {
		const g = this.#gesture;
		if (!g || e.pointerId !== g.pointerId) return;
		if (!g.moved) {
			if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < DRAG_THRESHOLD) return;
			if (g.touch) {
				// Let the browser scroll; touch only ever taps.
				this.#gesture = null;
				return;
			}
			if (g.kind === 'create' && !this.#options.canCreate()) return;
			if (g.kind === 'move' && !this.#options.canMove(g.occurrence!)) return;
			g.moved = true;
		}
		const date = this.#dateAt(e.clientX, e.clientY);
		if (date) g.current = date;
		if (g.kind === 'create') {
			const [from, to] = g.origin <= g.current ? [g.origin, g.current] : [g.current, g.origin];
			this.preview = { kind: 'create', from, to };
		} else {
			this.preview = {
				kind: 'move',
				occurrence: g.occurrence!,
				dayDelta: differenceInCalendarDays(g.current, g.origin)
			};
		}
	};

	onpointerup = (e: PointerEvent) => {
		const g = this.#gesture;
		if (!g || e.pointerId !== g.pointerId) return;
		this.#gesture = null;
		const preview = this.preview;
		this.preview = null;

		if (!g.moved) {
			if (g.occurrence) this.#options.onOpen(g.occurrence, g.element);
			else if (this.#options.canCreate()) this.#options.onClickDay(g.origin, g.element);
			return;
		}
		if (preview?.kind === 'create') this.#options.onCreateRange(preview.from, preview.to);
		else if (preview?.kind === 'move' && preview.dayDelta !== 0) {
			this.#options.onMove(preview.occurrence, preview.dayDelta);
		}
	};

	onpointercancel = () => {
		this.#gesture = null;
		this.preview = null;
	};

	/** Escape aborts a drag in progress. Returns whether it handled the key. */
	cancel(): boolean {
		if (!this.#gesture && !this.preview) return false;
		this.onpointercancel();
		return true;
	}
}
