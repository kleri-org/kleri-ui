import type {
	AttendeeResponse,
	CalendarEvent,
	CalendarInfo,
	CalendarOccurrence,
	EditScope,
	EventChanges,
	EventDraft,
	TimeInterval
} from '../types.js';
import { addDays, differenceInCalendarDays } from '../core/date.js';
import { expandRecurrence } from '../core/recurrence.js';
import { mergeIntervals } from '../core/availability.js';
import { safeColor } from '../core/safe.js';
import { applyChanges, draftToEvent, randomId, shiftSeriesTimes } from '../providers/shared.js';
import {
	CalendarProviderError,
	isAbortError,
	type CalendarProvider,
	type OccurrenceRef,
	type ProviderErrorCode
} from '../providers/types.js';

export type SourceStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unauthorized';

export interface CalendarSource {
	provider: CalendarProvider;
	status: SourceStatus;
	/** Message of the last failure, cleared on the next success. */
	error?: string;
	lastSyncedAt?: Date;
}

export type StoreOperation = 'load' | 'create' | 'update' | 'delete' | 'respond' | 'freebusy';

export interface CalendarStoreError {
	id: string;
	sourceId: string;
	operation: StoreOperation;
	code: ProviderErrorCode;
	message: string;
	at: Date;
}

export interface CalendarStoreOptions {
	providers?: CalendarProvider[];
	/** Re-sync the visible range every this many ms. `0` disables polling. @default 0 */
	refreshInterval?: number;
	/** Re-sync when the tab becomes visible again. @default true */
	refreshOnFocus?: boolean;
	/** Days loaded on either side of the visible range, so paging feels instant. @default 7 */
	prefetchDays?: number;
	/** `localStorage` key under which calendar visibility and colors persist. */
	persistKey?: string;
	/** Colors handed to calendars that don't bring their own. */
	palette?: string[];
	/** Load data as soon as providers are added. @default true in the browser, false on the server */
	autoLoad?: boolean;
	onError?: (error: CalendarStoreError) => void;
	/** A provider rejected its credentials (HTTP 401 after a refresh attempt). */
	onAuthRequired?: (provider: CalendarProvider) => void;
}

/** Kleri-harmonised calendar palette: the brand teals first, then warm and cool accents. */
export const KLERI_CALENDAR_PALETTE = [
	'#239190',
	'#4a90d9',
	'#e0a458',
	'#d9667b',
	'#7a6fd6',
	'#8fb356',
	'#196072',
	'#c77dba',
	'#5f7d95',
	'#84ccb8'
];

interface LoadedWindow {
	start: Date;
	end: Date;
}

const isBrowser = typeof window !== 'undefined';

function toError(error: unknown): CalendarProviderError {
	if (error instanceof CalendarProviderError) return error;
	const message = error instanceof Error ? error.message : String(error);
	return new CalendarProviderError(message || 'Something went wrong', { cause: error });
}

function occurrenceKey(calendarId: string, eventId: string, start: Date): string {
	return `${calendarId}|${eventId}|${start.getTime()}`;
}

function eventKey(calendarId: string, eventId: string): string {
	return `${calendarId}|${eventId}`;
}

/**
 * Aggregates any number of calendar providers into one reactive model.
 *
 * - Loads only what's visible (plus `prefetchDays` of padding) and discards
 *   responses that arrive after the user has already moved on.
 * - Applies every mutation optimistically, rolls it back if the provider
 *   refuses, then re-syncs the calendar so the UI shows the canonical result.
 * - Expands recurring series for providers that return masters (memory, ICS),
 *   honouring exclusions and per-instance overrides.
 */
export class CalendarStore {
	sources = $state.raw<CalendarSource[]>([]);
	calendars = $state.raw<CalendarInfo[]>([]);
	/** Most recent failures, newest last (at most 5). */
	errors = $state.raw<CalendarStoreError[]>([]);

	#events = $state.raw<Record<string, CalendarEvent[]>>({});
	#hidden = $state.raw<Set<string>>(new Set());
	#colors = $state.raw<Record<string, string>>({});
	#pending = $state.raw<Set<string>>(new Set());
	#range = $state.raw<LoadedWindow | null>(null);

	#loaded = new Map<string, LoadedWindow>();
	#controllers = new Map<string, AbortController>();
	#tokens = new Map<string, number>();
	#inflight = new Map<string, number>();
	#work = new Set<Promise<unknown>>();
	#unsubscribers = new Map<string, () => void>();
	#disposers: (() => void)[] = [];
	#options: CalendarStoreOptions;
	#autoLoad: boolean;

	constructor(options: CalendarStoreOptions = {}) {
		this.#options = options;
		this.#autoLoad = options.autoLoad ?? isBrowser;
		this.#restore();
		for (const provider of options.providers ?? []) this.addProvider(provider);

		if (isBrowser && this.#autoLoad) {
			if (options.refreshInterval && options.refreshInterval > 0) {
				const timer = setInterval(() => {
					if (typeof document === 'undefined' || document.visibilityState === 'visible')
						void this.refresh();
				}, options.refreshInterval);
				this.#disposers.push(() => clearInterval(timer));
			}
			if (options.refreshOnFocus !== false && typeof document !== 'undefined') {
				let hiddenAt = 0;
				const onVisibility = () => {
					if (document.visibilityState === 'hidden') hiddenAt = Date.now();
					else if (hiddenAt && Date.now() - hiddenAt > 30_000) void this.refresh();
				};
				document.addEventListener('visibilitychange', onVisibility);
				this.#disposers.push(() => document.removeEventListener('visibilitychange', onVisibility));
			}
		}
	}

	// -------------------------------------------------------------------------
	// Derived views of the state
	// -------------------------------------------------------------------------

	/** Some source is fetching. */
	get isLoading(): boolean {
		return this.sources.some((s) => s.status === 'loading');
	}

	/** Some edit is waiting for its provider. */
	get isSaving(): boolean {
		return this.#pending.size > 0;
	}

	get visibleCalendars(): CalendarInfo[] {
		return this.calendars.filter((c) => !this.#hidden.has(c.id));
	}

	get writableCalendars(): CalendarInfo[] {
		return this.calendars.filter((c) => !c.readOnly && this.#providerOf(c)?.capabilities.write);
	}

	/** Where new events go by default: the first writable primary calendar. */
	get defaultCalendar(): CalendarInfo | undefined {
		const writable = this.writableCalendars;
		return (
			writable.find((c) => c.primary && !this.#hidden.has(c.id)) ??
			writable.find((c) => !this.#hidden.has(c.id)) ??
			writable[0]
		);
	}

	/** At least one source can answer free/busy queries. */
	get supportsFreeBusy(): boolean {
		return this.sources.some(
			(s) => s.provider.capabilities.freeBusy && s.status !== 'unauthorized'
		);
	}

	getCalendar(calendarId: string): CalendarInfo | undefined {
		return this.calendars.find((c) => c.id === calendarId);
	}

	getSource(sourceId: string): CalendarSource | undefined {
		return this.sources.find((s) => s.provider.id === sourceId);
	}

	/** The provider that owns `calendarId`. */
	providerFor(calendarId: string): CalendarProvider | undefined {
		const calendar = this.getCalendar(calendarId);
		return calendar ? this.#providerOf(calendar) : undefined;
	}

	isVisible(calendarId: string): boolean {
		return !this.#hidden.has(calendarId);
	}

	/** The calendar is writable and the event itself isn't locked. */
	canEdit(occurrence: Pick<CalendarOccurrence, 'calendar' | 'event'>): boolean {
		const calendar = this.getCalendar(occurrence.calendar.id) ?? occurrence.calendar;
		const provider = this.#providerOf(calendar);
		return Boolean(
			!calendar.readOnly && !occurrence.event.readOnly && provider?.capabilities.write
		);
	}

	#providerOf(calendar: CalendarInfo): CalendarProvider | undefined {
		return this.sources.find((s) => s.provider.id === calendar.sourceId)?.provider;
	}

	// -------------------------------------------------------------------------
	// Sources and calendars
	// -------------------------------------------------------------------------

	addProvider(provider: CalendarProvider): void {
		if (this.getSource(provider.id)) {
			throw new Error(`A calendar source with id "${provider.id}" is already connected`);
		}
		this.sources = [...this.sources, { provider, status: 'idle' }];
		const unsubscribe = provider.subscribe?.(() => this.#scheduleSourceReload(provider.id));
		if (unsubscribe) this.#unsubscribers.set(provider.id, unsubscribe);
		if (this.#autoLoad) this.#track(this.#loadCalendars(provider));
	}

	removeProvider(sourceId: string): void {
		const source = this.getSource(sourceId);
		if (!source) return;
		this.#unsubscribers.get(sourceId)?.();
		this.#unsubscribers.delete(sourceId);
		source.provider.dispose?.();
		const removed = this.calendars.filter((c) => c.sourceId === sourceId);
		for (const calendar of removed) {
			this.#controllers.get(calendar.id)?.abort();
			this.#loaded.delete(calendar.id);
		}
		const events = { ...this.#events };
		for (const calendar of removed) delete events[calendar.id];
		this.#events = events;
		this.calendars = this.calendars.filter((c) => c.sourceId !== sourceId);
		this.sources = this.sources.filter((s) => s.provider.id !== sourceId);
	}

	setVisible(calendarId: string, visible: boolean): void {
		const hidden = new Set(this.#hidden);
		if (visible) hidden.delete(calendarId);
		else hidden.add(calendarId);
		this.#hidden = hidden;
		this.#persist();
		if (visible && this.#autoLoad) this.#ensureLoaded();
	}

	toggleCalendar(calendarId: string): void {
		this.setVisible(calendarId, this.#hidden.has(calendarId));
	}

	/** Shows `calendarId` and hides every other calendar. */
	showOnly(calendarId: string): void {
		this.#hidden = new Set(this.calendars.filter((c) => c.id !== calendarId).map((c) => c.id));
		this.#persist();
		if (this.#autoLoad) this.#ensureLoaded();
	}

	/** Overrides a calendar's color locally (persisted with `persistKey`). */
	setColor(calendarId: string, color: string | null): void {
		const safe = safeColor(color);
		const colors = { ...this.#colors };
		if (safe) colors[calendarId] = safe;
		else delete colors[calendarId];
		this.#colors = colors;
		this.calendars = this.calendars.map((c) =>
			c.id === calendarId ? { ...c, color: safe ?? this.#baseColor(c.sourceId, c.remoteId) } : c
		);
		this.#persist();
	}

	#baseColors = new Map<string, string>();

	#baseColor(sourceId: string, remoteId: string): string {
		return this.#baseColors.get(`${sourceId}/${remoteId}`) ?? KLERI_CALENDAR_PALETTE[0];
	}

	async #loadCalendars(provider: CalendarProvider): Promise<void> {
		this.#patchSource(provider.id, { status: 'loading' });
		try {
			const remote = await provider.listCalendars();
			if (!this.getSource(provider.id)) return;
			const palette = this.#options.palette ?? KLERI_CALENDAR_PALETTE;
			const others = this.calendars.filter((c) => c.sourceId !== provider.id);
			const mapped = remote.map((cal, i): CalendarInfo => {
				const id = `${provider.id}/${cal.id}`;
				// Keep a calendar's assigned color across refreshes, even as other
				// sources come and go and shift the palette index.
				const base =
					safeColor(cal.color) ??
					this.#baseColors.get(id) ??
					palette[(others.length + i) % palette.length];
				this.#baseColors.set(id, base);
				return {
					id,
					remoteId: cal.id,
					sourceId: provider.id,
					name: cal.name,
					color: safeColor(this.#colors[id]) ?? base,
					readOnly: Boolean(cal.readOnly) || !provider.capabilities.write,
					primary: cal.primary,
					timeZone: cal.timeZone,
					description: cal.description
				};
			});
			// Keep the order sources were added in.
			const order = this.sources.map((s) => s.provider.id);
			this.calendars = [...others, ...mapped].sort(
				(a, b) => order.indexOf(a.sourceId) - order.indexOf(b.sourceId)
			);
			const known = new Set(mapped.map((c) => c.id));
			for (const id of this.#loaded.keys())
				if (id.startsWith(`${provider.id}/`) && !known.has(id)) this.#loaded.delete(id);
			this.#patchSource(provider.id, {
				status: 'ready',
				error: undefined,
				lastSyncedAt: new Date()
			});
			this.#ensureLoaded();
		} catch (error) {
			this.#fail(provider.id, 'load', error);
		}
	}

	#patchSource(sourceId: string, patch: Partial<CalendarSource>): void {
		this.sources = this.sources.map((s) => (s.provider.id === sourceId ? { ...s, ...patch } : s));
	}

	// -------------------------------------------------------------------------
	// Range loading
	// -------------------------------------------------------------------------

	/** Tells the store which instants are on screen. Loads whatever is missing. */
	setRange(start: Date, end: Date): void {
		const current = this.#range;
		if (
			current &&
			current.start.getTime() === start.getTime() &&
			current.end.getTime() === end.getTime()
		)
			return;
		this.#range = { start: new Date(start), end: new Date(end) };
		if (this.#autoLoad) this.#ensureLoaded();
	}

	/** Re-fetches calendars and events of one source, or of every source. */
	async refresh(sourceId?: string): Promise<void> {
		const targets = this.sources.filter((s) => !sourceId || s.provider.id === sourceId);
		await Promise.all(
			targets.map(async (source) => {
				await this.#loadCalendars(source.provider);
				this.#ensureLoaded({ force: true, sourceId: source.provider.id });
			})
		);
		await this.whenIdle();
	}

	/** Resolves once no load or save is in flight. Handy in tests. */
	async whenIdle(): Promise<void> {
		while (this.#work.size) await Promise.allSettled([...this.#work]);
	}

	#track<T>(promise: Promise<T>): Promise<T> {
		this.#work.add(promise);
		promise.finally(() => this.#work.delete(promise)).catch(() => {});
		return promise;
	}

	#ensureLoaded(options: { force?: boolean; sourceId?: string } = {}): void {
		const range = this.#range;
		if (!range) return;
		const pad = this.#options.prefetchDays ?? 7;
		for (const calendar of this.calendars) {
			if (this.#hidden.has(calendar.id)) continue;
			if (options.sourceId && calendar.sourceId !== options.sourceId) continue;
			const source = this.getSource(calendar.sourceId);
			if (!source || source.status === 'unauthorized') continue;
			const loaded = this.#loaded.get(calendar.id);
			const covered = loaded && loaded.start <= range.start && loaded.end >= range.end;
			if (covered && !options.force) continue;
			this.#track(this.#loadEvents(calendar, addDays(range.start, -pad), addDays(range.end, pad)));
		}
	}

	#scheduledReloads = new Set<string>();

	#scheduleSourceReload(sourceId: string): void {
		if (this.#scheduledReloads.has(sourceId)) return;
		this.#scheduledReloads.add(sourceId);
		setTimeout(() => {
			this.#scheduledReloads.delete(sourceId);
			if (this.#destroyed) return;
			for (const calendar of this.calendars) {
				if (calendar.sourceId === sourceId) this.#track(this.#reloadCalendar(calendar.id));
			}
		}, 30);
	}

	async #reloadCalendar(calendarId: string): Promise<void> {
		const calendar = this.getCalendar(calendarId);
		const loaded = this.#loaded.get(calendarId);
		if (!calendar || !loaded) return;
		await this.#loadEvents(calendar, loaded.start, loaded.end);
	}

	async #loadEvents(calendar: CalendarInfo, start: Date, end: Date): Promise<void> {
		const provider = this.#providerOf(calendar);
		if (!provider) return;
		this.#controllers.get(calendar.id)?.abort();
		const controller = new AbortController();
		this.#controllers.set(calendar.id, controller);
		const token = (this.#tokens.get(calendar.id) ?? 0) + 1;
		this.#tokens.set(calendar.id, token);

		this.#setInflight(provider.id, +1);
		try {
			const events = await provider.listEvents({
				calendarId: calendar.remoteId,
				start,
				end,
				signal: controller.signal
			});
			if (this.#tokens.get(calendar.id) !== token || !this.getCalendar(calendar.id)) return;
			this.#events = {
				...this.#events,
				[calendar.id]: events.map((e) => ({ ...e, calendarId: calendar.id }))
			};
			this.#loaded.set(calendar.id, { start, end });
			this.#patchSource(provider.id, { error: undefined, lastSyncedAt: new Date() });
		} catch (error) {
			if (isAbortError(error) || controller.signal.aborted) return;
			this.#fail(provider.id, 'load', error);
		} finally {
			this.#setInflight(provider.id, -1);
		}
	}

	#setInflight(sourceId: string, delta: number): void {
		const count = Math.max(0, (this.#inflight.get(sourceId) ?? 0) + delta);
		this.#inflight.set(sourceId, count);
		const source = this.getSource(sourceId);
		if (!source || source.status === 'unauthorized') return;
		if (count > 0) {
			if (source.status !== 'loading') this.#patchSource(sourceId, { status: 'loading' });
		} else if (source.status === 'loading') {
			this.#patchSource(sourceId, { status: source.error ? 'error' : 'ready' });
		}
	}

	#fail(sourceId: string, operation: StoreOperation, error: unknown): CalendarProviderError {
		const normalized = toError(error);
		const source = this.getSource(sourceId);
		if (operation === 'load' && source) {
			this.#patchSource(sourceId, {
				status: normalized.code === 'auth' ? 'unauthorized' : 'error',
				error: normalized.message
			});
		}
		if (normalized.code === 'auth' && source) {
			this.#patchSource(sourceId, { status: 'unauthorized', error: normalized.message });
			this.#options.onAuthRequired?.(source.provider);
		}
		const entry: CalendarStoreError = {
			id: randomId('err_'),
			sourceId,
			operation,
			code: normalized.code,
			message: normalized.message,
			at: new Date()
		};
		this.errors = [...this.errors.slice(-4), entry];
		this.#options.onError?.(entry);
		return normalized;
	}

	dismissError(errorId: string): void {
		this.errors = this.errors.filter((e) => e.id !== errorId);
	}

	// -------------------------------------------------------------------------
	// Reading
	// -------------------------------------------------------------------------

	/** Every visible occurrence overlapping `[start, end)`, sorted for display. */
	occurrences(start: Date, end: Date): CalendarOccurrence[] {
		const out: CalendarOccurrence[] = [];
		// Views key their lists by occurrence; a feed with a repeated UID must not
		// produce the same key twice.
		const seen = new Set<string>();
		const push = (occurrence: CalendarOccurrence) => {
			if (seen.has(occurrence.key)) return;
			seen.add(occurrence.key);
			out.push(occurrence);
		};
		const pending = this.#pending;
		for (const calendar of this.calendars) {
			if (this.#hidden.has(calendar.id)) continue;
			const events = this.#events[calendar.id];
			if (!events?.length) continue;
			const clientExpands = this.#providerOf(calendar)?.capabilities.recurrence === 'client';

			const overridden = new Map<string, Date[]>();
			if (clientExpands) {
				for (const e of events) {
					if (e.recurringEventId && e.originalStart) {
						const list = overridden.get(e.recurringEventId) ?? [];
						list.push(e.originalStart);
						overridden.set(e.recurringEventId, list);
					}
				}
			}

			for (const event of events) {
				if (event.status === 'cancelled') continue;
				const color = safeColor(event.color) ?? calendar.color;
				const isPending = pending.has(eventKey(calendar.id, event.id));
				if (clientExpands && event.recurrence) {
					const duration = event.end.getTime() - event.start.getTime();
					const spanDays = differenceInCalendarDays(event.end, event.start);
					const starts = expandRecurrence(event.start, event.recurrence, {
						rangeStart: start,
						rangeEnd: end,
						duration,
						exdates: [...(event.exdates ?? []), ...(overridden.get(event.id) ?? [])]
					});
					for (const s of starts) {
						const e = event.allDay ? addDays(s, spanDays) : new Date(s.getTime() + duration);
						push({
							key: occurrenceKey(calendar.id, event.id, s),
							event,
							calendar,
							start: s,
							end: e,
							allDay: Boolean(event.allDay),
							recurring: true,
							color,
							pending: isPending
						});
					}
					continue;
				}
				const zeroLength = event.start.getTime() === event.end.getTime();
				const visible = zeroLength
					? event.start >= start && event.start < end
					: event.start < end && event.end > start;
				if (!visible) continue;
				push({
					key: occurrenceKey(calendar.id, event.id, event.start),
					event,
					calendar,
					start: event.start,
					end: event.end,
					allDay: Boolean(event.allDay),
					recurring: Boolean(event.recurringEventId || event.recurrence),
					color,
					pending: isPending
				});
			}
		}
		return out.sort(
			(a, b) =>
				a.start.getTime() - b.start.getTime() ||
				Number(b.allDay) - Number(a.allDay) ||
				b.end.getTime() - a.end.getTime() ||
				a.event.title.localeCompare(b.event.title)
		);
	}

	/** The loaded copy of an event. */
	getEvent(calendarId: string, eventId: string): CalendarEvent | undefined {
		return this.#events[calendarId]?.find((e) => e.id === eventId);
	}

	// -------------------------------------------------------------------------
	// Writing
	// -------------------------------------------------------------------------

	/** An event created optimistically only has a temporary id until its provider answers. */
	#requireSaved(calendarId: string, event: CalendarEvent): void {
		if (this.#pending.has(eventKey(calendarId, event.id)) && event.id.startsWith('tmp_')) {
			throw new CalendarProviderError('This event is still being saved — try again in a moment', {
				code: 'conflict',
				retryable: true
			});
		}
	}

	#requireWritable(calendarId: string): { calendar: CalendarInfo; provider: CalendarProvider } {
		const calendar = this.getCalendar(calendarId);
		if (!calendar) throw new CalendarProviderError('Calendar not found', { code: 'not-found' });
		const provider = this.#providerOf(calendar);
		if (!provider || calendar.readOnly || !provider.capabilities.write) {
			throw new CalendarProviderError(`"${calendar.name}" is read-only`, { code: 'forbidden' });
		}
		return { calendar, provider };
	}

	#setEvents(calendarId: string, update: (events: CalendarEvent[]) => CalendarEvent[]): void {
		this.#events = { ...this.#events, [calendarId]: update(this.#events[calendarId] ?? []) };
	}

	#setPending(key: string, pending: boolean): void {
		const next = new Set(this.#pending);
		if (pending) next.add(key);
		else next.delete(key);
		this.#pending = next;
	}

	/** Creates an event. Resolves with the provider's copy (namespaced). */
	async createEvent(calendarId: string, draft: EventDraft): Promise<CalendarEvent> {
		const { calendar, provider } = this.#requireWritable(calendarId);
		if (!provider.createEvent)
			throw new CalendarProviderError('This calendar cannot create events', { code: 'forbidden' });
		const tempId = randomId('tmp_');
		const temp = draftToEvent(tempId, calendar.id, draft);
		const key = eventKey(calendar.id, tempId);
		this.#setEvents(calendar.id, (events) => [...events, temp]);
		this.#setPending(key, true);

		const work = (async () => {
			try {
				const created = {
					...(await provider.createEvent!(calendar.remoteId, draft)),
					calendarId: calendar.id
				};
				this.#setEvents(calendar.id, (events) =>
					events.map((e) => (e.id === tempId ? created : e))
				);
				if (draft.recurrence && provider.capabilities.recurrence === 'provider') {
					await this.#reloadCalendar(calendar.id);
				}
				return created;
			} catch (error) {
				this.#setEvents(calendar.id, (events) => events.filter((e) => e.id !== tempId));
				throw this.#fail(provider.id, 'create', error);
			} finally {
				this.#setPending(key, false);
			}
		})();
		return this.#track(work);
	}

	#occurrenceRef(occurrence: CalendarOccurrence): OccurrenceRef | undefined {
		if (!occurrence.recurring) return undefined;
		const { event } = occurrence;
		return {
			start: occurrence.start,
			end: occurrence.end,
			originalStart: event.recurrence ? occurrence.start : event.originalStart,
			recurringEventId: event.recurringEventId ?? (event.recurrence ? event.id : undefined)
		};
	}

	/**
	 * Edits an occurrence. For recurring events `scope` picks one instance or
	 * the whole series; it's ignored for plain events.
	 */
	async updateOccurrence(
		occurrence: CalendarOccurrence,
		changes: EventChanges,
		scope: EditScope = 'this'
	): Promise<void> {
		const { calendar, provider } = this.#requireWritable(occurrence.calendar.id);
		if (!provider.updateEvent)
			throw new CalendarProviderError('This calendar cannot edit events', { code: 'forbidden' });
		if (occurrence.event.readOnly)
			throw new CalendarProviderError('This event cannot be edited', { code: 'forbidden' });
		this.#requireSaved(calendar.id, occurrence.event);
		const { event } = occurrence;
		const ref = this.#occurrenceRef(occurrence);
		const snapshot = this.#events[calendar.id] ?? [];
		const key = eventKey(calendar.id, event.id);

		// Optimistic local copy of what the provider is about to do.
		this.#setEvents(calendar.id, (events) => {
			if (!occurrence.recurring || (!event.recurrence && scope === 'this')) {
				return events.map((e) => (e.id === event.id ? applyChanges(e, changes) : e));
			}
			if (event.recurrence && scope === 'this') {
				const override = applyChanges(
					{
						...event,
						id: randomId('tmp_'),
						start: occurrence.start,
						end: occurrence.end,
						recurrence: undefined,
						exdates: undefined,
						recurringEventId: event.id,
						originalStart: occurrence.start
					},
					changes
				);
				return [...events, override];
			}
			const seriesId = event.recurringEventId ?? event.id;
			return events.map((e) => {
				if (e.id !== seriesId && e.recurringEventId !== seriesId) return e;
				const shifted = shiftSeriesTimes(e, occurrence, changes);
				return applyChanges(e, { ...changes, start: shifted?.start, end: shifted?.end });
			});
		});
		this.#setPending(key, true);

		const work = (async () => {
			try {
				await provider.updateEvent!({
					calendarId: calendar.remoteId,
					eventId: event.id,
					event: { ...event, calendarId: calendar.remoteId },
					changes,
					scope: occurrence.recurring ? scope : 'this',
					occurrence: ref
				});
			} catch (error) {
				this.#events = { ...this.#events, [calendar.id]: snapshot };
				throw this.#fail(provider.id, 'update', error);
			} finally {
				this.#setPending(key, false);
			}
			await this.#reloadCalendar(calendar.id);
		})();
		return this.#track(work);
	}

	/** Moves an occurrence to new times. */
	moveOccurrence(
		occurrence: CalendarOccurrence,
		start: Date,
		end: Date,
		options: { scope?: EditScope; allDay?: boolean } = {}
	): Promise<void> {
		const changes: EventChanges = { start, end };
		if (options.allDay !== undefined && options.allDay !== occurrence.allDay)
			changes.allDay = options.allDay;
		return this.updateOccurrence(occurrence, changes, options.scope);
	}

	/**
	 * Moves an event to another calendar (possibly another provider) by
	 * re-creating it there and removing the original. For a recurring event,
	 * `scope: 'this'` moves just this instance (as a one-off event) and `'all'`
	 * moves the whole series, keeping its original first occurrence.
	 * `draft` holds the occurrence's edited values, as instants.
	 */
	async changeCalendar(
		occurrence: CalendarOccurrence,
		targetCalendarId: string,
		draft: EventDraft,
		scope: EditScope = 'all'
	): Promise<CalendarEvent> {
		if (targetCalendarId === occurrence.calendar.id)
			throw new Error('Event is already in that calendar');
		const { calendar } = this.#requireWritable(occurrence.calendar.id);
		this.#requireWritable(targetCalendarId);
		this.#requireSaved(calendar.id, occurrence.event);
		const effectiveScope: EditScope = occurrence.recurring ? scope : 'this';

		let next = draft;
		if (occurrence.recurring && effectiveScope === 'this') {
			next = { ...draft, recurrence: null };
		} else if (occurrence.recurring) {
			// Rebuild the series from its master, shifted by however far this
			// instance was moved in the editor.
			const { event } = occurrence;
			const master = event.recurrence
				? event
				: event.recurringEventId
					? this.getEvent(calendar.id, event.recurringEventId)
					: undefined;
			if (!master?.recurrence) {
				throw new CalendarProviderError(
					'This repeating event can only be moved to another calendar one occurrence at a time',
					{ code: 'invalid' }
				);
			}
			const shifted = shiftSeriesTimes(master, occurrence, draft);
			next = {
				...draft,
				start: shifted?.start ?? master.start,
				end: shifted?.end ?? master.end,
				// Editing the master shows its rule, so the draft's value is the user's
				// choice; an overridden instance has none of its own to show.
				recurrence: event.recurrence ? draft.recurrence : (draft.recurrence ?? master.recurrence)
			};
		}

		const created = await this.createEvent(targetCalendarId, next);
		await this.deleteOccurrence(occurrence, effectiveScope);
		return created;
	}

	async deleteOccurrence(occurrence: CalendarOccurrence, scope: EditScope = 'this'): Promise<void> {
		const { calendar, provider } = this.#requireWritable(occurrence.calendar.id);
		if (!provider.deleteEvent)
			throw new CalendarProviderError('This calendar cannot delete events', { code: 'forbidden' });
		this.#requireSaved(calendar.id, occurrence.event);
		const { event } = occurrence;
		const snapshot = this.#events[calendar.id] ?? [];
		const effectiveScope = occurrence.recurring ? scope : 'this';

		this.#setEvents(calendar.id, (events) => {
			if (effectiveScope === 'all') {
				const seriesId = event.recurringEventId ?? event.id;
				return events.filter((e) => e.id !== seriesId && e.recurringEventId !== seriesId);
			}
			if (event.recurrence) {
				return events.map((e) =>
					e.id === event.id ? { ...e, exdates: [...(e.exdates ?? []), occurrence.start] } : e
				);
			}
			return events.filter((e) => e.id !== event.id);
		});

		const work = (async () => {
			try {
				await provider.deleteEvent!({
					calendarId: calendar.remoteId,
					eventId: event.id,
					event: { ...event, calendarId: calendar.remoteId },
					scope: effectiveScope,
					occurrence: this.#occurrenceRef(occurrence)
				});
			} catch (error) {
				this.#events = { ...this.#events, [calendar.id]: snapshot };
				throw this.#fail(provider.id, 'delete', error);
			}
			if (occurrence.recurring) await this.#reloadCalendar(calendar.id);
		})();
		return this.#track(work);
	}

	/** RSVPs for the signed-in user. */
	async respond(occurrence: CalendarOccurrence, response: AttendeeResponse): Promise<void> {
		const calendar = this.getCalendar(occurrence.calendar.id);
		const provider = calendar && this.#providerOf(calendar);
		if (!calendar || !provider?.respond) {
			throw new CalendarProviderError('This calendar does not support RSVPs', {
				code: 'forbidden'
			});
		}
		this.#requireSaved(calendar.id, occurrence.event);
		const { event } = occurrence;
		const snapshot = this.#events[calendar.id] ?? [];
		this.#setEvents(calendar.id, (events) =>
			events.map((e) =>
				e.id === event.id
					? { ...e, attendees: e.attendees?.map((a) => (a.self ? { ...a, response } : a)) }
					: e
			)
		);
		const work = (async () => {
			try {
				await provider.respond!({
					calendarId: calendar.remoteId,
					eventId: event.id,
					event: { ...event, calendarId: calendar.remoteId },
					response
				});
			} catch (error) {
				this.#events = { ...this.#events, [calendar.id]: snapshot };
				throw this.#fail(provider.id, 'respond', error);
			}
			await this.#reloadCalendar(calendar.id);
		})();
		return this.#track(work);
	}

	/**
	 * Busy time per email across every source that supports free/busy. Sources
	 * that fail are skipped (and reported), so one broken account doesn't hide
	 * the others' answers.
	 */
	async getFreeBusy(
		emails: string[],
		start: Date,
		end: Date,
		signal?: AbortSignal
	): Promise<Record<string, TimeInterval[]>> {
		const result: Record<string, TimeInterval[]> = Object.fromEntries(emails.map((e) => [e, []]));
		if (!emails.length) return result;
		const providers = this.sources
			.filter(
				(s) =>
					s.provider.capabilities.freeBusy && s.provider.getFreeBusy && s.status !== 'unauthorized'
			)
			.map((s) => s.provider);
		const answers = await Promise.allSettled(
			providers.map((p) => p.getFreeBusy!({ emails, start, end, signal }))
		);
		answers.forEach((answer, i) => {
			if (answer.status === 'rejected') {
				if (!isAbortError(answer.reason)) this.#fail(providers[i].id, 'freebusy', answer.reason);
				return;
			}
			for (const email of emails) result[email].push(...(answer.value[email] ?? []));
		});
		for (const email of emails) result[email] = mergeIntervals(result[email]);
		return result;
	}

	// -------------------------------------------------------------------------
	// Persistence and teardown
	// -------------------------------------------------------------------------

	#restore(): void {
		const key = this.#options.persistKey;
		if (!key || typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return;
			const saved = JSON.parse(raw) as { hidden?: string[]; colors?: Record<string, string> };
			this.#hidden = new Set(saved.hidden ?? []);
			this.#colors = saved.colors ?? {};
		} catch {
			// Corrupt or blocked storage: start fresh.
		}
	}

	#persist(): void {
		const key = this.#options.persistKey;
		if (!key || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(
				key,
				JSON.stringify({ hidden: [...this.#hidden], colors: this.#colors })
			);
		} catch {
			// Storage full or blocked; the preference just won't survive a reload.
		}
	}

	#destroyed = false;

	destroy(): void {
		this.#destroyed = true;
		for (const dispose of this.#disposers) dispose();
		this.#disposers = [];
		for (const controller of this.#controllers.values()) controller.abort();
		for (const unsubscribe of this.#unsubscribers.values()) unsubscribe();
		this.#unsubscribers.clear();
		for (const source of this.sources) source.provider.dispose?.();
	}
}

/** Convenience factory mirroring the other `create*` helpers. */
export function createCalendarStore(options?: CalendarStoreOptions): CalendarStore {
	return new CalendarStore(options);
}
