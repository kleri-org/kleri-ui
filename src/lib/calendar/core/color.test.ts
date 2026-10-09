import { describe, expect, it } from 'vitest';
import { INK_DARK, INK_LIGHT, readableInk, relativeLuminance } from './color.js';

describe('readableInk', () => {
	it('uses dark ink on light colours', () => {
		expect(readableInk('#84ccb8')).toBe(INK_DARK);
		expect(readableInk('#e0a458')).toBe(INK_DARK);
		expect(readableInk('#fff')).toBe(INK_DARK);
	});

	it('uses white ink on dark colours', () => {
		expect(readableInk('#196072')).toBe(INK_LIGHT);
		expect(readableInk('rgb(25, 96, 114)')).toBe(INK_LIGHT);
		expect(readableInk('#000000ff')).toBe(INK_LIGHT);
	});

	it('falls back to white when the colour cannot be parsed', () => {
		expect(readableInk('oklch(0.7 0.1 180)')).toBe(INK_LIGHT);
		expect(readableInk(undefined)).toBe(INK_LIGHT);
	});
});

describe('relativeLuminance', () => {
	it('matches the WCAG endpoints', () => {
		expect(relativeLuminance('#000')).toBe(0);
		expect(relativeLuminance('#ffffff')).toBeCloseTo(1);
		expect(relativeLuminance('teal')).toBeUndefined();
	});
});
