<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { Upload } from '@lucide/svelte';

	type Props = {
		/**
		 * Called when an image file (.png, .jpg, .jpeg, .gif, .svg, .webp) is dropped
		 */
		onImageDrop?: (paths: string[]) => void;
		/**
		 * Called when a document file (.pdf, .doc, .docx, .txt, .csv, .md, etc.) is dropped
		 */
		onDocumentDrop?: (paths: string[]) => void;
		/**
		 * Called whenever any file type is dropped
		 */
		onDrop?: (paths: string[]) => void;
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
		mainText: string;
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

	const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

	function isImageFile(path: string): boolean {
		const lowerPath = path.toLowerCase();
		return imageExtensions.some((ext) => lowerPath.endsWith(ext));
	}

	function handleFiles(paths: string[]) {
		if (!paths || paths.length === 0) return;

		// Enforce the "accept" prop for dragged files
		if (accept === 'images') {
			paths = paths.filter(isImageFile);
			if (paths.length === 0) {
				isHovering = false;
				return;
			}
		}

		const imagePaths = paths.filter(isImageFile);
		const documentPaths = paths.filter((p) => !isImageFile(p));

		if (imagePaths.length > 0) {
			imagePreview = convertFileSrc(imagePaths[0]);
		} else {
			imagePreview = null;
		}

		// Trigger hooks
		if (imagePaths.length > 0 && onImageDrop) {
			onImageDrop(imagePaths);
		}
		if (documentPaths.length > 0 && onDocumentDrop) {
			onDocumentDrop(documentPaths);
		}
		if (onDrop) {
			onDrop(paths);
		}
	}

	async function handleClick() {
		try {
			const filters =
				accept === 'images'
					? [
							{
								name: 'Images',
								extensions: imageExtensions.map((e) => e.slice(1))
							}
						]
					: [];

			// Tauri command to open file selector dialogue
			const selected = await open({
				directory: false,
				multiple: true,
				filters
			});

			if (!selected) return;

			const paths = Array.isArray(selected) ? selected : [selected];
			handleFiles(paths);
		} catch (error) {
			console.error('Failed to open file dialog:', error);
		}
	}

	onMount(async () => {
		try {
			const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
				if (event.payload.type === 'over' || event.payload.type === 'enter') {
					isHovering = true;
				} else if (event.payload.type === 'drop') {
					isHovering = false;
					handleFiles(event.payload.paths);
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

<!-- Label and Errors -->
<div class="-mt-2 mb-[-0.5px] inline-flex flex-row items-center align-middle">
	{#if label}
		<p class="indent-2 text-sm font-medium select-none">
			{label}
		</p>
	{/if}
</div>
<div
	class="relative flex min-h-10 w-full cursor-pointer flex-col items-center justify-center rounded-kleri border-2 border-dashed border-border p-2 transition-all duration-300 ease-in-out {isHovering
		? 'scale-[1.02] kleri-border border-solid bg-foreground/5 dark:bg-foreground/10'
		: 'border-border/60 hover:border-border hover:bg-foreground/5'} {className}"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	aria-label="File Upload Dropzone"
	{...restProps}
>
	<div class="pointer-events-none flex flex-col items-center justify-center gap-2 text-center">
		{#if imagePreview}
			<img
				src={imagePreview}
				alt="File Preview"
				class="max-h-48 w-auto rounded-kleri object-contain shadow-sm"
			/>
		{:else}
			<!-- Icon -->
			<div
				class="flex items-center justify-center text-foreground transition-transform duration-300 {isHovering
					? 'scale-110 kleri-border'
					: ''}"
			>
				<Upload class="size-5" />
			</div>

			<!-- Text -->
			<div class="space-y-1">
				<h3 class="text-xs font-semibold tracking-tight text-foreground">
					{#if isHovering}
						Drop file(s) to upload
					{:else}
						{mainText}
					{/if}
				</h3>
				<p class="max-w-62.5 text-sm text-foreground/60">
					{subText}
				</p>
			</div>
		{/if}
	</div>
</div>
