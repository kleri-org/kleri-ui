<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { isImageFile, IMAGE_EXTENSIONS } from '$lib/input/dragndrop-utils.js';
	import DragNDropChrome from '$lib/input/DragNDropChrome.svelte';

	type Props = {
		/**
		 * Called when an image file (.png, .jpg, .jpeg, .gif, .svg, .webp) is dropped
		 */
		onImageDrop?: (path: string) => void;
		/**
		 * Called when a document file (.pdf, .doc, .docx, .txt, .csv, .md, etc.) is dropped
		 */
		onDocumentDrop?: (path: string) => void;
		/**
		 * Called whenever any file type is dropped
		 */
		onDrop?: (path: string) => void;
		/**
		 * Filter for the file picker dialog opened on click.
		 * - `"images"` — only image files (.png, .jpg, .jpeg, .gif, .svg, .webp)
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

	let unlistenFn: (() => void) | undefined;
	let isDestroyed = false;

	function handleFile(path: string | null) {
		if (!path) return;

		// Enforce the "accept" prop for dragged files
		if (accept === 'images' && !isImageFile(path)) {
			isHovering = false;
			return;
		}

		const isImage = isImageFile(path);

		if (isImage) {
			imagePreview = convertFileSrc(path);
		} else {
			imagePreview = null;
		}

		// Trigger hooks
		if (isImage && onImageDrop) {
			onImageDrop(path);
		}
		if (!isImage && onDocumentDrop) {
			onDocumentDrop(path);
		}
		if (onDrop) {
			onDrop(path);
		}
	}

	async function handleClick() {
		try {
			const filters =
				accept === 'images'
					? [
							{
								name: 'Images',
								extensions: IMAGE_EXTENSIONS.map((e) => e.slice(1))
							}
						]
					: [];

			const selected = await open({
				directory: false,
				multiple: false,
				filters
			});

			if (!selected) return;

			// With multiple: false, open() returns a single string or null
			handleFile(selected as string | null);
		} catch (error) {
			console.error('Failed to open file dialog:', error);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleClick();
		}
	}

	onMount(async () => {
		try {
			const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
				if (event.payload.type === 'over' || event.payload.type === 'enter') {
					isHovering = true;
				} else if (event.payload.type === 'drop') {
					isHovering = false;
					// Take only the first file
					const paths = event.payload.paths;
					if (paths && paths.length > 0) {
						handleFile(paths[0]);
					}
				} else {
					// cancelled or leave
					isHovering = false;
				}
			});

			if (isDestroyed) {
				unlisten();
			} else {
				unlistenFn = unlisten;
			}
		} catch (error) {
			console.error('Failed to listen to Tauri drag/drop events:', error);
		}
	});

	onDestroy(() => {
		isDestroyed = true;
		if (unlistenFn) {
			unlistenFn();
		}
	});
</script>

<DragNDropChrome
	{isHovering}
	{imagePreview}
	{mainText}
	{subText}
	{label}
	class={className}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	{...restProps}
/>
