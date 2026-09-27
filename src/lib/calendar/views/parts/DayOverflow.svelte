<script lang="ts">
	import { Popover } from 'bits-ui';
	import { X } from '@lucide/svelte';
	import { getCalendarContext } from '../../context.js';
	import type { DisplayOccurrence } from '../../types.js';
	import EventPill from './EventPill.svelte';

	/** "+N more" button that lists every event of one day in a popover. */
	interface Props {
		day: Date;
		occurrences: DisplayOccurrence[];
		hiddenCount: number;
		viewId: string;
	}

	let { day, occurrences, hiddenCount, viewId }: Props = $props();
	const ctx = getCalendarContext();

	let open = $state(false);
	let triggerEl = $state<HTMLElement | null>(null);

	function choose(occurrence: DisplayOccurrence) {
		open = false;
		if (triggerEl) ctx.actions.open(occurrence, triggerEl);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		bind:ref={triggerEl}
		data-no-drag
		aria-label={ctx.labels.moreEvents(hiddenCount)}
		class="w-full truncate rounded-md px-1.5 text-left font-spacemono text-[11px] leading-5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
	>
		{ctx.labels.more(hiddenCount)}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			side="bottom"
			align="start"
			sideOffset={4}
			collisionPadding={12}
			class="kleri-dropdown z-50 w-64 rounded-kleri border-2 border-border bg-popover p-2 text-popover-foreground shadow-xl outline-hidden"
		>
			<div class="mb-2 flex items-center justify-between gap-2 px-1">
				<div class="flex items-baseline gap-2">
					<span class="font-spacemono text-[11px] tracking-wider text-muted-foreground uppercase">
						{ctx.formatters.weekdayShort(day)}
					</span>
					<button
						type="button"
						class="text-xl font-semibold hover:text-kleri-1 dark:hover:text-kleri-2"
						onclick={() => {
							open = false;
							ctx.actions.navigate(day, 'day');
						}}
					>
						{ctx.formatters.dayOfMonth(day)}
					</button>
				</div>
				<Popover.Close
					class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
					aria-label={ctx.labels.close}
				>
					<X class="size-4" />
				</Popover.Close>
			</div>
			<ul class="flex kleri-scrollbar max-h-72 flex-col gap-1 overflow-y-auto">
				{#each occurrences as occurrence (occurrence.key)}
					<li>
						<EventPill
							{occurrence}
							{viewId}
							continuesBefore={occurrence.displayStart < day}
							onclick={() => choose(occurrence)}
						/>
					</li>
				{/each}
			</ul>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
