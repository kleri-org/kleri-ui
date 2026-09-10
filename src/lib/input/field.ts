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
 *     label   -> `KleriFieldLabel` (label + hint + errors, one row)
 *     shell   -> `fieldShell()`    (the bordered box, animates on error)
 *       icon  -> `FIELD_ICON_SIZE` / `FIELD_ICON_STROKE`
 *       input -> `FIELD_CONTROL`   (chrome-free control that fills the shell)
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
		'my-1 flex w-full flex-row gap-2 overflow-hidden rounded-kleri border-2 py-2 pr-3 pl-4 transition-colors focus-within:kleri-border dark:focus-within:kleri-border-dark',
		align === 'start' ? 'items-start' : 'items-center',
		withBorder ? 'border-border' : 'border-transparent',
		hasErrors && 'border-destructive focus-within:border-destructive',
		disabled && 'cursor-not-allowed opacity-60',
		className
	);
}
