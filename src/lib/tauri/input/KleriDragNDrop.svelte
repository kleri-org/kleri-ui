<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { open } from '@tauri-apps/plugin-dialog';
	import {
		getDefaultSubText,
		getErrorSubText,
		createErrorTimer,
		getFileName,
		restingStatus,
		FILE_TYPE_REGISTRY,
		IMAGE_EXTENSIONS,
		type DropzoneStatus
	} from '$lib/input/dragndrop/dragndrop-utils.js';
	import type { DropzoneBaseProps, DropzoneEntry } from '$lib/input/dragndrop/dragndrop-props.js';
	import DragNDropChrome from '$lib/input/dragndrop/DragNDropChrome.svelte';
	import DragNDropFileList from '$lib/input/dragndrop/DragNDropFileList.svelte';
	import { syncDropzoneStatus } from '$lib/input/dragndrop/use-dropzone-status.svelte.js';

	type Props = DropzoneBaseProps & {
		/**
		 * Called with the accepted file paths after a successful drop or file
		 * selection. Only fires when at least one path passes validation.
		 */
		onDrop?: (paths: string[]) => void;

		/**
		 * Called with paths that were rejected (wrong type) after a drop or file
		 * selection. Fires for both partial and full rejections.
		 *
		 * When all paths are rejected, `onDrop` does **not** fire.
		 */
		onRejected?: (rejected: Array<{ path: string; reason: string }>) => void;

		/** Bindable list of accepted file paths. */
		files?: string[];
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

	/** The dropzone element, used to hit-test window-level drag events. */
	let dropzoneEl = $state<HTMLElement | null>(null);

	// Back to the resting state, not blindly to idle: a rejected drop on top of
	// an existing selection should return to showing that selection.
	const errorTimer = createErrorTimer(() => {
		status = restingStatus(files.length);
	});

	let resolvedSubText = $derived(consumerSubText ?? getDefaultSubText(allowedTypes));

	let entries = $derived<DropzoneEntry[]>(
		files.map((path) => ({ key: path, name: getFileName(path) }))
	);

	syncDropzoneStatus(
		() => files.length,
		() => status,
		(next) => (status = next)
	);

	// Image preview URL (Tauri asset protocol) for the most recent image path.
	let imagePreview = $derived.by(() => {
		if (typeof window === 'undefined') return null;
		const imgPath =
			[...files]
				.reverse()
				.find((p) => IMAGE_EXTENSIONS.some((ext) => p.toLowerCase().endsWith(ext))) ?? null;
		return imgPath ? convertFileSrc(imgPath) : null;
	});

	// -----------------------------------------------------------------------
	// Path validation (extension-only — no MIME available for paths)
	// -----------------------------------------------------------------------

	function isAllowedPath(path: string): boolean {
		if (!allowedTypes || allowedTypes.length === 0) return true;

		const lower = path.toLowerCase();
		return allowedTypes.some((typeName) =>
			FILE_TYPE_REGISTRY[typeName]?.extensions.some((ext) => lower.endsWith(ext))
		);
	}

	function classifyPaths(paths: string[]): {
		accepted: string[];
		rejected: Array<{ path: string; reason: string }>;
	} {
		const accepted: string[] = [];
		const rejected: Array<{ path: string; reason: string }> = [];

		for (const path of paths) {
			if (isAllowedPath(path)) {
				accepted.push(path);
			} else {
				rejected.push({ path, reason: getErrorSubText(allowedTypes ?? []) });
			}
		}

		return { accepted, rejected };
	}

	function handlePaths(paths: string[]) {
		if (paths.length === 0) return;

		errorTimer.clear();

		const { accepted, rejected } = classifyPaths(paths);

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
			// Append new paths, skipping duplicates by name.
			const existingNames = new Set(files.map(getFileName));
			files = [...files, ...accepted.filter((p) => !existingNames.has(getFileName(p)))];
		}

		status = restingStatus(files.length);
		onDrop?.(files);
	}

	// -----------------------------------------------------------------------
	// Public API
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

	function setPaths(next: string[]) {
		files = next;
		status = restingStatus(files.length);
		onDrop?.(files);
	}

	function removeAllPaths() {
		errorTimer.clear();
		setPaths([]);
	}

	function removePath(index: number) {
		setPaths(files.filter((_, i) => i !== index));
	}

	// -----------------------------------------------------------------------
	// Click-to-browse
	// -----------------------------------------------------------------------

	export async function handleClick() {
		if (disabled) return;
		try {
			const extensions =
				allowedTypes?.flatMap(
					(t) => FILE_TYPE_REGISTRY[t]?.extensions.map((e) => e.slice(1)) ?? []
				) ?? [];

			const selected = await open({
				directory: false,
				multiple,
				filters: extensions.length > 0 ? [{ name: 'Allowed files', extensions }] : []
			});

			if (!selected) return;

			// open() returns string[] | null when multiple, string | null otherwise.
			handlePaths(Array.isArray(selected) ? selected : [selected]);
		} catch (error) {
			console.error('Failed to open file dialog:', error);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	// -----------------------------------------------------------------------
	// Tauri drag-and-drop events
	// -----------------------------------------------------------------------

	/**
	 * Whether a drag event landed on *this* dropzone.
	 *
	 * `onDragDropEvent` is a window-level listener, so every mounted dropzone
	 * hears every drop. Without this check a page with two dropzones (a colour
	 * and a mono logo, say) would fill both from a single file. The payload
	 * carries physical pixels relative to the window; the webview fills the
	 * window on every platform we build for, so dividing by the device pixel
	 * ratio lands in the same space as `getBoundingClientRect`.
	 */
	function isEventInside(position: { x: number; y: number }): boolean {
		if (!dropzoneEl) return false;

		const rect = dropzoneEl.getBoundingClientRect();
		// A hidden or unlaid-out element has a zero-area box and can never be
		// the drop target.
		if (rect.width === 0 || rect.height === 0) return false;

		const ratio = window.devicePixelRatio || 1;
		const x = position.x / ratio;
		const y = position.y / ratio;

		return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
	}

	/** Leaves the hover state without disturbing an error that is on screen. */
	function clearHover() {
		if (status.state === 'hover') {
			status = restingStatus(files.length);
		}
	}

	let unlistenFn: (() => void) | undefined;
	let isDestroyed = false;

	$effect(() => {
		let cancelled = false;

		getCurrentWebview()
			.onDragDropEvent((event) => {
				if (disabled) return;

				if (event.payload.type === 'over' || event.payload.type === 'enter') {
					if (isEventInside(event.payload.position)) {
						status = { state: 'hover' };
					} else {
						// The cursor moved off this zone onto a sibling.
						clearHover();
					}
				} else if (event.payload.type === 'drop') {
					if (!isEventInside(event.payload.position)) {
						clearHover();
						return;
					}
					handlePaths(event.payload.paths ?? []);
				} else {
					// cancelled or leave
					if (status.state !== 'error') {
						status = restingStatus(files.length);
					}
				}
			})
			.then((unlisten) => {
				if (cancelled || isDestroyed) {
					unlisten();
				} else {
					unlistenFn = unlisten;
				}
			})
			.catch((error) => {
				console.error('Failed to listen to Tauri drag/drop events:', error);
			});

		return () => {
			cancelled = true;
			unlistenFn?.();
			unlistenFn = undefined;
		};
	});

	onDestroy(() => {
		isDestroyed = true;
		errorTimer.clear();
	});
</script>

<DragNDropChrome
	{status}
	{mainText}
	subText={resolvedSubText}
	{label}
	{errors}
	{disabled}
	class={className}
	{imagePreview}
	bind:ref={dropzoneEl}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	{...restProps}
>
	{#snippet corner()}
		<DragNDropFileList
			{entries}
			size="xs"
			align="start"
			contentClass="w-full max-w-80"
			buttonClass="border-muted-foreground/50"
			onRemove={removePath}
			onRemoveAll={removeAllPaths}
		/>
	{/snippet}
</DragNDropChrome>
