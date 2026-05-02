<script lang="ts">
	import { motion, useMotionTemplate, useMotionValue } from 'motion-sv';
	import { cn } from '$lib/utils';
	import { KLERI_GREEN_1, KLERI_GREEN_2 } from '$lib/constants';
	import type { Snippet } from 'svelte';

	interface KleriMagicCardProps {
		/** Card content */
		children?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Size of the gradient circle in px */
		gradientSize?: number;
		/** Color of the inner glow overlay */
		gradientColor?: string;
		/** Opacity of the inner glow overlay */
		gradientOpacity?: number;
		/** Starting color of the border spotlight */
		gradientFrom?: string;
		/** Ending color of the border spotlight */
		gradientTo?: string;
	}

	let {
		children,
		class: className,
		gradientSize = 200,
		gradientColor = KLERI_GREEN_2,
		gradientOpacity = 0.15,
		gradientFrom = KLERI_GREEN_2,
		gradientTo = KLERI_GREEN_1
	}: KleriMagicCardProps = $props();

	let mouseX = $derived(useMotionValue(-gradientSize));
	let mouseY = $derived(useMotionValue(-gradientSize));

	let borderGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`
	);
	let overlayGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`
	);

	const reset = () => {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	};

	const handlePointerMove = (e: PointerEvent) => {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		mouseX.set(e.clientX - rect.left);
		mouseY.set(e.clientY - rect.top);
	};

	$effect(() => {
		reset();
	});

	$effect(() => {
		const handleGlobalPointerOut = (e: PointerEvent) => {
			if (!e.relatedTarget) {
				reset();
			}
		};

		const handleVisibility = () => {
			if (document.visibilityState !== 'visible') {
				reset();
			}
		};

		window.addEventListener('pointerout', handleGlobalPointerOut);
		window.addEventListener('blur', reset);
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			window.removeEventListener('pointerout', handleGlobalPointerOut);
			window.removeEventListener('blur', reset);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

<motion.div
	class={cn('group rounded-kleri relative flex overflow-hidden p-px', className)}
	style={{ background: borderGradient }}
	onpointermove={handlePointerMove}
	onpointerleave={reset}
>
	<div
		class="bg-card text-card-foreground rounded-kleri relative flex w-full flex-col overflow-hidden p-6"
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
	<motion.div
		class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style={{ background: overlayGradient, opacity: gradientOpacity }}
	></motion.div>
</motion.div>
