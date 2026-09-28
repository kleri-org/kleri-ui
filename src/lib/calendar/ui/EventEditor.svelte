<script lang="ts" module>
	import type {
		CalendarAttendee,
		CalendarConference,
		ConferenceProvider,
		EventDraft,
		EventTransparency
	} from '../types.js';
	import type { RecurrenceRule } from '../core/recurrence.js';

	/** Values the editor opens with. Times are wall clock in the display zone. */
	export interface EditorInitial {
		calendarId: string;
		start: Date;
		end: Date;
		allDay: boolean;
		title?: string;
		description?: string;
		location?: string;
		attendees?: CalendarAttendee[];
		recurrence?: RecurrenceRule | null;
		conference?: CalendarConference | null;
		color?: string | null;
		transparency?: EventTransparency;
		reminders?: number[];
	}

	export interface EditorSubmit {
		calendarId: string;
		/** Wall-clock times; the calendar converts them to instants. */
		draft: EventDraft;
		/** Set when the user asked for a conference from a custom provider (e.g. Zoom). */
		conferenceProvider?: ConferenceProvider;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import {
		AlertTriangle,
		AlignLeft,
		Bell,
		Globe,
		MapPin,
		Plus,
		Trash2,
		Video,
		X
	} from '@lucide/svelte';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import KleriButton from '$lib/button/KleriButton/KleriButton.svelte';
	import KleriMorphDialog from '$lib/dialog/KleriMorphDialog.svelte';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import KleriTextarea from '$lib/input/KleriTextarea.svelte';
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import KleriSelect from '$lib/input/KleriSelect.svelte';
	import KleriToggleGroup from '$lib/toggle/KleriToggleGroup.svelte';
	import KleriToggleGroupItem from '$lib/toggle/KleriToggleGroupItem.svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarPerson, ConferenceKind, TimeInterval } from '../types.js';
	import {
		addDays,
		addMinutes,
		atMinutes,
		ceilToStep,
		differenceInCalendarDays,
		differenceInMinutes,
		fromDateKey,
		isSameDay,
		minutesOfDay,
		startOfDay,
		toDateKey
	} from '../core/date.js';
	import { CONFERENCE_LABELS } from '../core/ics.js';
	import { safeUrl } from '../core/safe.js';
	import { formatTimeZoneLabel } from '../core/timezone.js';
	import { KLERI_CALENDAR_PALETTE } from '../store/calendar-store.svelte.js';
	import { selfResponse } from '../views/utils.js';
	import CalendarSelect from './CalendarSelect.svelte';
	import DateField from './fields/DateField.svelte';
	import TimeField from './fields/TimeField.svelte';
	import AttendeeField from './fields/AttendeeField.svelte';
	import RecurrenceField from './fields/RecurrenceField.svelte';
	import SuggestedTimes from './fields/SuggestedTimes.svelte';

	interface Props {
		open: boolean;
		mode: 'create' | 'edit';
		initial: EditorInitial;
		/** Occurrence being edited, excluded from conflict checks. */
		occurrenceKey?: string;
		/** Its current instants, so it isn't counted as its own guests' busy time. */
		originalInterval?: TimeInterval;
		/** Organizer of an existing event: listed among guests but not removable. */
		organizerEmail?: string;
		contacts?: CalendarPerson[];
		self?: CalendarPerson;
		conferenceProviders?: ConferenceProvider[];
		/** Resolve `false` to keep the editor open (e.g. the user backed out of a prompt). */
		onSubmit: (submit: EditorSubmit) => Promise<boolean | void>;
		onDelete?: () => void;
		onClosed?: () => void;
		/** Element the editor morphs from, e.g. the event or the create button. */
		origin?: HTMLElement | null;
	}

	let {
		open = $bindable(),
		mode,
		initial,
		occurrenceKey,
		originalInterval,
		organizerEmail,
		contacts = [],
		self,
		conferenceProviders = [],
		onSubmit,
		onDelete,
		onClosed,
		origin = null
	}: Props = $props();

	const ctx = getCalendarContext();
	const clock = $derived(ctx.config.clock);

	interface Form {
		title: string;
		calendarId: string;
		allDay: boolean;
		startDate: Date;
		startMinutes: number;
		endDate: Date;
		endMinutes: number;
		recurrence: RecurrenceRule | null;
		attendees: CalendarAttendee[];
		location: string;
		description: string;
		conference: CalendarConference | null;
		/** Built-in kind or custom provider id to create a conference on save. */
		requestConference: string | null;
		color: string | null;
		transparency: EventTransparency;
		reminders: number[];
	}

	/** Providers can repeat a guest or a reminder (e.g. popup + email at 10 min); lists are keyed by them. */
	function uniqueAttendees(attendees: CalendarAttendee[]): CalendarAttendee[] {
		const seen = new Set<string>();
		return attendees.filter((a) => {
			const email = a.email.toLowerCase();
			if (seen.has(email)) return false;
			seen.add(email);
			return true;
		});
	}

	function buildForm(init: EditorInitial): Form {
		const endInclusive = init.allDay ? addDays(init.end, -1) : init.end;
		return {
			title: init.title ?? '',
			calendarId: init.calendarId,
			allDay: init.allDay,
			startDate: startOfDay(init.start),
			startMinutes: init.allDay ? 9 * 60 : minutesOfDay(init.start),
			endDate: startOfDay(endInclusive < init.start ? init.start : endInclusive),
			endMinutes: init.allDay
				? 10 * 60
				: minutesOfDay(init.end) === 0 && !isSameDay(init.start, init.end)
					? 24 * 60
					: minutesOfDay(init.end),
			recurrence: init.recurrence ?? null,
			attendees: uniqueAttendees(init.attendees ?? []).map((a) => ({ ...a })),
			location: init.location ?? '',
			description: init.description ?? '',
			conference: init.conference ?? null,
			requestConference: null,
			color: init.color ?? null,
			transparency: init.transparency ?? 'busy',
			reminders: [...new Set(init.reminders ?? [10])].sort((a, b) => a - b)
		};
	}

	// Midnight ends (24:00) belong to the start day in the form, so normalise.
	function normalise(form: Form): Form {
		if (!form.allDay && form.endMinutes === 24 * 60 && !isSameDay(form.startDate, form.endDate)) {
			return { ...form, endDate: addDays(form.endDate, -1) };
		}
		return form;
	}

	let form = $state(untrack(() => normalise(buildForm(initial))));
	const snapshot = untrack(() => JSON.stringify(form));
	let dirty = $derived(JSON.stringify(form) !== snapshot);

	let saving = $state(false);
	let submitError = $state<string | null>(null);
	let confirmDiscard = $state(false);
	let showErrors = $state(false);
	let guestErrors = $state<string[]>([]);

	let wallStart = $derived(
		form.allDay ? form.startDate : atMinutes(form.startDate, form.startMinutes)
	);
	let wallEnd = $derived(
		form.allDay ? addDays(form.endDate, 1) : atMinutes(form.endDate, form.endMinutes)
	);
	let instantStart = $derived(form.allDay ? wallStart : clock.toInstant(wallStart));
	let instantEnd = $derived(form.allDay ? wallEnd : clock.toInstant(wallEnd));
	let sameDay = $derived(isSameDay(form.startDate, form.endDate));

	let timeErrors = $derived(wallEnd <= wallStart ? [ctx.labels.endBeforeStart] : []);
	let recurrenceErrors = $derived(
		form.recurrence?.until && form.recurrence.until < wallStart ? [ctx.labels.untilBeforeStart] : []
	);
	let isValid = $derived(
		timeErrors.length === 0 && recurrenceErrors.length === 0 && guestErrors.length === 0
	);

	// ---------------------------------------------------------------------------
	// Time editing keeps the duration, like every calendar app
	// ---------------------------------------------------------------------------

	function setStartDate(date: Date) {
		const delta = differenceInCalendarDays(date, form.startDate);
		form.startDate = date;
		form.endDate = addDays(form.endDate, delta);
	}

	function setStartMinutes(minutes: number) {
		const duration = differenceInMinutes(wallEnd, wallStart);
		form.startMinutes = minutes;
		const end = addMinutes(
			atMinutes(form.startDate, minutes),
			Math.max(duration, ctx.config.slotDuration)
		);
		form.endDate = startOfDay(end);
		form.endMinutes = minutesOfDay(end);
		if (form.endMinutes === 0 && !isSameDay(end, form.startDate)) {
			form.endDate = addDays(form.endDate, -1);
			form.endMinutes = 24 * 60;
		}
	}

	function setAllDay(allDay: boolean) {
		form.allDay = allDay;
		if (allDay) {
			if (form.endDate < form.startDate) form.endDate = form.startDate;
			return;
		}
		const isToday = isSameDay(form.startDate, ctx.today);
		const start = isToday
			? minutesOfDay(ceilToStep(ctx.now, 30))
			: (ctx.config.workingHours?.start ?? 9 * 60);
		form.startMinutes = Math.min(start, 23 * 60);
		form.endDate = form.startDate;
		form.endMinutes = Math.min(form.startMinutes + ctx.config.defaultEventDuration, 24 * 60);
	}

	function applySlot(slot: TimeInterval) {
		const start = clock.toWall(slot.start);
		const end = clock.toWall(slot.end);
		form.allDay = false;
		form.startDate = startOfDay(start);
		form.startMinutes = minutesOfDay(start);
		form.endDate = startOfDay(end);
		form.endMinutes = minutesOfDay(end);
	}

	// ---------------------------------------------------------------------------
	// Calendar, conferencing
	// ---------------------------------------------------------------------------

	let calendar = $derived(ctx.store.getCalendar(form.calendarId));
	let builtInConference = $derived(
		ctx.store.providerFor(form.calendarId)?.capabilities.conferencing ?? []
	);
	let conferenceOptions = $derived([
		...builtInConference.map((kind) => ({
			id: kind as string,
			label: CONFERENCE_LABELS[kind],
			custom: undefined
		})),
		...conferenceProviders.map((p) => ({ id: p.id, label: p.label, custom: p }))
	]);
	let requested = $derived(conferenceOptions.find((o) => o.id === form.requestConference));

	$effect(() => {
		// A different calendar may not offer the conference that was requested.
		if (form.requestConference && !conferenceOptions.some((o) => o.id === form.requestConference)) {
			form.requestConference = null;
		}
	});

	// ---------------------------------------------------------------------------
	// Availability
	// ---------------------------------------------------------------------------

	let busy = $state<Record<string, TimeInterval[]> | null>(null);
	let loadingBusy = $state(false);
	let guestKey = $derived(
		form.attendees
			.map((a) => a.email.toLowerCase())
			.sort()
			.join(',')
	);
	let windowKey = $derived(toDateKey(form.startDate));
	let canCheckAvailability = $derived(ctx.store.supportsFreeBusy && form.attendees.length > 0);

	$effect(() => {
		const emails = guestKey ? guestKey.split(',') : [];
		const dayKey = windowKey;
		if (!ctx.store.supportsFreeBusy || emails.length === 0) {
			busy = null;
			loadingBusy = false;
			return;
		}
		const all = [...new Set([...emails, ...(self ? [self.email.toLowerCase()] : [])])];
		const from = untrack(() => clock.toInstant(fromDateKey(dayKey)));
		const until = addDays(from, 8);
		const controller = new AbortController();
		loadingBusy = true;
		const timer = setTimeout(async () => {
			try {
				const result = await ctx.store.getFreeBusy(all, from, until, controller.signal);
				if (controller.signal.aborted) return;
				// The meeting being edited shouldn't count as its own guests' conflict.
				const original = originalInterval;
				busy = Object.fromEntries(
					Object.entries(result).map(([email, intervals]) => [
						email,
						original
							? intervals.filter(
									(i) =>
										!(
											i.start.getTime() === original.start.getTime() &&
											i.end.getTime() === original.end.getTime()
										)
								)
							: intervals
					])
				);
			} catch {
				busy = null;
			} finally {
				if (!controller.signal.aborted) loadingBusy = false;
			}
		}, 350);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	let busyByAttendee = $derived.by(() => {
		if (!busy) return null;
		const lower = Object.fromEntries(Object.entries(busy).map(([k, v]) => [k.toLowerCase(), v]));
		return Object.fromEntries(
			form.attendees.map((a) => [a.email, lower[a.email.toLowerCase()] ?? []])
		);
	});
	let names = $derived(
		Object.fromEntries(form.attendees.map((a) => [a.email, a.name ?? a.email.split('@')[0]]))
	);

	/** Your own events that overlap the proposed time. */
	let conflicts = $derived.by(() => {
		if (form.allDay || wallEnd <= wallStart) return [];
		return ctx.store
			.occurrences(instantStart, instantEnd)
			.filter(
				(o) =>
					o.key !== occurrenceKey &&
					!o.allDay &&
					o.event.transparency !== 'free' &&
					selfResponse(o.event) !== 'declined' &&
					o.start < instantEnd &&
					instantStart < o.end
			);
	});

	// ---------------------------------------------------------------------------
	// Reminders
	// ---------------------------------------------------------------------------

	const REMINDER_CHOICES = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080];
	let reminderItems = $derived(
		REMINDER_CHOICES.filter((m) => !form.reminders.includes(m)).map((m) => ({
			value: String(m),
			label: m === 0 ? 'At start time' : ctx.labels.reminderBefore(ctx.formatters.duration(m))
		}))
	);

	// ---------------------------------------------------------------------------
	// Submit and close
	// ---------------------------------------------------------------------------

	async function submit(e?: Event) {
		e?.preventDefault();
		showErrors = true;
		if (!isValid || saving) return;
		saving = true;
		submitError = null;
		const builtIn = builtInConference.includes(form.requestConference as ConferenceKind)
			? (form.requestConference as ConferenceKind)
			: undefined;
		// Plain data only: providers may clone or serialise the draft.
		const values = $state.snapshot(form);
		const draft: EventDraft = {
			title: values.title.trim(),
			start: wallStart,
			end: wallEnd,
			allDay: values.allDay,
			description: values.description.trim() || undefined,
			location: values.location.trim() || undefined,
			attendees: values.attendees,
			recurrence: values.recurrence,
			transparency: values.transparency,
			reminders: values.reminders,
			color: values.color,
			conference: values.conference,
			requestConference: builtIn
		};
		try {
			const keepOpen =
				(await onSubmit({
					calendarId: form.calendarId,
					draft,
					conferenceProvider: requested?.custom
				})) === false;
			if (!keepOpen) open = false;
		} catch (error) {
			submitError = error instanceof Error ? error.message : String(error);
		} finally {
			saving = false;
		}
	}

	function requestClose() {
		if (dirty && !saving) confirmDiscard = true;
		else open = false;
	}

	function guardDismiss(e: Event) {
		if (dirty && !saving) {
			e.preventDefault();
			confirmDiscard = true;
		}
	}
</script>

<KleriMorphDialog
	bind:open
	{origin}
	onClose={onClosed}
	class="max-h-[min(92vh,52rem)] w-[calc(100vw-1.5rem)] max-w-3xl"
	contentProps={{
		onEscapeKeydown: guardDismiss,
		onInteractOutside: guardDismiss,
		onkeydown: (e: KeyboardEvent) => {
			if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
		}
	}}
>
	{#snippet panel()}
		<form class="flex min-h-0 flex-1 flex-col" onsubmit={submit} novalidate>
			<!-- Header: title -->
			<div class="flex items-start gap-3 border-b border-(--kc-line) px-5 pt-5 pb-3">
				<span
					class="mt-3 size-3.5 shrink-0 rounded-[4px]"
					style:background-color={form.color ?? calendar?.color ?? 'var(--color-kleri-2)'}
					aria-hidden="true"
				></span>
				<div class="min-w-0 flex-1">
					<DialogPrimitive.Title class="sr-only"
						>{mode === 'edit' ? ctx.labels.editEvent : ctx.labels.newEvent}</DialogPrimitive.Title
					>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						bind:value={form.title}
						autofocus={mode === 'create'}
						placeholder={ctx.labels.addTitle}
						aria-label={ctx.labels.title}
						class="w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-1 text-2xl font-semibold outline-none placeholder:text-muted-foreground focus:border-kleri-2 focus:ring-0"
					/>
				</div>
				<button
					type="button"
					class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
					aria-label={ctx.labels.close}
					onclick={requestClose}
				>
					<X class="size-5" />
				</button>
			</div>

			<div class="kleri-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
				<!-- When -->
				<section class="flex flex-col gap-2" aria-label={ctx.labels.date}>
					<div class="grid grid-cols-2 gap-x-3 sm:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
						<DateField
							value={form.startDate}
							label={ctx.labels.start}
							onValueChange={setStartDate}
						/>
						{#if !form.allDay}
							<TimeField
								value={form.startMinutes}
								label="&nbsp;"
								step={ctx.config.slotDuration}
								onValueChange={setStartMinutes}
							/>
							<TimeField
								bind:value={form.endMinutes}
								label={ctx.labels.end}
								step={ctx.config.slotDuration}
								durationFrom={sameDay ? form.startMinutes : undefined}
								errors={showErrors ? timeErrors : undefined}
							/>
						{/if}
						<DateField
							bind:value={form.endDate}
							label={form.allDay ? ctx.labels.end : ctx.labels.endDate}
							min={form.startDate}
							errors={showErrors && form.allDay ? timeErrors : undefined}
						/>
					</div>
					<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
						<label class="flex items-center gap-2 text-sm">
							<KleriSwitch
								value={form.allDay}
								ariaLabel={ctx.labels.allDay}
								onValueChange={setAllDay}
							/>
							{ctx.labels.allDay}
						</label>
						{#if !form.allDay}
							<span
								class="flex items-center gap-1.5 font-spacemono text-[11px] text-muted-foreground"
							>
								<Globe class="size-3.5" />{formatTimeZoneLabel(clock.timeZone, instantStart)}
							</span>
						{/if}
					</div>
					{#if conflicts.length}
						<p
							class="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
						>
							<AlertTriangle class="size-4 shrink-0" />
							<span class="truncate">
								{ctx.labels.conflictWith(
									conflicts[0].event.title || ctx.labels.noTitle
								)}{conflicts.length > 1 ? ` ${ctx.labels.more(conflicts.length - 1)}` : ''}
							</span>
						</p>
					{/if}
					<RecurrenceField
						bind:value={form.recurrence}
						start={wallStart}
						errors={showErrors ? recurrenceErrors : undefined}
					/>
				</section>

				<div class="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2">
					<!-- Who -->
					<section class="flex flex-col gap-3" aria-label={ctx.labels.guestsField}>
						<AttendeeField
							bind:attendees={form.attendees}
							bind:errors={guestErrors}
							{contacts}
							busy={busyByAttendee}
							{loadingBusy}
							start={instantStart}
							end={instantEnd}
							{organizerEmail}
						/>
						{#if canCheckAvailability && !form.allDay}
							<SuggestedTimes
								busy={busyByAttendee ?? {}}
								{names}
								loading={loadingBusy || !busy}
								start={instantStart}
								end={instantEnd}
								onPick={applySlot}
							/>
						{/if}
					</section>

					<!-- Where and how -->
					<section class="flex flex-col gap-3" aria-label={ctx.labels.location}>
						<KleriInput
							bind:value={form.location}
							label={ctx.labels.location}
							placeholder={ctx.labels.addLocation}
							InputIcon={MapPin}
						/>

						<div class="flex flex-col gap-1.5">
							<span class="indent-2 text-sm font-medium">{ctx.labels.video}</span>
							{#if form.conference}
								<div
									class="flex items-center gap-2 rounded-kleri border-2 border-border py-2 pr-2 pl-4"
								>
									<Video class="size-5 shrink-0 text-kleri-1 dark:text-kleri-2" />
									<a
										href={safeUrl(form.conference.url)}
										target="_blank"
										rel="noopener noreferrer"
										class="min-w-0 flex-1 truncate text-sm hover:underline"
									>
										{form.conference.label ?? CONFERENCE_LABELS[form.conference.kind ?? 'other']}
									</a>
									<button
										type="button"
										class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
										aria-label={ctx.labels.removeVideo}
										onclick={() => (form.conference = null)}
									>
										<X class="size-4" />
									</button>
								</div>
							{:else if requested}
								<div
									class="flex items-center gap-2 rounded-kleri border-2 border-kleri-2/60 bg-kleri-2/10 py-2 pr-2 pl-4 text-sm"
								>
									<Video class="size-5 shrink-0 text-kleri-1 dark:text-kleri-2" />
									<span class="min-w-0 flex-1">{ctx.labels.videoOnSave(requested.label)}</span>
									<button
										type="button"
										class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
										aria-label={ctx.labels.removeVideo}
										onclick={() => (form.requestConference = null)}
									>
										<X class="size-4" />
									</button>
								</div>
							{:else if conferenceOptions.length}
								<div class="flex flex-wrap gap-2">
									{#each conferenceOptions as option (option.id)}
										<button
											type="button"
											class="flex items-center gap-2 rounded-kleri border-2 border-border px-3 py-1.5 text-sm transition-colors hover:border-kleri-2 hover:bg-kleri-2/10"
											onclick={() => (form.requestConference = option.id)}
										>
											<Video class="size-4 text-kleri-1 dark:text-kleri-2" />
											{ctx.labels.addVideo(option.label)}
										</button>
									{/each}
								</div>
							{:else}
								<p class="indent-2 text-xs text-muted-foreground">—</p>
							{/if}
						</div>

						<CalendarSelect
							calendars={ctx.store.writableCalendars}
							bind:value={form.calendarId}
							label={ctx.labels.calendar}
						/>

						<div class="flex flex-wrap items-end gap-x-5 gap-y-3">
							<div class="flex flex-col gap-1.5">
								<span class="indent-2 text-sm font-medium">{ctx.labels.availability}</span>
								<KleriToggleGroup
									type="single"
									size="sm"
									variant="outline"
									value={form.transparency}
									onValueChange={(next: string) =>
										next && (form.transparency = next as EventTransparency)}
								>
									<KleriToggleGroupItem value="busy">{ctx.labels.busy}</KleriToggleGroupItem>
									<KleriToggleGroupItem value="free">{ctx.labels.free}</KleriToggleGroupItem>
								</KleriToggleGroup>
							</div>
							<div class="flex flex-col gap-1.5">
								<span class="indent-2 text-sm font-medium">{ctx.labels.color}</span>
								<div
									class="flex flex-wrap items-center gap-1.5 py-0.5"
									role="radiogroup"
									aria-label={ctx.labels.color}
								>
									<button
										type="button"
										role="radio"
										aria-checked={form.color === null}
										aria-label={ctx.labels.defaultColor}
										title={ctx.labels.defaultColor}
										class={cn(
											'size-6 rounded-full border-2 border-dashed border-(--kc-line-strong) ring-offset-2 ring-offset-background',
											form.color === null && 'ring-2 ring-foreground/60'
										)}
										style:background-color={calendar?.color}
										onclick={() => (form.color = null)}
									></button>
									{#each KLERI_CALENDAR_PALETTE.slice(0, 8) as color (color)}
										<button
											type="button"
											role="radio"
											aria-checked={form.color === color}
											aria-label={color}
											class={cn(
												'size-6 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110',
												form.color === color && 'ring-2 ring-foreground/60'
											)}
											style:background-color={color}
											onclick={() => (form.color = color)}
										></button>
									{/each}
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-1.5">
							<span class="flex items-center gap-2 indent-2 text-sm font-medium"
								><Bell class="size-4" />{ctx.labels.reminders}</span
							>
							<div class="flex flex-wrap items-center gap-1.5">
								{#each form.reminders as minutes (minutes)}
									<span
										class="flex items-center gap-1 rounded-full border-2 border-border py-0.5 pr-1 pl-2.5 text-xs"
									>
										{minutes === 0
											? 'At start time'
											: ctx.labels.reminderBefore(ctx.formatters.duration(minutes))}
										<button
											type="button"
											class="rounded-full p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
											aria-label="{ctx.labels.delete} {minutes}"
											onclick={() => (form.reminders = form.reminders.filter((m) => m !== minutes))}
										>
											<X class="size-3" />
										</button>
									</span>
								{/each}
								{#if form.reminders.length < 5 && reminderItems.length}
									<KleriSelect
										items={reminderItems}
										value=""
										placeholder={ctx.labels.addReminder}
										persistentIcon={Plus}
										ariaLabel={ctx.labels.addReminder}
										class="w-auto [&>div]:my-0 [&>div]:py-1"
										onValueChange={(next) => {
											if (next)
												form.reminders = [...form.reminders, Number(next)].sort((a, b) => a - b);
										}}
									/>
								{/if}
							</div>
						</div>
					</section>
				</div>

				<div class="mt-5">
					<KleriTextarea
						bind:value={form.description}
						label={ctx.labels.description}
						placeholder={ctx.labels.addDescription}
						InputIcon={AlignLeft}
						rows={4}
						resize="y"
					/>
				</div>
			</div>

			<!-- Footer -->
			<div class="relative border-t border-(--kc-line) px-5 py-3">
				{#if confirmDiscard}
					<div
						class="flex flex-wrap items-center justify-between gap-3"
						role="alertdialog"
						aria-label={ctx.labels.discardChanges}
					>
						<span class="text-sm font-medium">{ctx.labels.discardChanges}</span>
						<div class="flex gap-2">
							<button
								type="button"
								class="rounded-kleri border-2 border-border px-4 py-1.5 text-sm hover:border-kleri-2"
								onclick={() => (confirmDiscard = false)}
							>
								{ctx.labels.keepEditing}
							</button>
							<button
								type="button"
								class="rounded-kleri border-2 border-destructive bg-destructive/10 px-4 py-1.5 text-sm text-destructive hover:bg-destructive/20"
								onclick={() => {
									confirmDiscard = false;
									open = false;
								}}
							>
								{ctx.labels.discard}
							</button>
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap items-center gap-2">
						{#if mode === 'edit' && onDelete}
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-kleri px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
								onclick={onDelete}
							>
								<Trash2 class="size-4" />{ctx.labels.delete}
							</button>
						{/if}
						{#if submitError}
							<p
								class="min-w-0 flex-1 truncate font-spacemono text-xs text-destructive"
								role="alert"
								title={submitError}
							>
								{submitError}
							</p>
						{:else}
							<span class="flex-1"></span>
						{/if}
						<span class="hidden font-spacemono text-[10px] text-muted-foreground sm:inline"
							>⌘/Ctrl + Enter</span
						>
						<button
							type="button"
							class="rounded-kleri border-2 border-border px-4 py-1.5 text-sm transition-colors hover:border-kleri-2"
							onclick={requestClose}
						>
							{ctx.labels.cancel}
						</button>
						<KleriButton
							type="submit"
							class={cn('w-auto px-6 py-1.5 text-sm', showErrors && !isValid && 'kleri-shake')}
							disabled={saving}
						>
							{saving ? ctx.labels.saving : ctx.labels.save}
						</KleriButton>
					</div>
				{/if}
			</div>
		</form>
	{/snippet}
</KleriMorphDialog>
