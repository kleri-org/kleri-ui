import type { Component } from 'svelte';
import type { ClassValue } from 'clsx';
import { cn } from '$lib/utils.js';

/**
 * Shared building blocks for the Kleri input family (KleriInput, KleriTextarea,
 * KleriCombobox, KleriSlider, KleriSwitch, KleriDragNDrop).
 *
 * Every field follows the same shape:
 *
 *   root      -> `FIELD_ROOT`      (block, full width, small medium text)
 *     label   -> `KleriFieldLabel` (label + hint on one row, errors on the next)
 *     shell   -> `fieldShell()`    (the bordered box, animates on error)
 *       icon  -> `FIELD_ICON_SIZE` / `FIELD_ICON_STROKE`
 *       input -> `FIELD_CONTROL`   (chrome-free control that fills the shell)
 *
 * The shell carries `data-slot="field-shell"` so pages can target it.
 */

/** Icon components accepted by the `InputIcon` prop (e.g. `@lucide/svelte` icons). */
export type FieldIcon = Component;

/** Uniform icon metrics for every icon rendered inside a field shell. */
export const FIELD_ICON_SIZE = 22;
export const FIELD_ICON_STROKE = 2.5;

/** Outer wrapper shared by every labelled field. */
export const FIELD_ROOT = 'block w-full text-sm font-medium select-none';

/**
 * The control itself. Resets the user-agent (and `@tailwindcss/forms`) chrome so
 * the field's height is decided by the shell's padding, not by the plugin.
 */
export const FIELD_CONTROL =
	'min-w-0 flex-1 border-0 bg-transparent px-1 py-0 text-foreground placeholder-muted-foreground outline-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed';

export type FieldShellOptions = {
	/** Draw the resting border. When `false` the border is transparent (no layout shift). */
	withBorder?: boolean;
	/** Paint the destructive border. */
	hasErrors?: boolean;
	/** Dim the shell and block the pointer. */
	disabled?: boolean;
	/** `start` for multi-line controls (textarea), `center` for single-line ones. */
	align?: 'center' | 'start';
	/** Extra classes, merged last. */
	class?: ClassValue;
};

/** The bordered box wrapping a field's control, icon and trailing affordances. */
export function fieldShell({
	withBorder = true,
	hasErrors = false,
	disabled = false,
	align = 'center',
	class: className
}: FieldShellOptions = {}) {
	return cn(
		'relative my-1 flex w-full min-w-0 flex-row gap-2 rounded-kleri border py-2 pr-3 pl-4 transition-colors',
		align === 'start' ? 'items-start' : 'items-center',
		withBorder ? 'border-border' : 'border-transparent',
		// The gradient ring would paint over the error border, so errors keep it
		// off and draw the solid focus ring outside the Ember border instead.
		hasErrors
			? 'border-destructive focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring'
			: 'focus-within:kleri-border dark:focus-within:kleri-border-dark',
		disabled && 'cursor-not-allowed opacity-60',
		className
	);
}

/**
 * A highlighted option in a field's dropdown list (select, combobox). Built on
 * `accent` so the Lagoon/Sea Glass role swap keeps it visible in both themes.
 */
export const FIELD_OPTION =
	'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-hidden transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-accent/45 data-highlighted:text-foreground dark:data-highlighted:bg-accent/35';

/** Id of a field's error list, which `KleriFieldLabel` renders as a live region. */
export function fieldErrorId(controlId: string): string {
	return `${controlId}-errors`;
}

/**
 * Joins `aria-describedby` ids, skipping empty ones, so a field's own error id
 * and any ids the consumer (e.g. formsnap) passes in both survive.
 */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
	const joined = ids.filter(Boolean).join(' ');
	return joined === '' ? undefined : joined;
}
