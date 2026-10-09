<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Plus } from '@lucide/svelte';
	import KleriButton from '$lib/button/KleriButton/KleriButton.svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarSource } from '../store/calendar-store.svelte.js';
	import { addDays, startOfMonth, toDateKey } from '../core/date.js';
	import MiniCalendar from './MiniCalendar.svelte';
	import CalendarList from './CalendarList.svelte';

	interface Props {
		date: Date;
		range: { start: Date; end: Date };
		/** Both receive the clicked button, which the opened dialog morphs from. */
		onCreate: (origin?: HTMLElement) => void;
		onConnect?: (origin?: HTMLElement) => void;
		onReconnect?: (source: CalendarSource) => void;
		onDisconnect?: (source: CalendarSource) => void;
		canDisconnect?: (source: CalendarSource) => boolean;
		footer?: Snippet;
	}

	let {
		date,
		range,
		onCreate,
		onConnect,
		onReconnect,
		onDisconnect,
		canDisconnect,
		footer
	}: Props = $props();
	const ctx = getCalendarContext();

	let canCreate = $derived(!ctx.config.readOnly && ctx.store.writableCalendars.length > 0);

	/** Event colors per day around the focus month, for the mini calendar's dots. */
	let markerMap = $derived.by(() => {
		const clock = ctx.config.clock;
		const from = addDays(startOfMonth(date), -7);
		const to = addDays(from, 50);
		const map = new Map<string, string[]>();
		for (const o of ctx.store.occurrences(clock.toInstant(from), clock.toInstant(to))) {
			const day = o.allDay ? o.start : clock.toWall(o.start);
			const key = toDateKey(day);
			const colors = map.get(key) ?? [];
			if (!colors.includes(o.color)) colors.push(o.color);
			map.set(key, colors);
		}
		return map;
	});
</script>

<div class="flex h-full flex-col gap-4 overflow-hidden">
	{#if canCreate}
		<KleriButton
			class="flex h-11 items-center justify-center gap-2 font-medium shadow-md shadow-kleri-1/20"
			onclick={(e) => onCreate(e.currentTarget)}
		>
			<Plus class="size-5" strokeWidth={2.5} />
			{ctx.labels.create}
		</KleriButton>
	{/if}

	<MiniCalendar
		value={date}
		highlight={range}
		markers={(day) => markerMap.get(toDateKey(day)) ?? []}
		onSelect={(day) => ctx.actions.navigate(day)}
	/>

	<div class="-mx-1 flex kleri-scrollbar min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
		<div class="flex items-center justify-between px-2">
			<h2 class="text-sm font-semibold">{ctx.labels.calendars}</h2>
			{#if onConnect}
				<button
					type="button"
					class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-brand focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
					aria-label={ctx.labels.addCalendar}
					title={ctx.labels.addCalendar}
					onclick={(e) => onConnect(e.currentTarget)}
				>
					<Plus class="size-4" />
				</button>
			{/if}
		</div>
		<CalendarList {onReconnect} {onDisconnect} {canDisconnect} />
		{#if onConnect}
			<button
				type="button"
				class="mx-2 flex items-center justify-center gap-2 rounded-kleri border border-dashed border-(--kc-line-strong) py-2 text-sm text-muted-foreground transition-colors hover:border-kleri-2 hover:text-foreground"
				onclick={(e) => onConnect(e.currentTarget)}
			>
				<Plus class="size-4" />
				{ctx.labels.addCalendar}
			</button>
		{/if}
		{@render footer?.()}
	</div>
</div>
