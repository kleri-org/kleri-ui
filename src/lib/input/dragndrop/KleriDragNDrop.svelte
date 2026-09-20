<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		isAllowedFile,
		getAcceptString,
		getDefaultSubText,
		getErrorSubText,
		createErrorTimer,
		formatBytes,
		restingStatus,
		type DropzoneStatus
	} from './dragndrop-utils.js';
	import type { DropzoneBaseProps, DropzoneEntry } from './dragndrop-props.js';
	import DragNDropChrome from './DragNDropChrome.svelte';
	import DragNDropFileList from './DragNDropFileList.svelte';
	import { syncDropzoneStatus } from './use-dropzone-status.svelte.js';

	type Props = DropzoneBaseProps & {
		/**
		 * Called with the accepted files after a successful drop or file
		 * selection. Only fires when at least one file passes validation.
		 */
		onDrop?: (files: File[]) => void;

		/**
		 * Called with files that were rejected (wrong type) after a drop or file
		 * selection. Fires for both partial and full rejections.
		 *
		 * When all files are rejected, `onDrop` does **not** fire.
		 */
		onRejected?: (rejected: Array<{ file: File; reason: string }>) => void;

		/** Bindable list of accepted files. */
		files?: File[];
	};

	let {
		allowedTypes = undefined,
		multiple = true,
		onDrop,
		onRejected,
		label,
		errors,
		disabled = false,
		mainText = 'Drag and Drop Your file here',
		subText: consumerSubText,
		errorDuration = 3000,
		class: className,
		files = $bindable([]),
		...restProps
	}: Props = $props();

	// -----------------------------------------------------------------------
	// State
	// -----------------------------------------------------------------------

	let status = $state<DropzoneStatus>({ state: 'idle' });
	let enterCounter = 0;
	let fileInput: HTMLInputElement | undefined;

	// Back to the resting state, not blindly to idle: a rejected drop on top of
	// an existing selection should return to showing that selection.
	const errorTimer = createErrorTimer(() => {
		status = restingStatus(files.length);
	});

	/** Sub-text: consumer override > auto-generated > undefined */
	let resolvedSubText = $derived(consumerSubText ?? getDefaultSubText(allowedTypes));

	let entries = $derived<DropzoneEntry[]>(
		files.map((file) => ({ key: file.name, name: file.name, meta: formatBytes(file.size) }))
	);

	syncDropzoneStatus(
		() => files.length,
		() => status,
		(next) => (status = next)
	);

	// -----------------------------------------------------------------------
	// Image preview (object URL lifecycle)
	// -----------------------------------------------------------------------

	/** Returns the most recently added image file, or null when none. */
	function getLatestImage(list: File[]): File | null {
		for (let i = list.length - 1; i >= 0; i--) {
			if (isAllowedFile(list[i], ['image'])) return list[i];
		}
		return null;
	}

	let previewUrl = $state<string | null>(null);
	// Plain (non-reactive) trackers so the effect depends only on `files`.
	let currentPreviewFile: File | null = null;
	let currentPreviewObjectUrl: string | null = null;

	function revokePreview() {
		if (currentPreviewObjectUrl) {
			URL.revokeObjectURL(currentPreviewObjectUrl);
			currentPreviewObjectUrl = null;
		}
	}

	$effect(() => {
		const imageFile = getLatestImage(files);
		if (imageFile === currentPreviewFile) return;

		revokePreview();

		currentPreviewFile = imageFile;
		if (imageFile) {
			currentPreviewObjectUrl = URL.createObjectURL(imageFile);
			previewUrl = currentPreviewObjectUrl;
		} else {
			previewUrl = null;
		}
	});

	// -----------------------------------------------------------------------
	// File handling
	// -----------------------------------------------------------------------

	function classifyFiles(incoming: File[]): {
		accepted: File[];
		rejected: Array<{ file: File; reason: string }>;
	} {
		const accepted: File[] = [];
		const rejected: Array<{ file: File; reason: string }> = [];

		for (const file of incoming) {
			if (isAllowedFile(file, allowedTypes)) {
				accepted.push(file);
			} else {
				rejected.push({ file, reason: getErrorSubText(allowedTypes ?? []) });
			}
		}

		return { accepted, rejected };
	}

	function handleFiles(incoming: File[]) {
		if (incoming.length === 0) return;

		errorTimer.clear();

		const { accepted, rejected } = classifyFiles(incoming);

		if (rejected.length > 0) onRejected?.(rejected);

		// All rejected — show the error and keep the current selection.
		if (accepted.length === 0) {
			status = {
				state: 'error',
				message:
					allowedTypes && allowedTypes.length > 0
						? getErrorSubText(allowedTypes)
						: 'File type not supported'
			};
			errorTimer.start(errorDuration);
			return;
		}

		if (!multiple) {
			files = [accepted[0]];
		} else {
			// Append new files, skipping duplicates by name.
			const existingNames = new Set(files.map((f) => f.name));
			files = [...files, ...accepted.filter((f) => !existingNames.has(f.name))];
		}

		status = restingStatus(files.length);
		onDrop?.(files);
	}

	// -----------------------------------------------------------------------
	// Public API (exposed via bind:this)
	// -----------------------------------------------------------------------

	/**
	 * Resets the dropzone to its idle state, clears the file list, and cancels
	 * any pending error timeout. Does not fire `onDrop`.
	 */
	export function reset() {
		errorTimer.clear();
		status = { state: 'idle' };
		files = [];
	}

	function setFiles(next: File[]) {
		files = next;
		status = restingStatus(files.length);
		onDrop?.(files);
	}

	function removeAllFiles() {
		errorTimer.clear();
		setFiles([]);
	}

	function removeFile(index: number) {
		setFiles(files.filter((_, i) => i !== index));
	}

	// -----------------------------------------------------------------------
	// Event handlers
	// -----------------------------------------------------------------------

	function handleClick() {
		if (disabled) return;
		fileInput?.click();
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		handleFiles(Array.from(input.files ?? []));
		// Reset so the same files can be re-selected.
		input.value = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	function handleDragOver(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDragEnter() {
		if (disabled) return;
		enterCounter++;
		if (enterCounter === 1) {
			status = { state: 'hover' };
		}
	}

	function handleDragLeave() {
		if (disabled) return;
		enterCounter--;
		if (enterCounter <= 0) {
			enterCounter = 0;
			// Revert to the resting state, but don't clear an error.
			if (status.state !== 'error') {
				status = restingStatus(files.length);
			}
		}
	}

	function handleDrop(e: DragEvent) {
		if (disabled) return;
		e.preventDefault();
		enterCounter = 0;

		handleFiles(Array.from(e.dataTransfer?.files ?? []));
	}

	onDestroy(() => {
		errorTimer.clear();
		revokePreview();
	});
</script>

<!-- Hidden file input for click-to-browse -->
<input
	type="file"
	{multiple}
	{disabled}
	accept={getAcceptString(allowedTypes)}
	tabindex="-1"
	class="hidden"
	bind:this={fileInput}
	onchange={handleInputChange}
/>

<DragNDropChrome
	{status}
	{mainText}
	subText={resolvedSubText}
	{label}
	{errors}
	{disabled}
	class={className}
	imagePreview={previewUrl}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	ondragover={handleDragOver}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	{...restProps}
>
	{#snippet corner()}
		<DragNDropFileList {entries} onRemove={removeFile} onRemoveAll={removeAllFiles} />
	{/snippet}
</DragNDropChrome>
