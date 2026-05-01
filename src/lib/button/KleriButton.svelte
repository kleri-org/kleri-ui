<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils';
	import { cn } from '$lib/utils';
	import { CircleCheckBig } from '@lucide/svelte';

	type ButtonProps = WithElementRef<HTMLButtonAttributes>;

	interface ExtendedButtonProps extends ButtonProps {
		showSuccess?: boolean;
		successMessage?: string;
		successTimeout?: number; // in milliseconds
		onSuccessComplete?: () => void;
	}

	let {
		children,
		class: className,
		showSuccess = false,
		successMessage = 'Success!',
		successTimeout = 2000,
		onSuccessComplete,
		...restProps
	}: ExtendedButtonProps = $props();

	$effect(() => {
		if (showSuccess && successTimeout > 0) {
			const timeoutId = setTimeout(() => {
				onSuccessComplete?.();
			}, successTimeout);

			return () => {
				clearTimeout(timeoutId);
			};
		}
	});
</script>

<button
	class={cn(
		'btn align-center rounded-kleri bg-primary hover:kleri-bg disabled:bg-primary/50 w-full border-2 border-black p-2 text-base font-normal text-black ring-0 transition-none duration-0 select-none hover:text-black hover:ring-0 hover:shadow-black/50 disabled:cursor-not-allowed disabled:border-none disabled:text-black disabled:shadow-none disabled:ring-0',
		className
	)}
	disabled={showSuccess}
	{...restProps}
>
	{#if showSuccess}
		<span class="animate-zoom-in flex items-center justify-center gap-2">
			<CircleCheckBig class="animate-zoom-in" />
			<span class="animate-zoom-in">{successMessage}</span>
		</span>
	{:else}
		{@render children?.()}
	{/if}
</button>

<style>
	@keyframes zoom-in {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-zoom-in {
		animation: zoom-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
</style>
