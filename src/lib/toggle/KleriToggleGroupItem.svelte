<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { getToggleGroupCtx } from './toggle-group-context.js';
	import {
		kleriToggleVariants,
		kleriToggleActiveClass,
		type ToggleVariants
	} from './toggle-variants.js';

	let {
		ref = $bindable(null),
		value,
		class: className,
		size,
		variant,
		activeClass = kleriToggleActiveClass,
		...restProps
	}: ToggleGroupPrimitive.ItemProps &
		ToggleVariants & {
			/** Used only when the item is not nested in a `KleriToggleGroup`. */
			activeClass?: string;
		} = $props();

	const ctx = getToggleGroupCtx();

	// Mirrors bits-ui's own `isPressed`, so the active classes flip in the same
	// tick as the `data-state` attribute.
	const isActive = $derived.by(() => {
		const current = ctx?.value;
		return Array.isArray(current) ? current.includes(value) : current === value;
	});
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
		isActive && 'border-black text-black',
		isActive && (ctx?.activeClass ?? activeClass),
		className
	)}
	{...restProps}
/>
