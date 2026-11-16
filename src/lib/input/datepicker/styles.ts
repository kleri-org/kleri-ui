/**
 * Class strings shared by the date picker's calendar parts, so every piece of
 * the grid reads as one Kleri surface. The look is ported from the scheduler's
 * `MiniCalendar`: selected days use the text-bearing `kleri-bg` fill with
 * `kleri-ink`, today is brand-coloured text rather than a second fill, and
 * focus uses the theme `--ring` (Lagoon on light, Sea Glass on dark) so it
 * clears 3:1 in both themes.
 */

/** Focus treatment for every interactive part of the calendar. */
export const CAL_FOCUS =
	'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-popover focus-visible:outline-none';

/** Previous / next month buttons. */
export const CAL_NAV_BUTTON = `flex size-(--cell-size) items-center justify-center rounded-md p-0 text-muted-foreground transition-colors select-none hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 rtl:rotate-180 ${CAL_FOCUS}`;

/** Weekday column headers. */
export const CAL_HEAD_CELL =
	'w-(--cell-size) font-spacemono text-[10px] font-normal text-muted-foreground uppercase';

/** The wrapper around the native month / year `<select>` overlays. */
export const CAL_SELECT_SHELL =
	'relative flex rounded-md transition-colors hover:bg-muted/60 has-focus-visible:ring-2 has-focus-visible:ring-ring';

/** The visible label drawn under a native month / year `<select>`. */
export const CAL_SELECT_LABEL =
	'flex h-(--cell-size) items-center gap-1 rounded-md ps-2 pe-1 text-sm font-semibold select-none [&>svg]:size-3.5 [&>svg]:text-muted-foreground';

/** A single day button, driven by the bits-ui `data-*` state attributes. */
export const CAL_DAY = [
	'flex size-(--cell-size) cursor-pointer items-center justify-center rounded-full p-0 text-sm leading-none whitespace-nowrap transition-colors select-none',
	CAL_FOCUS,
	'not-data-selected:hover:bg-muted/60',
	// Today without a fill, so it never reads as a second selection.
	'[&[data-today]:not([data-selected])]:font-semibold [&[data-today]:not([data-selected])]:text-brand',
	'data-selected:kleri-bg data-selected:font-semibold data-selected:text-kleri-ink',
	'[&[data-outside-month]:not([data-selected]):not([data-today])]:text-muted-foreground',
	'data-disabled:pointer-events-none data-disabled:opacity-30',
	'data-unavailable:text-muted-foreground data-unavailable:line-through'
].join(' ');
