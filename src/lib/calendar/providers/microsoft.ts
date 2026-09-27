import type {
	AttendeeResponse,
	CalendarAttendee,
	EventChanges,
	ProviderCalendar,
	ProviderEvent,
	TimeInterval
} from '../types.js';
import { toDateKey } from '../core/date.js';
import { WEEKDAY_CODES, weekdayIndex, type RecurrenceRule } from '../core/recurrence.js';
import { detectConference } from '../core/ics.js';
import { getSystemTimeZone } from '../core/timezone.js';
import { createHttpClient } from './http.js';
import { fromLocalIsoString, shiftSeriesTimes, toLocalIsoString } from './shared.js';
import { CalendarProviderError, type AccessTokenGetter, type CalendarProvider } from './types.js';

/**
 * Microsoft Graph (Outlook / Microsoft 365) calendar adapter.
 *
 * Pass `getAccessToken` returning a token with `Calendars.ReadWrite` (or
 * `Calendars.Read`), e.g. from MSAL's `acquireTokenSilent`. Every request
 * carries `Prefer: outlook.timezone` set to the system zone, so Graph answers
 * in local wall-clock time and all-day events keep their dates.
 */
export interface MicrosoftCalendarProviderOptions {
	getAccessToken: AccessTokenGetter;
	/** Email of the signed-in account. */
	account?: string;
	/** @default `microsoft:<account>` */
	id?: string;
	/** @default 'Outlook' */
	label?: string;
	calendarIds?: string[];
	fetch?: typeof fetch;
	/** @default 'https://graph.microsoft.com/v1.0' */
	baseUrl?: string;
}

interface GraphDateTime {
	dateTime: string;
	timeZone: string;
}

interface GraphEmail {
	emailAddress: { address: string; name?: string };
}

type GraphResponse =
	'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';

interface GraphEvent {
	id: string;
	subject?: string;
	bodyPreview?: string;
	body?: { contentType: 'text' | 'html'; content: string };
	location?: { displayName?: string };
	start: GraphDateTime;
	end: GraphDateTime;
	isAllDay?: boolean;
	isCancelled?: boolean;
	isOrganizer?: boolean;
	showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
	responseStatus?: { response: GraphResponse };
	attendees?: (GraphEmail & {
		type: 'required' | 'optional' | 'resource';
		status?: { response: GraphResponse };
	})[];
	organizer?: GraphEmail;
	isOnlineMeeting?: boolean;
	onlineMeeting?: { joinUrl?: string } | null;
	onlineMeetingUrl?: string | null;
	seriesMasterId?: string | null;
	originalStart?: string | null;
	type?: 'singleInstance' | 'occurrence' | 'exception' | 'seriesMaster';
	webLink?: string;
	isReminderOn?: boolean;
	reminderMinutesBeforeStart?: number;
	originalStartTimeZone?: string;
}

interface GraphCalendar {
	id: string;
	name: string;
	color?: string;
	hexColor?: string;
	canEdit?: boolean;
	isDefaultCalendar?: boolean;
}

/** Graph's named calendar colors, approximated. */
const GRAPH_COLORS: Record<string, string> = {
	lightBlue: '#4a90d9',
	lightGreen: '#5fb760',
	lightOrange: '#f0a04b',
	lightGray: '#9aa0a6',
	lightYellow: '#e3b82f',
	lightTeal: '#3fb5b0',
	lightPink: '#e373ad',
	lightBrown: '#b3875f',
	lightRed: '#e0625d'
};

const RESPONSE_MAP: Record<GraphResponse, AttendeeResponse> = {
	none: 'needsAction',
	notResponded: 'needsAction',
	organizer: 'accepted',
	tentativelyAccepted: 'tentative',
	accepted: 'accepted',
	declined: 'declined'
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const INDEX_NAMES: Record<number, string> = {
	1: 'first',
	2: 'second',
	3: 'third',
	4: 'fourth',
	[-1]: 'last'
};

/** Converts an RRULE into Graph's `patternedRecurrence`. Throws for rules Graph can't express. */
export function toGraphRecurrence(rule: RecurrenceRule, start: Date): Record<string, unknown> {
	const interval = rule.interval ?? 1;
	const unsupported = () =>
		new CalendarProviderError('Outlook cannot store this repeat pattern', { code: 'invalid' });
	if (rule.bySetPos?.length) throw unsupported();

	let pattern: Record<string, unknown>;
	const nthDays = rule.byDay?.filter((d) => d.nth !== undefined) ?? [];
	switch (rule.freq) {
		case 'DAILY':
			pattern = { type: 'daily', interval };
			break;
		case 'WEEKLY':
			pattern = {
				type: 'weekly',
				interval,
				daysOfWeek: (rule.byDay?.map((d) => d.day) ?? [WEEKDAY_CODES[start.getDay()]]).map(
					(code) => DAY_NAMES[weekdayIndex(code)]
				),
				// RRULE weeks start on Monday unless WKST says otherwise.
				firstDayOfWeek: DAY_NAMES[weekdayIndex(rule.weekStart ?? 'MO')]
			};
			break;
		case 'MONTHLY':
		case 'YEARLY': {
			const yearly = rule.freq === 'YEARLY';
			const month = rule.byMonth?.[0] ?? start.getMonth() + 1;
			if (nthDays.length) {
				const nth = nthDays[0].nth!;
				if (!INDEX_NAMES[nth] || new Set(nthDays.map((d) => d.nth)).size > 1) throw unsupported();
				pattern = {
					type: yearly ? 'relativeYearly' : 'relativeMonthly',
					interval,
					daysOfWeek: nthDays.map((d) => DAY_NAMES[weekdayIndex(d.day)]),
					index: INDEX_NAMES[nth],
					...(yearly ? { month } : {})
				};
			} else {
				const dayOfMonth = rule.byMonthDay?.[0] ?? start.getDate();
				if (dayOfMonth < 1) throw unsupported();
				pattern = {
					type: yearly ? 'absoluteYearly' : 'absoluteMonthly',
					interval,
					dayOfMonth,
					...(yearly ? { month } : {})
				};
			}
			break;
		}
	}

	const startDate = toDateKey(start);
	const range = rule.count
		? { type: 'numbered', startDate, numberOfOccurrences: rule.count }
		: rule.until
			? { type: 'endDate', startDate, endDate: toDateKey(rule.until) }
			: { type: 'noEnd', startDate };
	return { pattern, range };
}

function colorOf(calendar: GraphCalendar): string | undefined {
	if (calendar.hexColor) return calendar.hexColor;
	return calendar.color ? GRAPH_COLORS[calendar.color] : undefined;
}

export function fromGraphEvent(g: GraphEvent, calendarId: string, account?: string): ProviderEvent {
	const event: ProviderEvent = {
		id: g.id,
		calendarId,
		title: g.subject ?? '',
		start: fromLocalIsoString(g.start.dateTime),
		end: fromLocalIsoString(g.end.dateTime),
		allDay: Boolean(g.isAllDay)
	};
	const description = g.body?.contentType === 'text' ? g.body.content : g.bodyPreview;
	if (description) event.description = description;
	if (g.location?.displayName) event.location = g.location.displayName;
	if (g.webLink) event.url = g.webLink;
	if (g.originalStartTimeZone) event.timeZone = g.originalStartTimeZone;
	if (g.isCancelled) event.status = 'cancelled';
	else if (g.responseStatus?.response === 'tentativelyAccepted') event.status = 'tentative';
	if (g.showAs === 'free') event.transparency = 'free';
	if (g.seriesMasterId) event.recurringEventId = g.seriesMasterId;
	if (g.originalStart) event.originalStart = new Date(g.originalStart);
	if (g.isOrganizer === false) event.readOnly = true;

	const joinUrl = g.onlineMeeting?.joinUrl ?? g.onlineMeetingUrl;
	if (joinUrl) {
		event.conference = detectConference(joinUrl) ?? {
			url: joinUrl,
			kind: 'teams',
			label: 'Microsoft Teams'
		};
	} else {
		const detected = detectConference(g.location?.displayName, description);
		if (detected) event.conference = detected;
	}

	if (g.organizer) {
		event.organizer = {
			email: g.organizer.emailAddress.address,
			name: g.organizer.emailAddress.name
		};
	}
	const self = account?.toLowerCase();
	const attendees = g.attendees?.filter((a) => a.type !== 'resource');
	if (attendees?.length) {
		event.attendees = attendees.map((a): CalendarAttendee => {
			const email = a.emailAddress.address;
			const attendee: CalendarAttendee = { email };
			if (a.emailAddress.name) attendee.name = a.emailAddress.name;
			if (a.status) attendee.response = RESPONSE_MAP[a.status.response];
			if (a.type === 'optional') attendee.optional = true;
			if (event.organizer?.email.toLowerCase() === email.toLowerCase()) attendee.organizer = true;
			if (self && email.toLowerCase() === self) {
				attendee.self = true;
				if (g.responseStatus) attendee.response = RESPONSE_MAP[g.responseStatus.response];
			}
			return attendee;
		});
	}
	if (g.isReminderOn && g.reminderMinutesBeforeStart !== undefined) {
		event.reminders = [g.reminderMinutesBeforeStart];
	}
	return event;
}

export function toGraphBody(changes: EventChanges, timeZone: string): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (changes.title !== undefined) body.subject = changes.title;
	if (changes.description !== undefined)
		body.body = { contentType: 'text', content: changes.description };
	if (changes.location !== undefined) body.location = { displayName: changes.location };
	if (changes.allDay !== undefined) body.isAllDay = changes.allDay;
	if (changes.start) body.start = { dateTime: toLocalIsoString(changes.start), timeZone };
	if (changes.end) body.end = { dateTime: toLocalIsoString(changes.end), timeZone };
	if (changes.transparency) body.showAs = changes.transparency === 'free' ? 'free' : 'busy';
	if (changes.attendees) {
		body.attendees = changes.attendees.map((a) => ({
			emailAddress: { address: a.email, name: a.name },
			type: a.optional ? 'optional' : 'required'
		}));
	}
	if (changes.reminders) {
		body.isReminderOn = changes.reminders.length > 0;
		if (changes.reminders.length) body.reminderMinutesBeforeStart = Math.min(...changes.reminders);
	}
	if (changes.recurrence !== undefined) {
		body.recurrence =
			changes.recurrence && changes.start
				? toGraphRecurrence(changes.recurrence, changes.start)
				: null;
	}
	if (changes.requestConference === 'teams') {
		body.isOnlineMeeting = true;
		body.onlineMeetingProvider = 'teamsForBusiness';
	} else if (changes.conference === null) {
		body.isOnlineMeeting = false;
	}
	return body;
}

export function createMicrosoftCalendarProvider(
	options: MicrosoftCalendarProviderOptions
): CalendarProvider {
	const {
		account,
		id = `microsoft:${account ?? 'default'}`,
		label = 'Outlook',
		calendarIds
	} = options;
	const timeZone = getSystemTimeZone();
	const http = createHttpClient({
		baseUrl: options.baseUrl ?? 'https://graph.microsoft.com/v1.0',
		getAccessToken: options.getAccessToken,
		fetch: options.fetch,
		headers: { Prefer: `outlook.timezone="${timeZone}"` }
	});
	const eventPath = (eventId: string) => `/me/events/${encodeURIComponent(eventId)}`;

	return {
		id,
		kind: 'microsoft',
		label,
		account,
		capabilities: {
			write: true,
			freeBusy: true,
			respond: true,
			conferencing: ['teams'],
			recurrence: 'provider'
		},

		async listCalendars(signal) {
			const calendars: ProviderCalendar[] = [];
			let next: string | undefined = '/me/calendars?$top=100';
			while (next) {
				const page: { value: GraphCalendar[]; '@odata.nextLink'?: string } = await http.request(
					next,
					{ signal }
				);
				for (const c of page.value) {
					if (calendarIds && !calendarIds.includes(c.id)) continue;
					calendars.push({
						id: c.id,
						name: c.name,
						color: colorOf(c),
						readOnly: c.canEdit === false,
						primary: c.isDefaultCalendar
					});
				}
				next = page['@odata.nextLink'];
			}
			return calendars;
		},

		async listEvents({ calendarId, start, end, signal }) {
			const events: ProviderEvent[] = [];
			let next: string | undefined = `/me/calendars/${encodeURIComponent(calendarId)}/calendarView`;
			let query: Record<string, string | number> | undefined = {
				startDateTime: start.toISOString(),
				endDateTime: end.toISOString(),
				$top: 250
			};
			while (next) {
				const page: { value: GraphEvent[]; '@odata.nextLink'?: string } = await http.request(next, {
					query,
					signal
				});
				for (const item of page.value) {
					if (!item.isCancelled) events.push(fromGraphEvent(item, calendarId, account));
				}
				next = page['@odata.nextLink'];
				query = undefined;
			}
			return events;
		},

		async createEvent(calendarId, draft) {
			const created = await http.request<GraphEvent>(
				`/me/calendars/${encodeURIComponent(calendarId)}/events`,
				{
					method: 'POST',
					body: toGraphBody(draft, timeZone)
				}
			);
			return fromGraphEvent(created, calendarId, account);
		},

		async updateEvent({ calendarId, eventId, event, changes, scope, occurrence }) {
			const seriesId = scope === 'all' ? event.recurringEventId : undefined;
			let effective = changes;
			if (seriesId && (changes.start || changes.end)) {
				const master = fromGraphEvent(
					await http.request<GraphEvent>(eventPath(seriesId)),
					calendarId,
					account
				);
				const shifted = shiftSeriesTimes(master, occurrence ?? event, changes);
				if (shifted) effective = { ...changes, ...shifted };
			}
			if (changes.recurrence && !effective.start) effective = { ...effective, start: event.start };
			const updated = await http.request<GraphEvent>(eventPath(seriesId ?? eventId), {
				method: 'PATCH',
				body: toGraphBody(effective, timeZone)
			});
			return fromGraphEvent(updated, calendarId, account);
		},

		async deleteEvent({ eventId, event, scope }) {
			const target = scope === 'all' && event.recurringEventId ? event.recurringEventId : eventId;
			try {
				await http.request(eventPath(target), { method: 'DELETE' });
			} catch (error) {
				if (!(error instanceof CalendarProviderError && error.code === 'not-found')) throw error;
			}
		},

		async respond({ eventId, response }) {
			const action = { accepted: 'accept', declined: 'decline', tentative: 'tentativelyAccept' }[
				response as 'accepted' | 'declined' | 'tentative'
			];
			if (!action) throw new CalendarProviderError('Unsupported response', { code: 'invalid' });
			await http.request(`${eventPath(eventId)}/${action}`, {
				method: 'POST',
				body: { sendResponse: true }
			});
		},

		async getFreeBusy({ emails, start, end, signal }) {
			const response = await http.request<{
				value: {
					scheduleId: string;
					scheduleItems?: { status: string; start: GraphDateTime; end: GraphDateTime }[];
				}[];
			}>('/me/calendar/getSchedule', {
				method: 'POST',
				body: {
					schedules: emails,
					startTime: { dateTime: toLocalIsoString(start), timeZone },
					endTime: { dateTime: toLocalIsoString(end), timeZone },
					availabilityViewInterval: 15
				},
				signal
			});
			const result: Record<string, TimeInterval[]> = {};
			for (const email of emails) result[email] = [];
			// Graph may echo an address in a different case than it was asked for.
			const requested = new Map(emails.map((email) => [email.toLowerCase(), email]));
			for (const schedule of response.value ?? []) {
				const email = requested.get(schedule.scheduleId.toLowerCase()) ?? schedule.scheduleId;
				result[email] = (schedule.scheduleItems ?? [])
					.filter((item) => item.status !== 'free')
					.map((item) => ({
						start: fromLocalIsoString(item.start.dateTime),
						end: fromLocalIsoString(item.end.dateTime)
					}));
			}
			return result;
		}
	};
}
