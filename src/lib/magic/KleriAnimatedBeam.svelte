<script lang="ts">
	import { motion } from 'motion-sv';
	import { cn } from '$lib/utils';
	import { KLERI_COLOR_1, KLERI_COLOR_2 } from '$lib/constants';
	import { usePathCalculator } from './animated-beam/use-path-calculator.svelte';
	import { useGradientCoordinates } from './animated-beam/use-gradient-coordinates.svelte';
	import { useResizeObserver } from './animated-beam/use-resize-observer.svelte';

	interface KleriAnimatedBeamProps {
		/** Additional CSS classes */
		class?: string;
		/** Container element that defines the SVG viewport bounds */
		containerRef: HTMLElement | null;
		/** Starting element the beam originates from */
		fromRef: HTMLElement | null;
		/** Target element the beam connects to */
		toRef: HTMLElement | null;
		/** Curvature of the beam path in px (higher = more arc) */
		curvature?: number;
		/** Reverse the gradient animation direction */
		reverse?: boolean;
		/** Color of the static path trace */
		pathColor?: string;
		/** Width of the beam stroke */
		pathWidth?: number;
		/** Opacity of the static path trace */
		pathOpacity?: number;
		/** Starting color of the animated gradient */
		gradientStartColor?: string;
		/** Ending color of the animated gradient */
		gradientStopColor?: string;
		/** Delay before animation starts (seconds) */
		delay?: number;
		/** Duration of one animation cycle (seconds) */
		duration?: number;
		/** Horizontal offset from the center of fromRef */
		startXOffset?: number;
		/** Vertical offset from the center of fromRef */
		startYOffset?: number;
		/** Horizontal offset from the center of toRef */
		endXOffset?: number;
		/** Vertical offset from the center of toRef */
		endYOffset?: number;
		/** Fraction of the SVG axis occupied by the travelling gradient beam (0–1) */
		beamLength?: number;
		/** Gap between consecutive beam sweeps in seconds (0 = rapid fire, no gap) */
		interval?: number;
	}

	let {
		class: className,
		containerRef,
		fromRef,
		toRef,
		curvature = 0,
		reverse = false,
		duration = Math.random() * 3 + 4,
		delay = 0,
		pathColor = 'var(--muted-foreground)',
		pathWidth = 2,
		pathOpacity = 0.2,
		gradientStartColor = KLERI_COLOR_2,
		gradientStopColor = KLERI_COLOR_1,
		startXOffset = 0,
		startYOffset = 0,
		endXOffset = 0,
		endYOffset = 0,
		beamLength = 0.1,
		interval = 0
	}: KleriAnimatedBeamProps = $props();

	// Unique instance ID consistent between server and client (Svelte 5.20+)
	const uid = $props.id();
	const trailingUid = `${uid}-continuous`;

	// Use path calculator
	const pathCalculator = usePathCalculator();

	// Calculate gradient coordinates based on path orientation and reverse prop
	const gradientCoordinates = $derived(
		useGradientCoordinates(
			reverse,
			pathCalculator.startX,
			pathCalculator.startY,
			pathCalculator.endX,
			pathCalculator.endY,
			beamLength
		)
	);

	// Start directly at the first travelling-beam frame instead of animating
	// from a collapsed 0% gradient, which creates a visible pause before each run.
	const initialGradientCoordinates = $derived({
		x1: gradientCoordinates.x1[0],
		x2: gradientCoordinates.x2[0],
		y1: gradientCoordinates.y1[0],
		y2: gradientCoordinates.y2[0]
	});
	const isContinuous = $derived(interval <= 0);
	const repeatDelay = $derived(Math.max(interval, 0));
	const trailingDelay = $derived(delay <= 0 ? -duration / 2 : delay + duration / 2);

	// Update path function
	const updatePath = () => {
		pathCalculator.calculatePath(
			containerRef,
			fromRef,
			toRef,
			curvature,
			startXOffset,
			startYOffset,
			endXOffset,
			endYOffset
		);
	};

	// Setup resize observer
	useResizeObserver(() => containerRef, updatePath);

	// Watch for changes in refs and offsets
	$effect(() => {
		updatePath();
	});
</script>

<svg
	fill="none"
	width={pathCalculator.svgDimensions.width}
	height={pathCalculator.svgDimensions.height}
	xmlns="http://www.w3.org/2000/svg"
	class={cn('pointer-events-none absolute top-0 left-0 transform-gpu', className)}
	viewBox={`0 0 ${pathCalculator.svgDimensions.width} ${pathCalculator.svgDimensions.height}`}
>
	<path
		d={pathCalculator.pathD}
		stroke={pathColor}
		stroke-width={pathWidth}
		stroke-opacity={pathOpacity}
		stroke-linecap="round"
	/>
	<path
		d={pathCalculator.pathD}
		stroke-width={pathWidth}
		stroke={`url(#${uid})`}
		stroke-opacity="1"
		stroke-linecap="round"
	/>
	{#if isContinuous}
		<path
			d={pathCalculator.pathD}
			stroke-width={pathWidth}
			stroke={`url(#${trailingUid})`}
			stroke-opacity="1"
			stroke-linecap="round"
		/>
	{/if}
	<defs>
		<motion.linearGradient
			class="transform-gpu"
			id={uid}
			gradientUnits="userSpaceOnUse"
			initial={initialGradientCoordinates}
			animate={{
				x1: gradientCoordinates.x1,
				x2: gradientCoordinates.x2,
				y1: gradientCoordinates.y1,
				y2: gradientCoordinates.y2
			}}
			transition={{
				delay,
				duration,
				ease: 'linear',
				repeat: Infinity,
				repeatDelay
			}}
		>
			<stop stop-color={gradientStartColor} stop-opacity="0"></stop>
			<stop stop-color={gradientStartColor}></stop>
			<stop offset="32.5%" stop-color={gradientStopColor}></stop>
			<stop offset="100%" stop-color={gradientStopColor} stop-opacity="0"></stop>
		</motion.linearGradient>
		{#if isContinuous}
			<motion.linearGradient
				class="transform-gpu"
				id={trailingUid}
				gradientUnits="userSpaceOnUse"
				initial={initialGradientCoordinates}
				animate={{
					x1: gradientCoordinates.x1,
					x2: gradientCoordinates.x2,
					y1: gradientCoordinates.y1,
					y2: gradientCoordinates.y2
				}}
				transition={{
					delay: trailingDelay,
					duration,
					ease: 'linear',
					repeat: Infinity,
					repeatDelay: 0
				}}
			>
				<stop stop-color={gradientStartColor} stop-opacity="0"></stop>
				<stop stop-color={gradientStartColor}></stop>
				<stop offset="32.5%" stop-color={gradientStopColor}></stop>
				<stop offset="100%" stop-color={gradientStopColor} stop-opacity="0"></stop>
			</motion.linearGradient>
		{/if}
	</defs>
</svg>
