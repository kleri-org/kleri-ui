<script lang="ts">
	import { onMount, tick, untrack, type Snippet } from 'svelte';
	import { Popover } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import {
		setCalendarContext,
		type CalendarActions,
		type EventContentArgs,
		type ResolvedCalendarConfig,
		type WallRange
	} from './context.js';
	import { DEFAULT_CALENDAR_LABELS, type CalendarLabels } from './labels.js';
	import type { CalendarStore, CalendarSource } from './store/calendar-store.svelte.js';
	import type { CalendarProvider } from './providers/types.js';
	import type {
		AttendeeResponse,
		CalendarEvent,
		CalendarIntegration,
		CalendarOccurrence,
		CalendarPerson,
		ConferenceProvider,
		DisplayOccurrence,
		EditScope,
		EventChanges,
		EventDraft,
		WorkingHours
	} from './types.js';
	import { addDays, addMinutes, atMinutes, ceilToStep, startOfDay } from './core/date.js';
	import { createFormatters, localeUses12Hour, localeWeekStart } from './core/format.js';
	import { createZonedClock } from './core/timezone.js';
	import { DEFAULT_WORKING_HOURS } from './core/availability.js';
	import { isSameRule } from './core/recurrence.js';
	import { randomId } from './providers/shared.js';
	import { defaultCalendarViews } from './views/registry.js';
	import type { CalendarViewDefinition, ViewRangeContext } from './views/types.js';
	import { occurrenceTitle } from './views/utils.js';
	import CalendarToolbar from './ui/CalendarToolbar.svelte';
	import CalendarSidebar from './ui/CalendarSidebar.svelte';
	import EventDetails from './ui/EventDetails.svelte';
	import QuickCreate from './ui/QuickCreate.svelte';
	import EventEditor, { type EditorInitial, type EditorSubmit } from './ui/EventEditor.svelte';
	import ScopeDialog from './ui/ScopeDialog.svelte';
	import ConnectCalendarDialog from './ui/ConnectCalendarDialog.svelte';
	import ShortcutsDialog from './ui/ShortcutsDialog.svelte';
	import CalendarToasts, { type CalendarToast } from './ui/CalendarToasts.svelte';

	interface Props {
		/** The data source. Create it with `new CalendarStore({ providers })`. */
		store: CalendarStore;
		/** Id of the active view. Bindable. @default 'week' */
		view?: string;
		/** Focus date. Bindable. @default today */
		date?: Date;
		/** Available views, in switcher order. Add your own (timeline, chart…) here. */
		views?: CalendarViewDefinition[];
		/** BCP 47 locale for every date and time. @default the browser's */
		locale?: string;
		/** IANA zone to display times in. @default the system zone */
		timeZone?: string;
		/** `0` = Sunday. @default from the locale */
		weekStartsOn?: number;
		/** Hide Saturday and Sunday in multi-day views. */
		hideWeekends?: boolean;
		/** Weekdays to hide in multi-day views (overrides `hideWeekends`). */
		hiddenDays?: number[];
		/** @default from the locale */
		hour12?: boolean;
		/** Shaded outside these hours, and used by "find a time". `null` disables. */
		workingHours?: WorkingHours | null;
		/** Snap step in minutes for dragging and the editor's time lists. @default 15 */
		slotDuration?: number;
		/** Pixel height of an hour in time grids. @default 52 */
		hourHeight?: number;
		dayStartHour?: number;
		dayEndHour?: number;
		/** Length of click-created events, in minutes. @default 30 */
		defaultEventDuration?: number;
		/** Hour time grids open at (when now isn't visible). @default 8 */
		scrollToHour?: number;
		/** Disable every edit, whatever the calendars allow. */
		readOnly?: boolean;
		showWeekNumbers?: boolean;
		/** Fade events that already ended. @default true */
		dimPastEvents?: boolean;
		/** Render the sidebar at all. @default true */
		sidebar?: boolean;
		/** Whether the sidebar is open. Bindable. */
		showSidebar?: boolean;
		/** Global single-key shortcuts (T, J/K, C, D/W/M/A, /, ?). @default true */
		keyboardShortcuts?: boolean;
		/** The signed-in user; organizer of new events and RSVP target. */
		self?: CalendarPerson;
		/** People suggested in the guest field. */
		contacts?: CalendarPerson[];
		/** Accounts offered in "Add calendar" (Google, Outlook… via your OAuth). */
		integrations?: CalendarIntegration[];
		/** Extra conferencing (e.g. Zoom) on top of what providers create themselves. */
		conferenceProviders?: ConferenceProvider[];
		/** Offer iCalendar URL subscriptions in "Add calendar". @default true */
		allowIcsSubscribe?: boolean;
		/** Offer .ics file import in "Add calendar". @default true */
		allowIcsImport?: boolean;
		/** Rewrites iCalendar feed URLs, e.g. through a CORS proxy. */
		icsProxy?: (url: string) => string;
		/**
		 * Offer "Disconnect" on sources: on all of them, or on those the
		 * predicate accepts. @default true
		 */
		allowDisconnect?: boolean | ((source: CalendarSource) => boolean);
		/** Override any user-facing string. */
		labels?: Partial<CalendarLabels>;
		/** Hide occurrences for which this returns `false`. */
		filter?: (occurrence: CalendarOccurrence) => boolean;
		class?: string;

		onRangeChange?: (range: { start: Date; end: Date; view: string }) => void;
		/** Return `false` to replace the built-in details popover with your own UI. */
		onEventOpen?: (occurrence: DisplayOccurrence) => boolean | void;
		onEventCreated?: (event: CalendarEvent) => void;
		onEventUpdated?: (
			occurrence: CalendarOccurrence,
			changes: EventChanges,
			scope: EditScope
		) => void;
		onEventDeleted?: (occurrence: CalendarOccurrence, scope: EditScope) => void;
		/** Called for sources whose credentials expired; re-run your auth flow here. */
		onReconnect?: (source: CalendarSource) => void;
		/** Called after a source is disconnected from the sidebar. */
		onDisconnect?: (source: CalendarSource) => void;

		/** Replace the default content inside every event block. */
		eventContent?: Snippet<[EventContentArgs]>;
		/** Extra section inside the details popover. */
		eventDetails?: Snippet<[DisplayOccurrence]>;
		sidebarFooter?: Snippet;
		toolbarExtra?: Snippet;
	}

	let {
		store,
		view = $bindable('week'),
		date = $bindable(new Date()),
		views = defaultCalendarViews,
		locale,
		timeZone,
		weekStartsOn,
		hideWeekends = false,
		hiddenDays,
		hour12,
		workingHours = DEFAULT_WORKING_HOURS,
		slotDuration = 15,
		hourHeight = 52,
		dayStartHour = 0,
		dayEndHour = 24,
		defaultEventDuration = 30,
		scrollToHour = 8,
		readOnly = false,
		showWeekNumbers = false,
		dimPastEvents = true,
		sidebar = true,
		showSidebar = $bindable(true),
		keyboardShortcuts = true,
		self,
		contacts = [],
		integrations = [],
		conferenceProviders = [],
		allowIcsSubscribe = true,
		allowIcsImport = true,
		icsProxy,
		allowDisconnect = true,
		labels,
		filter,
		class: className,
		onRangeChange,
		onEventOpen,
		onEventCreated,
		onEventUpdated,
		onEventDeleted,
		onReconnect,
		onDisconnect,
		eventContent,
		eventDetails,
		sidebarFooter,
		toolbarExtra
	}: Props = $props();

	// ---------------------------------------------------------------------------
	// Configuration
	// ---------------------------------------------------------------------------

	/** Below this width the sidebar floats over the grid instead of pushing it. */
	const SIDEBAR_INLINE_MIN = 880;

	let mounted = $state(false);
	let rootEl = $state<HTMLElement | null>(null);
	let width = $state(0);
	let searchInput = $state<HTMLInputElement | null>(null);
	let search = $state('');
	let nowInstant = $state(new Date());

	let resolvedLocale = $derived(
		locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
	);
	let clock = $derived(createZonedClock(timeZone));
	let config = $derived<ResolvedCalendarConfig>({
		locale: resolvedLocale,
		weekStartsOn: weekStartsOn ?? localeWeekStart(resolvedLocale),
		hour12: hour12 ?? localeUses12Hour(resolvedLocale),
		hiddenDays: hiddenDays ?? (hideWeekends ? [0, 6] : []),
		workingHours,
		slotDuration,
		hourHeight,
		dayStartHour: Math.max(0, Math.min(dayStartHour, 23)),
		dayEndHour: Math.max(dayStartHour + 1, Math.min(dayEndHour, 24)),
		defaultEventDuration,
		scrollToHour,
		readOnly,
		showWeekNumbers,
		dimPastEvents,
		clock
	});
	let formatters = $derived(createFormatters(config.locale, config.hour12));
	let mergedLabels = $derived<CalendarLabels>({ ...DEFAULT_CALENDAR_LABELS, ...labels });
	let now = $derived(clock.toWall(nowInstant));
	let today = $derived(startOfDay(now));

	let activeView = $derived(views.find((v) => v.id === view) ?? views[0]);
	let rangeContext = $derived<ViewRangeContext>({
		locale: config.locale,
		weekStartsOn: config.weekStartsOn,
		hiddenDays: config.hiddenDays,
		formatters
	});
	let range = $derived(activeView.range(date, rangeContext));
	let title = $derived(activeView.title(range, rangeContext));
	let sidebarMode = $derived<'inline' | 'overlay'>(
		width === 0 || width >= SIDEBAR_INLINE_MIN ? 'inline' : 'overlay'
	);
	let sidebarVisible = $derived(sidebar && showSidebar);

	// Shrinking past the breakpoint collapses an open sidebar instead of
	// suddenly floating it over the grid.
	let previousMode: 'inline' | 'overlay' | null = null;
	$effect(() => {
		const mode = sidebarMode;
		if (previousMode === 'inline' && mode === 'overlay') untrack(() => (showSidebar = false));
		previousMode = mode;
	});

	onMount(() => {
		mounted = true;
		// Start collapsed where the sidebar would cover the grid. A zero width
		// means the calendar isn't laid out yet (hidden tab), so leave it alone.
		const initialWidth = rootEl?.clientWidth ?? 0;
		if (initialWidth > 0 && initialWidth < SIDEBAR_INLINE_MIN) showSidebar = false;
		const timer = setInterval(() => (nowInstant = new Date()), 30_000);
		return () => clearInterval(timer);
	});

	$effect(() => {
		const target = store;
		const padStart = clock.toInstant(addDays(range.start, -1));
		const padEnd = clock.toInstant(addDays(range.end, 1));
		const payload = { start: range.start, end: range.end, view: activeView.id };
		// Loading touches the store's source state; only a new range should re-run this.
		untrack(() => {
			target.setRange(padStart, padEnd);
			onRangeChange?.(payload);
		});
	});

	// ---------------------------------------------------------------------------
	// Occurrences in display time
	// ---------------------------------------------------------------------------

	function matchesSearch(o: CalendarOccurrence, query: string): boolean {
		const e = o.event;
		return [
			e.title,
			e.location,
			e.description,
			o.calendar.name,
			...(e.attendees ?? []).flatMap((a) => [a.email, a.name])
		].some((field) => field?.toLowerCase().includes(query));
	}

	let occurrences = $derived.by(() => {
		const query = search.trim().toLowerCase();
		const list = store.occurrences(
			clock.toInstant(addDays(range.start, -1)),
			clock.toInstant(addDays(range.end, 1))
		);
		const out: DisplayOccurrence[] = [];
		for (const o of list) {
			if (filter && !filter(o)) continue;
			if (query && !matchesSearch(o, query)) continue;
			const displayStart = o.allDay ? o.start : clock.toWall(o.start);
			const displayEnd = o.allDay ? o.end : clock.toWall(o.end);
			const zeroLength = displayStart.getTime() === displayEnd.getTime();
			const visible = zeroLength
				? displayStart >= range.start && displayStart < range.end
				: displayStart < range.end && displayEnd > range.start;
			if (visible) out.push({ ...o, displayStart, displayEnd });
		}
		return out;
	});

	// ---------------------------------------------------------------------------
	// Feedback: toasts and the live region
	// ---------------------------------------------------------------------------

	let toasts = $state.raw<CalendarToast[]>([]);
	let announcement = $state('');

	function toast(message: string, options: Omit<CalendarToast, 'id' | 'message'> = {}) {
		const id = randomId('toast_');
		toasts = [...toasts.slice(-2), { id, message, ...options }];
		setTimeout(
			() => dismissToast(id),
			options.action ? 7000 : options.tone === 'error' ? 6000 : 3500
		);
	}

	function dismissToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	function fail(error: unknown) {
		toast(error instanceof Error ? error.message : String(error), { tone: 'error' });
	}

	async function announce(message: string) {
		announcement = '';
		await tick();
		announcement = message;
	}

	// Surface sync failures once each; mutation failures are toasted where they happen.
	const seenErrors = new Set<string>();
	$effect(() => {
		for (const error of store.errors) {
			if (seenErrors.has(error.id)) continue;
			seenErrors.add(error.id);
			if (error.operation !== 'load') continue;
			const label = store.getSource(error.sourceId)?.provider.label ?? error.sourceId;
			untrack(() => toast(`${label}: ${error.message}`, { tone: 'error' }));
		}
	});

	// ---------------------------------------------------------------------------
	// Popover (details / quick create), editor and prompts
	// ---------------------------------------------------------------------------

	type PopoverState =
		| { kind: 'details'; key: string; anchor: HTMLElement }
		| { kind: 'create'; range: WallRange; anchor: HTMLElement; calendarId: string };

	/** `origin` is the element the editor morphs from (and back to on close). */
	type EditorState =
		| { id: number; mode: 'create'; initial: EditorInitial; origin: HTMLElement | null }
		| {
				id: number;
				mode: 'edit';
				initial: EditorInitial;
				occurrence: DisplayOccurrence;
				origin: HTMLElement | null;
		  };

	let popover = $state.raw<PopoverState | null>(null);
	let draft = $state.raw<WallRange | null>(null);
	let editor = $state.raw<EditorState | null>(null);
	let editorOpen = $state(false);
	let editorSeq = 0;
	let scopePrompt = $state.raw<{
		id: number;
		action: 'edit' | 'delete' | 'move';
		resolve: (scope: EditScope | null) => void;
	} | null>(null);
	let scopeSeq = 0;
	let connectOpen = $state(false);
	let connectOrigin = $state.raw<HTMLElement | null>(null);
	let shortcutsOpen = $state(false);
	let shortcutsOrigin = $state.raw<HTMLElement | null>(null);

	let detailsOccurrence = $derived.by(() => {
		const current = popover;
		return current?.kind === 'details'
			? (occurrences.find((o) => o.key === current.key) ?? null)
			: null;
	});

	$effect(() => {
		// The event vanished (deleted elsewhere, filtered out, moved): close its popover.
		if (popover?.kind === 'details' && !detailsOccurrence) untrack(() => closePopover());
	});

	function closePopover() {
		popover = null;
		if (!editor) draft = null;
	}

	function askScope(action: 'edit' | 'delete' | 'move'): Promise<EditScope | null> {
		// Only one prompt at a time: a newer question cancels the one still open.
		scopePrompt?.resolve(null);
		// The prompt stays mounted until its close animation ends (see ScopeDialog's onClosed).
		return new Promise((resolve) => {
			scopePrompt = { id: ++scopeSeq, action, resolve };
		});
	}

	function toInstant(d: Date, allDay: boolean | undefined): Date {
		return allDay ? d : clock.toInstant(d);
	}

	function draftToInstants(d: EventDraft): EventDraft {
		return {
			...d,
			start: toInstant(d.start, d.allDay),
			end: toInstant(d.end, d.allDay),
			timeZone: d.allDay ? undefined : (d.timeZone ?? clock.timeZone)
		};
	}

	function draftFromEvent(event: CalendarEvent, start = event.start, end = event.end): EventDraft {
		return {
			title: event.title,
			start,
			end,
			allDay: event.allDay,
			description: event.description,
			location: event.location,
			attendees: event.attendees?.map((a) => ({ ...a })),
			recurrence: event.recurrence ?? null,
			transparency: event.transparency,
			reminders: event.reminders,
			color: event.color ?? null,
			conference: event.conference ?? null
		};
	}

	function occurrenceOf(event: CalendarEvent): CalendarOccurrence | undefined {
		return store
			.occurrences(addDays(event.start, -1), addDays(event.end, 1))
			.find((o) => o.event.id === event.id && o.calendar.id === event.calendarId);
	}

	/** Opens the full editor, morphing from `origin` (by default the open popover's anchor). */
	function openEditorForCreate(
		initial: EditorInitial,
		origin: HTMLElement | null = popover?.anchor ?? null
	) {
		popover = null;
		draft = { start: initial.start, end: initial.end, allDay: initial.allDay };
		editor = { id: ++editorSeq, mode: 'create', initial, origin };
		editorOpen = true;
	}

	function openEditorForEdit(occurrence: DisplayOccurrence) {
		// Morph from the event itself: the element the popover opened from, or its first segment.
		const origin =
			popover?.kind === 'details' && popover.key === occurrence.key
				? popover.anchor
				: (rootEl?.querySelector<HTMLElement>(`[data-event-key="${CSS.escape(occurrence.key)}"]`) ??
					null);
		popover = null;
		const { event } = occurrence;
		editor = {
			id: ++editorSeq,
			mode: 'edit',
			occurrence,
			origin,
			initial: {
				calendarId: occurrence.calendar.id,
				start: occurrence.displayStart,
				end: occurrence.displayEnd,
				allDay: occurrence.allDay,
				title: event.title,
				description: event.description,
				location: event.location,
				attendees: event.attendees,
				recurrence: event.recurrence ?? null,
				conference: event.conference ?? null,
				color: event.color ?? null,
				transparency: event.transparency,
				reminders: event.reminders ?? []
			}
		};
		editorOpen = true;
	}

	function defaultNewRange(): WallRange {
		const inRange = now >= range.start && now < range.end;
		const start = inRange
			? ceilToStep(now, 30)
			: atMinutes(date, config.workingHours?.start ?? 9 * 60);
		return { start, end: addMinutes(start, config.defaultEventDuration), allDay: false };
	}

	/** Differences between an occurrence and an edited draft (instants). */
	function diff(occurrence: CalendarOccurrence, next: EventDraft): EventChanges {
		const e = occurrence.event;
		const changes: EventChanges = {};
		if (next.title !== e.title) changes.title = next.title;
		if (Boolean(next.allDay) !== occurrence.allDay) changes.allDay = Boolean(next.allDay);
		if (next.start.getTime() !== occurrence.start.getTime() || changes.allDay !== undefined)
			changes.start = next.start;
		if (next.end.getTime() !== occurrence.end.getTime() || changes.allDay !== undefined)
			changes.end = next.end;
		if ((next.description ?? '') !== (e.description ?? ''))
			changes.description = next.description ?? '';
		if ((next.location ?? '') !== (e.location ?? '')) changes.location = next.location ?? '';
		if (JSON.stringify(next.attendees ?? []) !== JSON.stringify(e.attendees ?? []))
			changes.attendees = next.attendees ?? [];
		if (!isSameRule(next.recurrence, e.recurrence)) changes.recurrence = next.recurrence ?? null;
		if ((next.transparency ?? 'busy') !== (e.transparency ?? 'busy'))
			changes.transparency = next.transparency;
		if (JSON.stringify(next.reminders ?? []) !== JSON.stringify(e.reminders ?? []))
			changes.reminders = next.reminders ?? [];
		if ((next.color ?? null) !== (e.color ?? null)) changes.color = next.color ?? null;
		if (!next.conference && e.conference) changes.conference = null;
		else if (next.conference && next.conference.url !== e.conference?.url)
			changes.conference = next.conference;
		if (next.requestConference) changes.requestConference = next.requestConference;
		return changes;
	}

	async function submitEditor(submit: EditorSubmit): Promise<boolean | void> {
		const state = editor;
		if (!state) return;
		const next = draftToInstants(submit.draft);
		if (submit.conferenceProvider) next.conference = await submit.conferenceProvider.create(next);

		if (state.mode === 'create') {
			const created = await store.createEvent(submit.calendarId, next);
			toast(mergedLabels.eventCreated, {
				action: { label: mergedLabels.undo, run: () => undoCreate(created) }
			});
			void announce(`${mergedLabels.eventCreated}: ${created.title || mergedLabels.noTitle}`);
			onEventCreated?.(created);
			return;
		}

		const { occurrence } = state;
		if (submit.calendarId !== occurrence.calendar.id) {
			let scope: EditScope = 'this';
			if (occurrence.recurring) {
				const picked = await askScope('edit');
				if (!picked) return false;
				scope = picked;
			}
			await store.changeCalendar(occurrence, submit.calendarId, next, scope);
			toast(mergedLabels.eventUpdated);
			void announce(mergedLabels.eventUpdated);
			return;
		}
		const changes = diff(occurrence, next);
		if (!Object.keys(changes).length) return;
		let scope: EditScope = 'this';
		if (occurrence.recurring) {
			// A new repeat rule only makes sense for the whole series.
			if ('recurrence' in changes) scope = 'all';
			else {
				const picked = await askScope('edit');
				if (!picked) return false;
				scope = picked;
			}
		}
		await store.updateOccurrence(occurrence, changes, scope);
		toast(mergedLabels.eventUpdated);
		void announce(mergedLabels.eventUpdated);
		onEventUpdated?.(occurrence, changes, scope);
	}

	async function undoCreate(event: CalendarEvent) {
		const occurrence = occurrenceOf(event);
		if (!occurrence) return;
		try {
			await store.deleteOccurrence(occurrence, 'all');
		} catch (error) {
			fail(error);
		}
	}

	async function quickSave(titleText: string, calendarId: string) {
		if (popover?.kind !== 'create') return;
		const r = popover.range;
		closePopover();
		try {
			const created = await store.createEvent(
				calendarId,
				draftToInstants({ title: titleText.trim(), start: r.start, end: r.end, allDay: r.allDay })
			);
			toast(mergedLabels.eventCreated, {
				action: { label: mergedLabels.undo, run: () => undoCreate(created) }
			});
			void announce(`${mergedLabels.eventCreated}: ${created.title || mergedLabels.noTitle}`);
			onEventCreated?.(created);
		} catch (error) {
			fail(error);
		}
	}

	async function respond(occurrence: DisplayOccurrence, response: AttendeeResponse) {
		try {
			await store.respond(occurrence, response);
			toast(mergedLabels.responseSaved);
		} catch (error) {
			fail(error);
		}
	}

	// ---------------------------------------------------------------------------
	// Actions shared with the views through context
	// ---------------------------------------------------------------------------

	function canModify(occurrence: DisplayOccurrence | CalendarOccurrence): boolean {
		return !config.readOnly && store.canEdit(occurrence);
	}

	const actions: CalendarActions = {
		navigate(target, targetView) {
			date = target;
			if (targetView && views.some((v) => v.id === targetView)) view = targetView;
			closePopover();
			if (sidebarMode === 'overlay') showSidebar = false;
		},

		open(occurrence, anchor) {
			if (onEventOpen?.(occurrence) === false) return;
			draft = null;
			popover = { kind: 'details', key: occurrence.key, anchor };
		},

		async create(wall, options = {}) {
			if (config.readOnly) return;
			const calendar = store.defaultCalendar;
			if (!calendar) {
				toast(mergedLabels.noWritableCalendar, { tone: 'error' });
				return;
			}
			if (options.full) {
				openEditorForCreate({ calendarId: calendar.id, ...wall });
				return;
			}
			popover = null;
			draft = wall;
			await tick();
			const anchor =
				rootEl?.querySelector<HTMLElement>('[data-kc-draft]') ?? options.anchor ?? null;
			if (!anchor) {
				openEditorForCreate({ calendarId: calendar.id, ...wall });
				return;
			}
			popover = { kind: 'create', range: wall, anchor, calendarId: calendar.id };
		},

		async move(occurrence, wallStart, wallEnd, allDay = occurrence.allDay) {
			if (!canModify(occurrence)) {
				toast(mergedLabels.readOnlyEvent, { tone: 'error' });
				return;
			}
			let start = toInstant(wallStart, allDay);
			let end = toInstant(wallEnd, allDay);
			if (allDay && !occurrence.allDay) {
				start = startOfDay(wallStart);
				end = addDays(start, 1);
			}
			let scope: EditScope = 'this';
			if (occurrence.recurring) {
				const picked = await askScope('move');
				if (!picked) return;
				scope = picked;
			}
			closePopover();
			const previous = { start: occurrence.start, end: occurrence.end, allDay: occurrence.allDay };
			try {
				await store.moveOccurrence(occurrence, start, end, { scope, allDay });
				const label = formatters.occurrenceLabel(wallStart, wallEnd, allDay);
				void announce(
					`${occurrenceTitle(occurrence as DisplayOccurrence, mergedLabels)}: ${label}`
				);
				toast(
					mergedLabels.eventMoved,
					occurrence.recurring
						? {}
						: {
								action: {
									label: mergedLabels.undo,
									run: () => {
										const moved = occurrenceOf({ ...occurrence.event, start, end });
										if (moved) {
											void store
												.moveOccurrence(moved, previous.start, previous.end, {
													allDay: previous.allDay
												})
												.catch(fail);
										}
									}
								}
							}
				);
				onEventUpdated?.(occurrence, { start, end }, scope);
			} catch (error) {
				fail(error);
			}
		},

		async remove(occurrence) {
			if (!canModify(occurrence)) return;
			let scope: EditScope = 'this';
			if (occurrence.recurring) {
				const picked = await askScope('delete');
				if (!picked) return;
				scope = picked;
			}
			closePopover();
			editorOpen = false;
			try {
				await store.deleteOccurrence(occurrence, scope);
				void announce(`${mergedLabels.eventDeleted}: ${occurrenceTitle(occurrence, mergedLabels)}`);
				const snapshot = draftFromEvent(occurrence.event);
				toast(
					mergedLabels.eventDeleted,
					occurrence.recurring
						? {}
						: {
								action: {
									label: mergedLabels.undo,
									run: () => void store.createEvent(occurrence.calendar.id, snapshot).catch(fail)
								}
							}
				);
				onEventDeleted?.(occurrence, scope);
			} catch (error) {
				fail(error);
			}
		},

		edit(occurrence) {
			if (canModify(occurrence)) openEditorForEdit(occurrence);
		},

		canModify,

		setDraft(next) {
			draft = next;
		},

		announce(message) {
			void announce(message);
		}
	};

	setCalendarContext({
		get store() {
			return store;
		},
		get config() {
			return config;
		},
		get labels() {
			return mergedLabels;
		},
		get formatters() {
			return formatters;
		},
		get now() {
			return now;
		},
		get today() {
			return today;
		},
		get selectedKey() {
			if (popover?.kind === 'details') return popover.key;
			return editor?.mode === 'edit' ? editor.occurrence.key : null;
		},
		get draft() {
			return draft;
		},
		get eventContent() {
			return eventContent;
		},
		actions
	});

	// ---------------------------------------------------------------------------
	// Navigation and keyboard shortcuts
	// ---------------------------------------------------------------------------

	function step(direction: 1 | -1) {
		date = activeView.step(date, direction, rangeContext);
		closePopover();
	}

	function goToday() {
		// Today in the display zone, which can differ from the system's date.
		date = new Date(now);
		closePopover();
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && sidebarVisible && sidebarMode === 'overlay' && !popover && !editor) {
			showSidebar = false;
			return;
		}
		if (!keyboardShortcuts || !mounted || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey)
			return;
		const target = e.target as HTMLElement | null;
		if (!target || !rootEl) return;
		if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
			return;
		if (editor || scopePrompt || shortcutsOpen || connectOpen) return;
		// The details popover is portaled out of the calendar and takes focus when it opens.
		const inPopover = Boolean(target.closest('[data-kc-popover]'));
		if (!rootEl.contains(target) && target !== document.body && !inPopover) return;

		const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
		if (key === 'e' && detailsOccurrence) {
			e.preventDefault();
			actions.edit(detailsOccurrence);
			return;
		}
		if (inPopover || target.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return;

		const viewMatch = views.find((v) => v.shortcut === key);
		if (viewMatch) {
			e.preventDefault();
			view = viewMatch.id;
			return;
		}
		switch (key) {
			case 't':
				goToday();
				break;
			case 'j':
			case 'n':
				step(1);
				break;
			case 'k':
			case 'p':
				step(-1);
				break;
			case 'c':
				if (!config.readOnly && store.defaultCalendar) {
					openEditorForCreate({ calendarId: store.defaultCalendar.id, ...defaultNewRange() }, null);
				}
				break;
			case '/':
				searchInput?.focus();
				if (!searchInput) {
					// The search box renders on demand; focus it once it exists.
					rootEl
						.querySelector<HTMLButtonElement>(
							`button[aria-label="${CSS.escape(mergedLabels.search)}"]`
						)
						?.click();
				}
				break;
			case '?':
				shortcutsOrigin = null;
				shortcutsOpen = true;
				break;
			case 'r':
				void store.refresh();
				break;
			default:
				return;
		}
		e.preventDefault();
	}

	function disconnect(source: CalendarSource) {
		store.removeProvider(source.provider.id);
		toast(`${mergedLabels.disconnect}: ${source.provider.label}`);
		onDisconnect?.(source);
	}

	function connected(provider: CalendarProvider) {
		try {
			store.addProvider(provider);
			toast(`${provider.label} connected`);
		} catch (error) {
			fail(error);
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div
	bind:this={rootEl}
	bind:clientWidth={width}
	class={cn(
		'relative flex h-full min-h-[34rem] w-full overflow-hidden rounded-kleri border border-border/50 bg-background font-Poppins text-foreground kleri-calendar',
		className
	)}
	data-kleri-calendar
>
	{#if !mounted}
		<!-- Server render: layout-only skeleton. Dates depend on the viewer's zone. -->
		<div class="flex flex-1 flex-col" aria-busy="true">
			<div class="flex items-center gap-3 border-b border-(--kc-line) p-3">
				<div class="h-9 w-20 animate-pulse rounded-kleri bg-muted/40"></div>
				<div class="h-6 w-44 animate-pulse rounded-md bg-muted/40"></div>
			</div>
			<div class="grid flex-1 grid-cols-7 gap-px p-3">
				{#each [0, 1, 2, 3, 4, 5, 6] as i (i)}
					<div class="animate-pulse rounded-md bg-muted/20"></div>
				{/each}
			</div>
		</div>
	{:else}
		{#if sidebarVisible}
			{#if sidebarMode === 'overlay'}
				<!-- Pointer-only dismissal; keyboard users press Escape or the toolbar toggle. -->
				<div
					role="presentation"
					class="absolute inset-0 z-30 kleri-scrim"
					onclick={() => (showSidebar = false)}
				></div>
			{/if}
			<aside
				class={cn(
					'flex w-64 shrink-0 flex-col border-r border-(--kc-line) bg-background p-3',
					sidebarMode === 'overlay' && 'absolute inset-y-0 left-0 z-40 shadow-2xl shadow-black/40'
				)}
				aria-label={mergedLabels.calendars}
			>
				<CalendarSidebar
					{date}
					{range}
					onCreate={(origin) =>
						store.defaultCalendar &&
						openEditorForCreate(
							{ calendarId: store.defaultCalendar.id, ...defaultNewRange() },
							origin ?? null
						)}
					onConnect={integrations.length || allowIcsSubscribe || allowIcsImport
						? (origin) => {
								connectOrigin = origin ?? null;
								connectOpen = true;
							}
						: undefined}
					{onReconnect}
					onDisconnect={allowDisconnect ? disconnect : undefined}
					canDisconnect={typeof allowDisconnect === 'function' ? allowDisconnect : undefined}
					footer={sidebarFooter}
				/>
			</aside>
		{/if}

		<div class="@container flex min-w-0 flex-1 flex-col">
			<CalendarToolbar
				{title}
				{views}
				view={activeView.id}
				bind:search
				bind:searchInput
				sidebarOpen={sidebarVisible && sidebarMode === 'inline'}
				showSidebarToggle={sidebar}
				onViewChange={(next) => {
					view = next;
					closePopover();
				}}
				onToday={goToday}
				onStep={step}
				onToggleSidebar={() => (showSidebar = !showSidebar)}
				onCreate={(origin) =>
					store.defaultCalendar &&
					openEditorForCreate(
						{ calendarId: store.defaultCalendar.id, ...defaultNewRange() },
						origin ?? null
					)}
				onShortcuts={(origin) => {
					shortcutsOrigin = origin ?? null;
					shortcutsOpen = true;
				}}
				extra={toolbarExtra}
			/>
			<div class="relative min-h-0 flex-1" aria-busy={store.isLoading}>
				{#if store.isLoading && store.calendars.length === 0}
					<div class="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
						<div
							class="h-full w-1/3 animate-[kleri-loading_1.1s_ease-in-out_infinite] kleri-bg"
						></div>
					</div>
				{/if}
				<activeView.component {date} {range} {occurrences} viewId={activeView.id} />
			</div>
		</div>

		<Popover.Root
			open={popover !== null}
			onOpenChange={(next) => {
				if (!next) closePopover();
			}}
		>
			<Popover.Portal>
				<Popover.Content
					data-kc-popover
					customAnchor={popover?.anchor ?? null}
					side={popover?.kind === 'create' ? 'right' : 'bottom'}
					align="start"
					sideOffset={8}
					collisionPadding={12}
					class={cn(
						'kleri-dropdown z-50 overflow-hidden rounded-kleri border border-border/50 kleri-glass text-popover-foreground shadow-2xl shadow-black/40 outline-hidden',
						popover?.kind === 'create' ? 'w-80' : 'w-[23rem] max-w-[calc(100vw-1.5rem)]'
					)}
					onCloseAutoFocus={(e) => {
						e.preventDefault();
						const anchor = popover?.anchor;
						if (anchor?.isConnected && anchor.matches('[data-event-key]')) anchor.focus();
					}}
				>
					{#if popover?.kind === 'details' && detailsOccurrence}
						{@const occurrence = detailsOccurrence}
						<EventDetails
							{occurrence}
							extra={eventDetails}
							onClose={closePopover}
							onEdit={() => actions.edit(occurrence)}
							onDelete={() => actions.remove(occurrence)}
							onDuplicate={() => {
								const calendarId = canModify(occurrence)
									? occurrence.calendar.id
									: store.defaultCalendar?.id;
								if (!calendarId) return;
								openEditorForCreate({
									calendarId,
									start: occurrence.displayStart,
									end: occurrence.displayEnd,
									allDay: occurrence.allDay,
									title: occurrence.event.title,
									description: occurrence.event.description,
									location: occurrence.event.location,
									attendees: occurrence.event.attendees?.filter((a) => !a.self),
									recurrence: occurrence.event.recurrence ?? null,
									color: occurrence.event.color ?? null,
									transparency: occurrence.event.transparency,
									reminders: occurrence.event.reminders
								});
							}}
							onRespond={(response) => respond(occurrence, response)}
						/>
					{:else if popover?.kind === 'create'}
						{@const pending = popover}
						<QuickCreate
							range={pending.range}
							calendarId={pending.calendarId}
							onCancel={closePopover}
							onSave={quickSave}
							onMore={(titleText, calendarId) =>
								openEditorForCreate({ calendarId, title: titleText, ...pending.range })}
						/>
					{/if}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>

		{#if editor}
			{#key editor.id}
				{@const state = editor}
				<EventEditor
					bind:open={editorOpen}
					origin={state.origin}
					mode={state.mode}
					initial={state.initial}
					occurrenceKey={state.mode === 'edit' ? state.occurrence.key : undefined}
					originalInterval={state.mode === 'edit'
						? { start: state.occurrence.start, end: state.occurrence.end }
						: undefined}
					organizerEmail={state.mode === 'edit'
						? state.occurrence.event.organizer?.email
						: self?.email}
					{contacts}
					{self}
					{conferenceProviders}
					onSubmit={submitEditor}
					onDelete={state.mode === 'edit' ? () => actions.remove(state.occurrence) : undefined}
					onClosed={() => {
						if (editor?.id === state.id) {
							editor = null;
							draft = null;
						}
					}}
				/>
			{/key}
		{/if}

		{#if scopePrompt}
			{@const prompt = scopePrompt}
			{#key prompt.id}
				<ScopeDialog
					action={prompt.action}
					onResolve={prompt.resolve}
					onClosed={() => {
						if (scopePrompt?.id === prompt.id) scopePrompt = null;
					}}
				/>
			{/key}
		{/if}

		<ConnectCalendarDialog
			bind:open={connectOpen}
			origin={connectOrigin}
			{integrations}
			allowSubscribe={allowIcsSubscribe}
			allowImport={allowIcsImport}
			{icsProxy}
			onConnected={connected}
			onImported={(count) => toast(mergedLabels.importDone(count))}
		/>
		<ShortcutsDialog bind:open={shortcutsOpen} origin={shortcutsOrigin} {views} />
		<CalendarToasts {toasts} onDismiss={dismissToast} />
	{/if}

	<div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
</div>

<style>
	@keyframes -global-kleri-loading {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}
</style>
