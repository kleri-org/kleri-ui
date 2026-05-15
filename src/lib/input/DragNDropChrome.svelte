<script lang="ts">
	import type {
		HTMLAttributes,
		MouseEventHandler,
		KeyboardEventHandler,
		DragEventHandler
	} from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils.js';
	import { Upload } from '@lucide/svelte';

	type Props = {
		isHovering: boolean;
		imagePreview: string | null;
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
		isHovering,
		imagePreview,
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
	class="relative flex min-h-40 min-w-20 cursor-pointer flex-col items-center justify-center rounded-kleri border-2 border-dashed border-border p-2 transition-all duration-300 ease-in-out {isHovering
		? 'scale-105 border-solid border-primary bg-muted/50'
		: 'border-border/60 hover:border-border hover:bg-muted/80'} {className}"
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
					? 'scale-105 text-primary'
					: ''}"
			>
				<Upload class="size-5" />
			</div>

			<!-- Text -->
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">
					{#if isHovering}
						Drop file(s) to upload
					{:else}
						{mainText}
					{/if}
				</h3>
				<p class="max-w-62.5 text-xs text-foreground/60">
					{subText}
				</p>
			</div>
		{/if}
	</div>
</div>
