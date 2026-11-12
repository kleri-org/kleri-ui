<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChildrenOrChild } from '#lib/utils.js';
	import { CAL_SELECT_LABEL, CAL_SELECT_SHELL } from '../styles.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.MonthSelectProps> = $props();
</script>

<span class={cn(CAL_SELECT_SHELL, className)}>
	<CalendarPrimitive.MonthSelect
		bind:ref
		class="absolute inset-0 cursor-pointer bg-popover text-popover-foreground opacity-0"
		{...restProps}
	>
		{#snippet child({ props, monthItems, selectedMonthItem })}
			<select {...props} {value} {onchange}>
				{#each monthItems as monthItem (monthItem.value)}
					<option
						value={monthItem.value}
						selected={value !== undefined
							? monthItem.value === value
							: monthItem.value === selectedMonthItem?.value}
					>
						{monthItem.label}
					</option>
				{/each}
			</select>
			<span class={CAL_SELECT_LABEL} aria-hidden="true">
				{monthItems.find((item) => item.value === value)?.label || selectedMonthItem?.label}
				<ChevronDownIcon class="size-4" />
			</span>
		{/snippet}
	</CalendarPrimitive.MonthSelect>
</span>
