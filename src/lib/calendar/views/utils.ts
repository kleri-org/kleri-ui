import type { AttendeeResponse, CalendarEvent, DisplayOccurrence } from '../types.js';
import type { CalendarLabels } from '../labels.js';
import type { CalendarFormatters } from '../core/format.js';
import { MS_PER_DAY } from '../core/date.js';

/** The signed-in user's RSVP, when they are a guest. */
export function selfResponse(event: CalendarEvent): AttendeeResponse | undefined {
	const self = event.attendees?.find((a) => a.self);
	if (!self || self.organizer) return undefined;
	return self.response ?? 'needsAction';
}

export function occurrenceTitle(occurrence: DisplayOccurrence, labels: CalendarLabels): string {
	return occurrence.event.title.trim() || labels.noTitle;
}

/** Items that belong in an all-day strip: all-day events and timed ones lasting a day or more. */
export function isAllDayLike(occurrence: DisplayOccurrence): boolean {
	return (
		occurrence.allDay ||
		occurrence.displayEnd.getTime() - occurrence.displayStart.getTime() >= MS_PER_DAY
	);
}

/** Data attributes that drive the `kleri-event` states. */
export function eventStateAttributes(occurrence: DisplayOccurrence, now: Date, dimPast: boolean) {
	const response = selfResponse(occurrence.event);
	return {
		'data-response': response,
		'data-tentative': String(occurrence.event.status === 'tentative' || response === 'tentative'),
		'data-past': String(dimPast && occurrence.displayEnd <= now),
		'data-pending': String(occurrence.pending)
	};
}

/** What a control renders after the event title, so its accessible name can contain it. */
export interface ShownText {
	/** The time text as rendered. */
	time: string;
	/** True when `time` is the full range, so only the date needs adding to the name. */
	fullRange?: boolean;
	/** True when the location is rendered after the time. */
	location?: boolean;
}

/**
 * Accessible name: title, time and calendar in one sentence. Pass `shown` when the control
 * renders more than "title, time range" so the name still contains the visible text in
 * order (WCAG 2.5.3, label in name).
 */
export function occurrenceAriaLabel(
	occurrence: DisplayOccurrence,
	labels: CalendarLabels,
	formatters: CalendarFormatters,
	shown?: ShownText
): string {
	const title = occurrenceTitle(occurrence, labels);
	const location = occurrence.event.location;
	const when = formatters.occurrenceLabel(
		occurrence.displayStart,
		occurrence.displayEnd,
		occurrence.allDay
	);
	const parts: string[] = [];
	if (shown) {
		parts.push(title, shown.time);
		if (shown.location && location) parts.push(location);
		parts.push(shown.fullRange ? formatters.fullDate(occurrence.displayStart) : when);
	} else {
		parts.push(title, when);
	}
	parts.push(occurrence.calendar.name);
	if (location && !(shown?.location ?? false)) parts.push(location);
	const response = selfResponse(occurrence.event);
	if (response === 'declined') parts.push(labels.no);
	else if (response === 'tentative') parts.push(labels.maybe);
	return parts.join(', ');
}
