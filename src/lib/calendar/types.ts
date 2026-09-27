import type { Component } from 'svelte';
import type { RecurrenceRule } from './core/recurrence.js';

/**
 * The data model shared by the calendar store, its providers and its views.
 *
 * Times are always real instants (`Date`) except for all-day events, whose
 * `start`/`end` are local midnights with an **exclusive** end — the same
 * convention iCalendar, Google and Microsoft use. A one-day all-day event on
 * 26 Sep therefore runs from `26 Sep 00:00` to `27 Sep 00:00`.
 */

/** Built-in provider kinds. Custom adapters may use any other string. */
export type CalendarProviderKind = 'local' | 'google' | 'microsoft' | 'ics' | (string & {});

export interface CalendarPerson {
	email: string;
	name?: string;
}

export type AttendeeResponse = 'needsAction' | 'accepted' | 'declined' | 'tentative';

export interface CalendarAttendee extends CalendarPerson {
	response?: AttendeeResponse;
	optional?: boolean;
	organizer?: boolean;
	/** The attendee is the signed-in user of the calendar that returned the event. */
	self?: boolean;
}

export type ConferenceKind = 'google-meet' | 'teams' | 'zoom' | 'other';

export interface CalendarConference {
	url: string;
	kind?: ConferenceKind;
	/** Display name, e.g. "Google Meet". Derived from `kind` when omitted. */
	label?: string;
}

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
/** Whether the event blocks time for free/busy lookups. */
export type EventTransparency = 'busy' | 'free';

/**
 * An event as the store holds it. `calendarId` is the store-namespaced id
 * (`<sourceId>/<remoteCalendarId>`), unique across every connected provider.
 */
export interface CalendarEvent {
	id: string;
	calendarId: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	/** IANA zone the event was scheduled in. Informational; `start`/`end` are instants. */
	timeZone?: string;
	description?: string;
	location?: string;
	conference?: CalendarConference;
	attendees?: CalendarAttendee[];
	organizer?: CalendarPerson;
	/** Present on series masters the client has to expand (memory, ICS). */
	recurrence?: RecurrenceRule;
	/** Excluded occurrence starts of a client-expanded series. */
	exdates?: Date[];
	/** On a single occurrence: the id of the series it belongs to. */
	recurringEventId?: string;
	/** On a single occurrence: its unmodified start, which identifies it within the series. */
	originalStart?: Date;
	status?: EventStatus;
	transparency?: EventTransparency;
	/** Overrides the calendar color for this event. */
	color?: string;
	/** Reminder offsets, in minutes before the start. */
	reminders?: number[];
	/** Deep link to the event in its home app. */
	url?: string;
	/** The provider refuses edits to this event even though the calendar is writable. */
	readOnly?: boolean;
	/** Free-form data the provider wants to round-trip. */
	meta?: Record<string, unknown>;
}

/** An event exactly as a provider returns it: `calendarId` is the provider's own id. */
export type ProviderEvent = CalendarEvent;

/** The editable fields of an event, used for creation and updates. */
export interface EventDraft {
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	timeZone?: string;
	description?: string;
	location?: string;
	conference?: CalendarConference | null;
	/** Ask the provider to create a conference (e.g. a Meet link) on save. */
	requestConference?: ConferenceKind;
	attendees?: CalendarAttendee[];
	recurrence?: RecurrenceRule | null;
	status?: EventStatus;
	transparency?: EventTransparency;
	color?: string | null;
	reminders?: number[];
}

export type EventChanges = Partial<EventDraft>;

/** Which occurrences of a recurring series an edit applies to. */
export type EditScope = 'this' | 'all';

export interface CalendarInfo {
	/** Store-namespaced id: `<sourceId>/<remoteId>`. */
	id: string;
	/** The provider's own id for the calendar. */
	remoteId: string;
	sourceId: string;
	name: string;
	color: string;
	readOnly: boolean;
	primary?: boolean;
	timeZone?: string;
	description?: string;
}

/** A calendar exactly as a provider returns it. */
export interface ProviderCalendar {
	id: string;
	name: string;
	color?: string;
	readOnly?: boolean;
	primary?: boolean;
	timeZone?: string;
	description?: string;
}

/** One concrete, renderable instance of an event (a series yields many). */
export interface CalendarOccurrence {
	/** Stable across re-renders: `<calendarId>|<eventId>|<startMs>`. */
	key: string;
	event: CalendarEvent;
	calendar: CalendarInfo;
	/** Instants of this occurrence. */
	start: Date;
	end: Date;
	allDay: boolean;
	/** Part of a recurring series, expanded either by the client or the provider. */
	recurring: boolean;
	color: string;
	/** Saved optimistically, still waiting for the provider. */
	pending: boolean;
}

/** An occurrence with its times converted to the calendar's display time zone. */
export interface DisplayOccurrence extends CalendarOccurrence {
	displayStart: Date;
	displayEnd: Date;
}

export interface TimeInterval {
	start: Date;
	end: Date;
}

export interface WorkingHours {
	/** Minutes from midnight, e.g. `9 * 60`. */
	start: number;
	/** Minutes from midnight, e.g. `17 * 60`. */
	end: number;
	/** Working weekdays, `0` = Sunday. */
	days: number[];
}

/** A way to add video conferencing that isn't built into a calendar provider, e.g. Zoom. */
export interface ConferenceProvider {
	id: string;
	label: string;
	kind: ConferenceKind;
	icon?: Component;
	/** Create the meeting and return its join link. */
	create(draft: EventDraft): Promise<CalendarConference>;
}

/**
 * One entry of the "Add calendar" dialog. `connect` runs the app's own auth
 * flow (OAuth, etc.) and resolves to the provider to add, or `undefined` if
 * the user backed out.
 */
export interface CalendarIntegration {
	id: string;
	label: string;
	description?: string;
	icon?: Component;
	connect(): Promise<import('./providers/types.js').CalendarProvider | undefined | void>;
}
