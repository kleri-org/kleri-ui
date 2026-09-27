// Full calendar API, also available as `@kleri/ui/calendar`.

// Component
export { default as KleriCalendar } from './KleriCalendar.svelte';
export { default as MiniCalendar } from './ui/MiniCalendar.svelte';

// Store
export {
	CalendarStore,
	createCalendarStore,
	KLERI_CALENDAR_PALETTE,
	type CalendarSource,
	type CalendarStoreError,
	type CalendarStoreOptions,
	type SourceStatus,
	type StoreOperation
} from './store/calendar-store.svelte.js';

// Providers
export {
	CalendarProviderError,
	isAbortError,
	type AccessTokenGetter,
	type CalendarProvider,
	type DeleteEventInput,
	type FreeBusyQuery,
	type ListEventsQuery,
	type OccurrenceRef,
	type ProviderCapabilities,
	type ProviderErrorCode,
	type RespondInput,
	type UpdateEventInput
} from './providers/types.js';
export {
	createMemoryProvider,
	type MemoryProvider,
	type MemoryProviderOptions,
	type MemorySnapshot
} from './providers/memory.js';
export {
	createGoogleCalendarProvider,
	fromGoogleEvent,
	toGoogleBody,
	GOOGLE_EVENT_COLORS,
	type GoogleCalendarProviderOptions
} from './providers/google.js';
export {
	createMicrosoftCalendarProvider,
	fromGraphEvent,
	toGraphBody,
	toGraphRecurrence,
	type MicrosoftCalendarProviderOptions
} from './providers/microsoft.js';
export { createIcsFeedProvider, type IcsFeedProviderOptions } from './providers/ics-feed.js';
export {
	createHttpClient,
	type HttpClient,
	type HttpClientOptions,
	type RequestOptions
} from './providers/http.js';
export { applyChanges, shiftSeriesTimes, isEventRelevant } from './providers/shared.js';

// Views
export {
	agendaView,
	createAgendaView,
	createMonthView,
	createTimeGridView,
	dayView,
	defaultCalendarViews,
	monthView,
	threeDayView,
	weekView,
	type AgendaViewOptions,
	type MonthViewOptions,
	type TimeGridViewOptions
} from './views/registry.js';
export type { CalendarViewDefinition, CalendarViewProps, ViewRangeContext } from './views/types.js';
export { default as EventBlock } from './views/parts/EventBlock.svelte';
export { default as EventPill } from './views/parts/EventPill.svelte';
export {
	DayGridDrag,
	type DayGridDragOptions,
	type DayGridPreview
} from './views/day-grid-drag.svelte.js';
export {
	eventStateAttributes,
	isAllDayLike,
	occurrenceAriaLabel,
	occurrenceTitle,
	selfResponse
} from './views/utils.js';

// Context, for custom views
export {
	getCalendarContext,
	type CalendarActions,
	type CalendarContext,
	type EventContentArgs,
	type ResolvedCalendarConfig,
	type WallRange
} from './context.js';
export { DEFAULT_CALENDAR_LABELS, type CalendarLabels } from './labels.js';

// Core utilities
export * from './core/date.js';
export {
	describeRecurrence,
	expandRecurrence,
	formatRRule,
	isSameRule,
	matchRecurrencePreset,
	parseRRule,
	recurrencePresets,
	truncateRule,
	WEEKDAY_CODES,
	type ByDay,
	type ExpandOptions,
	type RecurrenceFrequency,
	type RecurrencePreset,
	type RecurrenceRule,
	type WeekdayCode
} from './core/recurrence.js';
export {
	CONFERENCE_LABELS,
	detectConference,
	downloadICS,
	googleCalendarUrl,
	icsFileName,
	outlookCalendarUrl,
	parseICS,
	serializeICS,
	type ParsedCalendar,
	type SerializeOptions
} from './core/ics.js';
export {
	createZonedClock,
	formatTimeZoneLabel,
	getSystemTimeZone,
	getTimeZoneOffset,
	getZonedParts,
	isValidTimeZone,
	listTimeZones,
	zonedPartsToInstant,
	type ZonedClock,
	type ZonedParts
} from './core/timezone.js';
export {
	DEFAULT_WORKING_HOURS,
	findAvailableSlots,
	findConflicts,
	isBusy,
	mergeIntervals,
	type FindSlotsOptions
} from './core/availability.js';
export {
	countHiddenPerDay,
	layoutDaySpans,
	layoutTimeGrid,
	type PositionedItem,
	type SpanItem
} from './core/layout.js';
export {
	createFormatters,
	formatDateRange,
	localeUses12Hour,
	localeWeekStart,
	type CalendarFormatters
} from './core/format.js';
export { safeColor, safeUrl } from './core/safe.js';

// Model
export type * from './types.js';
