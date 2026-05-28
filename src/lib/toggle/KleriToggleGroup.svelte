<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { setToggleGroupCtx } from './toggle-group-context.js';
	import type { ToggleVariants } from './toggle-variants.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = 'default',
		variant = 'default',
		orientation = 'horizontal',
		...restProps
	}: ToggleGroupPrimitive.RootProps &
		ToggleVariants & {
			orientation?: 'horizontal' | 'vertical';
		} = $props();

	setToggleGroupCtx({
		get variant() {
			return variant;
		},
		get size() {
			return size;
		},
		get orientation() {
			return orientation;
		}
	});
</script>

<!--
Discriminated Unions + Destructuring (required for bindable) do not
get along, so we cast `value` to `never`.
-->
<ToggleGroupPrimitive.Root
	bind:ref
	bind:value={value as never}
	{orientation}
	data-slot="kleri-toggle-group"
	data-orientation={orientation}
	class={cn(
		'flex w-fit items-stretch',
		orientation === 'horizontal' && 'flex-row gap-1',
		orientation === 'vertical' && 'flex-col gap-1',
		className
	)}
	{...restProps}
/>
