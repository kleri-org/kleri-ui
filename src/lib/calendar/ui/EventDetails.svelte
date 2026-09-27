<script lang="ts">
	import type { Snippet } from 'svelte';
	import { DropdownMenu } from 'bits-ui';
	import {
		AlignLeft,
		Bell,
		CalendarDays,
		CalendarPlus,
		Check,
		CircleHelp,
		Copy,
		CopyPlus,
		Download,
		ExternalLink,
		Globe,
		MapPin,
		Pencil,
		Repeat,
		Trash2,
		Users,
		Video,
		X
	} from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import type { AttendeeResponse, CalendarAttendee, DisplayOccurrence } from '../types.js';
	import { addDays, isSameDay } from '../core/date.js';
	import { describeRecurrence } from '../core/recurrence.js';
	import {
		CONFERENCE_LABELS,
		downloadICS,
		googleCalendarUrl,
		icsFileName,
		outlookCalendarUrl,
		serializeICS
	} from '../core/ics.js';
	import { safeUrl } from '../core/safe.js';
	import { selfResponse, occurrenceTitle } from '../views/utils.js';
	import { initials, avatarColor } from './people.js';

	interface Props {
		occurrence: DisplayOccurrence;
		onEdit: () => void;
		onDelete: () => void;
		onDuplicate: () => void;
		onClose: () => void;
		onRespond: (response: AttendeeResponse) => void;
		/** Extra content from the consumer, rendered above the calendar line. */
		extra?: Snippet<[DisplayOccurrence]>;
	}

	let { occurrence, onEdit, onDelete, onDuplicate, onClose, onRespond, extra }: Props = $props();
	const ctx = getCalendarContext();

	let event = $derived(occurrence.event);
	let editable = $derived(ctx.actions.canModify(occurrence));
	let title = $derived(occurrenceTitle(occurrence, ctx.labels));
	let response = $derived(selfResponse(event));
	let canRespond = $derived(
		response !== undefined &&
			Boolean(ctx.store.providerFor(occurrence.calendar.id)?.capabilities.respond)
	);
	let source = $derived(ctx.store.getSource(occurrence.calendar.sourceId));
	let copied = $state(false);

	let whenLine = $derived.by(() => {
		const { displayStart: s, displayEnd: e } = occurrence;
		if (occurrence.allDay) {
			const last = addDays(e, -1);
			return isSameDay(s, last) || last < s
				? ctx.formatters.fullDate(s)
				: `${ctx.formatters.mediumDate(s)} – ${ctx.formatters.mediumDate(last)}`;
		}
		if (isSameDay(s, e) || e.getTime() === addDays(s, 1).setHours(0, 0, 0, 0)) {
			return `${ctx.formatters.fullDate(s)} · ${ctx.formatters.timeRange(s, e)}`;
		}
		return `${ctx.formatters.mediumDate(s)}, ${ctx.formatters.time(s)} – ${ctx.formatters.mediumDate(e)}, ${ctx.formatters.time(e)}`;
	});

	let startsSoon = $derived.by(() => {
		const minutes = (occurrence.displayStart.getTime() - ctx.now.getTime()) / 60_000;
		if (occurrence.allDay) return null;
		if (minutes > 0 && minutes <= 60)
			return ctx.formatters.relative(occurrence.displayStart, ctx.now);
		if (minutes <= 0 && occurrence.displayEnd > ctx.now) return 'Happening now';
		return null;
	});

	let recurrenceText = $derived(
		event.recurrence
			? describeRecurrence(event.recurrence, { locale: ctx.config.locale, start: event.start })
			: null
	);

	let foreignZone = $derived(
		event.timeZone && !occurrence.allDay && event.timeZone !== ctx.config.clock.timeZone
			? event.timeZone
			: null
	);

	// Invites and feeds are untrusted: only http(s)-style links become clickable.
	let eventUrl = $derived(safeUrl(event.url));
	let conferenceUrl = $derived(safeUrl(event.conference?.url));

	let conferenceLabel = $derived(
		event.conference
			? (event.conference.label ?? CONFERENCE_LABELS[event.conference.kind ?? 'other'])
			: ''
	);

	let guests = $derived(event.attendees ?? []);
	let guestCounts = $derived({
		yes: guests.filter((g) => g.response === 'accepted').length,
		no: guests.filter((g) => g.response === 'declined').length,
		maybe: guests.filter((g) => g.response === 'tentative').length,
		awaiting: guests.filter((g) => !g.response || g.response === 'needsAction').length
	});
	let showAllGuests = $state(false);
	let visibleGuests = $derived(showAllGuests ? guests : guests.slice(0, 6));

	const URL_PATTERN = /(https?:\/\/[^\s<>"')]+)/g;

	function linkify(text: string): { text: string; href?: string }[] {
		return text
			.split(URL_PATTERN)
			.map((part, i) => (i % 2 === 1 ? { text: part, href: part } : { text: part }));
	}

	let locationIsUrl = $derived(Boolean(event.location && /^https?:\/\//.test(event.location)));

	function reminderText(minutes: number): string {
		if (minutes === 0) return 'At start time';
		return ctx.labels.reminderBefore(ctx.formatters.duration(minutes));
	}

	async function copyLink() {
		if (!conferenceUrl) return;
		try {
			await navigator.clipboard.writeText(conferenceUrl);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard blocked; the link is still visible to copy by hand.
		}
	}

	function exportIcs() {
		// A standalone copy of this one occurrence, not an orphaned series exception.
		downloadICS(
			serializeICS([
				{
					...event,
					start: occurrence.start,
					end: occurrence.end,
					recurrence: undefined,
					exdates: undefined,
					recurringEventId: undefined,
					originalStart: undefined
				}
			]),
			icsFileName(event.title)
		);
	}

	function responseIcon(r: CalendarAttendee['response']) {
		if (r === 'accepted') return { icon: Check, className: 'bg-emerald-500 text-white' };
		if (r === 'declined') return { icon: X, className: 'bg-destructive text-white' };
		if (r === 'tentative') return { icon: CircleHelp, className: 'bg-amber-400 text-black' };
		return null;
	}

	const actionButton =
		'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none';
	const row = 'grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3';
</script>

<div class="flex max-h-[min(34rem,80vh)] flex-col">
	<div class="flex items-center justify-end gap-0.5 px-2 pt-2">
		{#if editable}
			<button
				type="button"
				class={actionButton}
				aria-label={ctx.labels.edit}
				title="{ctx.labels.edit} (E)"
				onclick={onEdit}
			>
				<Pencil class="size-4" />
			</button>
			<button
				type="button"
				class={actionButton}
				aria-label={ctx.labels.delete}
				title={ctx.labels.delete}
				onclick={onDelete}
			>
				<Trash2 class="size-4" />
			</button>
		{/if}
		{#if ctx.store.writableCalendars.length && !ctx.config.readOnly}
			<button
				type="button"
				class={actionButton}
				aria-label={ctx.labels.duplicate}
				title={ctx.labels.duplicate}
				onclick={onDuplicate}
			>
				<CopyPlus class="size-4" />
			</button>
		{/if}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={actionButton}
				aria-label={ctx.labels.addToCalendar}
				title={ctx.labels.addToCalendar}
			>
				<CalendarPlus class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align="end"
					sideOffset={4}
					class="kleri-dropdown z-[60] min-w-48 rounded-kleri border-2 border-border bg-popover p-1 text-sm shadow-xl outline-hidden"
				>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-hidden data-highlighted:bg-kleri-2/20"
						onSelect={exportIcs}
					>
						<Download class="size-4" />{ctx.labels.downloadIcs}
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-hidden data-highlighted:bg-kleri-2/20"
						onSelect={() =>
							window.open(
								googleCalendarUrl({ ...event, start: occurrence.start, end: occurrence.end }),
								'_blank',
								'noopener'
							)}
					>
						<ExternalLink class="size-4" />{ctx.labels.openInGoogle}
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-hidden data-highlighted:bg-kleri-2/20"
						onSelect={() =>
							window.open(
								outlookCalendarUrl({ ...event, start: occurrence.start, end: occurrence.end }),
								'_blank',
								'noopener'
							)}
					>
						<ExternalLink class="size-4" />{ctx.labels.openInOutlook}
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
		{#if eventUrl}
			<a
				href={eventUrl}
				target="_blank"
				rel="noopener noreferrer"
				class={actionButton}
				aria-label={ctx.labels.openOriginal}
				title={ctx.labels.openOriginal}
			>
				<ExternalLink class="size-4" />
			</a>
		{/if}
		<button type="button" class={actionButton} aria-label={ctx.labels.close} onclick={onClose}>
			<X class="size-4" />
		</button>
	</div>

	<div class="flex kleri-scrollbar flex-col gap-4 overflow-y-auto px-4 pt-1 pb-4">
		<div class={row}>
			<span
				class="mt-1.5 size-3.5 rounded-[4px]"
				style:background-color={occurrence.color}
				aria-hidden="true"
			></span>
			<div class="min-w-0">
				<h2
					class="text-lg leading-snug font-semibold break-words"
					class:line-through={response === 'declined'}
				>
					{title}
				</h2>
				<p class="mt-0.5 text-sm text-muted-foreground">{whenLine}</p>
				{#if recurrenceText}
					<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
						<Repeat class="size-3" />{recurrenceText}
					</p>
				{/if}
				{#if foreignZone}
					<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
						<Globe class="size-3" />{foreignZone.replaceAll('_', ' ')}
					</p>
				{/if}
				{#if startsSoon}
					<span
						class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-kleri-2/15 px-2 py-0.5 font-spacemono text-[11px] text-kleri-1 dark:text-kleri-2"
					>
						<span class="size-1.5 animate-pulse rounded-full bg-kleri-2"></span>{startsSoon}
					</span>
				{/if}
			</div>
		</div>

		{#if event.conference && conferenceUrl}
			<div class={row}>
				<Video class="mt-2 size-5 text-muted-foreground" />
				<div class="flex min-w-0 flex-col gap-1.5">
					<a
						href={conferenceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex w-fit items-center gap-2 rounded-kleri border-2 border-black px-4 py-1.5 text-sm font-medium text-black shadow-md shadow-kleri-1/25 transition-transform kleri-bg hover:scale-[1.02] active:scale-[0.98]"
					>
						<Video class="size-4" />
						{ctx.labels.join(conferenceLabel)}
					</a>
					<div class="flex min-w-0 items-center gap-1.5">
						<span class="truncate font-spacemono text-[11px] text-muted-foreground"
							>{conferenceUrl.replace(/^https?:\/\//, '')}</span
						>
						<button
							type="button"
							class="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
							aria-label={copied ? ctx.labels.linkCopied : ctx.labels.copyLink}
							title={copied ? ctx.labels.linkCopied : ctx.labels.copyLink}
							onclick={copyLink}
						>
							{#if copied}<Check class="size-3.5 text-kleri-1 dark:text-kleri-2" />{:else}<Copy
									class="size-3.5"
								/>{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if event.location}
			<div class={row}>
				<MapPin class="mt-0.5 size-5 text-muted-foreground" />
				{#if locationIsUrl}
					<a
						href={event.location}
						target="_blank"
						rel="noopener noreferrer"
						class="truncate text-sm text-kleri-1 hover:underline dark:text-kleri-2"
						>{event.location}</a
					>
				{:else}
					<a
						href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(
							event.location
						)}"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm break-words hover:text-kleri-1 hover:underline dark:hover:text-kleri-2"
					>
						{event.location}
					</a>
				{/if}
			</div>
		{/if}

		{#if guests.length}
			<div class={row}>
				<Users class="mt-0.5 size-5 text-muted-foreground" />
				<div class="min-w-0">
					<p class="text-sm font-medium">{ctx.labels.guests(guests.length)}</p>
					<p class="text-xs text-muted-foreground">
						{ctx.labels.guestSummary(
							guestCounts.yes,
							guestCounts.no,
							guestCounts.maybe,
							guestCounts.awaiting
						)}
					</p>
					<ul class="mt-2 flex flex-col gap-1.5">
						{#each visibleGuests as guest, i (i)}
							{@const badge = responseIcon(guest.response)}
							<li class="flex items-center gap-2.5">
								<span class="relative shrink-0">
									<span
										class="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
										style:background-color={avatarColor(guest.email)}
									>
										{initials(guest)}
									</span>
									{#if badge}
										<span
											class={cn(
												'absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full ring-2 ring-popover',
												badge.className
											)}
										>
											<badge.icon class="size-2.5" strokeWidth={3} />
										</span>
									{/if}
								</span>
								<span class="min-w-0 flex-1 leading-tight">
									<span class="block truncate text-sm"
										>{guest.name ?? guest.email}{guest.self ? ' (you)' : ''}</span
									>
									<span class="block truncate text-[11px] text-muted-foreground">
										{#if guest.organizer}{ctx.labels.organizer}{:else if guest.optional}{ctx.labels
												.optional}{:else if guest.name}{guest.email}{/if}
									</span>
								</span>
							</li>
						{/each}
					</ul>
					{#if guests.length > 6 && !showAllGuests}
						<button
							type="button"
							class="mt-1.5 text-xs text-kleri-1 hover:underline dark:text-kleri-2"
							onclick={() => (showAllGuests = true)}
						>
							{ctx.labels.more(guests.length - 6)}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if event.description}
			<div class={row}>
				<AlignLeft class="mt-0.5 size-5 text-muted-foreground" />
				<p class="kleri-scrollbar max-h-40 overflow-y-auto text-sm break-words whitespace-pre-line">
					{#each linkify(event.description) as part, i (i)}
						{#if part.href}
							<a
								href={part.href}
								target="_blank"
								rel="noopener noreferrer"
								class="text-kleri-1 hover:underline dark:text-kleri-2">{part.text}</a
							>
						{:else}{part.text}{/if}
					{/each}
				</p>
			</div>
		{/if}

		{#if event.reminders?.length}
			<div class={row}>
				<Bell class="mt-0.5 size-5 text-muted-foreground" />
				<p class="text-sm">{event.reminders.map(reminderText).join(', ')}</p>
			</div>
		{/if}

		{@render extra?.(occurrence)}

		<div class={row}>
			<CalendarDays class="mt-0.5 size-5 text-muted-foreground" />
			<p class="min-w-0 text-sm">
				<span class="block truncate">{occurrence.calendar.name}</span>
				{#if source?.provider.account}
					<span class="block truncate text-xs text-muted-foreground">{source.provider.account}</span
					>
				{/if}
			</p>
		</div>
	</div>

	{#if canRespond}
		<div class="flex items-center gap-2 border-t border-(--kc-line) px-4 py-2.5">
			<span class="mr-auto text-sm font-medium">{ctx.labels.going}</span>
			{#each [['accepted', ctx.labels.yes], ['declined', ctx.labels.no], ['tentative', ctx.labels.maybe]] as [value, label] (value)}
				<button
					type="button"
					aria-pressed={response === value}
					class={cn(
						'rounded-kleri border-2 px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none',
						response === value
							? 'border-black font-medium text-black kleri-bg'
							: 'border-border hover:border-kleri-2'
					)}
					onclick={() => onRespond(value as AttendeeResponse)}
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}
</div>
