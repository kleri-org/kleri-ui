import type { PathDimensions } from './types';

export function usePathCalculator() {
	let pathD = $state('');
	let svgDimensions = $state<PathDimensions>({ width: 0, height: 0 });
	let startX = $state(0);
	let startY = $state(0);
	let endX = $state(0);
	let endY = $state(0);

	function calculatePath(
		containerRef: HTMLElement | null,
		fromRef: HTMLElement | null,
		toRef: HTMLElement | null,
		curvature: number,
		startXOffset: number,
		startYOffset: number,
		endXOffset: number,
		endYOffset: number
	) {
		if (!containerRef || !fromRef || !toRef) return;

		const containerRect = containerRef.getBoundingClientRect();
		const rectA = fromRef.getBoundingClientRect();
		const rectB = toRef.getBoundingClientRect();

		const svgWidth = containerRect.width;
		const svgHeight = containerRect.height;
		svgDimensions = { width: svgWidth, height: svgHeight };

		const sx = rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
		const sy = rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
		const ex = rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
		const ey = rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

		startX = sx;
		startY = sy;
		endX = ex;
		endY = ey;

		const controlY = sy - curvature;
		const d = `M ${sx},${sy} Q ${(sx + ex) / 2},${controlY} ${ex},${ey}`;
		pathD = d;
	}

	return {
		get pathD() {
			return pathD;
		},
		get svgDimensions() {
			return svgDimensions;
		},
		get startX() {
			return startX;
		},
		get startY() {
			return startY;
		},
		get endX() {
			return endX;
		},
		get endY() {
			return endY;
		},
		calculatePath
	};
}
