<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChildrenOrChild } from '#lib/utils.js';
	import { CAL_SELECT_LABEL, CAL_SELECT_SHELL } from '../styles.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> = $props();
</script>

<span class={cn(CAL_SELECT_SHELL, className)}>
	<CalendarPrimitive.YearSelect
		bind:ref
		class="absolute inset-0 cursor-pointer bg-popover text-popover-foreground opacity-0"
		{...restProps}
	>
		{#snippet child({ props, yearItems, selectedYearItem })}
			<select {...props} {value}>
				{#each yearItems as yearItem (yearItem.value)}
					<option
						value={yearItem.value}
						selected={value !== undefined
							? yearItem.value === value
							: yearItem.value === selectedYearItem?.value}
					>
						{yearItem.label}
					</option>
				{/each}
			</select>
			<span class={CAL_SELECT_LABEL} aria-hidden="true">
				{yearItems.find((item) => item.value === value)?.label || selectedYearItem?.label || value}
				<ChevronDownIcon class="size-4" />
			</span>
		{/snippet}
	</CalendarPrimitive.YearSelect>
</span>
