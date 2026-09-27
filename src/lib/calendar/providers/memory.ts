import type {
	CalendarPerson,
	CalendarProviderKind,
	ProviderCalendar,
	ProviderEvent,
	TimeInterval
} from '../types.js';
import { expandRecurrence } from '../core/recurrence.js';
import { CalendarProviderError, type CalendarProvider, type OccurrenceRef } from './types.js';
import {
	applyChanges,
	delay,
	draftToEvent,
	isEventRelevant,
	randomId,
	shiftSeriesTimes
} from './shared.js';

export interface MemoryProviderOptions {
	/** @default 'local' */
	id?: string;
	/** @default 'My calendars' */
	label?: string;
	/** @default 'local' */
	kind?: CalendarProviderKind;
	account?: string;
	/** @default one writable calendar called "Calendar" */
	calendars?: ProviderCalendar[];
	/** Seed events; `calendarId` refers to the ids in `calendars`. */
	events?: ProviderEvent[];
	/** Refuse every write. */
	readOnly?: boolean;
	/** Artificial delay per call, in ms, to exercise loading states. @default 0 */
	latency?: number;
	/** Organizer of newly created events, and the attendee RSVPs are recorded for. */
	self?: CalendarPerson;
	/** Called after every change, e.g. to persist the snapshot. */
	onChange?: (snapshot: MemorySnapshot) => void;
}

export interface MemorySnapshot {
	calendars: ProviderCalendar[];
	events: ProviderEvent[];
}

export interface MemoryProvider extends CalendarProvider {
	getSnapshot(): MemorySnapshot;
	addCalendar(calendar: ProviderCalendar): void;
	removeCalendar(calendarId: string): void;
	/** Adds (or replaces, by id) events in bulk — e.g. from an `.ics` import. */
	importEvents(calendarId: string, events: ProviderEvent[]): void;
}

/**
 * Deep copy that keeps `Date`s. Unlike `structuredClone` it also accepts
 * proxies (e.g. Svelte `$state` objects handed straight to the provider).
 */
function clone<T>(value: T): T {
	if (value instanceof Date) return new Date(value.getTime()) as T;
	if (Array.isArray(value)) return value.map(clone) as T;
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) out[key] = clone(entry);
		return out as T;
	}
	return value;
}

function sameInstant(a: Date | undefined, b: Date | undefined): boolean {
	return Boolean(a && b && a.getTime() === b.getTime());
}

/**
 * A fully featured provider that keeps everything in memory: local calendars,
 * demos, tests, or the base for an adapter over your own backend. Recurring
 * series are stored as masters with overrides, exactly like iCalendar.
 */
export function createMemoryProvider(options: MemoryProviderOptions = {}): MemoryProvider {
	const {
		id = 'local',
		label = 'My calendars',
		kind = 'local',
		account,
		readOnly = false,
		latency = 0,
		self,
		onChange
	} = options;

	const calendars = new Map<string, ProviderCalendar>(
		(options.calendars ?? [{ id: 'default', name: 'Calendar', primary: true }]).map((c) => [
			c.id,
			clone(c)
		])
	);
	const events = new Map<string, ProviderEvent>(
		(options.events ?? []).map((e) => [e.id, clone(e)])
	);
	const listeners = new Set<() => void>();

	const snapshot = (): MemorySnapshot => ({
		calendars: [...calendars.values()].map(clone),
		events: [...events.values()].map(clone)
	});

	const changed = () => {
		onChange?.(snapshot());
		for (const listener of listeners) listener();
	};

	const assertWritable = (calendarId: string) => {
		const calendar = calendars.get(calendarId);
		if (!calendar)
			throw new CalendarProviderError(`Calendar "${calendarId}" not found`, { code: 'not-found' });
		if (readOnly || calendar.readOnly) {
			throw new CalendarProviderError(`"${calendar.name}" is read-only`, { code: 'forbidden' });
		}
	};

	const getEvent = (eventId: string) => {
		const event = events.get(eventId);
		if (!event) throw new CalendarProviderError('Event not found', { code: 'not-found' });
		return event;
	};

	const originalStartOf = (occurrence: OccurrenceRef) =>
		occurrence.originalStart ?? occurrence.start;

	const removeSeries = (masterId: string) => {
		events.delete(masterId);
		for (const [key, event] of events) if (event.recurringEventId === masterId) events.delete(key);
	};

	const markSelf = (event: ProviderEvent): ProviderEvent => {
		if (!self || !event.attendees) return event;
		const email = self.email.toLowerCase();
		return {
			...event,
			attendees: event.attendees.map((a) =>
				a.email.toLowerCase() === email ? { ...a, self: true } : a
			)
		};
	};

	const provider: MemoryProvider = {
		id,
		kind,
		label,
		account,
		capabilities: {
			write: !readOnly,
			freeBusy: true,
			respond: !readOnly,
			recurrence: 'client'
		},

		async listCalendars(signal) {
			await delay(latency, signal);
			return [...calendars.values()].map((c) => ({
				...clone(c),
				readOnly: readOnly || c.readOnly
			}));
		},

		async listEvents({ calendarId, start, end, signal }) {
			await delay(latency, signal);
			const out: ProviderEvent[] = [];
			for (const event of events.values()) {
				if (event.calendarId !== calendarId) continue;
				if (isEventRelevant(event, start, end)) out.push(markSelf(clone(event)));
			}
			return out;
		},

		async createEvent(calendarId, draft) {
			await delay(latency);
			assertWritable(calendarId);
			const event = draftToEvent(randomId('evt_'), calendarId, draft);
			if (self) {
				event.organizer = { ...self };
				const selfEmail = self.email.toLowerCase();
				if (
					event.attendees?.length &&
					!event.attendees.some((a) => a.email.toLowerCase() === selfEmail)
				) {
					event.attendees = [
						{ ...self, response: 'accepted', organizer: true },
						...event.attendees
					];
				}
			}
			events.set(event.id, event);
			changed();
			return markSelf(clone(event));
		},

		async updateEvent({ calendarId, eventId, changes, scope, occurrence }) {
			await delay(latency);
			assertWritable(calendarId);
			const stored = getEvent(eventId);

			// An instance of a series stored as a master: split off an override.
			if (stored.recurrence && scope === 'this' && occurrence) {
				const originalStart = originalStartOf(occurrence);
				const overrideId = `${stored.id}::${originalStart.getTime()}`;
				const base: ProviderEvent = { ...stored };
				delete base.recurrence;
				delete base.exdates;
				const override = applyChanges(
					{
						...base,
						id: overrideId,
						start: occurrence.start,
						end: occurrence.end,
						recurringEventId: stored.id,
						originalStart
					},
					{ ...changes, recurrence: null }
				);
				events.set(overrideId, override);
				events.set(stored.id, { ...stored, exdates: [...(stored.exdates ?? []), originalStart] });
				changed();
				return markSelf(clone(override));
			}

			// "All events" from a master occurrence or from an override.
			const masterId =
				scope === 'all' && stored.recurringEventId ? stored.recurringEventId : stored.id;
			const master = getEvent(masterId);
			if (scope === 'all' && (master.recurrence || stored.recurringEventId)) {
				const shifted = shiftSeriesTimes(master, occurrence ?? stored, changes);
				const next = applyChanges(master, { ...changes, start: undefined, end: undefined });
				if (shifted) {
					// Moving the whole series drops per-instance overrides (like Google
					// does) and frees their slots; plain deletions move with the series.
					const delta = shifted.start.getTime() - master.start.getTime();
					const overridden = new Set<number>();
					for (const [key, event] of events) {
						if (event.recurringEventId !== masterId) continue;
						if (event.originalStart) overridden.add(event.originalStart.getTime());
						events.delete(key);
					}
					next.start = shifted.start;
					next.end = shifted.end;
					next.exdates = next.exdates
						?.filter((d) => !overridden.has(d.getTime()))
						.map((d) => new Date(d.getTime() + delta));
				}
				if (changes.recurrence === null) {
					for (const [key, event] of events)
						if (event.recurringEventId === masterId) events.delete(key);
					delete next.exdates;
				}
				events.set(masterId, next);
				changed();
				return markSelf(clone(next));
			}

			const next = applyChanges(stored, changes);
			events.set(stored.id, next);
			changed();
			return markSelf(clone(next));
		},

		async deleteEvent({ calendarId, eventId, scope, occurrence }) {
			await delay(latency);
			assertWritable(calendarId);
			const stored = getEvent(eventId);
			if (scope === 'all') {
				removeSeries(stored.recurringEventId ?? stored.id);
			} else if (stored.recurrence && occurrence) {
				const originalStart = originalStartOf(occurrence);
				const exdates = stored.exdates ?? [];
				if (!exdates.some((d) => sameInstant(d, originalStart))) {
					events.set(stored.id, { ...stored, exdates: [...exdates, originalStart] });
				}
			} else {
				// A plain event, or an override whose slot is already excluded by its master.
				events.delete(stored.id);
				if (stored.recurringEventId && stored.originalStart) {
					const master = events.get(stored.recurringEventId);
					if (master && !master.exdates?.some((d) => sameInstant(d, stored.originalStart))) {
						events.set(master.id, {
							...master,
							exdates: [...(master.exdates ?? []), stored.originalStart]
						});
					}
				}
			}
			changed();
		},

		async respond({ eventId, response }) {
			await delay(latency);
			if (!self)
				throw new CalendarProviderError('No `self` configured to respond as', { code: 'invalid' });
			const stored = getEvent(eventId);
			const email = self.email.toLowerCase();
			const attendees = [...(stored.attendees ?? [])];
			const index = attendees.findIndex((a) => a.email.toLowerCase() === email);
			if (index === -1) attendees.push({ ...self, response });
			else attendees[index] = { ...attendees[index], response };
			const next = { ...stored, attendees };
			events.set(stored.id, next);
			changed();
			return markSelf(clone(next));
		},

		async getFreeBusy({ emails, start, end, signal }) {
			await delay(latency, signal);
			const result: Record<string, TimeInterval[]> = {};
			for (const email of emails) {
				const lower = email.toLowerCase();
				const busy: TimeInterval[] = [];
				for (const event of events.values()) {
					if (event.status === 'cancelled' || event.transparency === 'free' || event.allDay)
						continue;
					const involved =
						event.organizer?.email.toLowerCase() === lower ||
						event.attendees?.some(
							(a) => a.email.toLowerCase() === lower && a.response !== 'declined'
						) ||
						(self?.email.toLowerCase() === lower && !event.attendees?.length);
					if (!involved) continue;
					const duration = event.end.getTime() - event.start.getTime();
					if (event.recurrence) {
						for (const s of expandRecurrence(event.start, event.recurrence, {
							rangeStart: start,
							rangeEnd: end,
							duration,
							exdates: event.exdates
						})) {
							busy.push({ start: s, end: new Date(s.getTime() + duration) });
						}
					} else if (event.start < end && event.end > start) {
						busy.push({ start: new Date(event.start), end: new Date(event.end) });
					}
				}
				result[email] = busy;
			}
			return result;
		},

		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},

		dispose() {
			listeners.clear();
		},

		getSnapshot: snapshot,

		addCalendar(calendar) {
			calendars.set(calendar.id, clone(calendar));
			changed();
		},

		removeCalendar(calendarId) {
			calendars.delete(calendarId);
			for (const [key, event] of events) if (event.calendarId === calendarId) events.delete(key);
			changed();
		},

		importEvents(calendarId, incoming) {
			if (!calendars.has(calendarId)) {
				throw new CalendarProviderError(`Calendar "${calendarId}" not found`, {
					code: 'not-found'
				});
			}
			for (const event of incoming) events.set(event.id, { ...clone(event), calendarId });
			changed();
		}
	};

	return provider;
}
