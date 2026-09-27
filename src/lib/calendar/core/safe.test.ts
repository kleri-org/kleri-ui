import { describe, expect, it } from 'vitest';
import { safeColor, safeUrl } from './safe.js';

describe('safeUrl', () => {
	it('keeps web, mail and phone links', () => {
		expect(safeUrl('https://meet.google.com/abc-defg-hij')).toBe(
			'https://meet.google.com/abc-defg-hij'
		);
		expect(safeUrl(' http://example.com ')).toBe('http://example.com');
		expect(safeUrl('mailto:ada@example.com')).toBe('mailto:ada@example.com');
		expect(safeUrl('tel:+441234')).toBe('tel:+441234');
		expect(safeUrl('/events/42')).toBe('/events/42');
	});

	it('drops script and data URLs, however they are disguised', () => {
		expect(safeUrl('javascript:alert(1)')).toBeUndefined();
		expect(safeUrl('JavaScript:alert(1)')).toBeUndefined();
		expect(safeUrl('java\tscript:alert(1)')).toBeUndefined();
		expect(safeUrl(' \njavascript:alert(1)')).toBeUndefined();
		expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
		expect(safeUrl('vbscript:msgbox')).toBeUndefined();
		expect(safeUrl('')).toBeUndefined();
		expect(safeUrl(undefined)).toBeUndefined();
	});
});

describe('safeColor', () => {
	it('accepts plain CSS colors', () => {
		for (const color of [
			'#239190',
			'#abc',
			'#23919080',
			'teal',
			'rgb(1, 2, 3)',
			'oklch(70% 0.1 200)'
		])
			expect(safeColor(color)).toBe(color);
	});

	it('rejects anything that could add declarations', () => {
		expect(safeColor('red; background-image: url(https://evil.test/p.png)')).toBeUndefined();
		expect(safeColor('url(https://evil.test)')).toBeUndefined();
		expect(safeColor('var(--x)')).toBeUndefined();
		expect(safeColor('')).toBeUndefined();
		expect(safeColor(null)).toBeUndefined();
	});
});
