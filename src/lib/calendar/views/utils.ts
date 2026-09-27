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

/** Accessible name: title, time and calendar in one sentence. */
export function occurrenceAriaLabel(
	occurrence: DisplayOccurrence,
	labels: CalendarLabels,
	formatters: CalendarFormatters
): string {
	const parts = [
		occurrenceTitle(occurrence, labels),
		formatters.occurrenceLabel(occurrence.displayStart, occurrence.displayEnd, occurrence.allDay),
		occurrence.calendar.name
	];
	if (occurrence.event.location) parts.push(occurrence.event.location);
	const response = selfResponse(occurrence.event);
	if (response === 'declined') parts.push(labels.no);
	else if (response === 'tentative') parts.push(labels.maybe);
	return parts.join(', ');
}
