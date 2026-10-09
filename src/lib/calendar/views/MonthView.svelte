<script lang="ts">
	import { tick } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import type { DisplayOccurrence } from '../types.js';
	import type { CalendarViewProps } from './types.js';
	import {
		addDays,
		addMinutes,
		addMonths,
		atMinutes,
		ceilToStep,
		eachDay,
		fromDateKey,
		isSameDay,
		isoWeekNumber,
		startOfWeek,
		toDateKey
	} from '../core/date.js';
	import { countHiddenPerDay, layoutDaySpans } from '../core/layout.js';
	import { DayGridDrag } from './day-grid-drag.svelte.js';
	import EventPill from './parts/EventPill.svelte';
	import DayOverflow from './parts/DayOverflow.svelte';

	let { date, range, occurrences, viewId }: CalendarViewProps = $props();
	const ctx = getCalendarContext();

	// Day-number band: must clear the 24px number button (6px top inset) so the
	// first event lane never crowds it.
	const HEADER = 36;
	const LANE = 22;

	let gridEl = $state<HTMLElement | null>(null);
	let rowHeight = $state(120);

	/** The month the grid is about, i.e. the one owning its middle. */
	let month = $derived(addDays(range.start, 14));
	let canCreate = $derived(!ctx.config.readOnly && ctx.store.writableCalendars.length > 0);

	let weeks = $derived.by(() => {
		const rows: Date[][] = [];
		for (let start = range.start; start < range.end; start = addDays(start, 7)) {
			rows.push(
				eachDay(start, addDays(start, 7)).filter((d) => !ctx.config.hiddenDays.includes(d.getDay()))
			);
		}
		return rows;
	});
	let columns = $derived(weeks[0]?.length ?? 7);
	let template = $derived(`repeat(${columns}, minmax(0, 1fr))`);
	let maxLanes = $derived(Math.max(1, Math.floor((rowHeight - HEADER - 4) / LANE)));

	let layouts = $derived(
		weeks.map((week) => {
			const layout = layoutDaySpans(occurrences, week, (o) => ({
				start: o.displayStart,
				end: o.displayEnd
			}));
			const visible = layout.laneCount > maxLanes ? maxLanes - 1 : maxLanes;
			return { ...layout, visible, hidden: countHiddenPerDay(layout.spans, week.length, visible) };
		})
	);

	function occurrencesOn(day: Date): DisplayOccurrence[] {
		const next = addDays(day, 1);
		return occurrences.filter((o) =>
			o.displayStart.getTime() === o.displayEnd.getTime()
				? isSameDay(o.displayStart, day)
				: o.displayStart < next && o.displayEnd > day
		);
	}

	/** Where a click on an empty day starts a new event. */
	function defaultStart(day: Date): Date {
		if (isSameDay(day, ctx.today)) {
			const next = ceilToStep(ctx.now, 30);
			if (isSameDay(next, day)) return next;
		}
		return atMinutes(day, ctx.config.workingHours?.start ?? 9 * 60);
	}

	function createOn(day: Date, anchor?: HTMLElement) {
		const start = defaultStart(day);
		ctx.actions.create(
			{ start, end: addMinutes(start, ctx.config.defaultEventDuration), allDay: false },
			{ anchor }
		);
	}

	const drag = new DayGridDrag({
		container: () => gridEl,
		findOccurrence: (key) => occurrences.find((o) => o.key === key),
		canCreate: () => canCreate,
		canMove: (o) => ctx.actions.canModify(o),
		onClickDay: (day, cell) => createOn(day, cell),
		onCreateRange: (from, to) => {
			if (isSameDay(from, to)) createOn(from);
			else ctx.actions.create({ start: from, end: addDays(to, 1), allDay: true });
		},
		onMove: (o, delta) =>
			void ctx.actions.move(
				o,
				addDays(o.displayStart, delta),
				addDays(o.displayEnd, delta),
				o.allDay
			),
		onOpen: (o, el) => ctx.actions.open(o, el)
	});

	/** Days highlighted by a drag-create, a pending draft, or a move target. */
	function isHighlighted(day: Date): 'create' | 'move' | null {
		const p = drag.preview;
		if (p?.kind === 'create') return day >= p.from && day <= p.to ? 'create' : null;
		if (p?.kind === 'move') {
			const s = addDays(p.occurrence.displayStart, p.dayDelta);
			const e = addDays(p.occurrence.displayEnd, p.dayDelta);
			const next = addDays(day, 1);
			return s < next && (e > day || (s.getTime() === e.getTime() && isSameDay(s, day)))
				? 'move'
				: null;
		}
		const draft = ctx.draft;
		if (draft) {
			const endDay = draft.allDay ? addDays(draft.end, -1) : draft.end;
			return day >= atMinutes(draft.start, 0) && day <= endDay ? 'create' : null;
		}
		return null;
	}

	let draftAnchorKey = $derived(ctx.draft && !drag.preview ? toDateKey(ctx.draft.start) : null);

	// ---------------------------------------------------------------------------
	// Keyboard: a roving-tabindex grid, arrow keys move the focused day
	// ---------------------------------------------------------------------------

	let focusedKey = $state<string | null>(null);
	let activeKey = $derived.by(() => {
		const keys = weeks.flat().map(toDateKey);
		if (focusedKey && keys.includes(focusedKey)) return focusedKey;
		const today = toDateKey(ctx.today);
		if (keys.includes(today) && isSameDay(ctx.today, date)) return today;
		const focus = toDateKey(date);
		return keys.includes(focus) ? focus : keys[0];
	});

	async function focusDay(day: Date) {
		const key = toDateKey(day);
		if (day < range.start || day >= range.end || ctx.config.hiddenDays.includes(day.getDay())) {
			ctx.actions.navigate(day);
			await tick();
		}
		focusedKey = key;
		await tick();
		gridEl?.querySelector<HTMLElement>(`[data-date="${key}"]`)?.focus();
	}

	function onAreaKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const eventEl = target.closest<HTMLElement>('[data-event-key]');
		if (eventEl) {
			const occurrence = occurrences.find((o) => o.key === eventEl.dataset.eventKey);
			if (occurrence) onEventKeydown(e, occurrence);
			return;
		}
		const cell = target.closest<HTMLElement>('[role="gridcell"]');
		if (!cell || target !== cell) return;
		const current = fromDateKey(cell.dataset.date!);
		const step = (days: number) => {
			let next = addDays(current, days);
			// Skip hidden weekdays in the direction of travel.
			for (let i = 0; i < 7 && ctx.config.hiddenDays.includes(next.getDay()); i++) {
				next = addDays(next, Math.sign(days) || 1);
			}
			return next;
		};
		let next: Date;
		switch (e.key) {
			case 'ArrowLeft':
				next = step(-1);
				break;
			case 'ArrowRight':
				next = step(1);
				break;
			case 'ArrowUp':
				next = addDays(current, -7);
				break;
			case 'ArrowDown':
				next = addDays(current, 7);
				break;
			case 'Home':
				next = startOfWeek(current, ctx.config.weekStartsOn);
				break;
			case 'End':
				next = addDays(startOfWeek(current, ctx.config.weekStartsOn), 6);
				break;
			case 'PageUp':
				next = addMonths(current, -1);
				break;
			case 'PageDown':
				next = addMonths(current, 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (canCreate) createOn(current, cell);
				return;
			default:
				return;
		}
		e.preventDefault();
		if (next) void focusDay(next);
	}

	function onEventClick(e: MouseEvent, occurrence: DisplayOccurrence) {
		if (e.detail === 0) ctx.actions.open(occurrence, e.currentTarget as HTMLElement);
	}

	function onEventKeydown(e: KeyboardEvent, occurrence: DisplayOccurrence) {
		if ((e.key === 'Delete' || e.key === 'Backspace') && ctx.actions.canModify(occurrence)) {
			e.preventDefault();
			void ctx.actions.remove(occurrence);
		} else if (
			e.altKey &&
			(e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
			ctx.actions.canModify(occurrence)
		) {
			e.preventDefault();
			const delta = e.key === 'ArrowLeft' ? -1 : 1;
			void ctx.actions.move(
				occurrence,
				addDays(occurrence.displayStart, delta),
				addDays(occurrence.displayEnd, delta),
				occurrence.allDay
			);
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && drag.cancel()) e.stopPropagation();
	}}
/>

<div class="flex h-full min-h-0 flex-col" data-view={viewId}>
	<div
		class="grid shrink-0 border-b border-(--kc-line)"
		style:grid-template-columns={template}
		aria-hidden="true"
	>
		{#each weeks[0] ?? [] as day (day.getDay())}
			<div
				class="py-2 text-center font-spacemono text-[11px] tracking-wider text-muted-foreground uppercase"
			>
				{ctx.formatters.weekdayShort(day)}
			</div>
		{/each}
	</div>

	<!--
	Two stacked layers share one row template: the ARIA grid holds only the day
	cells (so it stays a valid grid), and the event lanes float above it.
	Pointer gestures are handled on the wrapper, which covers both.
	-->
	<div
		bind:this={gridEl}
		role="presentation"
		class="relative min-h-0 flex-1 touch-pan-y select-none"
		onpointerdown={drag.onpointerdown}
		onpointermove={drag.onpointermove}
		onpointerup={drag.onpointerup}
		onpointercancel={drag.onpointercancel}
		onkeydown={onAreaKeydown}
	>
		<div
			role="grid"
			aria-label={ctx.formatters.monthYear(month)}
			aria-readonly={!canCreate}
			class="absolute inset-0 grid"
			style:grid-template-rows="repeat({weeks.length}, minmax(0, 1fr))"
		>
			{#each weeks as week, w (toDateKey(week[0]))}
				<div
					role="row"
					class={cn('grid min-h-0 border-(--kc-line)', w < weeks.length - 1 && 'border-b')}
					style:grid-template-columns={template}
				>
					{#each week as day, i (toDateKey(day))}
						{@const key = toDateKey(day)}
						{@const isToday = isSameDay(day, ctx.today)}
						{@const outside = day.getMonth() !== month.getMonth()}
						{@const highlight = isHighlighted(day)}
						<div
							role="gridcell"
							data-date={key}
							tabindex={key === activeKey ? 0 : -1}
							aria-label={ctx.formatters.fullDate(day)}
							aria-current={isToday ? 'date' : undefined}
							aria-selected={highlight === 'create'}
							class={cn(
								'relative min-w-0 border-(--kc-line) outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:ring-inset',
								i > 0 && 'border-l',
								outside && 'bg-muted/15',
								isToday && 'bg-(--kc-today)',
								highlight === 'create' && 'bg-(--kc-selection)',
								highlight === 'move' && 'ring-2 ring-kleri-2/70 ring-inset'
							)}
							onfocus={() => (focusedKey = key)}
						>
							{#if highlight === 'create' && key === draftAnchorKey}
								<span data-kc-draft class="pointer-events-none absolute inset-x-1 top-9 h-5"></span>
							{/if}
							<div class="flex h-9 items-center justify-between px-2">
								{#if ctx.config.showWeekNumbers && i === 0}
									<span class="font-spacemono text-[10px] text-muted-foreground"
										>W{isoWeekNumber(day)}</span
									>
								{:else}
									<span></span>
								{/if}
								<button
									type="button"
									data-no-drag
									tabindex="-1"
									aria-hidden="true"
									class={cn(
										'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium transition-colors',
										isToday ? 'font-semibold text-kleri-ink kleri-bg' : 'hover:bg-muted/60',
										!isToday && outside && 'text-muted-foreground'
									)}
									onclick={() => ctx.actions.navigate(day, 'day')}
								>
									{day.getDate() === 1
										? `${ctx.formatters.monthShort(day)} 1`
										: ctx.formatters.dayOfMonth(day)}
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<div
			class="pointer-events-none absolute inset-0 grid"
			style:grid-template-rows="repeat({weeks.length}, minmax(0, 1fr))"
		>
			{#each weeks as week, w (toDateKey(week[0]))}
				{@const layout = layouts[w]}
				<div class="relative min-h-0">
					{#if w === 0}
						<div class="absolute inset-0" bind:clientHeight={rowHeight}></div>
					{/if}
					<div class="absolute inset-x-0 bottom-0" style:top="{HEADER}px">
						{#each layout.spans as span (span.item.key)}
							{#if span.lane < layout.visible}
								{@const moving =
									drag.preview?.kind === 'move' && drag.preview.occurrence.key === span.item.key}
								<div
									class="pointer-events-auto absolute px-1"
									style:top="{span.lane * LANE}px"
									style:left="{(span.startIndex / columns) * 100}%"
									style:width="{((span.endIndex - span.startIndex + 1) / columns) * 100}%"
								>
									<EventPill
										occurrence={span.item}
										{viewId}
										dragging={moving}
										continuesBefore={span.continuesBefore}
										continuesAfter={span.continuesAfter}
										onclick={(e) => onEventClick(e, span.item)}
									/>
								</div>
							{/if}
						{/each}
						{#each week as day, i (toDateKey(day))}
							{#if layout.hidden[i] > 0}
								<div
									class="pointer-events-auto absolute px-1"
									style:top="{layout.visible * LANE}px"
									style:left="{(i / columns) * 100}%"
									style:width="{100 / columns}%"
								>
									<DayOverflow
										{day}
										occurrences={occurrencesOn(day)}
										hiddenCount={layout.hidden[i]}
										{viewId}
									/>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
