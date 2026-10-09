/** Ink for marks drawn on an arbitrary colour: near-black or white. */
export const INK_DARK = '#0a0a0a';
export const INK_LIGHT = '#ffffff';

function channels(color: string): [number, number, number] | undefined {
	const value = color.trim().toLowerCase();
	const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value)?.[1];
	if (hex) {
		const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
		return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
	}
	const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(value);
	if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	return undefined;
}

/** WCAG relative luminance of a hex or `rgb()` colour, or `undefined` if unparseable. */
export function relativeLuminance(color: string): number | undefined {
	const rgb = channels(color);
	if (!rgb) return undefined;
	const [r, g, b] = rgb.map((v) => {
		const c = Math.min(255, Math.max(0, v)) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Whichever of near-black or white contrasts more with `color`, for initials
 * and check marks on user-chosen calendar and avatar colours. Unparseable
 * colours (named colours, `oklch()`) fall back to white.
 */
export function readableInk(color: string | undefined): string {
	const lum = color ? relativeLuminance(color) : undefined;
	if (lum === undefined) return INK_LIGHT;
	const dark = relativeLuminance(INK_DARK)!;
	return (lum + 0.05) / (dark + 0.05) >= 1.05 / (lum + 0.05) ? INK_DARK : INK_LIGHT;
}
