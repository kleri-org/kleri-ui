<script lang="ts">
	import { Repeat, Video } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../../context.js';
	import type { DisplayOccurrence } from '../../types.js';
	import { eventStateAttributes, occurrenceAriaLabel, occurrenceTitle } from '../utils.js';

	/**
	 * A timed event inside a time-grid column. Positioning is the parent's job;
	 * this renders the tinted surface and adapts its content to the height.
	 */
	interface Props {
		occurrence: DisplayOccurrence;
		viewId: string;
		/** Pixel height, used to pick a layout. */
		height: number;
		/** Times to show instead of the occurrence's own (while dragging). */
		start?: Date;
		end?: Date;
		/** Rendered as a drag preview: not focusable, not interactive. */
		ghost?: boolean;
		/** The original stays put, faded, while its ghost is dragged. */
		dragging?: boolean;
		/** Cut off at the top/bottom of the visible hours. */
		continuesBefore?: boolean;
		continuesAfter?: boolean;
		style?: string;
		class?: string;
		onkeydown?: (event: KeyboardEvent) => void;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		occurrence,
		viewId,
		height,
		start,
		end,
		ghost = false,
		dragging = false,
		continuesBefore = false,
		continuesAfter = false,
		style,
		class: className,
		onkeydown,
		onclick
	}: Props = $props();

	const ctx = getCalendarContext();

	let displayStart = $derived(start ?? occurrence.displayStart);
	let displayEnd = $derived(end ?? occurrence.displayEnd);
	let title = $derived(occurrenceTitle(occurrence, ctx.labels));
	let compact = $derived(height < 34);
	let roomy = $derived(height >= 64);
	let editable = $derived(!ghost && ctx.actions.canModify(occurrence));
	let timeText = $derived(ctx.formatters.timeRange(displayStart, displayEnd));
	let state = $derived(eventStateAttributes(occurrence, ctx.now, ctx.config.dimPastEvents));
</script>

<button
	type="button"
	data-event-key={ghost ? undefined : occurrence.key}
	data-event-id={ghost ? undefined : occurrence.event.id}
	data-selected={String(!ghost && ctx.selectedKey === occurrence.key)}
	{...state}
	tabindex={ghost ? -1 : 0}
	aria-hidden={ghost || undefined}
	aria-label={occurrenceAriaLabel(occurrence, ctx.labels, ctx.formatters)}
	aria-roledescription="event"
	style="--event-color: {occurrence.color}; {style ?? ''}"
	class={cn(
		'group/event @container/event absolute kleri-event overflow-hidden rounded-md text-left text-xs leading-tight outline-none select-none focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
		compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
		'@max-[52px]/event:px-1',
		continuesBefore && 'rounded-t-none',
		continuesAfter && 'rounded-b-none',
		ghost && 'pointer-events-none z-30 shadow-lg ring-2 shadow-black/30 ring-kleri-2/70',
		dragging && 'opacity-35',
		editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
		className
	)}
	{onkeydown}
	{onclick}
>
	{#if ctx.eventContent}
		{@render ctx.eventContent({ occurrence, view: viewId, compact })}
	{:else if compact}
		<span class="flex min-w-0 items-baseline gap-1.5 truncate">
			<span class="truncate font-semibold">{title}</span>
			<span class="shrink-0 font-spacemono text-[10px] @max-[80px]/event:hidden"
				>{ctx.formatters.time(displayStart, true)}</span
			>
		</span>
	{:else}
		<!-- Narrow blocks (three-way overlaps) truncate instead of breaking words apart. -->
		<span
			class="line-clamp-2 font-semibold break-words @max-[88px]/event:line-clamp-none @max-[88px]/event:truncate"
			class:line-clamp-3={roomy}>{title}</span
		>
		<span
			class="mt-0.5 flex items-center gap-1 font-spacemono text-[10px] @max-[60px]/event:hidden"
		>
			<span class="truncate">{timeText}</span>
			{#if occurrence.recurring}
				<Repeat class="size-2.5 shrink-0" aria-hidden="true" />
			{/if}
			{#if occurrence.event.conference}
				<Video class="size-3 shrink-0" aria-hidden="true" />
			{/if}
		</span>
		{#if roomy && occurrence.event.location}
			<span class="mt-0.5 block truncate text-[11px]">{occurrence.event.location}</span>
		{/if}
	{/if}

	{#if editable && !occurrence.allDay && !continuesAfter}
		<!-- Resize handle: the time grid recognises it by the data attribute. -->
		<span
			data-resize-handle
			aria-hidden="true"
			class="absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-end justify-center opacity-0 transition-opacity group-hover/event:opacity-100"
		>
			<span class="mb-0.5 h-0.5 w-6 rounded-full bg-current opacity-60"></span>
		</span>
	{/if}
</button>
