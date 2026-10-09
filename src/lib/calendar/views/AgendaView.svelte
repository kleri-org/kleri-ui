<script lang="ts">
	import { CalendarPlus, MapPin, Repeat, Users, Video } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import type { DisplayOccurrence } from '../types.js';
	import type { CalendarViewProps } from './types.js';
	import {
		addDays,
		addMinutes,
		atMinutes,
		ceilToStep,
		eachDay,
		isSameDay,
		toDateKey
	} from '../core/date.js';
	import { CONFERENCE_LABELS } from '../core/ics.js';
	import { safeUrl } from '../core/safe.js';
	import { eventStateAttributes, occurrenceAriaLabel, occurrenceTitle } from './utils.js';

	let { range, occurrences, viewId }: CalendarViewProps = $props();
	const ctx = getCalendarContext();

	interface DayGroup {
		day: Date;
		items: DisplayOccurrence[];
	}

	let groups = $derived.by(() => {
		const out: DayGroup[] = [];
		for (const day of eachDay(range.start, range.end)) {
			const next = addDays(day, 1);
			const items = occurrences.filter((o) =>
				o.displayStart.getTime() === o.displayEnd.getTime()
					? isSameDay(o.displayStart, day)
					: o.displayStart < next && o.displayEnd > day
			);
			if (items.length || isSameDay(day, ctx.today)) out.push({ day, items });
		}
		return out;
	});
	let isEmpty = $derived(groups.every((g) => g.items.length === 0));
	let canCreate = $derived(!ctx.config.readOnly && ctx.store.writableCalendars.length > 0);

	function timeLabel(o: DisplayOccurrence, day: Date): string {
		const next = addDays(day, 1);
		if (o.allDay || (o.displayStart <= day && o.displayEnd >= next)) return ctx.labels.allDay;
		if (o.displayStart < day) return `– ${ctx.formatters.time(o.displayEnd)}`;
		if (o.displayEnd > next) return `${ctx.formatters.time(o.displayStart)} –`;
		return ctx.formatters.timeRange(o.displayStart, o.displayEnd);
	}

	/** Offer "Join" from ten minutes before a meeting until it ends. */
	function isJoinable(o: DisplayOccurrence): boolean {
		return (
			Boolean(safeUrl(o.event.conference?.url)) &&
			addMinutes(o.displayStart, -10) <= ctx.now &&
			o.displayEnd > ctx.now
		);
	}

	function createToday() {
		const inRange = ctx.now >= range.start && ctx.now < range.end;
		const start = inRange
			? ceilToStep(ctx.now, 30)
			: atMinutes(range.start, ctx.config.workingHours?.start ?? 9 * 60);
		ctx.actions.create(
			{ start, end: addMinutes(start, ctx.config.defaultEventDuration), allDay: false },
			{ full: true }
		);
	}
</script>

<div class="kleri-scrollbar h-full overflow-y-auto" data-view={viewId}>
	{#if isEmpty}
		<div class="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
			<div
				class="flex size-14 items-center justify-center rounded-2xl text-kleri-ink shadow-lg shadow-kleri-1/30 kleri-bg"
			>
				<CalendarPlus class="size-7" strokeWidth={2.2} />
			</div>
			<p class="text-lg font-semibold">{ctx.labels.noEvents}</p>
			<p class="max-w-xs text-sm text-muted-foreground">{ctx.labels.noEventsHint}</p>
			{#if canCreate}
				<button
					type="button"
					class="mt-1 rounded-kleri border border-border px-4 py-1.5 text-sm transition-colors hover:border-kleri-2 hover:bg-kleri-2/10"
					onclick={createToday}
				>
					{ctx.labels.newEvent}
				</button>
			{/if}
		</div>
	{:else}
		<ol class="divide-y divide-(--kc-line)">
			{#each groups as group (toDateKey(group.day))}
				{@const isToday = isSameDay(group.day, ctx.today)}
				<li
					class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 px-3 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:px-5"
				>
					<button
						type="button"
						class="sticky top-2 flex h-fit items-center gap-2 self-start rounded-lg p-1 text-left transition-colors hover:bg-muted/40"
						aria-label={ctx.formatters.fullDate(group.day)}
						onclick={() => ctx.actions.navigate(group.day, 'day')}
					>
						<span
							class={cn(
								'flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-semibold',
								isToday && 'text-kleri-ink kleri-bg'
							)}
						>
							{ctx.formatters.dayOfMonth(group.day)}
						</span>
						<span
							class="flex flex-col font-spacemono text-[10px] leading-tight tracking-wider text-muted-foreground uppercase"
						>
							<span class={isToday ? 'text-brand' : undefined}>
								{ctx.formatters.weekdayShort(group.day)}
							</span>
							<span>{ctx.formatters.monthShort(group.day)}</span>
						</span>
					</button>

					<ul class="flex flex-col gap-1">
						{#if group.items.length === 0}
							<li class="px-2 py-2 text-sm text-muted-foreground">{ctx.labels.noEvents}</li>
						{/if}
						{#each group.items as o (o.key)}
							{@const state = eventStateAttributes(o, ctx.now, ctx.config.dimPastEvents)}
							<li class="group/row flex items-center gap-2">
								<button
									type="button"
									data-event-key={o.key}
									data-event-id={o.event.id}
									data-selected={String(ctx.selectedKey === o.key)}
									aria-label={occurrenceAriaLabel(o, ctx.labels, ctx.formatters)}
									class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none data-[past=true]:text-muted-foreground data-[selected=true]:bg-kleri-2/15 sm:grid-cols-[10.5rem_minmax(0,1fr)]"
									data-past={state['data-past']}
									onclick={(e) => ctx.actions.open(o, e.currentTarget)}
								>
									<span class="flex items-center gap-2 pt-0.5">
										<span
											class="size-2.5 shrink-0 rounded-full"
											style:background-color={o.color}
											class:opacity-40={state['data-response'] === 'needsAction'}
										></span>
										<span class="hidden font-spacemono text-xs text-muted-foreground sm:inline"
											>{timeLabel(o, group.day)}</span
										>
									</span>
									<span class="min-w-0">
										<span
											class="block truncate text-sm font-medium"
											class:line-through={state['data-response'] === 'declined'}
										>
											{occurrenceTitle(o, ctx.labels)}
										</span>
										<span
											class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
										>
											<span class="font-spacemono sm:hidden">{timeLabel(o, group.day)}</span>
											{#if o.event.location}
												<span class="flex min-w-0 items-center gap-1"
													><MapPin class="size-3 shrink-0" /><span class="truncate"
														>{o.event.location}</span
													></span
												>
											{/if}
											{#if o.event.attendees?.length}
												<span class="flex items-center gap-1"
													><Users class="size-3" />{o.event.attendees.length}</span
												>
											{/if}
											{#if o.recurring}
												<Repeat class="size-3" aria-hidden="true" />
											{/if}
										</span>
									</span>
								</button>
								{#if o.event.conference && isJoinable(o)}
									<a
										href={safeUrl(o.event.conference.url)}
										target="_blank"
										rel="noopener noreferrer"
										class="flex shrink-0 items-center gap-1.5 rounded-kleri border border-kleri-ink px-3 py-1 text-xs font-medium text-kleri-ink kleri-bg"
									>
										<Video class="size-3.5" />
										{ctx.labels.join(
											o.event.conference.label ??
												CONFERENCE_LABELS[o.event.conference.kind ?? 'other']
										)}
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{/if}
</div>
