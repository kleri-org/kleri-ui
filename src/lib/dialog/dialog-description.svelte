<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: DialogPrimitive.DescriptionProps &
		WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<DialogPrimitive.Description
	bind:ref
	data-slot="dialog-description"
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
>
	{@render children?.()}
</DialogPrimitive.Description>
