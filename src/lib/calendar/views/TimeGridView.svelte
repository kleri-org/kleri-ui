<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import type { DisplayOccurrence } from '../types.js';
	import type { CalendarViewProps } from './types.js';
	import {
		addDays,
		addMinutes,
		atMinutes,
		differenceInCalendarDays,
		differenceInMinutes,
		eachDay,
		isSameDay,
		isoWeekNumber,
		minutesOfDay,
		snapMinutes,
		toDateKey
	} from '../core/date.js';
	import { countHiddenPerDay, layoutDaySpans, layoutTimeGrid } from '../core/layout.js';
	import { formatOffset } from '../core/timezone.js';
	import { isAllDayLike } from './utils.js';
	import { DayGridDrag } from './day-grid-drag.svelte.js';
	import EventBlock from './parts/EventBlock.svelte';
	import EventPill from './parts/EventPill.svelte';

	let { range, occurrences, viewId }: CalendarViewProps = $props();
	const ctx = getCalendarContext();

	const GUTTER = 56;
	const LANE = 22;
	const DRAG_THRESHOLD = 4;

	let rootEl = $state<HTMLElement | null>(null);
	let scrollEl = $state<HTMLElement | null>(null);
	let gridEl = $state<HTMLElement | null>(null);
	let stripEl = $state<HTMLElement | null>(null);
	let columnEls = $state<HTMLElement[]>([]);

	let days = $derived.by(() => {
		const all = eachDay(range.start, range.end);
		return all.length === 1 ? all : all.filter((d) => !ctx.config.hiddenDays.includes(d.getDay()));
	});
	let isSingleDay = $derived(days.length === 1);
	let startMin = $derived(ctx.config.dayStartHour * 60);
	let endMin = $derived(ctx.config.dayEndHour * 60);
	let pxPerMin = $derived(ctx.config.hourHeight / 60);
	let gridHeight = $derived((endMin - startMin) * pxPerMin);
	let step = $derived(ctx.config.slotDuration);
	let template = $derived(`${GUTTER}px repeat(${days.length}, minmax(0, 1fr))`);
	let canCreate = $derived(!ctx.config.readOnly && ctx.store.writableCalendars.length > 0);
	let hours = $derived.by(() => {
		const out: number[] = [];
		for (let h = ctx.config.dayStartHour + 1; h < ctx.config.dayEndHour; h++) out.push(h);
		return out;
	});

	// ---------------------------------------------------------------------------
	// Layout
	// ---------------------------------------------------------------------------

	interface Segment {
		occurrence: DisplayOccurrence;
		start: number;
		end: number;
		continuesBefore: boolean;
		continuesAfter: boolean;
	}

	/** Wall-clock minutes from `day`'s midnight to `date` (negative before, > 1440 after). */
	function wallMinutesFrom(day: Date, date: Date): number {
		return differenceInCalendarDays(date, day) * 24 * 60 + minutesOfDay(date);
	}

	/** Minutes past `day`'s midnight, clamped to that day. */
	function minutesInDay(date: Date, day: Date): number {
		if (date <= day) return 0;
		if (date >= addDays(day, 1)) return 24 * 60;
		return minutesOfDay(date);
	}

	let columns = $derived(
		days.map((day) => {
			const next = addDays(day, 1);
			const segments: Segment[] = [];
			for (const occurrence of occurrences) {
				if (isAllDayLike(occurrence)) continue;
				const { displayStart: s, displayEnd: e } = occurrence;
				const zeroLength = s.getTime() === e.getTime();
				const inDay = zeroLength ? isSameDay(s, day) : s < next && e > day;
				if (!inDay) continue;
				const start = Math.max(minutesInDay(s, day), startMin);
				const end = Math.min(zeroLength ? start : minutesInDay(e, day), endMin);
				if (end < start || (!zeroLength && end === start)) continue;
				segments.push({
					occurrence,
					start,
					end,
					continuesBefore: s < atMinutes(day, startMin),
					continuesAfter: e > atMinutes(day, endMin)
				});
			}
			const minDuration = Math.max(15, 22 / pxPerMin);
			return layoutTimeGrid(
				segments,
				(seg) => ({ start: seg.start - startMin, end: seg.end - startMin }),
				{
					minDuration
				}
			);
		})
	);

	let allDayItems = $derived(occurrences.filter(isAllDayLike));
	let allDay = $derived(
		layoutDaySpans(allDayItems, days, (o) => ({ start: o.displayStart, end: o.displayEnd }))
	);
	let allDayExpanded = $state(false);
	let collapsible = $derived(allDay.laneCount > 3);
	let visibleLanes = $derived(collapsible && !allDayExpanded ? 2 : allDay.laneCount);
	let hiddenPerDay = $derived(countHiddenPerDay(allDay.spans, days.length, visibleLanes));
	let hasHidden = $derived(hiddenPerDay.some((n) => n > 0));
	let stripHeight = $derived(Math.max(1, visibleLanes + (hasHidden ? 1 : 0)) * LANE + 8);

	let nowTop = $derived((minutesOfDay(ctx.now) - startMin) * pxPerMin);
	let nowVisible = $derived(minutesOfDay(ctx.now) >= startMin && minutesOfDay(ctx.now) <= endMin);
	let todayIndex = $derived(days.findIndex((d) => isSameDay(d, ctx.today)));

	function offHourBands(day: Date): { top: number; height: number }[] {
		const wh = ctx.config.workingHours;
		if (!wh) return [];
		if (!wh.days.includes(day.getDay())) return [{ top: 0, height: gridHeight }];
		const bands: { top: number; height: number }[] = [];
		if (wh.start > startMin)
			bands.push({ top: 0, height: (Math.min(wh.start, endMin) - startMin) * pxPerMin });
		if (wh.end < endMin) {
			const top = (Math.max(wh.end, startMin) - startMin) * pxPerMin;
			bands.push({ top, height: gridHeight - top });
		}
		return bands;
	}

	// ---------------------------------------------------------------------------
	// Timed-grid gestures: click/drag to create, drag to move, drag edge to resize
	// ---------------------------------------------------------------------------

	interface GestureBase {
		pointerId: number;
		x: number;
		y: number;
		moved: boolean;
		touch: boolean;
	}
	type Gesture =
		| (GestureBase & { kind: 'create'; day: number; anchor: number; current: number })
		| (GestureBase & {
				kind: 'move';
				occurrence: DisplayOccurrence;
				element: HTMLElement;
				grab: number;
				day: number;
				start: number;
				duration: number;
		  })
		| (GestureBase & {
				kind: 'resize';
				occurrence: DisplayOccurrence;
				element: HTMLElement;
				day: number;
				start: number;
				end: number;
		  });

	let gesture = $state.raw<Gesture | null>(null);
	let lastPointer = { x: 0, y: 0 };
	let scrollFrame = 0;

	function minutesAt(clientY: number): number {
		const rect = gridEl!.getBoundingClientRect();
		return Math.min(endMin, Math.max(startMin, (clientY - rect.top) / pxPerMin + startMin));
	}

	function dayAt(clientX: number): number | null {
		for (let i = 0; i < columnEls.length; i++) {
			const r = columnEls[i]?.getBoundingClientRect();
			if (r && clientX >= r.left && clientX < r.right) return i;
		}
		return null;
	}

	function onGridPointerDown(e: PointerEvent) {
		if (e.button !== 0 || gesture || !gridEl) return;
		const target = e.target as HTMLElement;
		const column = target.closest<HTMLElement>('[data-day-index]');
		if (!column) return;
		const day = Number(column.dataset.dayIndex);
		const base: GestureBase = {
			pointerId: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			moved: false,
			touch: e.pointerType === 'touch'
		};
		const eventEl = target.closest<HTMLElement>('[data-event-key]');
		if (eventEl) {
			const occurrence = occurrences.find((o) => o.key === eventEl.dataset.eventKey);
			if (!occurrence) return;
			const start = wallMinutesFrom(days[day], occurrence.displayStart);
			const duration = differenceInMinutes(occurrence.displayEnd, occurrence.displayStart);
			gesture = target.closest('[data-resize-handle]')
				? {
						...base,
						kind: 'resize',
						occurrence,
						element: eventEl,
						day,
						start,
						end: start + duration
					}
				: {
						...base,
						kind: 'move',
						occurrence,
						element: eventEl,
						grab: minutesAt(e.clientY) - start,
						day,
						start,
						duration
					};
		} else {
			if (!canCreate) return;
			const minute = snapMinutes(minutesAt(e.clientY), step, 'floor');
			gesture = { ...base, kind: 'create', day, anchor: minute, current: minute };
		}
		if (!base.touch) {
			(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
			e.preventDefault();
		}
	}

	function updateGesture(x: number, y: number) {
		const g = gesture;
		if (!g) return;
		const minute = minutesAt(y);
		if (g.kind === 'create') {
			gesture = { ...g, current: snapMinutes(minute, step) };
		} else if (g.kind === 'move') {
			const span = Math.min(g.duration, endMin - startMin);
			const start = Math.min(Math.max(snapMinutes(minute - g.grab, step), startMin), endMin - span);
			gesture = { ...g, day: dayAt(x) ?? g.day, start };
		} else {
			const end = Math.min(endMin, Math.max(g.start + step, snapMinutes(minute, step)));
			gesture = { ...g, end };
		}
	}

	function autoScroll() {
		cancelAnimationFrame(scrollFrame);
		const loop = () => {
			if (!gesture?.moved || !scrollEl) return;
			const rect = scrollEl.getBoundingClientRect();
			const edge = 48;
			let dy = 0;
			if (lastPointer.y < rect.top + edge) dy = -Math.ceil((rect.top + edge - lastPointer.y) / 4);
			else if (lastPointer.y > rect.bottom - edge)
				dy = Math.ceil((lastPointer.y - rect.bottom + edge) / 4);
			if (dy) {
				scrollEl.scrollTop += dy;
				updateGesture(lastPointer.x, lastPointer.y);
			}
			scrollFrame = requestAnimationFrame(loop);
		};
		scrollFrame = requestAnimationFrame(loop);
	}

	function onGridPointerMove(e: PointerEvent) {
		const g = gesture;
		if (!g || e.pointerId !== g.pointerId) return;
		lastPointer = { x: e.clientX, y: e.clientY };
		if (!g.moved) {
			if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < DRAG_THRESHOLD) return;
			if (g.touch) {
				gesture = null;
				return;
			}
			if (g.kind !== 'create' && !ctx.actions.canModify(g.occurrence)) return;
			gesture = { ...g, moved: true };
			autoScroll();
		}
		updateGesture(e.clientX, e.clientY);
	}

	async function onGridPointerUp(e: PointerEvent) {
		const g = gesture;
		if (!g || e.pointerId !== g.pointerId) return;
		gesture = null;
		cancelAnimationFrame(scrollFrame);
		const day = days[g.day];

		if (g.kind === 'create') {
			const from = g.moved ? Math.min(g.anchor, g.current) : g.anchor;
			let to = g.moved ? Math.max(g.anchor, g.current) : g.anchor + ctx.config.defaultEventDuration;
			if (to <= from) to = from + step;
			ctx.actions.create({
				start: atMinutes(day, from),
				end: atMinutes(day, Math.min(to, 24 * 60)),
				allDay: false
			});
			return;
		}
		if (!g.moved) {
			ctx.actions.open(g.occurrence, g.element);
			return;
		}
		if (g.kind === 'move') {
			const start = atMinutes(day, g.start);
			if (start.getTime() === g.occurrence.displayStart.getTime()) return;
			await ctx.actions.move(g.occurrence, start, addMinutes(start, g.duration));
		} else {
			const end = atMinutes(day, g.end);
			if (end.getTime() === g.occurrence.displayEnd.getTime()) return;
			await ctx.actions.move(g.occurrence, g.occurrence.displayStart, end);
		}
	}

	function cancelGesture() {
		gesture = null;
		cancelAnimationFrame(scrollFrame);
	}

	/** Keyboard alternative to dragging: Alt+arrows move, Alt+Shift+arrows resize. */
	async function onEventKeydown(e: KeyboardEvent, occurrence: DisplayOccurrence) {
		if ((e.key === 'Delete' || e.key === 'Backspace') && ctx.actions.canModify(occurrence)) {
			e.preventDefault();
			await ctx.actions.remove(occurrence);
			return;
		}
		if (!e.altKey || !ctx.actions.canModify(occurrence)) return;
		let { displayStart: start, displayEnd: end } = occurrence;
		switch (e.key) {
			case 'ArrowUp':
				if (!e.shiftKey) start = addMinutes(start, -step);
				end = addMinutes(end, -step);
				break;
			case 'ArrowDown':
				if (!e.shiftKey) start = addMinutes(start, step);
				end = addMinutes(end, step);
				break;
			case 'ArrowLeft':
			case 'ArrowRight': {
				const delta = e.key === 'ArrowLeft' ? -1 : 1;
				start = addDays(start, delta);
				end = addDays(end, delta);
				break;
			}
			default:
				return;
		}
		e.preventDefault();
		if (end <= start) return;
		await ctx.actions.move(occurrence, start, end);
		await tick();
		rootEl
			?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(occurrence.event.id)}"]`)
			?.focus();
	}

	function onEventClick(e: MouseEvent, occurrence: DisplayOccurrence) {
		// Pointer clicks are handled on pointerup; this catches Enter/Space.
		if (e.detail === 0) ctx.actions.open(occurrence, e.currentTarget as HTMLElement);
	}

	// ---------------------------------------------------------------------------
	// All-day strip
	// ---------------------------------------------------------------------------

	const stripDrag = new DayGridDrag({
		container: () => stripEl,
		findOccurrence: (key) => allDayItems.find((o) => o.key === key),
		canCreate: () => canCreate,
		canMove: (o) => ctx.actions.canModify(o),
		onClickDay: (date) => ctx.actions.create({ start: date, end: addDays(date, 1), allDay: true }),
		onCreateRange: (from, to) =>
			ctx.actions.create({ start: from, end: addDays(to, 1), allDay: true }),
		onMove: (o, delta) =>
			void ctx.actions.move(
				o,
				addDays(o.displayStart, delta),
				addDays(o.displayEnd, delta),
				o.allDay
			),
		onOpen: (o, el) => ctx.actions.open(o, el)
	});

	function dayIndexOf(date: Date): number {
		return days.findIndex((d) => isSameDay(d, date));
	}

	/** First/last visible day indices covered by a wall range with an exclusive end. */
	function spanIndices(start: Date, endExclusive: Date): [number, number] | null {
		let first = -1;
		let last = -1;
		days.forEach((d, i) => {
			if (d < endExclusive && addDays(d, 1) > start) {
				if (first === -1) first = i;
				last = i;
			}
		});
		return first === -1 ? null : [first, last];
	}

	let stripSelection = $derived.by(() => {
		const p = stripDrag.preview;
		if (p?.kind === 'create') return spanIndices(p.from, addDays(p.to, 1));
		if (ctx.draft?.allDay) return spanIndices(ctx.draft.start, ctx.draft.end);
		return null;
	});

	let timedDraft = $derived.by(() => {
		if (gesture?.kind === 'create') {
			const from = gesture.moved ? Math.min(gesture.anchor, gesture.current) : gesture.anchor;
			const to = gesture.moved ? Math.max(gesture.anchor, gesture.current) : gesture.anchor + step;
			return { day: gesture.day, start: from, end: Math.max(to, from + step), anchor: false };
		}
		const draft = ctx.draft;
		if (!draft || draft.allDay) return null;
		const day = dayIndexOf(draft.start);
		if (day === -1) return null;
		return {
			day,
			start: Math.max(minutesInDay(draft.start, days[day]), startMin),
			end: Math.min(minutesInDay(draft.end, days[day]), endMin),
			anchor: true
		};
	});

	// The time grid's scrollbar takes width from its columns only; the header and
	// all-day strip reserve the same width so their columns stay aligned.
	let scrollbarWidth = $state(0);
	$effect(() => {
		const el = scrollEl;
		if (!el || !gridEl) return;
		const measure = () => (scrollbarWidth = el.offsetWidth - el.clientWidth);
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		observer.observe(gridEl);
		return () => observer.disconnect();
	});

	onMount(() => {
		if (!scrollEl) return;
		// Follow "now" during the day; at night, open on the usual start of the day instead.
		const nowMinutes = minutesOfDay(ctx.now);
		const followNow = todayIndex !== -1 && nowMinutes >= 6 * 60 && nowMinutes <= 22 * 60;
		const target = followNow ? nowMinutes - 90 : ctx.config.scrollToHour * 60;
		scrollEl.scrollTop = Math.max(0, (target - startMin) * pxPerMin);
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key !== 'Escape') return;
		if (gesture || stripDrag.cancel()) {
			cancelGesture();
			e.stopPropagation();
		}
	}}
/>

<div bind:this={rootEl} class="flex h-full min-h-0 flex-col" data-view={viewId}>
	<!-- Day headers -->
	<div
		class="grid shrink-0 border-b border-(--kc-line)"
		style:grid-template-columns={template}
		style:padding-right="{scrollbarWidth}px"
	>
		<div class="flex items-end justify-center pb-1.5">
			<span
				class="font-spacemono text-[10px] text-muted-foreground"
				title={ctx.config.clock.timeZone}
			>
				{#if ctx.config.showWeekNumbers && !isSingleDay}
					{ctx.labels.weekNumber(isoWeekNumber(days[0])).replace(/\D+/g, 'W')}
				{:else}
					{formatOffset(range.start, ctx.config.clock.timeZone).replace(':00', '')}
				{/if}
			</span>
		</div>
		{#each days as day, i (toDateKey(day))}
			{@const isToday = i === todayIndex}
			{@const isPast = day < ctx.today}
			<div class="flex min-w-0 justify-center border-l border-(--kc-line) py-1.5">
				<button
					type="button"
					class={cn(
						'flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none',
						!isSingleDay && 'hover:bg-muted/40',
						isSingleDay && 'pointer-events-none'
					)}
					tabindex={isSingleDay ? -1 : 0}
					aria-label={ctx.formatters.fullDate(day)}
					aria-current={isToday ? 'date' : undefined}
					onclick={() => ctx.actions.navigate(day, 'day')}
				>
					<span
						class={cn(
							'font-spacemono text-[11px] tracking-wider uppercase',
							isToday ? 'text-brand' : 'text-muted-foreground'
						)}
					>
						{ctx.formatters.weekdayShort(day)}
					</span>
					<span
						class={cn(
							'flex size-8 items-center justify-center rounded-full text-lg leading-none font-semibold',
							isToday && 'text-kleri-ink shadow-sm shadow-kleri-1/40 kleri-bg',
							!isToday && isPast && 'text-muted-foreground'
						)}
					>
						{ctx.formatters.dayOfMonth(day)}
					</span>
				</button>
			</div>
		{/each}
	</div>

	<!-- All-day strip -->
	<div
		class="grid shrink-0 border-b border-(--kc-line-strong)"
		style:grid-template-columns={template}
		style:padding-right="{scrollbarWidth}px"
	>
		<div class="flex flex-col items-center justify-start gap-0.5 pt-1.5">
			<span class="font-spacemono text-[10px] text-muted-foreground">{ctx.labels.allDay}</span>
			{#if collapsible}
				<button
					type="button"
					class="rounded p-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
					aria-expanded={allDayExpanded}
					aria-label={allDayExpanded ? 'Collapse all-day events' : 'Expand all-day events'}
					onclick={() => (allDayExpanded = !allDayExpanded)}
				>
					{#if allDayExpanded}<ChevronUp class="size-3.5" />{:else}<ChevronDown
							class="size-3.5"
						/>{/if}
				</button>
			{/if}
		</div>
		<div
			bind:this={stripEl}
			role="presentation"
			class="relative touch-pan-y select-none"
			style:grid-column="2 / -1"
			style:height="{stripHeight}px"
			onpointerdown={stripDrag.onpointerdown}
			onpointermove={stripDrag.onpointermove}
			onpointerup={stripDrag.onpointerup}
			onpointercancel={stripDrag.onpointercancel}
		>
			<div
				class="absolute inset-0 grid"
				style:grid-template-columns="repeat({days.length}, minmax(0, 1fr))"
			>
				{#each days as day, i (toDateKey(day))}
					<div
						data-date={toDateKey(day)}
						class={cn('border-l border-(--kc-line)', i === todayIndex && 'bg-(--kc-today)')}
					></div>
				{/each}
			</div>

			{#if stripSelection}
				<div
					data-kc-draft={ctx.draft?.allDay ? '' : undefined}
					class="pointer-events-none absolute inset-y-1 rounded-md bg-(--kc-selection) ring-1 ring-kleri-2/60"
					style:left="calc({(stripSelection[0] / days.length) * 100}% + 2px)"
					style:width="calc({((stripSelection[1] - stripSelection[0] + 1) / days.length) * 100}% -
					4px)"
				></div>
			{/if}

			{#each allDay.spans as span (span.item.key)}
				{#if span.lane < visibleLanes}
					{@const moving =
						stripDrag.preview?.kind === 'move' &&
						stripDrag.preview.occurrence.key === span.item.key}
					<div
						class="absolute px-0.5"
						style:top="{5 + span.lane * LANE}px"
						style:left="{(span.startIndex / days.length) * 100}%"
						style:width="{((span.endIndex - span.startIndex + 1) / days.length) * 100}%"
					>
						<EventPill
							occurrence={span.item}
							{viewId}
							bar
							dragging={moving}
							continuesBefore={span.continuesBefore}
							continuesAfter={span.continuesAfter}
							onclick={(e) => onEventClick(e, span.item)}
						/>
					</div>
					{#if moving && stripDrag.preview?.kind === 'move'}
						{@const delta = stripDrag.preview.dayDelta}
						{@const ghostSpan = spanIndices(
							addDays(span.item.displayStart, delta),
							addDays(span.item.displayEnd, delta)
						)}
						{#if ghostSpan}
							<div
								class="pointer-events-none absolute z-30 px-0.5"
								style:top="{5 + span.lane * LANE}px"
								style:left="{(ghostSpan[0] / days.length) * 100}%"
								style:width="{((ghostSpan[1] - ghostSpan[0] + 1) / days.length) * 100}%"
							>
								<EventPill occurrence={span.item} {viewId} bar ghost />
							</div>
						{/if}
					{/if}
				{/if}
			{/each}

			{#if hasHidden}
				{#each hiddenPerDay as count, i (i)}
					{#if count > 0}
						<button
							type="button"
							data-no-drag
							class="absolute rounded px-1.5 text-left font-spacemono text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							style:top="{5 + visibleLanes * LANE}px"
							style:left="{(i / days.length) * 100}%"
							style:width="{100 / days.length}%"
							onclick={() => (allDayExpanded = true)}
						>
							{ctx.labels.more(count)}
						</button>
					{/if}
				{/each}
			{/if}
		</div>
	</div>

	<!-- Scrollable time grid -->
	<div
		bind:this={scrollEl}
		class="relative kleri-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
	>
		<div
			bind:this={gridEl}
			role="presentation"
			class="relative grid touch-pan-y select-none"
			style:grid-template-columns={template}
			style:height="{gridHeight}px"
			onpointerdown={onGridPointerDown}
			onpointermove={onGridPointerMove}
			onpointerup={onGridPointerUp}
			onpointercancel={cancelGesture}
			onlostpointercapture={() => gesture?.moved && cancelGesture()}
		>
			<!-- Hour labels -->
			<div class="relative" aria-hidden="true">
				{#each hours as hour (hour)}
					<span
						class="absolute right-2 -translate-y-1/2 font-spacemono text-[10px] whitespace-nowrap text-muted-foreground"
						style:top="{(hour * 60 - startMin) * pxPerMin}px"
					>
						{ctx.formatters.hour(atMinutes(ctx.today, hour * 60))}
					</span>
				{/each}
			</div>

			{#each days as day, i (toDateKey(day))}
				{@const isToday = i === todayIndex}
				<div
					bind:this={columnEls[i]}
					data-day-index={i}
					data-date-key={toDateKey(day)}
					class={cn('relative border-l border-(--kc-line)', isToday && 'bg-(--kc-today)')}
					style="background-image: linear-gradient(to bottom, var(--kc-line) 1px, transparent 1px); background-size: 100% {ctx
						.config.hourHeight}px; background-position: 0 {-(startMin % 60) * pxPerMin}px;"
				>
					{#each offHourBands(day) as band, b (b)}
						<div
							class="pointer-events-none absolute inset-x-0 bg-(--kc-offhours)"
							style:top="{band.top}px"
							style:height="{band.height}px"
						></div>
					{/each}

					{#each columns[i] as placed (placed.item.occurrence.key)}
						{@const seg = placed.item}
						{@const active =
							gesture &&
							gesture.kind !== 'create' &&
							gesture.moved &&
							gesture.occurrence.key === seg.occurrence.key}
						<EventBlock
							occurrence={seg.occurrence}
							{viewId}
							height={placed.height * pxPerMin}
							dragging={Boolean(active)}
							continuesBefore={seg.continuesBefore}
							continuesAfter={seg.continuesAfter}
							style="top: {placed.top * pxPerMin + 1}px; height: {placed.height * pxPerMin -
								2}px; left: calc({placed.left * 100}% + 2px); width: calc({placed.width *
								100}% - {placed.left + placed.width >= 0.999 ? 8 : 3}px); z-index: {10 +
								placed.column};"
							onkeydown={(e) => onEventKeydown(e, seg.occurrence)}
							onclick={(e) => onEventClick(e, seg.occurrence)}
						/>
					{/each}

					<!-- Drag preview of a move/resize landing in this column -->
					{#if gesture && gesture.kind !== 'create' && gesture.moved && gesture.day === i}
						{@const start =
							gesture.kind === 'move' ? gesture.start : Math.max(gesture.start, startMin)}
						{@const end = gesture.kind === 'move' ? gesture.start + gesture.duration : gesture.end}
						<EventBlock
							occurrence={gesture.occurrence}
							{viewId}
							ghost
							height={(Math.min(end, endMin) - start) * pxPerMin}
							start={atMinutes(day, gesture.start)}
							end={gesture.kind === 'move'
								? addMinutes(atMinutes(day, gesture.start), gesture.duration)
								: atMinutes(day, end)}
							style="top: {(start - startMin) * pxPerMin + 1}px; height: {(Math.min(end, endMin) -
								start) *
								pxPerMin -
								2}px; left: 2px; right: 6px;"
						/>
					{/if}

					<!-- New event ghost -->
					{#if timedDraft && timedDraft.day === i}
						<div
							data-kc-draft={timedDraft.anchor ? '' : undefined}
							class="pointer-events-none absolute right-1.5 left-0.5 z-20 overflow-hidden rounded-md border-l-[3px] border-kleri-2 bg-(--kc-selection) px-2 py-1 font-spacemono text-[10px] text-foreground shadow-md ring-1 ring-kleri-2/50"
							style:top="{(timedDraft.start - startMin) * pxPerMin + 1}px"
							style:height="{Math.max((timedDraft.end - timedDraft.start) * pxPerMin - 2, 18)}px"
						>
							{ctx.formatters.timeRange(
								atMinutes(day, timedDraft.start),
								atMinutes(day, timedDraft.end)
							)}
						</div>
					{/if}

					{#if isToday && nowVisible}
						<div
							class="pointer-events-none absolute inset-x-0 z-40 flex items-center"
							style:top="{nowTop}px"
							aria-hidden="true"
						>
							<span
								class="-ml-1.5 size-3 rounded-full bg-kleri-2 shadow-[0_0_0_3px] shadow-background"
							></span>
							<span class="h-0.5 flex-1 kleri-bg"></span>
						</div>
					{/if}
				</div>
			{/each}

			{#if todayIndex !== -1 && nowVisible && days.length > 1}
				<!-- Faint now line across the other days -->
				<div
					class="pointer-events-none absolute right-0 z-0 h-px bg-kleri-2/30"
					style:top="{nowTop}px"
					style:left="{GUTTER}px"
					aria-hidden="true"
				></div>
			{/if}
		</div>
	</div>
</div>
