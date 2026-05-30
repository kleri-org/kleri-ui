export interface AnimatedBeamProps {
	class?: string;
	containerRef: HTMLElement | null;
	fromRef: HTMLElement | null;
	toRef: HTMLElement | null;
	curvature?: number;
	reverse?: boolean;
	pathColor?: string;
	pathWidth?: number;
	pathOpacity?: number;
	gradientStartColor?: string;
	gradientStopColor?: string;
	delay?: number;
	duration?: number;
	startXOffset?: number;
	startYOffset?: number;
	endXOffset?: number;
	endYOffset?: number;
	/** Fraction of the SVG axis occupied by the travelling gradient beam (0–1) */
	beamLength?: number;
	/** Gap between consecutive beam sweeps in seconds (0 = rapid fire, no gap) */
	interval?: number;
}

export interface PathDimensions {
	width: number;
	height: number;
}

export interface GradientCoordinates {
	x1: string[];
	x2: string[];
	y1: string[];
	y2: string[];
}
