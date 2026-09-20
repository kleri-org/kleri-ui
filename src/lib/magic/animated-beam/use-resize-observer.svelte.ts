/**
 * Observes the container element for size changes and re-runs `callback`.
 *
 * Uses `$effect` rather than `onMount` because the container is usually bound
 * with `bind:this` in the *parent*, so it is still `null` when the child
 * mounts. The effect re-subscribes whenever the element itself changes, which
 * also covers the container being swapped or removed.
 */
export function useResizeObserver(getContainerRef: () => HTMLElement | null, callback: () => void) {
	$effect(() => {
		const containerRef = getContainerRef();
		if (!containerRef) return;

		const resizeObserver = new ResizeObserver(() => {
			callback();
		});

		resizeObserver.observe(containerRef);

		// Initial measurement, before the observer has fired.
		callback();

		return () => {
			resizeObserver.disconnect();
		};
	});
}
