/**
 * Every user-facing string the calendar renders. Pass a partial override via
 * the `labels` prop to translate or reword; dates and times are localised by
 * `Intl` from the `locale` prop and need no labels.
 */
export interface CalendarLabels {
	today: string;
	previous: string;
	next: string;
	previousMonth: string;
	nextMonth: string;
	datePicker: string;
	create: string;
	newEvent: string;
	search: string;
	clearSearch: string;
	allDay: string;
	noTitle: string;
	more: (count: number) => string;
	moreEvents: (count: number) => string;
	calendars: string;
	addCalendar: string;
	refresh: string;
	syncing: string;
	lastSynced: (relative: string) => string;
	reconnect: string;
	retry: string;
	readOnly: string;
	showOnly: string;
	changeColor: string;
	disconnect: string;
	toggleSidebar: string;
	views: string;
	keyboardShortcuts: string;
	weekNumber: (week: number) => string;
	noEvents: string;
	noEventsHint: string;
	// Event details
	edit: string;
	delete: string;
	duplicate: string;
	close: string;
	join: (label: string) => string;
	copyLink: string;
	linkCopied: string;
	guests: (count: number) => string;
	guestSummary: (yes: number, no: number, maybe: number, awaiting: number) => string;
	organizer: string;
	going: string;
	yes: string;
	no: string;
	maybe: string;
	addToCalendar: string;
	downloadIcs: string;
	openInGoogle: string;
	openInOutlook: string;
	openOriginal: string;
	reminderBefore: (minutes: string) => string;
	// Editor
	addTitle: string;
	title: string;
	date: string;
	start: string;
	end: string;
	endDate: string;
	timeZone: string;
	repeat: string;
	customRepeat: string;
	every: string;
	repeatOn: string;
	ends: string;
	never: string;
	onDate: string;
	after: string;
	occurrences: string;
	guestsField: string;
	addGuests: string;
	optional: string;
	removeGuest: (name: string) => string;
	findATime: string;
	suggestedTimes: string;
	noSuggestions: string;
	checkingAvailability: string;
	busyAt: (names: string) => string;
	allAvailable: string;
	conflictWith: (title: string) => string;
	location: string;
	addLocation: string;
	video: string;
	addVideo: (label: string) => string;
	videoOnSave: (label: string) => string;
	removeVideo: string;
	calendar: string;
	color: string;
	defaultColor: string;
	availability: string;
	busy: string;
	free: string;
	reminders: string;
	addReminder: string;
	description: string;
	addDescription: string;
	moreOptions: string;
	save: string;
	saving: string;
	cancel: string;
	discard: string;
	discardChanges: string;
	keepEditing: string;
	editEvent: string;
	// Validation
	endBeforeStart: string;
	invalidEmail: (email: string) => string;
	untilBeforeStart: string;
	// Recurring scope
	editRecurring: string;
	deleteRecurring: string;
	moveRecurring: string;
	thisEvent: string;
	allEvents: string;
	confirm: string;
	// Connect
	connectTitle: string;
	connectDescription: string;
	subscribeUrl: string;
	subscribeUrlHint: string;
	subscribe: string;
	importFile: string;
	importInto: string;
	importDone: (count: number) => string;
	connecting: string;
	connectWaiting: string;
	// Feedback
	eventCreated: string;
	eventUpdated: string;
	eventMoved: string;
	eventDeleted: string;
	undo: string;
	responseSaved: string;
	noWritableCalendar: string;
	readOnlyEvent: string;
}

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
	today: 'Today',
	previous: 'Previous',
	next: 'Next',
	previousMonth: 'Previous month',
	nextMonth: 'Next month',
	datePicker: 'Date picker',
	create: 'Create',
	newEvent: 'New event',
	search: 'Search events',
	clearSearch: 'Clear search',
	allDay: 'All day',
	noTitle: '(No title)',
	more: (count) => `+${count} more`,
	moreEvents: (count) => `${count} more events`,
	calendars: 'Calendars',
	addCalendar: 'Add calendar',
	refresh: 'Refresh',
	syncing: 'Syncing…',
	lastSynced: (relative) => `Synced ${relative}`,
	reconnect: 'Reconnect',
	retry: 'Retry',
	readOnly: 'Read-only',
	showOnly: 'Display this only',
	changeColor: 'Change color',
	disconnect: 'Disconnect',
	toggleSidebar: 'Toggle sidebar',
	views: 'Calendar view',
	keyboardShortcuts: 'Keyboard shortcuts',
	weekNumber: (week) => `Week ${week}`,
	noEvents: 'Nothing scheduled',
	noEventsHint: 'Enjoy the free time — or plan something.',
	edit: 'Edit',
	delete: 'Delete',
	duplicate: 'Duplicate',
	close: 'Close',
	join: (label) => `Join with ${label}`,
	copyLink: 'Copy link',
	linkCopied: 'Link copied',
	guests: (count) => `${count} ${count === 1 ? 'guest' : 'guests'}`,
	guestSummary: (yes, no, maybe, awaiting) =>
		[
			yes && `${yes} yes`,
			no && `${no} no`,
			maybe && `${maybe} maybe`,
			awaiting && `${awaiting} awaiting`
		]
			.filter(Boolean)
			.join(', '),
	organizer: 'Organizer',
	going: 'Going?',
	yes: 'Yes',
	no: 'No',
	maybe: 'Maybe',
	addToCalendar: 'Add to calendar',
	downloadIcs: 'Download .ics',
	openInGoogle: 'Google Calendar',
	openInOutlook: 'Outlook',
	openOriginal: 'Open in source calendar',
	reminderBefore: (minutes) => `${minutes} before`,
	addTitle: 'Add title',
	title: 'Title',
	date: 'Date',
	start: 'Start',
	end: 'End',
	endDate: 'End date',
	timeZone: 'Time zone',
	repeat: 'Repeat',
	customRepeat: 'Custom…',
	every: 'Repeat every',
	repeatOn: 'Repeat on',
	ends: 'Ends',
	never: 'Never',
	onDate: 'On',
	after: 'After',
	occurrences: 'occurrences',
	guestsField: 'Guests',
	addGuests: 'Add guests by email',
	optional: 'Optional',
	removeGuest: (name) => `Remove ${name}`,
	findATime: 'Find a time',
	suggestedTimes: 'Suggested times',
	noSuggestions: 'No common free time in the next week.',
	checkingAvailability: 'Checking availability…',
	busyAt: (names) => `Busy: ${names}`,
	allAvailable: 'Everyone is available',
	conflictWith: (title) => `Overlaps “${title}”`,
	location: 'Location',
	addLocation: 'Add location',
	video: 'Video conferencing',
	addVideo: (label) => `Add ${label}`,
	videoOnSave: (label) => `${label} link will be created when you save`,
	removeVideo: 'Remove video conferencing',
	calendar: 'Calendar',
	color: 'Color',
	defaultColor: 'Calendar color',
	availability: 'Show as',
	busy: 'Busy',
	free: 'Free',
	reminders: 'Reminders',
	addReminder: 'Add reminder',
	description: 'Description',
	addDescription: 'Add description or agenda',
	moreOptions: 'More options',
	save: 'Save',
	saving: 'Saving…',
	cancel: 'Cancel',
	discard: 'Discard',
	discardChanges: 'Discard unsaved changes?',
	keepEditing: 'Keep editing',
	editEvent: 'Edit event',
	endBeforeStart: 'End must be after start',
	invalidEmail: (email) => `“${email}” isn’t a valid email`,
	untilBeforeStart: 'Must end after the first occurrence',
	editRecurring: 'Edit recurring event',
	deleteRecurring: 'Delete recurring event',
	moveRecurring: 'Move recurring event',
	thisEvent: 'This event',
	allEvents: 'All events',
	confirm: 'OK',
	connectTitle: 'Add calendar',
	connectDescription: 'Connect an account, subscribe to a feed, or import an .ics file.',
	subscribeUrl: 'Subscribe from URL',
	subscribeUrlHint: 'https:// or webcal:// address of an iCalendar feed',
	subscribe: 'Subscribe',
	importFile: 'Import .ics file',
	importInto: 'Import into',
	importDone: (count) => `Imported ${count} ${count === 1 ? 'event' : 'events'}`,
	connecting: 'Connecting…',
	connectWaiting: 'Finish signing in in your browser. Stuck? Cancel and try again.',
	eventCreated: 'Event created',
	eventUpdated: 'Event updated',
	eventMoved: 'Event moved',
	eventDeleted: 'Event deleted',
	undo: 'Undo',
	responseSaved: 'Response saved',
	noWritableCalendar: 'Connect or create a writable calendar first',
	readOnlyEvent: 'This event can’t be edited'
};
