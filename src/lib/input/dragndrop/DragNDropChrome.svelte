<script lang="ts">
	import type {
		HTMLAttributes,
		MouseEventHandler,
		KeyboardEventHandler,
		DragEventHandler
	} from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { Upload, Check, FileText } from '@lucide/svelte';

	// -----------------------------------------------------------------------
	// Status discriminated union – the single source of truth for the
	// dropzone's visual state.
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
		status: DropzoneStatus;
		mainText: string;
		subText?: string;
		label?: string;
		class?: string;
		ariaLabel?: string;
		onclick?: MouseEventHandler<HTMLDivElement> | undefined | null;
		onkeydown?: KeyboardEventHandler<HTMLDivElement> | undefined | null;
		ondragover?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondragenter?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondragleave?: DragEventHandler<HTMLDivElement> | undefined | null;
		ondrop?: DragEventHandler<HTMLDivElement> | undefined | null;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		status = { state: 'idle' },
		mainText,
		subText,
		label,
		class: className = '',
		ariaLabel = 'File Upload Dropzone',
		onclick,
		onkeydown,
		ondragover,
		ondragenter,
		ondragleave,
		ondrop,
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
	let displaySubText = $derived(
		isError ? (status as Extract<DropzoneStatus, { state: 'error' }>).message : subText
	);
</script>

<!-- Label -->
<div class="-mt-2 mb-[-0.5px] inline-flex flex-row items-center align-middle">
	{#if label}
		<p class="indent-2 text-sm font-medium select-none">
			{label}
		</p>
	{/if}
</div>

<!-- Dropzone -->
<div
	class="relative flex min-h-40 min-w-20 cursor-pointer flex-col items-center justify-center rounded-kleri border-2 border-dashed p-2 transition-all duration-300 ease-in-out
	{isHovering
		? 'scale-105 border-solid border-primary bg-muted/50'
		: isError
			? 'shake border-destructive bg-destructive/5'
			: isAccepted
				? 'border-solid border-primary/50 bg-muted/30'
				: 'border-border/60 hover:border-border hover:bg-muted/80'}
	{className}"
	role="button"
	tabindex="0"
	aria-label={ariaLabel}
	{onclick}
	{onkeydown}
	{ondragover}
	{ondragenter}
	{ondragleave}
	{ondrop}
	{...restProps}
>
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
</div>

<!-- Shake animation -->
<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-4px);
		}
		20%,
		40%,
		60%,
		80% {
			transform: translateX(4px);
		}
	}

	.shake {
		animation: shake 0.4s ease-in-out;
	}
</style>
