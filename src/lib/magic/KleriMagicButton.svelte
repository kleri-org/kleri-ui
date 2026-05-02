<script lang="ts">
	import { motion, useMotionTemplate, useMotionValue } from 'motion-sv';
	import { cn } from '$lib/utils';
	import { KLERI_GREEN_1, KLERI_GREEN_2 } from '$lib/constants';
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
		gradientColor = KLERI_GREEN_2,
		gradientOpacity = 0.25,
		gradientFrom = KLERI_GREEN_2,
		gradientTo = KLERI_GREEN_1,
		...restProps
	}: KleriMagicButtonProps = $props();

	let mouseX = $derived(useMotionValue(-gradientSize));
	let mouseY = $derived(useMotionValue(-gradientSize));
	let btnMouseX = $derived(useMotionValue(-gradientSize));
	let btnMouseY = $derived(useMotionValue(-gradientSize));
	let isHovered = $state(false);

	let borderGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`
	);
	let overlayGradient = $derived(
		useMotionTemplate`radial-gradient(${gradientSize}px circle at ${btnMouseX}px ${btnMouseY}px, ${gradientColor}, transparent 100%)`
	);

	const reset = () => {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	};

	const resetBtn = () => {
		btnMouseX.set(-gradientSize);
		btnMouseY.set(-gradientSize);
	};

	const handleWrapperPointerMove = (e: PointerEvent) => {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		mouseX.set(e.clientX - rect.left);
		mouseY.set(e.clientY - rect.top);
	};

	const handleButtonPointerMove = (e: PointerEvent) => {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		btnMouseX.set(e.clientX - rect.left);
		btnMouseY.set(e.clientY - rect.top);
	};

	const handlePointerEnter = () => {
		isHovered = true;
	};

	const handleWrapperPointerLeave = (e: PointerEvent) => {
		const wrapper = e.currentTarget as HTMLElement;
		const related = e.relatedTarget as HTMLElement | null;
		if (!related || !wrapper.contains(related)) {
			isHovered = false;
			reset();
			resetBtn();
		}
	};

	$effect(() => {
		reset();
	});

	$effect(() => {
		const handleGlobalPointerOut = (e: PointerEvent) => {
			if (!e.relatedTarget) {
				reset();
				resetBtn();
			}
		};

		const handleVisibility = () => {
			if (document.visibilityState !== 'visible') {
				reset();
				resetBtn();
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
	class={cn('rounded-kleri relative inline-flex overflow-hidden p-0.5', className)}
	style={{ background: borderGradient }}
	onpointermove={handleWrapperPointerMove}
	onpointerenter={handlePointerEnter}
	onpointerleave={handleWrapperPointerLeave}
	role="presentation"
>
	<button
		class="rounded-kleri relative flex w-full items-center justify-center overflow-hidden bg-transparent px-6 py-2 text-base font-normal text-white ring-0 transition-colors duration-300 select-none hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
		onpointermove={handleButtonPointerMove}
		{...restProps}
	>
		{@render children?.()}
		<motion.div
			class="pointer-events-none absolute inset-0 transition-opacity duration-300"
			style={{ background: overlayGradient, opacity: isHovered ? gradientOpacity : 0 }}
		></motion.div>
	</button>
</motion.div>
