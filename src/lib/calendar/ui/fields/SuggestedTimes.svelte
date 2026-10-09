<script lang="ts">
	import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../../context.js';
	import type { TimeInterval } from '../../types.js';
	import { findAvailableSlots } from '../../core/availability.js';
	import { addDays, startOfDay } from '../../core/date.js';

	/**
	 * "Find a time": shows who is busy at the proposed time and the next free
	 * slots everyone shares, within working hours.
	 */
	interface Props {
		/** Busy time per email (already merged per person). */
		busy: Record<string, TimeInterval[]>;
		names: Record<string, string>;
		loading: boolean;
		/** Proposed meeting, as instants. */
		start: Date;
		end: Date;
		onPick: (slot: TimeInterval) => void;
	}

	let { busy, names, loading, start, end, onPick }: Props = $props();
	const ctx = getCalendarContext();

	let duration = $derived(Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000)));
	let busyNames = $derived(
		Object.entries(busy)
			.filter(([, intervals]) => intervals.some((b) => b.start < end && start < b.end))
			.map(([email]) => names[email] ?? email)
	);
	let slots = $derived.by(() => {
		const clock = ctx.config.clock;
		const from = clock.toInstant(startOfDay(clock.toWall(start)));
		return findAvailableSlots({
			busy: Object.values(busy).flat(),
			from,
			until: addDays(from, 8),
			duration,
			step: 30,
			workingHours: ctx.config.workingHours,
			clock,
			now: new Date(),
			limit: 6,
			maxPerDay: 2
		});
	});

	function slotLabel(slot: TimeInterval) {
		const wall = ctx.config.clock.toWall(slot.start);
		return { day: ctx.formatters.mediumDate(wall), time: ctx.formatters.time(wall) };
	}
</script>

<div class="flex flex-col gap-2 rounded-kleri border border-(--kc-line-strong) p-3">
	<div class="flex items-center gap-2 text-sm">
		{#if loading}
			<Loader2 class="size-4 animate-spin text-muted-foreground" />
			<span class="text-muted-foreground">{ctx.labels.checkingAvailability}</span>
		{:else if busyNames.length}
			<AlertTriangle class="size-4 shrink-0 text-amber-500" />
			<span class="min-w-0 truncate">{ctx.labels.busyAt(busyNames.join(', '))}</span>
		{:else}
			<CheckCircle2 class="size-4 shrink-0 text-emerald-500" />
			<span>{ctx.labels.allAvailable}</span>
		{/if}
	</div>

	{#if !loading}
		<div>
			<p
				class="mb-1.5 flex items-center gap-1.5 font-spacemono text-[11px] tracking-wider text-muted-foreground uppercase"
			>
				<Sparkles class="size-3 text-brand" />{ctx.labels.suggestedTimes}
			</p>
			{#if slots.length}
				<ul class="flex flex-wrap gap-1.5">
					{#each slots as slot (slot.start.getTime())}
						{@const label = slotLabel(slot)}
						{@const current = slot.start.getTime() === start.getTime()}
						<li>
							<button
								type="button"
								aria-pressed={current}
								class={cn(
									'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none',
									current
										? 'border-kleri-ink text-kleri-ink kleri-bg'
										: 'border-border hover:border-kleri-2 hover:bg-kleri-2/10'
								)}
								onclick={() => onPick(slot)}
							>
								<span class="font-medium">{label.day}</span>
								<span class="font-spacemono">{label.time}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-xs text-muted-foreground">{ctx.labels.noSuggestions}</p>
			{/if}
		</div>
	{/if}
</div>
