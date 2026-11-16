<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { cn } from '#lib/utils.js';
	import { CAL_NAV_BUTTON } from '../styles.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CalendarPrimitive.PrevButtonProps = $props();
</script>

<CalendarPrimitive.PrevButton bind:ref class={cn(CAL_NAV_BUTTON, className)} {...restProps}>
	{#if children}
		{@render children()}
	{:else}
		<ChevronLeftIcon class="size-4" aria-hidden="true" />
	{/if}
</CalendarPrimitive.PrevButton>
