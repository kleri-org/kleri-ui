<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: DialogPrimitive.TitleProps & WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	data-slot="dialog-title"
	class={cn('text-lg leading-none font-semibold tracking-tight', className)}
	{...restProps}
>
	{@render children?.()}
</DialogPrimitive.Title>
