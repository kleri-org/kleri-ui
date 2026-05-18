<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import {
		type FileTypeName,
		isAllowedFile,
		getAcceptString,
		getDefaultSubText,
		getErrorSubText
	} from './dragndrop-utils.js';
	import DragNDropChrome from './DragNDropChrome.svelte';
	import { FileText, X } from '@lucide/svelte';

	// -----------------------------------------------------------------------
	// Status type (mirrors DragNDropChrome)
	// -----------------------------------------------------------------------

	type DropzoneStatus =
		| { state: 'idle' }
		| { state: 'hover' }
		| { state: 'accepted'; fileCount: number }
		| { state: 'error'; message: string };

	// -----------------------------------------------------------------------
	// Props
	// -----------------------------------------------------------------------

	type Props = {
		/**
		 * Allowed file types.  Pass an empty array or omit to accept any file.
		 *
		 * Built‑in values: `"image"`, `"pdf"`.  Custom types can be registered
		 * via `FILE_TYPE_REGISTRY` in `dragndrop-utils.ts`.
		 *
		 * @example
		 *   allowedTypes={['image']}
		 *   allowedTypes={['image', 'pdf']}
		 */
		allowedTypes?: FileTypeName[];

		/**
		 * Called with the accepted files after a successful drop or file
		 * selection.  Only fires when at least one file passes validation.
		 */
		onDrop?: (files: File[]) => void;

		/**
		 * Called with files that were rejected (wrong type) after a drop or
		 * file selection.  Fires for both partial and full rejections.
		 *
		 * When all files are rejected, `onDrop` does **not** fire.
		 */
		onRejected?: (rejected: Array<{ file: File; reason: string }>) => void;

		/**
		 * Optional class to append to the wrapper
		 */
		class?: string;

		/**
		 * When `false`, the dropzone accepts only a single file.
		 * Additional files are silently ignored.
		 * @default true
		 */
		multiple?: boolean;

		label?: string;

		/**
		 * Main heading text displayed when the dropzone is idle.
		 * @default "Drag and Drop Your file here"
		 */
		mainText?: string;

		/**
		 * Hint text shown below the main heading.
		 * When omitted, a description is auto‑generated from `allowedTypes`.
		 */
		subText?: string;

		/**
		 * Duration (in ms) the error state is shown before reverting to idle.
		 * @default 3000
		 */
		errorDuration?: number;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		allowedTypes = undefined,
		multiple = true,
		onDrop,
		onRejected,
		label,
		mainText = 'Drag and Drop Your file here',
		subText: consumerSubText,
		errorDuration = 3000,
		class: className = '',
		...restProps
	}: Props = $props();

	// -----------------------------------------------------------------------
	// State
	// -----------------------------------------------------------------------

	let status = $state<DropzoneStatus>({ state: 'idle' });
	let enterCounter = 0;
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;
	let isDestroyed = false;
	let acceptedFiles = $state<File[]>([]);

	/** Format a file size in bytes to a human-readable string. */
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}

	let fileInput: HTMLInputElement | undefined;

	// -----------------------------------------------------------------------
	// Derived
	// -----------------------------------------------------------------------

	/** Sub‑text: consumer override > auto‑generated > undefined */
	let resolvedSubText = $derived(consumerSubText ?? getDefaultSubText(allowedTypes));

	// -----------------------------------------------------------------------
	// File handling
	// -----------------------------------------------------------------------

	function classifyFiles(files: File[]): {
		accepted: File[];
		rejected: Array<{ file: File; reason: string }>;
	} {
		const accepted: File[] = [];
		const rejected: Array<{ file: File; reason: string }> = [];

		for (const file of files) {
			if (isAllowedFile(file, allowedTypes)) {
				accepted.push(file);
			} else {
				rejected.push({
					file,
					reason: getErrorSubText(allowedTypes ?? [])
				});
			}
		}

		return { accepted, rejected };
	}

	function handleFiles(files: File[]) {
		if (files.length === 0) return;

		clearErrorTimeout();

		const { accepted, rejected } = classifyFiles(files);

		// All rejected — show error
		if (accepted.length === 0) {
			if (rejected.length > 0 && onRejected) {
				onRejected(rejected);
			}
			const message =
				allowedTypes && allowedTypes.length > 0
					? getErrorSubText(allowedTypes)
					: 'File type not supported';

			status = { state: 'error', message };
			startErrorTimeout();
			return;
		}

		// Fire onRejected for any rejected files
		if (rejected.length > 0 && onRejected) {
			onRejected(rejected);
		}

		// Apply multiple/single logic
		if (multiple === false) {
			// Replace with first accepted file
			acceptedFiles = [accepted[0]];
		} else {
			// Append new files, skip duplicates by name
			const existingNames = new Set(acceptedFiles.map((f) => f.name));
			const newFiles = accepted.filter((f) => !existingNames.has(f.name));
			acceptedFiles = [...acceptedFiles, ...newFiles];
		}

		// Update visual state
		status = { state: 'accepted', fileCount: acceptedFiles.length };

		// Fire onDrop with the updated list
		if (onDrop) {
			onDrop(acceptedFiles);
		}
	}

	// -----------------------------------------------------------------------
	// Error timeout management
	// -----------------------------------------------------------------------

	function clearErrorTimeout() {
		if (errorTimeout !== null) {
			clearTimeout(errorTimeout);
			errorTimeout = null;
		}
	}

	function startErrorTimeout() {
		clearErrorTimeout();
		errorTimeout = setTimeout(() => {
			if (!isDestroyed) {
				status = { state: 'idle' };
			}
		}, errorDuration);
	}

	// -----------------------------------------------------------------------
	// Public API (exposed via bind:this)
	// -----------------------------------------------------------------------

	/**
	 * Resets the dropzone to its idle state, clears the file list,
	 * and cancels any pending error timeout.
	 */
	export function reset() {
		clearErrorTimeout();
		status = { state: 'idle' };
		acceptedFiles = [];
	}

	/**
	 * Removes a file from the accepted list by index.
	 */
	function removeFile(index: number) {
		acceptedFiles = acceptedFiles.filter((_, i) => i !== index);

		if (acceptedFiles.length === 0) {
			status = { state: 'idle' };
		} else {
			status = { state: 'accepted', fileCount: acceptedFiles.length };
		}

		if (onDrop) {
			onDrop(acceptedFiles);
		}
	}

	// -----------------------------------------------------------------------
	// Event handlers
	// -----------------------------------------------------------------------

	function handleClick() {
		fileInput?.click();
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		handleFiles(files);
		// Reset so the same files can be re‑selected
		input.value = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleClick();
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDragEnter() {
		enterCounter++;
		if (enterCounter === 1) {
			status = { state: 'hover' };
		}
	}

	function handleDragLeave() {
		enterCounter--;
		if (enterCounter <= 0) {
			enterCounter = 0;
			// Revert to previous non‑hover state, but don't clear an error
			if (status.state !== 'error') {
				status = { state: 'idle' };
			}
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		enterCounter = 0;

		const files = Array.from(e.dataTransfer?.files ?? []);
		handleFiles(files);
	}

	// -----------------------------------------------------------------------
	// Cleanup
	// -----------------------------------------------------------------------

	onDestroy(() => {
		isDestroyed = true;
		clearErrorTimeout();
	});
</script>

<!-- Hidden file input for click‑to‑browse -->
<input
	type="file"
	multiple
	accept={getAcceptString(allowedTypes)}
	class="hidden"
	bind:this={fileInput}
	onchange={handleInputChange}
/>

<DragNDropChrome
	{status}
	{mainText}
	subText={resolvedSubText}
	{label}
	class={className}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	ondragover={handleDragOver}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	{...restProps}
/>

{#if acceptedFiles.length > 0}
	<div class="mt-3 w-full space-y-1.5">
		{#each acceptedFiles as file, i (file.name)}
			<div class="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
				<FileText class="size-4 shrink-0 text-muted-foreground/60" />
				<span class="flex-1 truncate text-sm text-foreground">
					{file.name}
				</span>
				<span class="shrink-0 text-xs text-muted-foreground/60">
					{formatBytes(file.size)}
				</span>
				<button
					type="button"
					class="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-destructive"
					onclick={() => removeFile(i)}
				>
					<X class="size-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}
