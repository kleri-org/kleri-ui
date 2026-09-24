import { describe, expect, it } from 'vitest';
import {
	bake,
	CLOSE_TIMING,
	cubicBezier,
	morphFrame,
	OPEN_TIMING,
	ramp,
	spring,
	type Box
} from './morph.js';

const parseTransform = (transform: string) => {
	const [x, y, sx, sy] = transform.match(/-?[\d.]+(?:e-?\d+)?/g)!.map(Number);
	return { x, y, sx, sy };
};

describe('spring', () => {
	it('runs from exactly 0 to exactly 1', () => {
		const { ease } = spring(0.3, 0.12);
		expect(ease(0)).toBe(0);
		expect(ease(1)).toBe(1);
	});

	it('settles within its duration and does most of the motion early', () => {
		const { duration, ease } = spring(0.3, 0.12);
		expect(duration).toBeGreaterThan(200);
		expect(duration).toBeLessThan(500);
		expect(Math.abs(1 - ease(0.99))).toBeLessThan(0.002);
		// Snappy: past 90% of the distance well before half the timeline.
		expect(ease(0.45)).toBeGreaterThan(0.9);
	});

	it('overshoots only slightly with a small bounce, and not at all with none', () => {
		const bouncy = spring(0.3, 0.12);
		const critical = spring(0.3, 0);
		let bouncyPeak = 0;
		let criticalPeak = 0;
		for (let t = 0; t <= 1; t += 0.001) {
			bouncyPeak = Math.max(bouncyPeak, bouncy.ease(t));
			criticalPeak = Math.max(criticalPeak, critical.ease(t));
		}
		expect(bouncyPeak).toBeGreaterThan(1);
		expect(bouncyPeak).toBeLessThan(1.01);
		expect(criticalPeak).toBeLessThanOrEqual(1);
	});
});

describe('cubicBezier', () => {
	it('matches the endpoints and is monotonic', () => {
		const ease = cubicBezier(0.32, 0.72, 0, 1);
		expect(ease(0)).toBe(0);
		expect(ease(1)).toBe(1);
		let previous = 0;
		for (let t = 0.01; t <= 1; t += 0.01) {
			const value = ease(t);
			expect(value).toBeGreaterThanOrEqual(previous);
			previous = value;
		}
	});

	it('reproduces linear and ease-out shapes', () => {
		const linear = cubicBezier(0, 0, 1, 1);
		expect(linear(0.3)).toBeCloseTo(0.3, 4);
		const easeOut = cubicBezier(0, 0, 0.58, 1);
		expect(easeOut(0.5)).toBeGreaterThan(0.5);
	});
});

describe('ramp', () => {
	it('clamps outside its window and is linear inside', () => {
		expect(ramp(0, 10, 20)).toBe(0);
		expect(ramp(15, 10, 20)).toBe(0.5);
		expect(ramp(30, 10, 20)).toBe(1);
	});
});

describe('morphFrame', () => {
	const trigger: Box = { left: 40, top: 500, width: 200, height: 40 };
	const panel: Box = { left: 300, top: 200, width: 600, height: 400 };

	it('covers the trigger exactly at progress 0', () => {
		const frame = morphFrame(trigger, panel, 8, 14, 0);
		const { x, y, sx, sy } = parseTransform(frame.transform);
		// Scaled from the panel's top-left corner, the panel lands on the trigger box.
		expect(panel.left + x).toBeCloseTo(trigger.left);
		expect(panel.top + y).toBeCloseTo(trigger.top);
		expect(panel.width * sx).toBeCloseTo(trigger.width);
		expect(panel.height * sy).toBeCloseTo(trigger.height);
	});

	it('is the identity at progress 1', () => {
		const frame = morphFrame(trigger, panel, 8, 14, 1);
		expect(frame.transform).toBe('translate(0px, 0px) scale(1, 1)');
		expect(frame.contentTransform).toBe('scale(1, 1)');
		expect(frame.borderRadius).toBe('14px / 14px');
	});

	it('corrects the radius and counter-scales content for the current scale', () => {
		const frame = morphFrame(trigger, panel, 8, 14, 0);
		const { sx, sy } = parseTransform(frame.transform);
		const [rx, ry] = frame.borderRadius.split('/').map((part) => parseFloat(part));
		// After scaling, both radii read as the trigger's 8px.
		expect(rx * sx).toBeCloseTo(8, 2);
		expect(ry * sy).toBeCloseTo(8, 2);
		const counter = parseTransform(`translate(0px, 0px) ${frame.contentTransform}`);
		expect(counter.sx * sx).toBeCloseTo(1, 3);
		expect(counter.sy * sy).toBeCloseTo(1, 3);
	});

	it('never produces a degenerate scale', () => {
		const frame = morphFrame({ left: 0, top: 0, width: 0, height: 0 }, panel, 0, 14, 0);
		expect(frame.contentTransform).not.toContain('Infinity');
	});
});

describe('bake', () => {
	it('samples roughly one keyframe per 60Hz frame with increasing offsets from 0 to 1', () => {
		const keyframes = bake(OPEN_TIMING.duration, (t) => ({ opacity: t }));
		expect(keyframes.length).toBeGreaterThanOrEqual(Math.ceil(OPEN_TIMING.duration / (1000 / 60)));
		expect(keyframes[0].offset).toBe(0);
		expect(keyframes.at(-1)!.offset).toBe(1);
		for (let i = 1; i < keyframes.length; i++) {
			expect(keyframes[i].offset).toBeGreaterThan(keyframes[i - 1].offset);
		}
	});
});

describe('timings', () => {
	it('keep both directions snappy', () => {
		expect(OPEN_TIMING.duration).toBeLessThan(450);
		expect(CLOSE_TIMING.duration).toBeLessThanOrEqual(260);
	});
});
