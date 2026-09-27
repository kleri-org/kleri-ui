/**
 * Guards for values that come from calendar data and end up in markup.
 * Anyone can put anything in an invite or an iCalendar feed, so links and
 * colors are checked before they reach an `href` or a `style` attribute.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * `url` if it is safe to use as a link target, otherwise `undefined`. Only
 * http(s), mailto and tel links (and relative ones) pass, so a
 * `javascript:` URL hidden in an event never becomes clickable.
 */
export function safeUrl(url: string | null | undefined): string | undefined {
	const value = url?.trim();
	if (!value) return undefined;
	try {
		// The URL parser strips the same whitespace and control characters a
		// browser would, so `java\tscript:` is caught too.
		const parsed = new URL(value, 'https://relative.invalid');
		return SAFE_PROTOCOLS.has(parsed.protocol) ? value : undefined;
	} catch {
		return undefined;
	}
}

const COLOR_PATTERN =
	/^(?:#[0-9a-f]{3,8}|[a-z]{3,30}|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([0-9a-z\s.,%+\-/]*\))$/i;

/**
 * `color` if it is a plain CSS color (hex, a named color or a color
 * function), otherwise `undefined`. Stops `red; background: url(…)` from
 * smuggling extra declarations into an inline style.
 */
export function safeColor(color: string | null | undefined): string | undefined {
	const value = color?.trim();
	return value && COLOR_PATTERN.test(value) ? value : undefined;
}
