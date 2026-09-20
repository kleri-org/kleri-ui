<script lang="ts">
	import { motion, useMotionTemplate } from 'motion-sv';
	import { cn } from '$lib/utils';
	import { KLERI_COLOR_1, KLERI_COLOR_2 } from '$lib/constants';
	import { useSpotlight, parkSpotlightsOnWindowExit } from './use-spotlight.svelte.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface KleriMagicButtonProps extends HTMLButtonAttributes {
		children?: Snippet;
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
		gradientSize = 150,
		gradientColor = KLERI_COLOR_2,
		gradientOpacity = 0.1,
		gradientFrom = KLERI_COLOR_2,
		gradientTo = KLERI_COLOR_1,
		...restProps
	}: KleriMagicButtonProps = $props();

	// Two spotlights: the border tracks the padded wrapper, the glow tracks the
	// button itself, so the two gradients stay aligned with their own boxes.
	const border = useSpotlight(() => gradientSize);
	const glow = useSpotlight(() => gradientSize);
	let isHovered = $state(false);

	function park() {
		border.park();
		glow.park();
	}

	parkSpotlightsOnWindowExit(park);

	// `$derived` so a changed gradient prop rebuilds the template.
	const borderGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${border.x}px ${border.y}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`
	);
	const overlayGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${glow.x}px ${glow.y}px, ${gradientColor}, transparent 100%)`
	);

	function handleWrapperPointerLeave(e: PointerEvent) {
		const wrapper = e.currentTarget as HTMLElement;
		const related = e.relatedTarget as HTMLElement | null;
		// Moving onto the inner button is not leaving the wrapper.
		if (!related || !wrapper.contains(related)) {
			isHovered = false;
			park();
		}
	}
</script>

<motion.div
	class={cn('relative inline-flex overflow-hidden rounded-kleri p-0.5', className)}
	style={{ background: borderGradient }}
	onpointermove={border.track}
	onpointerenter={() => (isHovered = true)}
	onpointerleave={handleWrapperPointerLeave}
	role="presentation"
>
	<button
		class="relative flex w-full items-center justify-center overflow-hidden rounded-kleri bg-muted/80 px-6 py-2 text-base font-normal text-foreground ring-0 transition-colors duration-300 select-none disabled:cursor-not-allowed disabled:opacity-50"
		onpointermove={glow.track}
		{...restProps}
	>
		{@render children?.()}
		<motion.div
			class="pointer-events-none absolute inset-0 transition-opacity duration-300"
			style={{ background: overlayGradient, opacity: isHovered ? gradientOpacity : 0 }}
		></motion.div>
	</button>
</motion.div>
