import { useMotionValue } from 'motion-sv';

/**
 * A cursor-tracking motion point, parked off-canvas when the pointer is away.
 *
 * `KleriMagicCard` and `KleriMagicButton` both need the same thing: a motion
 * (x, y) pair that follows the pointer within an element and resets whenever
 * the pointer leaves the element, the window, or the tab.
 *
 * `getParkDistance` is read lazily so the parked position keeps up with a
 * changing `gradientSize`.
 */
export function useSpotlight(getParkDistance: () => number) {
	const x = useMotionValue(-getParkDistance());
	const y = useMotionValue(-getParkDistance());

	function park() {
		const distance = -getParkDistance();
		x.set(distance);
		y.set(distance);
	}

	function track(event: PointerEvent) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		x.set(event.clientX - rect.left);
		y.set(event.clientY - rect.top);
	}

	return { x, y, park, track };
}

/**
 * Parks every spotlight when the pointer leaves the window or the tab is
 * hidden — without this the glow freezes mid-element until the next hover.
 */
export function parkSpotlightsOnWindowExit(park: () => void) {
	$effect(() => {
		const onPointerOut = (event: PointerEvent) => {
			if (!event.relatedTarget) park();
		};

		const onVisibilityChange = () => {
			if (document.visibilityState !== 'visible') park();
		};

		window.addEventListener('pointerout', onPointerOut);
		window.addEventListener('blur', park);
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			window.removeEventListener('pointerout', onPointerOut);
			window.removeEventListener('blur', park);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});
}
