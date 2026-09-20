<script lang="ts">
	import { motion, useMotionTemplate } from 'motion-sv';
	import { cn } from '$lib/utils';
	import { KLERI_COLOR_1, KLERI_COLOR_2 } from '$lib/constants';
	import { useSpotlight, parkSpotlightsOnWindowExit } from './use-spotlight.svelte.js';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';

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
		/** Classes for the card's inner surface */
		background?: ClassValue;
	}

	let {
		children,
		class: className,
		gradientSize = 200,
		gradientColor = KLERI_COLOR_2,
		gradientOpacity = 0.15,
		gradientFrom = KLERI_COLOR_2,
		gradientTo = KLERI_COLOR_1,
		background = 'bg-card'
	}: KleriMagicCardProps = $props();

	const spotlight = useSpotlight(() => gradientSize);
	parkSpotlightsOnWindowExit(spotlight.park);

	// `$derived` so a changed gradient prop rebuilds the template.
	const borderGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${spotlight.x}px ${spotlight.y}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`
	);
	const overlayGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${spotlight.x}px ${spotlight.y}px, ${gradientColor}, transparent 100%)`
	);
</script>

<motion.div
	class={cn('group relative flex overflow-hidden rounded-kleri p-px', className)}
	style={{ background: borderGradient }}
	onpointermove={spotlight.track}
	onpointerleave={spotlight.park}
>
	<div
		class="relative flex w-full flex-col overflow-hidden rounded-kleri {background} p-6 text-card-foreground"
	>
		{@render children?.()}
	</div>
	<motion.div
		class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style={{ background: overlayGradient, opacity: gradientOpacity }}
	></motion.div>
</motion.div>
