import type {
	AttendeeResponse,
	CalendarProviderKind,
	ConferenceKind,
	EditScope,
	EventChanges,
	EventDraft,
	ProviderCalendar,
	ProviderEvent,
	TimeInterval
} from '../types.js';

/**
 * The contract every calendar source implements. Adapters speak in their own
 * calendar ids; the store namespaces them, so two accounts can both have a
 * calendar called `primary` without clashing.
 *
 * Only `listCalendars` and `listEvents` are required — a read-only feed can
 * stop there. Write methods are optional and advertised via `capabilities`.
 */
export interface CalendarProvider {
	/** Unique per connected account, e.g. `google:ada@example.com`. */
	readonly id: string;
	readonly kind: CalendarProviderKind;
	/** Shown as the group heading in the sidebar. */
	readonly label: string;
	/** Account identifier shown under the label, typically an email. */
	readonly account?: string;
	readonly capabilities: ProviderCapabilities;

	listCalendars(signal?: AbortSignal): Promise<ProviderCalendar[]>;
	listEvents(query: ListEventsQuery): Promise<ProviderEvent[]>;

	createEvent?(calendarId: string, draft: EventDraft): Promise<ProviderEvent>;
	updateEvent?(input: UpdateEventInput): Promise<ProviderEvent | void>;
	deleteEvent?(input: DeleteEventInput): Promise<void>;
	/** RSVP on behalf of the signed-in user. */
	respond?(input: RespondInput): Promise<ProviderEvent | void>;
	/** Busy intervals per email, for "find a time". */
	getFreeBusy?(query: FreeBusyQuery): Promise<Record<string, TimeInterval[]>>;
	/** Push notifications (webhooks, other tabs…). Returns an unsubscribe function. */
	subscribe?(onChange: () => void): () => void;
	dispose?(): void;
}

export interface ProviderCapabilities {
	/** The provider implements `createEvent`/`updateEvent`/`deleteEvent`. */
	write: boolean;
	/** The provider implements `getFreeBusy`. */
	freeBusy: boolean;
	/** The provider implements `respond`. */
	respond?: boolean;
	/** Conferences the provider creates itself when `draft.requestConference` is set. */
	conferencing?: ConferenceKind[];
	/**
	 * `provider` — `listEvents` returns ready-made instances of recurring series.
	 * `client`   — it returns series masters with a `recurrence` rule, plus any
	 *              overridden instances, and the store expands them.
	 */
	recurrence: 'provider' | 'client';
}

export interface ListEventsQuery {
	calendarId: string;
	start: Date;
	end: Date;
	signal?: AbortSignal;
}

/** Identifies one instance of a recurring series. */
export interface OccurrenceRef {
	/** Current start/end of the instance. */
	start: Date;
	end: Date;
	/** Unmodified start of the instance within its series. */
	originalStart?: Date;
	recurringEventId?: string;
}

export interface UpdateEventInput {
	calendarId: string;
	eventId: string;
	/** The event as last loaded, for providers that need the full record. */
	event: ProviderEvent;
	changes: EventChanges;
	scope: EditScope;
	/** Set when the edit targets one instance of a recurring series. */
	occurrence?: OccurrenceRef;
}

export interface DeleteEventInput {
	calendarId: string;
	eventId: string;
	event: ProviderEvent;
	scope: EditScope;
	occurrence?: OccurrenceRef;
}

export interface RespondInput {
	calendarId: string;
	eventId: string;
	event: ProviderEvent;
	response: AttendeeResponse;
}

export interface FreeBusyQuery {
	emails: string[];
	start: Date;
	end: Date;
	signal?: AbortSignal;
}

export type ProviderErrorCode =
	| 'auth'
	| 'forbidden'
	| 'not-found'
	| 'conflict'
	| 'rate-limit'
	| 'network'
	| 'invalid'
	| 'aborted'
	| 'unknown';

/** Every error a built-in provider throws. `code: 'auth'` means "reconnect". */
export class CalendarProviderError extends Error {
	readonly code: ProviderErrorCode;
	readonly status?: number;
	readonly retryable: boolean;

	constructor(
		message: string,
		options: {
			code?: ProviderErrorCode;
			status?: number;
			retryable?: boolean;
			cause?: unknown;
		} = {}
	) {
		super(message, { cause: options.cause });
		this.name = 'CalendarProviderError';
		this.code = options.code ?? 'unknown';
		this.status = options.status;
		this.retryable = options.retryable ?? false;
	}
}

export function isAbortError(error: unknown): boolean {
	return (
		(error instanceof DOMException && error.name === 'AbortError') ||
		(error instanceof CalendarProviderError && error.code === 'aborted') ||
		(error instanceof Error && error.name === 'AbortError')
	);
}

/** Supplies an OAuth access token; `forceRefresh` asks for a new one after a 401. */
export type AccessTokenGetter = (options: { forceRefresh: boolean }) => string | Promise<string>;
