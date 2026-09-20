export {
	cn,
	type WithElementRef,
	type WithoutChild,
	type WithoutChildren,
	type WithoutChildrenOrChild
} from './utils.js';

export { KLERI_COLOR_1, KLERI_COLOR_2, KLERI_COLOR_3 } from './constants.js';
export { default as PrimaryHeading } from './heading/PrimaryHeading.svelte';
export { default as SecondaryHeading } from './heading/SecondaryHeading.svelte';
export { default as SubHeading } from './heading/SubHeading.svelte';
export { default as KleriTooltip } from './tooltip/KleriTooltip.svelte';
export { default as MeteorAnimation } from './animation/MeteorAnimation.svelte';
export { default as AnimatedGridPattern } from './animation/AnimatedGridPattern.svelte';
export { default as SettingsOption } from './settings/SettingsOption.svelte';

export { default as KleriButton } from './button/KleriButton/KleriButton.svelte';
export { default as KleriUtilityButton } from './button/KleriUtilityButton/KleriUtilityButton.svelte';
export { default as KleriButtonGroup } from './button/KleriButtonGroup/KleriButtonGroup.svelte';
export type { ButtonGroupItem } from './button/KleriButtonGroup/types.js';

export { default as KleriSwitch } from './input/KleriSwitch.svelte';
export { default as KleriFieldLabel } from './input/KleriFieldLabel.svelte';
export {
	FIELD_CONTROL,
	FIELD_ICON_SIZE,
	FIELD_ICON_STROKE,
	FIELD_ROOT,
	fieldShell,
	type FieldIcon,
	type FieldShellOptions
} from './input/field.js';
export { default as KleriInput } from './input/KleriInput.svelte';
export { default as KleriCombobox } from './input/KleriCombobox.svelte';
export type { KleriComboboxItem } from './input/KleriCombobox.svelte';
export { default as KleriSelect } from './input/KleriSelect.svelte';
export type { KleriSelectItem } from './input/KleriSelect.svelte';
export { default as KleriTextarea } from './input/KleriTextarea.svelte';
export { default as KleriSlider } from './input/KleriSlider.svelte';
export { default as KleriDragNDrop } from './input/dragndrop/KleriDragNDrop.svelte';
export {
	FILE_TYPE_REGISTRY,
	getAcceptString,
	getDefaultSubText,
	getErrorSubText,
	isAllowedFile,
	type DropzoneStatus,
	type FileTypeEntry,
	type FileTypeName
} from './input/dragndrop/dragndrop-utils.js';

export { default as KleriMagicCard } from './magic/KleriMagicCard.svelte';
export { default as KleriMagicButton } from './magic/KleriMagicButton.svelte';
export { default as KleriAnimatedBeam } from './magic/KleriAnimatedBeam.svelte';
export type { AnimatedBeamProps } from './magic/animated-beam/types.js';

export { default as KleriToggleGroup } from './toggle/KleriToggleGroup.svelte';
export { default as KleriToggleGroupItem } from './toggle/KleriToggleGroupItem.svelte';
export type { ToggleVariant, ToggleSize, ToggleVariants } from './toggle/toggle-variants.js';
export { kleriToggleActiveClass } from './toggle/toggle-variants.js';

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
	KleriMorphDialog,
	MorphDialog
} from './dialog/index.js';

export {
	Popover,
	PopoverClose,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverPortal,
	PopoverTitle,
	PopoverTrigger
} from './menus/popover/index.js';

/**
 * `KleriWindowsControls` is **not** re-exported here on purpose: it imports
 * `@tauri-apps/api`, an optional peer dependency, so pulling it into the root
 * entry broke the build of every plain-web consumer. Import it from the Tauri
 * entry point instead:
 *
 *     import { KleriWindowsControls } from '@kleri/ui/tauri';
 */
