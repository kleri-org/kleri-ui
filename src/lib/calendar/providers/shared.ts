import type { CalendarEvent, EventChanges, EventDraft } from '../types.js';

/**
 * Helpers shared by the built-in adapters.
 */

/** Applies an edit to an event. `null` clears a field, `undefined` leaves it alone. */
export function applyChanges<T extends CalendarEvent>(event: T, changes: EventChanges): T {
	const next: Record<string, unknown> = { ...(event as CalendarEvent) };
	for (const [key, value] of Object.entries(changes)) {
		if (key === 'requestConference' || value === undefined) continue;
		if (value === null) delete next[key];
		else next[key] = value;
	}
	return next as T;
}

/**
 * For an "all events" edit made on one instance: the series start/end after
 * shifting the series by however far the instance moved.
 */
export function shiftSeriesTimes(
	series: { start: Date; end: Date },
	occurrence: { start: Date; end: Date },
	changes: Pick<EventChanges, 'start' | 'end'>
): { start: Date; end: Date } | null {
	if (!changes.start && !changes.end) return null;
	const newStart = changes.start ?? occurrence.start;
	const newEnd = changes.end ?? occurrence.end;
	const delta = newStart.getTime() - occurrence.start.getTime();
	const start = new Date(series.start.getTime() + delta);
	return { start, end: new Date(start.getTime() + (newEnd.getTime() - newStart.getTime())) };
}

export function draftToEvent(id: string, calendarId: string, draft: EventDraft): CalendarEvent {
	return applyChanges(
		{ id, calendarId, title: draft.title, start: draft.start, end: draft.end },
		draft
	);
}

export function randomId(prefix = ''): string {
	const uuid =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
	return `${prefix}${uuid}`;
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(new DOMException('Aborted', 'AbortError'));
			},
			{ once: true }
		);
	});
}

/** A wall-clock time as `YYYY-MM-DDTHH:mm:ss`, without any offset. */
export function toLocalIsoString(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
		`T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

/** Parses `YYYY-MM-DDTHH:mm:ss[.fffffff]` as a local wall-clock time. */
export function fromLocalIsoString(value: string): Date {
	const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
	if (!m) return new Date(value);
	return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
}

/**
 * Whether a client-expanded provider should return `event` for a range query:
 * plain events that overlap it, series that may produce instances inside it,
 * and overrides whose original slot falls inside it (so the store can hide
 * the instance they replace).
 */
export function isEventRelevant(event: CalendarEvent, start: Date, end: Date): boolean {
	if (event.recurrence) {
		return event.start < end && (!event.recurrence.until || event.recurrence.until >= start);
	}
	if (event.start < end && event.end > start) return true;
	if (event.start.getTime() === event.end.getTime() && event.start >= start && event.start < end)
		return true;
	return (
		event.originalStart !== undefined && event.originalStart >= start && event.originalStart < end
	);
}
