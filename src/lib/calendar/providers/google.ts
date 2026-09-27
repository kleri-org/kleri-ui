import type {
	AttendeeResponse,
	CalendarAttendee,
	CalendarEvent,
	EventChanges,
	ProviderCalendar,
	ProviderEvent,
	TimeInterval
} from '../types.js';
import { fromDateKey, toDateKey } from '../core/date.js';
import { formatRRule, parseRRule } from '../core/recurrence.js';
import { detectConference } from '../core/ics.js';
import { getSystemTimeZone } from '../core/timezone.js';
import { createHttpClient } from './http.js';
import { randomId, shiftSeriesTimes } from './shared.js';
import { CalendarProviderError, type AccessTokenGetter, type CalendarProvider } from './types.js';

/**
 * Google Calendar API v3 adapter.
 *
 * The app owns authentication: pass `getAccessToken` returning an OAuth token
 * with the `https://www.googleapis.com/auth/calendar` scope (or
 * `calendar.readonly` for read-only use, plus `calendar.freebusy` if you want
 * "find a time"). When Google answers 401 the adapter asks once for a fresh
 * token (`forceRefresh: true`) before surfacing an `auth` error.
 */
export interface GoogleCalendarProviderOptions {
	getAccessToken: AccessTokenGetter;
	/** Email of the signed-in account; used in the id and sidebar label. */
	account?: string;
	/** @default `google:<account>` */
	id?: string;
	/** @default 'Google Calendar' */
	label?: string;
	/** Only surface these calendar ids. */
	calendarIds?: string[];
	/** Who gets email updates about changes. @default 'all' */
	sendUpdates?: 'all' | 'externalOnly' | 'none';
	fetch?: typeof fetch;
	/** @default 'https://www.googleapis.com/calendar/v3' */
	baseUrl?: string;
}

interface GDateTime {
	date?: string;
	dateTime?: string;
	timeZone?: string;
}

interface GPerson {
	email: string;
	displayName?: string;
	self?: boolean;
}

interface GAttendee extends GPerson {
	responseStatus?: AttendeeResponse;
	optional?: boolean;
	organizer?: boolean;
	resource?: boolean;
}

interface GEvent {
	id: string;
	status?: 'confirmed' | 'tentative' | 'cancelled';
	htmlLink?: string;
	summary?: string;
	description?: string;
	location?: string;
	colorId?: string;
	start: GDateTime;
	end: GDateTime;
	recurringEventId?: string;
	originalStartTime?: GDateTime;
	recurrence?: string[];
	transparency?: 'opaque' | 'transparent';
	attendees?: GAttendee[];
	organizer?: GPerson;
	hangoutLink?: string;
	conferenceData?: {
		entryPoints?: { entryPointType: string; uri: string; label?: string }[];
		conferenceSolution?: { name?: string; key?: { type?: string } };
	};
	reminders?: { useDefault?: boolean; overrides?: { method: string; minutes: number }[] };
	guestsCanModify?: boolean;
	locked?: boolean;
}

interface GCalendarListEntry {
	id: string;
	summary: string;
	summaryOverride?: string;
	description?: string;
	backgroundColor?: string;
	accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
	primary?: boolean;
	timeZone?: string;
	hidden?: boolean;
}

/** Google's fixed event color palette (`colorId` 1-11). */
export const GOOGLE_EVENT_COLORS: Record<string, string> = {
	'1': '#7986cb',
	'2': '#33b679',
	'3': '#8e24aa',
	'4': '#e67c73',
	'5': '#f6bf26',
	'6': '#f4511e',
	'7': '#039be5',
	'8': '#616161',
	'9': '#3f51b5',
	'10': '#0b8043',
	'11': '#d50000'
};

function parseGDate(value: GDateTime): { date: Date; allDay: boolean } {
	if (value.date) return { date: fromDateKey(value.date), allDay: true };
	return { date: new Date(value.dateTime!), allDay: false };
}

export function fromGoogleEvent(g: GEvent, calendarId: string): ProviderEvent {
	const start = parseGDate(g.start);
	const end = parseGDate(g.end);
	const event: ProviderEvent = {
		id: g.id,
		calendarId,
		title: g.summary ?? '',
		start: start.date,
		end: end.date,
		allDay: start.allDay
	};
	if (g.start.timeZone) event.timeZone = g.start.timeZone;
	if (g.description) event.description = g.description;
	if (g.location) event.location = g.location;
	if (g.htmlLink) event.url = g.htmlLink;
	if (g.status && g.status !== 'confirmed') event.status = g.status;
	if (g.transparency === 'transparent') event.transparency = 'free';
	if (g.colorId && GOOGLE_EVENT_COLORS[g.colorId]) event.color = GOOGLE_EVENT_COLORS[g.colorId];
	if (g.recurringEventId) event.recurringEventId = g.recurringEventId;
	if (g.originalStartTime) event.originalStart = parseGDate(g.originalStartTime).date;
	if (g.recurrence) {
		const rrule = g.recurrence.find((line) => line.startsWith('RRULE:'));
		const rule = rrule ? parseRRule(rrule) : null;
		if (rule) event.recurrence = rule;
	}

	const video = g.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video');
	if (video) {
		const kind =
			g.conferenceData?.conferenceSolution?.key?.type === 'hangoutsMeet'
				? 'google-meet'
				: undefined;
		event.conference = {
			url: video.uri,
			kind: kind ?? detectConference(video.uri)?.kind ?? 'other',
			label: g.conferenceData?.conferenceSolution?.name
		};
	} else if (g.hangoutLink) {
		event.conference = { url: g.hangoutLink, kind: 'google-meet', label: 'Google Meet' };
	} else {
		const detected = detectConference(g.location, g.description);
		if (detected) event.conference = detected;
	}

	if (g.organizer) {
		event.organizer = { email: g.organizer.email, name: g.organizer.displayName };
		if (!g.organizer.self && !g.guestsCanModify) event.readOnly = true;
	}
	if (g.locked) event.readOnly = true;

	const attendees = g.attendees?.filter((a) => !a.resource);
	if (attendees?.length) {
		event.attendees = attendees.map((a): CalendarAttendee => {
			const attendee: CalendarAttendee = { email: a.email };
			if (a.displayName) attendee.name = a.displayName;
			if (a.responseStatus) attendee.response = a.responseStatus;
			if (a.optional) attendee.optional = true;
			if (a.organizer) attendee.organizer = true;
			if (a.self) attendee.self = true;
			return attendee;
		});
	}

	const overrides = g.reminders?.overrides;
	// Popup and email reminders often share an offset; keep each offset once.
	if (overrides?.length) {
		event.reminders = [...new Set(overrides.map((o) => o.minutes))].sort((a, b) => a - b);
	}
	return event;
}

/** Both keys are always sent so PATCH can switch between timed and all-day. */
function toGDateTime(date: Date, allDay: boolean, timeZone: string): Record<string, string | null> {
	return allDay
		? { date: toDateKey(date), dateTime: null, timeZone: null }
		: { dateTime: date.toISOString(), timeZone, date: null };
}

/**
 * Builds a create/patch body. Only fields present in `changes` are sent.
 * Moving an existing event keeps the zone it was scheduled in.
 */
export function toGoogleBody(
	changes: EventChanges,
	current?: Pick<CalendarEvent, 'allDay' | 'timeZone'>
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	const timeZone = changes.timeZone ?? current?.timeZone ?? getSystemTimeZone();
	const allDay = changes.allDay ?? current?.allDay ?? false;
	if (changes.title !== undefined) body.summary = changes.title;
	if (changes.description !== undefined) body.description = changes.description;
	if (changes.location !== undefined) body.location = changes.location;
	if (changes.start) body.start = toGDateTime(changes.start, allDay, timeZone);
	if (changes.end) body.end = toGDateTime(changes.end, allDay, timeZone);
	if (changes.transparency)
		body.transparency = changes.transparency === 'free' ? 'transparent' : 'opaque';
	if (changes.status) body.status = changes.status;
	if (changes.recurrence !== undefined) {
		body.recurrence = changes.recurrence
			? [`RRULE:${formatRRule(changes.recurrence, { dateOnlyUntil: allDay })}`]
			: [];
	}
	if (changes.attendees) {
		body.attendees = changes.attendees.map((a) => ({
			email: a.email,
			displayName: a.name,
			optional: a.optional || undefined,
			responseStatus: a.response
		}));
	}
	if (changes.reminders) {
		body.reminders = {
			useDefault: false,
			overrides: changes.reminders.slice(0, 5).map((minutes) => ({ method: 'popup', minutes }))
		};
	}
	if (changes.color !== undefined) {
		const match = Object.entries(GOOGLE_EVENT_COLORS).find(
			([, hex]) => hex === changes.color?.toLowerCase()
		);
		body.colorId = match ? match[0] : null;
	}
	if (changes.requestConference === 'google-meet') {
		body.conferenceData = {
			createRequest: { requestId: randomId(), conferenceSolutionKey: { type: 'hangoutsMeet' } }
		};
	} else if (changes.conference === null) {
		body.conferenceData = null;
	}
	return body;
}

export function createGoogleCalendarProvider(
	options: GoogleCalendarProviderOptions
): CalendarProvider {
	const {
		account,
		id = `google:${account ?? 'default'}`,
		label = 'Google Calendar',
		calendarIds,
		sendUpdates = 'all'
	} = options;
	const http = createHttpClient({
		baseUrl: options.baseUrl ?? 'https://www.googleapis.com/calendar/v3',
		getAccessToken: options.getAccessToken,
		fetch: options.fetch
	});
	const eventPath = (calendarId: string, eventId?: string) =>
		`/calendars/${encodeURIComponent(calendarId)}/events${eventId ? `/${encodeURIComponent(eventId)}` : ''}`;
	const writeQuery = { conferenceDataVersion: 1, sendUpdates };

	return {
		id,
		kind: 'google',
		label,
		account,
		capabilities: {
			write: true,
			freeBusy: true,
			respond: true,
			conferencing: ['google-meet'],
			recurrence: 'provider'
		},

		async listCalendars(signal) {
			const calendars: ProviderCalendar[] = [];
			let pageToken: string | undefined;
			do {
				const page = await http.request<{ items?: GCalendarListEntry[]; nextPageToken?: string }>(
					'/users/me/calendarList',
					{ query: { maxResults: 250, pageToken }, signal }
				);
				for (const entry of page.items ?? []) {
					if (entry.accessRole === 'freeBusyReader' || entry.hidden) continue;
					if (calendarIds && !calendarIds.includes(entry.id)) continue;
					calendars.push({
						id: entry.id,
						name: entry.summaryOverride ?? entry.summary,
						color: entry.backgroundColor,
						readOnly: entry.accessRole === 'reader',
						primary: entry.primary,
						timeZone: entry.timeZone,
						description: entry.description
					});
				}
				pageToken = page.nextPageToken;
			} while (pageToken);
			return calendars;
		},

		async listEvents({ calendarId, start, end, signal }) {
			const events: ProviderEvent[] = [];
			let pageToken: string | undefined;
			do {
				const page = await http.request<{ items?: GEvent[]; nextPageToken?: string }>(
					eventPath(calendarId),
					{
						query: {
							timeMin: start.toISOString(),
							timeMax: end.toISOString(),
							singleEvents: true,
							orderBy: 'startTime',
							maxResults: 2500,
							pageToken
						},
						signal
					}
				);
				for (const item of page.items ?? []) {
					if (item.status !== 'cancelled') events.push(fromGoogleEvent(item, calendarId));
				}
				pageToken = page.nextPageToken;
			} while (pageToken);
			return events;
		},

		async createEvent(calendarId, draft) {
			const created = await http.request<GEvent>(eventPath(calendarId), {
				method: 'POST',
				query: writeQuery,
				body: toGoogleBody(draft)
			});
			return fromGoogleEvent(created, calendarId);
		},

		async updateEvent({ calendarId, eventId, event, changes, scope, occurrence }) {
			const seriesId = scope === 'all' ? event.recurringEventId : undefined;
			let effective = changes;
			if (seriesId && (changes.start || changes.end)) {
				const master = fromGoogleEvent(
					await http.request<GEvent>(eventPath(calendarId, seriesId)),
					calendarId
				);
				const shifted = shiftSeriesTimes(master, occurrence ?? event, changes);
				if (shifted)
					effective = { ...changes, ...shifted, allDay: changes.allDay ?? master.allDay };
			}
			const updated = await http.request<GEvent>(eventPath(calendarId, seriesId ?? eventId), {
				method: 'PATCH',
				query: writeQuery,
				body: toGoogleBody(effective, event)
			});
			return fromGoogleEvent(updated, calendarId);
		},

		async deleteEvent({ calendarId, eventId, event, scope }) {
			const target = scope === 'all' && event.recurringEventId ? event.recurringEventId : eventId;
			try {
				await http.request(eventPath(calendarId, target), {
					method: 'DELETE',
					query: { sendUpdates }
				});
			} catch (error) {
				// Already gone is as good as deleted.
				if (!(error instanceof CalendarProviderError && error.code === 'not-found')) throw error;
			}
		},

		async respond({ calendarId, eventId, response }) {
			const current = await http.request<GEvent>(eventPath(calendarId, eventId));
			const attendees = current.attendees ?? [];
			const self = attendees.find((a) => a.self);
			if (!self)
				throw new CalendarProviderError('You are not a guest of this event', { code: 'invalid' });
			self.responseStatus = response;
			const updated = await http.request<GEvent>(eventPath(calendarId, eventId), {
				method: 'PATCH',
				query: { sendUpdates },
				body: { attendees }
			});
			return fromGoogleEvent(updated, calendarId);
		},

		async getFreeBusy({ emails, start, end, signal }) {
			const response = await http.request<{
				calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
			}>('/freeBusy', {
				method: 'POST',
				body: {
					timeMin: start.toISOString(),
					timeMax: end.toISOString(),
					items: emails.map((email) => ({ id: email }))
				},
				signal
			});
			const result: Record<string, TimeInterval[]> = {};
			for (const email of emails) {
				result[email] = (response.calendars?.[email]?.busy ?? []).map((b) => ({
					start: new Date(b.start),
					end: new Date(b.end)
				}));
			}
			return result;
		}
	};
}
