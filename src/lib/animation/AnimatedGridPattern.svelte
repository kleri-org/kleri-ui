<script lang="ts">
	import { onMount } from 'svelte';
	import { motion } from 'motion-sv';
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	interface AnimatedGridPatternProps extends HTMLAttributes<SVGElement> {
		width?: number;
		height?: number;
		x?: number;
		y?: number;
		strokeDasharray?: number;
		numSquares?: number;
		maxOpacity?: number;
		duration?: number;
		repeatDelay?: number;
		class?: string;
	}

	type Square = {
		id: number;
		pos: [number, number];
		iteration: number;
	};

	let {
		width = 40,
		height = 40,
		x = -1,
		y = -1,
		strokeDasharray = 0,
		numSquares = 50,
		class: className,
		maxOpacity = 0.5,
		duration = 4,
		repeatDelay = 0.5,
		...props
	}: AnimatedGridPatternProps = $props();

	const id = $props.id();
	const gradientId = id + '-grad';
	let containerRef: SVGSVGElement | null = $state(null);
	let dimensions = $state({ width: 0, height: 0 });
	let squares = $state<Array<Square>>([]);

	const getPos = (): [number, number] => {
		return [
			Math.floor((Math.random() * dimensions.width) / width),
			Math.floor((Math.random() * dimensions.height) / height)
		];
	};

	const generateSquares = (count: number): Array<Square> => {
		return Array.from({ length: count }, (_, i) => ({
			id: i,
			pos: getPos(),
			iteration: 0
		}));
	};

	const updateSquarePosition = (squareId: number) => {
		const current = squares[squareId];
		if (!current || current.id !== squareId) return;

		const nextSquares = squares.slice();
		nextSquares[squareId] = {
			...current,
			pos: getPos(),
			iteration: current.iteration + 1
		};

		squares = nextSquares;
	};

	$effect(() => {
		if (dimensions.width && dimensions.height) {
			squares = generateSquares(numSquares);
		}
	});

	onMount(() => {
		const element = containerRef;
		if (!element) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const nextWidth = entry.contentRect.width;
				const nextHeight = entry.contentRect.height;
				if (dimensions.width !== nextWidth || dimensions.height !== nextHeight) {
					dimensions = { width: nextWidth, height: nextHeight };
				}
			}
		});

		resizeObserver.observe(element);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<svg
	bind:this={containerRef}
	aria-hidden="true"
	class={cn(
		'pointer-events-none absolute inset-0 h-full w-full',
		className
	)}
	{...props}
>
	<defs>
		<!-- Kleri green gradient for animated squares -->
		<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#84CCB8" />
			<stop offset="100%" stop-color="#239190" />
		</linearGradient>
		<pattern {id} {width} {height} patternUnits="userSpaceOnUse" {x} {y}>
			<path
				d={`M.5 ${height}V.5H${width}`}
				fill="none"
				stroke="#196072"
				stroke-opacity="0.15"
				stroke-dasharray={strokeDasharray}
			/>
		</pattern>
	</defs>
	<rect width="100%" height="100%" fill={`url(#${id})`} />
	<svg {x} {y} class="overflow-visible">
		{#each squares as { pos: [squareX, squareY], id: squareId, iteration }, index (squareId + '-' + iteration)}
			<motion.rect
				initial={{ opacity: 0 }}
				animate={{ opacity: maxOpacity }}
				transition={{
					duration,
					repeat: 1,
					delay: index * 0.1,
					repeatType: 'reverse',
					repeatDelay
				}}
				onAnimationComplete={() => updateSquarePosition(squareId)}
				width={width - 1}
				height={height - 1}
				x={squareX * width + 1}
				y={squareY * height + 1}
				fill={`url(#${gradientId})`}
				stroke-width="0"
			/>
		{/each}
	</svg>
</svg>
