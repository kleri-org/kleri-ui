<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { getToggleGroupCtx } from './toggle-group-context.js';
	import { kleriToggleVariants, type ToggleVariants } from './toggle-variants.js';

	let {
		ref = $bindable(null),
		value,
		class: className,
		size,
		variant,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & ToggleVariants = $props();

	const ctx = getToggleGroupCtx();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	{value}
	data-slot="kleri-toggle-group-item"
	class={cn(
		kleriToggleVariants({
			variant: ctx?.variant ?? variant,
			size: ctx?.size ?? size
		}),
		className
	)}
	{...restProps}
/>
