<script lang="ts">
	import { tick } from 'svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import {
		addDays,
		addMonths,
		isSameDay,
		startOfDay,
		startOfMonth,
		startOfWeek,
		toDateKey,
		fromDateKey
	} from '../core/date.js';

	/**
	 * A compact month picker. Arrow keys move between days, PageUp/PageDown
	 * between months, Enter picks. Used by the sidebar and the date fields.
	 */
	interface Props {
		/** Selected day. */
		value: Date;
		onSelect: (date: Date) => void;
		/** Days to tint as part of the current view (e.g. the visible week). */
		highlight?: { start: Date; end: Date } | null;
		/** Colors of events on a day, drawn as dots. */
		markers?: (day: Date) => string[];
		/** Disable days before this one (e.g. a repeat's end date). */
		min?: Date;
		class?: string;
	}

	let { value, onSelect, highlight = null, markers, min, class: className }: Props = $props();
	const ctx = getCalendarContext();

	// Follows the selection (e.g. when the main view pages), but the arrows can
	// browse other months in the meantime.
	let visibleMonth = $derived(startOfMonth(value));
	let focusedKey = $state<string | null>(null);
	let gridEl = $state<HTMLElement | null>(null);

	let days = $derived.by(() => {
		const start = startOfWeek(visibleMonth, ctx.config.weekStartsOn);
		return Array.from({ length: 42 }, (_, i) => addDays(start, i));
	});
	let weeks = $derived([0, 1, 2, 3, 4, 5].map((w) => days.slice(w * 7, w * 7 + 7)));
	let activeKey = $derived.by(() => {
		const keys = days.map(toDateKey);
		if (focusedKey && keys.includes(focusedKey)) return focusedKey;
		const selected = toDateKey(value);
		if (keys.includes(selected) && value.getMonth() === visibleMonth.getMonth()) return selected;
		return toDateKey(visibleMonth);
	});

	function isDisabled(day: Date) {
		// `min` may carry a time of day; its own day stays selectable.
		return Boolean(min && day < startOfDay(min));
	}

	async function focus(day: Date) {
		if (
			day.getMonth() !== visibleMonth.getMonth() ||
			day.getFullYear() !== visibleMonth.getFullYear()
		) {
			visibleMonth = startOfMonth(day);
		}
		focusedKey = toDateKey(day);
		await tick();
		gridEl?.querySelector<HTMLElement>(`[data-mini-date="${focusedKey}"]`)?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		const key = (e.target as HTMLElement).dataset.miniDate;
		if (!key) return;
		const current = fromDateKey(key);
		const moves: Record<string, () => Date> = {
			ArrowLeft: () => addDays(current, -1),
			ArrowRight: () => addDays(current, 1),
			ArrowUp: () => addDays(current, -7),
			ArrowDown: () => addDays(current, 7),
			PageUp: () => addMonths(current, -1),
			PageDown: () => addMonths(current, 1),
			Home: () => startOfWeek(current, ctx.config.weekStartsOn),
			End: () => addDays(startOfWeek(current, ctx.config.weekStartsOn), 6)
		};
		const move = moves[e.key];
		if (!move) return;
		e.preventDefault();
		void focus(move());
	}
</script>

<div class={cn('w-full select-none', className)}>
	<div class="mb-1 flex items-center justify-between gap-1 px-1">
		<span class="text-sm font-semibold" aria-live="polite"
			>{ctx.formatters.monthYear(visibleMonth)}</span
		>
		<div class="flex items-center">
			<button
				type="button"
				class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
				aria-label={ctx.labels.previousMonth}
				onclick={() => (visibleMonth = addMonths(visibleMonth, -1))}
			>
				<ChevronLeft class="size-4" />
			</button>
			<button
				type="button"
				class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
				aria-label={ctx.labels.nextMonth}
				onclick={() => (visibleMonth = addMonths(visibleMonth, 1))}
			>
				<ChevronRight class="size-4" />
			</button>
		</div>
	</div>

	<table
		bind:this={gridEl}
		class="w-full table-fixed border-collapse"
		role="grid"
		aria-label="{ctx.labels.datePicker}, {ctx.formatters.monthYear(visibleMonth)}"
		onkeydown={onKeydown}
	>
		<thead>
			<tr>
				{#each weeks[0] as day (day.getDay())}
					<th scope="col" class="pb-1 font-spacemono text-[10px] font-normal text-muted-foreground">
						<abbr title={ctx.formatters.weekdayLong(day)} class="no-underline"
							>{ctx.formatters.weekdayNarrow(day)}</abbr
						>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week, w (w)}
				<tr>
					{#each week as day (toDateKey(day))}
						{@const key = toDateKey(day)}
						{@const selected = isSameDay(day, value)}
						{@const isToday = isSameDay(day, ctx.today)}
						{@const outside = day.getMonth() !== visibleMonth.getMonth()}
						{@const inRange = highlight && day >= highlight.start && day < highlight.end}
						{@const dots = markers?.(day) ?? []}
						<td
							class={cn(
								// pb-1 keeps the event dots clear of the next week's numbers.
								'p-0 pb-1 text-center',
								inRange && 'bg-kleri-2/12 first:rounded-l-full last:rounded-r-full'
							)}
						>
							<button
								type="button"
								data-mini-date={key}
								tabindex={key === activeKey ? 0 : -1}
								disabled={isDisabled(day)}
								aria-label={ctx.formatters.fullDate(day)}
								aria-pressed={selected}
								aria-current={isToday ? 'date' : undefined}
								class={cn(
									'relative mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30',
									outside && !inRange && 'text-muted-foreground',
									!selected && !isToday && 'hover:bg-muted/60',
									isToday && !selected && 'font-semibold text-kleri-1 dark:text-kleri-2',
									selected && 'font-semibold text-black kleri-bg'
								)}
								onfocus={() => (focusedKey = key)}
								onclick={() => onSelect(day)}
							>
								{day.getDate()}
								{#if dots.length && !selected}
									<span
										class="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-px"
										aria-hidden="true"
									>
										{#each dots.slice(0, 3) as color, i (i)}
											<span class="size-[3px] rounded-full" style:background-color={color}></span>
										{/each}
									</span>
								{/if}
							</button>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
