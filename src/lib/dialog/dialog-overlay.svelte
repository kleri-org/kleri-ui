<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn(
		'fixed inset-0 z-50 bg-black/60 data-closed:animate-out data-closed:duration-200 data-closed:fade-out-0 data-open:animate-in data-open:duration-300 data-open:fade-in-0',
		className
	)}
	{...restProps}
/>
