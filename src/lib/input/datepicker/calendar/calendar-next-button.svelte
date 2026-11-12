<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn } from '#lib/utils.js';
	import { CAL_NAV_BUTTON } from '../styles.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CalendarPrimitive.NextButtonProps = $props();
</script>

<CalendarPrimitive.NextButton bind:ref class={cn(CAL_NAV_BUTTON, className)} {...restProps}>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRightIcon class="size-4" aria-hidden="true" />
	{/if}
</CalendarPrimitive.NextButton>
