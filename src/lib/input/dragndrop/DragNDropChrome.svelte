<script lang="ts">
	import type {
		HTMLAttributes,
		MouseEventHandler,
		KeyboardEventHandler,
		DragEventHandler
	} from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { Upload, Check, FileText } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from '$lib/input/KleriFieldLabel.svelte';

	import type { DropzoneStatus } from './dragndrop-utils.js';

	// -----------------------------------------------------------------------
	// Props
	// -----------------------------------------------------------------------

	type Props = {
		status: DropzoneStatus;
		mainText: string;
		subText?: string;
		label?: string;
		/** Validation errors. Shown next to the label. */
		errors?: string[];
		/** Blocks interaction and dims the dropzone. */
		disabled?: boolean;
		class?: ClassValue;
		ariaLabel?: string;
		onclick?: MouseEventHandler<HTMLDivElement> | undefined | null;
		onkeydown?: KeyboardEventHandler<HTMLDivElement> | undefined | null;
		ondragover?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondragenter?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondragleave?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondrop?: DragEventHandler<HTMLDivElement> | undefined | null;
		/**
		 * Object/blob/asset URL of an image to preview inside the dropzone.
		 * When set (typically while files are accepted), the dropzone renders
		 * the image as a fill instead of the idle/hover icon + text block.
		 */
		imagePreview?: string | null;
		corner?: Snippet;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		status = { state: 'idle' },
		mainText,
		subText,
		label,
		errors,
		disabled = false,
		class: className,
		ariaLabel = 'File Upload Dropzone',
		onclick,
		onkeydown,
		ondragover,
		ondragenter,
		ondragleave,
		ondrop,
		imagePreview = null,
		corner,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	// -----------------------------------------------------------------------
	// Derived
	// -----------------------------------------------------------------------

	let isHovering = $derived(status.state === 'hover');
	let isError = $derived(status.state === 'error');
	let isAccepted = $derived(status.state === 'accepted');
	let acceptedCount = $derived(status.state === 'accepted' ? status.fileCount : 0);

	// Text displayed in the sub‑text slot.
	// Error always wins; otherwise consumer's subText (or nothing).
	let displaySubText = $derived(status.state === 'error' ? status.message : subText);
</script>

<!-- Label -->
<KleriFieldLabel {label} {errors} class="mb-1 text-sm font-medium select-none" />

<!-- Dropzone -->
<div
	bind:this={ref}
	class={cn(
		'relative flex min-h-40 min-w-20 cursor-pointer flex-col items-center justify-center rounded-kleri border-2 border-dashed p-2 transition-all duration-300 ease-in-out',
		isHovering
			? 'scale-105 border-solid border-primary bg-muted/50'
			: isError
				? 'kleri-shake border-destructive bg-destructive/5'
				: isAccepted
					? 'border-solid border-primary/50 bg-muted/30'
					: 'border-border/60 hover:border-border hover:bg-muted/80',
		disabled && 'pointer-events-none cursor-not-allowed opacity-60',
		className
	)}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-disabled={disabled || undefined}
	aria-label={ariaLabel}
	{onclick}
	{onkeydown}
	{ondragover}
	{ondragenter}
	{ondragleave}
	{ondrop}
	{...restProps}
>
	{#if imagePreview}
		<img
			src={imagePreview}
			alt=""
			draggable="false"
			class="pointer-events-none absolute inset-0 h-full w-full rounded-kleri object-cover"
		/>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-kleri bg-gradient-to-t from-black/60 to-transparent p-2"
		>
			<p class="text-xs font-medium text-white">
				{acceptedCount} file{acceptedCount !== 1 ? 's' : ''} selected
			</p>
		</div>
	{:else}
		<div class="pointer-events-none flex flex-col items-center justify-center gap-2 text-center">
			<!-- Icon -->
			<div
				class="flex items-center justify-center transition-transform duration-300
				{isHovering
					? 'scale-105 text-primary'
					: isError
						? 'text-destructive'
						: isAccepted
							? 'text-primary'
							: 'text-foreground'}"
			>
				{#if isAccepted}
					<Check class="size-5" />
				{:else if isError}
					<FileText class="size-5" />
				{:else}
					<Upload class="size-5" />
				{/if}
			</div>

			<!-- Text -->
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">
					{#if isHovering}
						Drop file(s) to upload
					{:else if isAccepted}
						{acceptedCount} file{acceptedCount !== 1 ? 's' : ''} selected
					{:else}
						{mainText}
					{/if}
				</h3>
				{#if displaySubText}
					<p
						class="max-w-62.5 text-xs {isError
							? 'font-medium text-destructive'
							: 'text-foreground/60'}"
					>
						{displaySubText}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	{#if corner}
		<div class="absolute top-2 right-2 z-10">
			{@render corner()}
		</div>
	{/if}
</div>
