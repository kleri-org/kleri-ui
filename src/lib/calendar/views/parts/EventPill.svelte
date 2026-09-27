<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../../context.js';
	import type { DisplayOccurrence } from '../../types.js';
	import {
		eventStateAttributes,
		isAllDayLike,
		occurrenceAriaLabel,
		occurrenceTitle
	} from '../utils.js';

	/**
	 * One event in a day grid (month cells, all-day strips, overflow lists).
	 * All-day and multi-day events render as tinted bars; single-day timed
	 * events as a colored dot, start time and title, like most calendars.
	 */
	interface Props {
		occurrence: DisplayOccurrence;
		viewId: string;
		continuesBefore?: boolean;
		continuesAfter?: boolean;
		ghost?: boolean;
		dragging?: boolean;
		/** Force the bar style even for timed events. */
		bar?: boolean;
		style?: string;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		occurrence,
		viewId,
		continuesBefore = false,
		continuesAfter = false,
		ghost = false,
		dragging = false,
		bar,
		style,
		class: className,
		onclick
	}: Props = $props();

	const ctx = getCalendarContext();

	let asBar = $derived(bar ?? isAllDayLike(occurrence));
	let title = $derived(occurrenceTitle(occurrence, ctx.labels));
	let state = $derived(eventStateAttributes(occurrence, ctx.now, ctx.config.dimPastEvents));
	let editable = $derived(!ghost && ctx.actions.canModify(occurrence));
</script>

<button
	type="button"
	data-event-key={ghost ? undefined : occurrence.key}
	data-event-id={ghost ? undefined : occurrence.event.id}
	data-selected={String(!ghost && ctx.selectedKey === occurrence.key)}
	{...asBar ? state : { 'data-past': state['data-past'], 'data-pending': state['data-pending'] }}
	tabindex={ghost ? -1 : 0}
	aria-hidden={ghost || undefined}
	aria-label={occurrenceAriaLabel(occurrence, ctx.labels, ctx.formatters)}
	aria-roledescription="event"
	style="--event-color: {occurrence.color}; {style ?? ''}"
	class={cn(
		'flex h-[20px] w-full min-w-0 items-center gap-1 overflow-hidden text-left text-xs leading-none outline-none select-none focus-visible:ring-2 focus-visible:ring-kleri-2',
		asBar
			? 'kleri-event rounded-md px-1.5 font-medium'
			: 'rounded-md px-1 text-foreground transition-colors hover:bg-muted/60 data-[past=true]:text-muted-foreground data-[pending=true]:animate-pulse data-[selected=true]:bg-kleri-2/20',
		asBar && continuesBefore && 'rounded-l-none border-l-0 pl-1',
		asBar && continuesAfter && 'rounded-r-none',
		ghost && 'pointer-events-none z-30 shadow-lg ring-2 shadow-black/30 ring-kleri-2/70',
		dragging && 'opacity-35',
		editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
		className
	)}
	{onclick}
>
	{#if ctx.eventContent}
		{@render ctx.eventContent({ occurrence, view: viewId, compact: true })}
	{:else if asBar}
		{#if continuesBefore}<ChevronLeft class="size-3 shrink-0 opacity-70" aria-hidden="true" />{/if}
		<span class="min-w-0 flex-1 truncate">
			{#if !occurrence.allDay}
				<span class="mr-1 font-spacemono text-[10px]"
					>{ctx.formatters.time(occurrence.displayStart, true)}</span
				>
			{/if}{title}
		</span>
		{#if continuesAfter}<ChevronRight class="size-3 shrink-0 opacity-70" aria-hidden="true" />{/if}
	{:else}
		<span
			class="size-2 shrink-0 rounded-full"
			style="background-color: var(--event-color)"
			class:opacity-50={state['data-response'] === 'needsAction' ||
				state['data-tentative'] === 'true'}
			aria-hidden="true"
		></span>
		<span class="shrink-0 font-spacemono text-[10px] text-muted-foreground">
			{ctx.formatters.time(occurrence.displayStart, true)}
		</span>
		<span class="min-w-0 truncate" class:line-through={state['data-response'] === 'declined'}
			>{title}</span
		>
	{/if}
</button>
