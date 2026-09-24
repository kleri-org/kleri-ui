/**
 * Shared-element morph between a dialog trigger and the dialog panel.
 *
 * The panel is laid out at its final size and position from the first frame;
 * the morph is pure FLIP: the panel is scaled/translated down onto the
 * trigger's box and springs back to identity. Motion only touches `transform`
 * and `opacity` (compositor-friendly, no per-frame layout), the content
 * wrapper is counter-scaled so text is revealed instead of squashed, and the
 * border radius is corrected per frame so corners stay round at any scale.
 *
 * Every track of a transition shares one duration, so a transition that is
 * interrupted (closed mid-open, reopened mid-close) turns around by reversing
 * in place instead of jumping.
 */

export interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
}

/** Maps linear progress in [0, 1] to eased progress (a spring may overshoot 1). */
export type Ease = (t: number) => number;

export interface Timing {
	/** Milliseconds. */
	duration: number;
	ease: Ease;
}

/** Marks the panel while a transition runs; the value is `<mode>-<in|out>`. */
export const MORPH_ATTR = 'data-kleri-morph';
/** Marks the panel's content wrapper, which is counter-scaled during a morph. */
export const MORPH_CONTENT_ATTR = 'data-kleri-morph-content';

/** Sample spacing for baked keyframes: one per 60Hz frame, interpolated linearly in between. */
const FRAME_MS = 1000 / 60;
/** A spring is considered settled once it stays within this distance of its target. */
const SETTLE_EPSILON = 0.001;
const MIN_SCALE = 0.01;

/**
 * Closed-form damped spring from 0 to 1, parameterised like SwiftUI's
 * `spring(duration:bounce:)`: `perceptual` (seconds) is roughly how long the
 * motion feels, `bounce` in [0, 1) trades damping for overshoot. The returned
 * duration runs until the spring settles, so the animation never ends on a
 * visible jump.
 */
export function spring(perceptual: number, bounce = 0): Timing {
	const omega = (2 * Math.PI) / perceptual;
	const zeta = 1 - Math.min(Math.max(bounce, 0), 0.95);

	let position: (seconds: number) => number;
	if (zeta < 1) {
		const decay = zeta * omega;
		const omegaD = omega * Math.sqrt(1 - zeta * zeta);
		const k = decay / omegaD;
		position = (s) => 1 - Math.exp(-decay * s) * (Math.cos(omegaD * s) + k * Math.sin(omegaD * s));
	} else {
		position = (s) => 1 - Math.exp(-omega * s) * (1 + omega * s);
	}

	let duration = 0;
	for (let ms = 0; ms <= 3000; ms++) {
		if (Math.abs(1 - position(ms / 1000)) > SETTLE_EPSILON) duration = ms + 1;
	}

	return {
		duration,
		ease: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : position((t * duration) / 1000))
	};
}

/** `cubic-bezier()` as a function, for curves that have to be baked into keyframes. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;

	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

	const solveT = (x: number) => {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const error = sampleX(t) - x;
			if (Math.abs(error) < 1e-6) return t;
			const slope = slopeX(t);
			if (Math.abs(slope) < 1e-6) break;
			t -= error / slope;
		}
		// Newton stalled on a flat stretch: fall back to bisection.
		let lo = 0;
		let hi = 1;
		t = x;
		while (hi - lo > 1e-6) {
			if (sampleX(t) < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return t;
	};

	return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveT(t)));
}

/** Opening: a quick spring with a hint of overshoot, most motion lands in ~200ms. */
export const OPEN_TIMING = spring(0.3, 0.12);
/** Closing: fast departure, soft landing on the trigger. */
export const CLOSE_TIMING: Timing = { duration: 260, ease: cubicBezier(0.32, 0.72, 0, 1) };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const round = (n: number) => Math.round(n * 1e5) / 1e5;

/** Linear 0 → 1 ramp between two points of a timeline. */
export function ramp(t: number, start: number, end: number) {
	if (t <= start) return 0;
	if (t >= end) return 1;
	return (t - start) / (end - start);
}

export interface MorphFrame {
	/** Applied to the panel (origin at its top-left corner). */
	transform: string;
	/** Visually `radius` at the current scale. */
	borderRadius: string;
	/** Applied to the content wrapper to cancel the panel's scale. */
	contentTransform: string;
}

/**
 * The panel's styles at morph progress `p`: at 0 it covers `from` exactly, at
 * 1 it sits untransformed at `to` (its real layout box).
 */
export function morphFrame(
	from: Box,
	to: Box,
	fromRadius: number,
	toRadius: number,
	p: number
): MorphFrame {
	const sx = Math.max(lerp(from.width, to.width, p) / to.width, MIN_SCALE);
	const sy = Math.max(lerp(from.height, to.height, p) / to.height, MIN_SCALE);
	const x = lerp(from.left, to.left, p) - to.left;
	const y = lerp(from.top, to.top, p) - to.top;
	const radius = Math.max(lerp(fromRadius, toRadius, p), 0);

	return {
		transform: `translate(${round(x)}px, ${round(y)}px) scale(${round(sx)}, ${round(sy)})`,
		borderRadius: `${round(radius / sx)}px / ${round(radius / sy)}px`,
		contentTransform: `scale(${round(1 / sx)}, ${round(1 / sy)})`
	};
}

/** Samples `frame` across a timeline into linearly-interpolated keyframes. */
export function bake<T extends Keyframe>(
	duration: number,
	frame: (t: number) => T
): (T & { offset: number })[] {
	const steps = Math.max(2, Math.ceil(duration / FRAME_MS));
	const keyframes: (T & { offset: number })[] = [];
	for (let i = 0; i <= steps; i++) {
		const offset = i / steps;
		keyframes.push({ ...frame(offset), offset });
	}
	return keyframes;
}

type Direction = 'in' | 'out';
type Mode = 'morph' | 'pop' | 'fade';

interface Track {
	element: Element;
	keyframes: Keyframe[];
}

interface Plan {
	mode: Mode;
	duration: number;
	/** Baked tracks are sampled already and must run linearly. */
	easing: string;
	tracks: Track[];
	trigger?: Track;
}

/** Radii can be huge (`rounded-full`); a box can't be rounder than half its short side. */
function radiusOf(element: Element, box: Box) {
	const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
	return Math.min(radius, box.width / 2, box.height / 2);
}

function isTransparent(color: string) {
	// `rgba(r, g, b, 0)` or any modern `fn(… / 0)`; opaque `rgb(0, 0, 0)` must not match.
	return color === 'transparent' || /^rgba\(.*,\s*0\)$|\/\s*0\)$/.test(color);
}

function isVisibleBox(box: DOMRect) {
	return (
		box.width > 0 &&
		box.height > 0 &&
		box.bottom > 0 &&
		box.right > 0 &&
		box.top < window.innerHeight &&
		box.left < window.innerWidth
	);
}

function prefersReducedMotion() {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function planMorph(
	panel: HTMLElement,
	content: HTMLElement | null,
	trigger: HTMLElement,
	from: Box,
	to: Box,
	direction: Direction
): Plan {
	const opening = direction === 'in';
	const { duration, ease } = opening ? OPEN_TIMING : CLOSE_TIMING;
	const ms = (t: number) => t * duration;

	const fromRadius = radiusOf(trigger, from);
	const toRadius = radiusOf(panel, to);
	const frameAt = (t: number) =>
		morphFrame(from, to, fromRadius, toRadius, opening ? ease(t) : 1 - ease(t));

	// Opening: panel and trigger crossfade in the first beat while the panel is
	// still trigger-sized, then the content fades up as the panel grows.
	// Closing mirrors it: content goes first, the crossfade happens on landing.
	const panelOpacity = (t: number) =>
		opening ? ramp(ms(t), 0, 80) : 1 - ramp(ms(t), duration - 90, duration);
	const contentOpacity = (t: number) => (opening ? ramp(ms(t), 60, 200) : 1 - ramp(ms(t), 0, 90));
	const triggerOpacity = (t: number) =>
		opening ? 1 - ramp(ms(t), 0, 80) : ramp(ms(t), duration - 110, duration - 20);

	const tracks: Track[] = [
		// Composited: transform + opacity only.
		{
			element: panel,
			keyframes: bake(duration, (t) => ({
				transform: frameAt(t).transform,
				opacity: panelOpacity(t)
			}))
		},
		// Main thread (paint only): kept apart so it can't pin the tracks above
		// to the main thread.
		{
			element: panel,
			keyframes: bake(duration, (t) => ({ borderRadius: frameAt(t).borderRadius }))
		}
	];

	if (content) {
		tracks.push({
			element: content,
			keyframes: bake(duration, (t) => ({
				transform: frameAt(t).contentTransform,
				opacity: contentOpacity(t)
			}))
		});
	}

	// Start from the trigger's own fill so the surface reads as the button
	// growing, not a new box appearing on top of it.
	const triggerFill = getComputedStyle(trigger).backgroundColor;
	if (!isTransparent(triggerFill)) {
		const panelFill = getComputedStyle(panel).backgroundColor;
		const [first, last] = opening ? [triggerFill, panelFill] : [panelFill, triggerFill];
		const [start, end] = opening ? [0, 160] : [40, 180];
		tracks.push({
			element: panel,
			keyframes: [
				{ backgroundColor: first, offset: 0 },
				{ backgroundColor: first, offset: start / duration },
				{ backgroundColor: last, offset: end / duration },
				{ backgroundColor: last, offset: 1 }
			]
		});
	}

	return {
		mode: 'morph',
		duration,
		easing: 'linear',
		tracks,
		trigger: {
			element: trigger,
			keyframes: bake(duration, (t) => ({ opacity: triggerOpacity(t) }))
		}
	};
}

/** No usable trigger (programmatic open, trigger scrolled away): scale + fade in place. */
function planPop(panel: HTMLElement, direction: Direction): Plan {
	const hidden = { opacity: 0, transform: 'translateY(8px) scale(0.96)' };
	const shown = { opacity: 1, transform: 'none' };
	const opening = direction === 'in';
	return {
		mode: 'pop',
		duration: opening ? 260 : 160,
		easing: opening ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.4, 0, 1, 1)',
		tracks: [{ element: panel, keyframes: opening ? [hidden, shown] : [shown, hidden] }]
	};
}

function planFade(panel: HTMLElement, direction: Direction): Plan {
	const opening = direction === 'in';
	return {
		mode: 'fade',
		duration: opening ? 150 : 120,
		easing: 'ease-out',
		tracks: [
			{ element: panel, keyframes: [{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }] }
		]
	};
}

function plan(panel: HTMLElement, trigger: HTMLElement | null, direction: Direction): Plan {
	if (prefersReducedMotion()) return planFade(panel, direction);

	const to = panel.getBoundingClientRect();
	const from = trigger?.getBoundingClientRect();
	if (!trigger || !from || !isVisibleBox(from) || to.width === 0 || to.height === 0) {
		return planPop(panel, direction);
	}

	const content = panel.querySelector<HTMLElement>(`[${MORPH_CONTENT_ATTR}]`);
	return planMorph(panel, content, trigger, from, to, direction);
}

type Phase = 'closed' | 'opening' | 'open' | 'closing';

export interface MorphTargets {
	panel: HTMLElement;
	trigger: HTMLElement | null;
}

/**
 * Drives the open/close transitions of one dialog panel.
 *
 * `enter` / `exit` are idempotent for the current phase, so they can be called
 * from a reactive effect whenever the open state or elements change. Closing
 * animations are registered on the panel synchronously, which is what the
 * bits-ui presence manager waits on before unmounting it.
 */
export class DialogMorph {
	#phase: Phase = 'closed';
	#panel: HTMLElement | null = null;
	#mode: Mode = 'morph';
	/** Panel/content tracks of the running (or last closing) transition. */
	#animations: Animation[] = [];
	/**
	 * The trigger's fade. It outlives an opening transition on purpose: its
	 * forward fill is what keeps the trigger hidden while the dialog is open.
	 */
	#triggerFade: Animation | null = null;
	/** Bumped on every transition so stale `finished` callbacks are ignored. */
	#run = 0;

	get phase() {
		return this.#phase;
	}

	enter({ panel, trigger }: MorphTargets) {
		if (panel !== this.#panel) this.#reset(panel);
		if (this.#phase === 'opening' || this.#phase === 'open') return;
		if (this.#phase === 'closing') this.#turnAround('opening');
		else this.#play('opening', trigger);
	}

	exit({ panel, trigger }: MorphTargets) {
		// A panel this controller never opened has nothing to reverse.
		if (panel !== this.#panel) return;
		if (this.#phase === 'closed' || this.#phase === 'closing') return;
		if (this.#phase === 'opening') this.#turnAround('closing');
		else this.#play('closing', trigger);
	}

	destroy() {
		this.#reset(null);
	}

	#play(phase: 'opening' | 'closing', trigger: HTMLElement | null) {
		const panel = this.#panel!;
		for (const animation of this.#animations) animation.cancel();
		this.#animations = [];

		if (typeof panel.animate !== 'function') {
			this.#phase = phase === 'opening' ? 'open' : 'closed';
			return;
		}

		const direction: Direction = phase === 'opening' ? 'in' : 'out';
		const next = plan(panel, trigger, direction);
		const options: KeyframeAnimationOptions = {
			duration: next.duration,
			easing: next.easing,
			fill: 'both'
		};

		this.#phase = phase;
		this.#mode = next.mode;
		panel.setAttribute(MORPH_ATTR, `${next.mode}-${direction}`);
		this.#animations = next.tracks.map(({ element, keyframes }) =>
			element.animate(keyframes, options)
		);
		// Without a trigger track (pop/fade), a hidden trigger is off-screen or
		// was never hidden, so it can simply be released.
		this.#triggerFade?.cancel();
		this.#triggerFade = next.trigger
			? next.trigger.element.animate(next.trigger.keyframes, options)
			: null;
		this.#settle();
	}

	#turnAround(phase: 'opening' | 'closing') {
		this.#phase = phase;
		this.#panel?.setAttribute(MORPH_ATTR, `${this.#mode}-${phase === 'opening' ? 'in' : 'out'}`);
		for (const animation of this.#animations) animation.reverse();
		this.#triggerFade?.reverse();
		this.#settle();
	}

	#settle() {
		const run = ++this.#run;
		const all = this.#triggerFade ? [...this.#animations, this.#triggerFade] : this.#animations;
		Promise.all(all.map((animation) => animation.finished)).then(
			() => {
				if (run === this.#run) this.#finish();
			},
			() => {
				// Cancelled: whoever cancelled it owns the next state.
			}
		);
	}

	#finish() {
		this.#panel?.removeAttribute(MORPH_ATTR);
		if (this.#phase === 'opening') {
			// Final keyframes equal the resting styles, so dropping them is invisible
			// and leaves no filled animations on an open dialog.
			for (const animation of this.#animations) animation.cancel();
			this.#animations = [];
			this.#phase = 'open';
		} else {
			// Leave the closing fill in place: the panel is about to unmount and
			// cancelling here could flash it at full size for a frame.
			this.#triggerFade?.cancel();
			this.#triggerFade = null;
			this.#phase = 'closed';
		}
	}

	#reset(panel: HTMLElement | null) {
		this.#run++;
		for (const animation of this.#animations) animation.cancel();
		this.#triggerFade?.cancel();
		this.#animations = [];
		this.#triggerFade = null;
		this.#panel?.removeAttribute(MORPH_ATTR);
		this.#panel = panel;
		this.#phase = 'closed';
	}
}
