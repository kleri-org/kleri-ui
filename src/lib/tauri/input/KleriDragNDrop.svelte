<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { open } from '@tauri-apps/plugin-dialog';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import {
		type FileTypeName,
		getDefaultSubText,
		getErrorSubText,
		FILE_TYPE_REGISTRY
	} from '$lib/input/dragndrop/dragndrop-utils.js';
	import DragNDropChrome from '$lib/input/dragndrop/DragNDropChrome.svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/menus/popover/index.js';
	import { KleriButtonGroup } from '$lib/button/KleriButtonGroup/index.js';
	import { FileText, Files, X } from '@lucide/svelte';

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
		 */
		allowedTypes?: FileTypeName[];

		/**
		 * Called with the accepted file paths after a successful drop or file
		 * selection.  Only fires when at least one path passes validation.
		 */
		onDrop?: (paths: string[]) => void;

		/**
		 * Called with paths that were rejected (wrong type) after a drop or
		 * file selection.  Fires for both partial and full rejections.
		 *
		 * When all files are rejected, `onDrop` does **not** fire.
		 */
		onRejected?: (rejected: Array<{ path: string; reason: string }>) => void;

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

		/**
		 * Bindable list of accepted file paths.
		 */
		files?: string[];
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
		files = $bindable([]),
		...restProps
	}: Props = $props();

	// -----------------------------------------------------------------------
	// State
	// -----------------------------------------------------------------------

	let status = $state<DropzoneStatus>({ state: 'idle' });
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;
	let isDestroyed = false;
	let popoverOpen = $state(false);

	/** Extract the file name from a full path. */
	function getFileName(path: string): string {
		return path.split('/').pop() ?? path;
	}

	let unlistenFn: (() => void) | undefined;

	// -----------------------------------------------------------------------
	// Derived
	// -----------------------------------------------------------------------

	let resolvedSubText = $derived(consumerSubText ?? getDefaultSubText(allowedTypes));

	// Sync status when files are modified externally
	$effect(() => {
		const count = files.length;
		if (count === 0) {
			if (status.state !== 'idle' && status.state !== 'error') {
				status = { state: 'idle' };
			}
		} else if (status.state !== 'accepted') {
			status = { state: 'accepted', fileCount: count };
		} else if ((status as Extract<DropzoneStatus, { state: 'accepted' }>).fileCount !== count) {
			status = { state: 'accepted', fileCount: count };
		}
	});

	// -----------------------------------------------------------------------
	// Path validation (extension‑only — no MIME available for paths)
	// -----------------------------------------------------------------------

	function isAllowedPath(path: string): boolean {
		if (!allowedTypes || allowedTypes.length === 0) return true;

		const lower = path.toLowerCase();
		for (const typeName of allowedTypes) {
			const entry = FILE_TYPE_REGISTRY[typeName];
			if (!entry) continue;
			if (entry.extensions.some((ext) => lower.endsWith(ext))) return true;
		}
		return false;
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
				rejected.push({
					path,
					reason: getErrorSubText(allowedTypes ?? [])
				});
			}
		}

		return { accepted, rejected };
	}

	function handlePaths(paths: string[]) {
		if (paths.length === 0) return;

		clearErrorTimeout();

		const { accepted, rejected } = classifyPaths(paths);

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

		// Fire onRejected for any rejected paths
		if (rejected.length > 0 && onRejected) {
			onRejected(rejected);
		}

		// Apply multiple/single logic
		if (multiple === false) {
			// Replace with first accepted path
			files = [accepted[0]];
		} else {
			// Append new paths, skip duplicates by name
			const existingNames = new Set(files.map((p) => getFileName(p)));
			const newPaths = accepted.filter((p) => !existingNames.has(getFileName(p)));
			files = [...files, ...newPaths];
		}

		// Update visual state
		status = { state: 'accepted', fileCount: files.length };

		// Fire onDrop with the updated list
		if (onDrop) {
			onDrop(files);
		}
	}

	// -----------------------------------------------------------------------
	// Error timeout
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
	// Public API
	// -----------------------------------------------------------------------

	/**
	 * Resets the dropzone to its idle state, clears the file list,
	 * and cancels any pending error timeout.
	 */
	export function reset() {
		clearErrorTimeout();
		status = { state: 'idle' };
		files = [];
	}

	/**
	 * Removes all paths from the accepted list.
	 */
	function removeAllPaths() {
		popoverOpen = false;
		clearErrorTimeout();
		files = [];
		status = { state: 'idle' };
		if (onDrop) {
			onDrop([]);
		}
	}

	/**
	 * Removes a path from the accepted list by index.
	 */
	function removePath(index: number) {
		files = files.filter((_, i) => i !== index);

		if (files.length === 0) {
			popoverOpen = false;
			status = { state: 'idle' };
		} else {
			status = { state: 'accepted', fileCount: files.length };
		}

		if (onDrop) {
			onDrop(files);
		}
	}

	// -----------------------------------------------------------------------
	// Click‑to‑browse
	// -----------------------------------------------------------------------

	export async function handleClick() {
		try {
			const filters =
				allowedTypes && allowedTypes.length > 0
					? [
							{
								name: 'Allowed files',
								extensions: allowedTypes.flatMap(
									(t) => FILE_TYPE_REGISTRY[t]?.extensions.map((e) => e.slice(1)) ?? []
								)
							}
						]
					: [];

			const selected = await open({
				directory: false,
				multiple: true,
				filters
			});

			if (!selected) return;

			// open() returns string[] | null when multiple: true
			const paths = Array.isArray(selected) ? selected : selected ? [selected] : [];
			handlePaths(paths);
		} catch (error) {
			console.error('Failed to open file dialog:', error);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleClick();
		}
	}

	// -----------------------------------------------------------------------
	// Tauri drag‑and‑drop events
	// -----------------------------------------------------------------------

	onMount(async () => {
		try {
			const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
				if (event.payload.type === 'over' || event.payload.type === 'enter') {
					status = { state: 'hover' };
				} else if (event.payload.type === 'drop') {
					const paths = event.payload.paths ?? [];
					handlePaths(paths);
				} else {
					// cancelled or leave
					if (status.state !== 'error') {
						status = { state: 'idle' };
					}
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
		clearErrorTimeout();
		if (unlistenFn) {
			unlistenFn();
		}
	});
</script>

<DragNDropChrome
	{status}
	{mainText}
	subText={resolvedSubText}
	{label}
	class={className}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	{...restProps}
>
	{#snippet corner()}
		{#if files.length > 0}
			<div transition:fade={{ duration: 150 }}>
				<Popover bind:open={popoverOpen}>
					<PopoverTrigger>
						{#snippet child({ props: popoverProps })}
							<KleriButtonGroup
								size="xs"
								onclick={(e) => e.stopPropagation()}
								items={[
									{
										type: 'button',
										label: '',
										icon: Files,
										tooltip: `${files.length} file${files.length !== 1 ? 's' : ''}`,
										triggerProps: popoverProps,
										class: 'rounded-r-none border-muted-foreground/50'
									},
									{
										type: 'button',
										label: '',
										icon: X,
										tooltip: 'Remove all files',
										onclick: removeAllPaths,
										class: 'rounded-l-none border-l-0 border-muted border-muted-foreground/50'
									}
								]}
							/>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-full max-w-80" align="start" sideOffset={4}>
						<div class="max-h-64 space-y-1.5 overflow-y-auto">
							{#each files as path, i (path)}
								<div
									class="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2"
								>
									<FileText class="size-4 shrink-0 text-muted-foreground/60" />
									<span class="flex-1 truncate text-sm text-foreground">
										{getFileName(path)}
									</span>
									<button
										type="button"
										class="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-destructive"
										onclick={() => removePath(i)}
									>
										<X class="size-3.5" />
									</button>
								</div>
							{/each}
						</div>
					</PopoverContent>
				</Popover>
			</div>
		{/if}
	{/snippet}
</DragNDropChrome>
