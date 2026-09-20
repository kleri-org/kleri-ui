import type { HTMLAttributes } from 'svelte/elements';
import type { ClassValue } from 'clsx';
import type { WithElementRef } from '$lib/utils.js';
import type { FileTypeName } from './dragndrop-utils.js';

/**
 * Everything the web (`File`-based) and Tauri (path-based) dropzones have in
 * common. Each component adds its own `onDrop` / `onRejected` signatures on
 * top, since those carry different payloads.
 */
export type DropzoneBaseProps = {
	/**
	 * Allowed file types. Pass an empty array or omit to accept any file.
	 *
	 * Built-in values: `"image"`, `"pdf"`. Custom types can be registered via
	 * `FILE_TYPE_REGISTRY` in `dragndrop-utils.ts`.
	 *
	 * @example
	 *   allowedTypes={['image']}
	 *   allowedTypes={['image', 'pdf']}
	 */
	allowedTypes?: FileTypeName[];

	/** Optional class appended to the dropzone. */
	class?: ClassValue;

	/**
	 * When `false`, the dropzone holds only a single file: a new selection
	 * replaces the previous one.
	 * @default true
	 */
	multiple?: boolean;

	/** Text shown above the dropzone. */
	label?: string;

	/** Validation errors. Shown next to the label. */
	errors?: string[];

	/**
	 * Blocks dropping and browsing, and dims the dropzone.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Main heading text displayed when the dropzone is idle.
	 * @default "Drag and Drop Your file here"
	 */
	mainText?: string;

	/**
	 * Hint text shown below the main heading.
	 * When omitted, a description is auto-generated from `allowedTypes`.
	 */
	subText?: string;

	/**
	 * Duration (in ms) the error state is shown before reverting to idle.
	 * @default 3000
	 */
	errorDuration?: number;
} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

/** One row of the dropzone's file-list popover. */
export interface DropzoneEntry {
	/** Stable key for the `{#each}` block. */
	key: string;
	/** File name shown in the row. */
	name: string;
	/** Optional trailing detail, e.g. a formatted file size. */
	meta?: string;
}
