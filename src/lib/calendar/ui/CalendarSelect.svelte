<script lang="ts">
	import { Select } from 'bits-ui';
	import { Check, ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from '$lib/input/KleriFieldLabel.svelte';
	import { FIELD_ROOT, fieldShell } from '$lib/input/field.js';
	import type { CalendarInfo } from '../types.js';
	import { getCalendarContext } from '../context.js';

	/** Picks one of the writable calendars; each option shows its color. */
	interface Props {
		calendars: CalendarInfo[];
		value: string;
		label?: string;
		compact?: boolean;
		onValueChange?: (value: string) => void;
		class?: string;
	}

	let {
		calendars,
		value = $bindable(),
		label,
		compact = false,
		onValueChange,
		class: className
	}: Props = $props();
	const ctx = getCalendarContext();
	const uid = $props.id();

	let selected = $derived(calendars.find((c) => c.id === value));
	let items = $derived(calendars.map((c) => ({ value: c.id, label: c.name })));

	function accountOf(calendar: CalendarInfo) {
		return (
			ctx.store.getSource(calendar.sourceId)?.provider.account ??
			ctx.store.getSource(calendar.sourceId)?.provider.label
		);
	}
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} for={uid} />
	<Select.Root type="single" {items} bind:value onValueChange={(next) => onValueChange?.(next)}>
		<Select.Trigger
			id={uid}
			aria-label={label ?? ctx.labels.calendar}
			class={cn(fieldShell(), 'justify-between text-left', compact && 'my-0 py-1.5')}
		>
			<span class="flex min-w-0 items-center gap-2.5">
				<span
					class="size-3 shrink-0 rounded-full"
					style:background-color={selected?.color ?? 'transparent'}
				></span>
				<span class="truncate">{selected?.name ?? ctx.labels.calendar}</span>
			</span>
			<ChevronDown class="size-5 shrink-0 text-muted-foreground" />
		</Select.Trigger>
		<Select.Portal>
			<Select.Content
				sideOffset={6}
				class="kleri-dropdown z-[60] w-[var(--bits-select-anchor-width)] min-w-56 overflow-hidden rounded-kleri border-2 border-border bg-popover p-1 text-popover-foreground shadow-xl outline-hidden"
			>
				<Select.Viewport class="kleri-scrollbar max-h-64 overflow-y-auto p-1">
					{#each calendars as calendar (calendar.id)}
						<Select.Item
							value={calendar.id}
							label={calendar.name}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-hidden data-highlighted:bg-kleri-2/20"
						>
							{#snippet children({ selected: isSelected })}
								<span class="size-3 shrink-0 rounded-full" style:background-color={calendar.color}
								></span>
								<span class="min-w-0 flex-1">
									<span class="block truncate">{calendar.name}</span>
									<span class="block truncate text-[11px] text-muted-foreground"
										>{accountOf(calendar)}</span
									>
								</span>
								{#if isSelected}<Check
										class="size-4 shrink-0 text-kleri-1 dark:text-kleri-2"
										strokeWidth={2.75}
									/>{/if}
							{/snippet}
						</Select.Item>
					{/each}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
</div>
