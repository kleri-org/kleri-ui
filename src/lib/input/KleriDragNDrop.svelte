<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { isImageFile } from '$lib/input/dragndrop-utils.js';
	import DragNDropChrome from '$lib/input/DragNDropChrome.svelte';

	type Props = {
		/**
		 * Called when an image file (.png, .jpg, .jpeg, .gif, .svg, .webp) is dropped
		 */
		onImageDrop?: (file: File) => void;
		/**
		 * Called when a document file (.pdf, .doc, .docx, .txt, .csv, .md, etc.) is dropped
		 */
		onDocumentDrop?: (file: File) => void;
		/**
		 * Called whenever any file type is dropped
		 */
		onDrop?: (file: File) => void;
		/**
		 * Filter for the file picker dialog opened on click.
		 * - `"images"` — only image files
		 * - `"any"` — all file types (default)
		 */
		accept?: 'images' | 'any';
		/**
		 * Optional class to append to the wrapper
		 */
		class?: string;
		label?: string;
		mainText?: string;
		subText?: string;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		onImageDrop,
		onDocumentDrop,
		onDrop,
		label,
		mainText = 'Drag and Drop Your file here',
		subText,
		accept = 'any',
		class: className = '',
		...restProps
	}: Props = $props();

	let isHovering = $state(false);
	let imagePreview = $state<string | null>(null);
	let enterCounter = 0;

	let fileInput: HTMLInputElement | undefined;
	let currentObjectUrl: string | null = null;

	function handleFile(file: File | null) {
		if (!file) return;

		// Enforce the "accept" prop
		if (accept === 'images' && !isImageFile(file.name)) {
			isHovering = false;
			return;
		}

		const isImage = isImageFile(file.name);

		// Manage object URL lifecycle
		if (currentObjectUrl) {
			URL.revokeObjectURL(currentObjectUrl);
			currentObjectUrl = null;
		}

		if (isImage) {
			currentObjectUrl = URL.createObjectURL(file);
			imagePreview = currentObjectUrl;
		} else {
			imagePreview = null;
		}

		// Trigger hooks
		if (isImage && onImageDrop) {
			onImageDrop(file);
		}
		if (!isImage && onDocumentDrop) {
			onDocumentDrop(file);
		}
		if (onDrop) {
			onDrop(file);
		}
	}

	function handleClick() {
		fileInput?.click();
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		handleFile(file);
		// Reset so the same file can be re-selected
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
			isHovering = true;
		}
	}

	function handleDragLeave() {
		enterCounter--;
		if (enterCounter <= 0) {
			enterCounter = 0;
			isHovering = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		enterCounter = 0;
		isHovering = false;

		const file = e.dataTransfer?.files?.[0] ?? null;
		handleFile(file);
	}

	onDestroy(() => {
		if (currentObjectUrl) {
			URL.revokeObjectURL(currentObjectUrl);
			currentObjectUrl = null;
		}
	});
</script>

<!-- Hidden file input for click-to-browse -->
<input
	type="file"
	accept={accept === 'images' ? 'image/*' : undefined}
	class="hidden"
	bind:this={fileInput}
	onchange={handleInputChange}
/>

<DragNDropChrome
	{isHovering}
	{imagePreview}
	{mainText}
	{subText}
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
