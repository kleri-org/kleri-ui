/** Props accepted by `KleriAnimatedBeam`. */
export interface AnimatedBeamProps {
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
	/** Horizontal offset from the center of `fromRef` */
	startXOffset?: number;
	/** Vertical offset from the center of `fromRef` */
	startYOffset?: number;
	/** Horizontal offset from the center of `toRef` */
	endXOffset?: number;
	/** Vertical offset from the center of `toRef` */
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
