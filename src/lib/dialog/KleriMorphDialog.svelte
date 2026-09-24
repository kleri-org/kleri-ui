<script lang="ts">
	import { Dialog, type WithoutChild } from 'bits-ui';
	import { untrack, type Component, type Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { type ClassValue } from 'clsx';
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { X, Eraser } from '@lucide/svelte';
	import { DialogMorph } from './morph.js';

	type Props = Dialog.RootProps & {
		trigger?: Snippet;
		buttonText?: string;
		ButtonIcon?: Component;
		title: Snippet;
		description?: Snippet;
		buttons?: Snippet;
		children?: Snippet;
		form?: string;
		class?: ClassValue;
		triggerClass?: ClassValue;
		contentProps?: WithoutChild<Dialog.ContentProps>;
		/** Fires once the dialog has fully closed (after the close animation). */
		onClose?: () => void;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		onOpenChangeComplete,
		trigger,
		buttonText,
		ButtonIcon,
		title,
		description,
		buttons,
		children,
		form,
		contentProps,
		onClose,
		triggerClass,
		class: className,
		...restProps
	}: Props = $props();

	let triggerElement = $state<HTMLElement | null>(null);
	let panelElement = $state<HTMLElement | null>(null);

	const morph = new DialogMorph();

	$effect(() => () => morph.destroy());

	// Effects flush before the browser paints, so the panel's first frame is
	// already drawn over the trigger. Closing needs no delay: bits-ui keeps the
	// panel (and overlay) mounted until their animations finish, which lets the
	// morph and the overlay fade run together.
	$effect(() => {
		const panel = panelElement;
		if (!panel) return;
		const isOpen = open;
		untrack(() => {
			const targets = { panel, trigger: triggerElement };
			if (isOpen) morph.enter(targets);
			else morph.exit(targets);
		});
	});

	function handleOpenChangeComplete(isOpen: boolean) {
		onOpenChangeComplete?.(isOpen);
		if (!isOpen) onClose?.();
	}
</script>

<Dialog.Root
	bind:open
	{onOpenChange}
	onOpenChangeComplete={handleOpenChangeComplete}
	{...restProps}
>
	{#if trigger}
		<Dialog.Trigger bind:ref={triggerElement} class={cn(triggerClass)}>
			{@render trigger()}
		</Dialog.Trigger>
	{:else}
		<Dialog.Trigger
			bind:ref={triggerElement}
			class={cn(
				'w-full rounded-kleri border-2 border-black bg-primary p-2 px-4 text-base font-normal text-background ring-0 hover:text-black hover:ring-0 hover:shadow-black/50 hover:kleri-bg disabled:cursor-not-allowed disabled:border-none disabled:bg-primary/50 disabled:text-black disabled:shadow-none disabled:ring-0',
				triggerClass
			)}
		>
			{#if ButtonIcon || buttonText}
				<div class="grid w-full grid-cols-6 items-center gap-x-3">
					{#if ButtonIcon}
						<ButtonIcon class="col-span-1 size-5 justify-self-start text-left" />
					{:else}
						<div class="col-span-1"></div>
					{/if}
					<div class="col-span-5 justify-self-center">{buttonText}</div>
				</div>
			{/if}
		</Dialog.Trigger>
	{/if}

	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/60 data-closed:animate-out data-closed:duration-200 data-closed:ease-in data-closed:fade-out-0 data-open:animate-in data-open:duration-300 data-open:ease-out data-open:fade-in-0 motion-reduce:duration-150"
		/>
		<Dialog.Content
			bind:ref={panelElement}
			preventScroll={false}
			{...contentProps}
			class={cn(
				'kleri-morph-panel fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-fit max-w-[min(42rem,calc(100vw-2rem))] flex-col rounded-kleri border border-border bg-background shadow-2xl shadow-black/50 outline-none',
				className
			)}
		>
			<div class="flex min-h-0 w-full flex-1 flex-col" data-kleri-morph-content>
				<Dialog.Title
					class="flex w-full shrink-0 flex-row flex-nowrap items-center justify-between border-b border-border/50 px-8 py-4"
				>
					<div class="w-full text-nowrap select-none">
						{@render title()}
					</div>
					<div class="flex w-full flex-row flex-nowrap justify-end gap-x-3">
						{#if buttons}
							{@render buttons()}
						{/if}

						{#if form}
							<KleriTooltip side="bottom">
								{#snippet trigger()}
									<button
										type="reset"
										{form}
										class="cursor-pointer rounded-md p-2 transition-colors duration-150 hover:bg-yellow-100/20 hover:text-yellow-400"
									>
										<Eraser class="size-4" />
									</button>
								{/snippet}
								Reset Form
							</KleriTooltip>
						{/if}

						<Dialog.Close
							class="z-20 cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
						>
							<div
								class="group flex h-full flex-col items-center justify-center rounded-md p-2 align-middle transition-colors duration-150 hover:bg-red-100/20"
							>
								<X
									class="size-5 text-foreground transition-colors duration-150 group-hover:text-red-400"
								/>
							</div>
						</Dialog.Close>
					</div>
				</Dialog.Title>

				{#if description}
					<Dialog.Description class="shrink-0 px-8 pt-3 text-sm text-muted-foreground">
						{@render description()}
					</Dialog.Description>
				{/if}

				<div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-8 pt-4 pb-5">
					{@render children?.()}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Transition-only styles, toggled by DialogMorph via data-kleri-morph. */
	:global(.kleri-morph-panel[data-kleri-morph]) {
		will-change: transform, opacity;
	}

	:global(.kleri-morph-panel[data-kleri-morph^='morph']) {
		/* The panel is scaled; its content is counter-scaled from the same corner
		   and clipped to the (rounded) morphing box. */
		overflow: hidden;
		/* clip, not hidden: a hidden box is a scroll container, and focusing the
		   close button on open would scroll the counter-scaled content sideways. */
		overflow: clip;
		transform-origin: 0 0;
	}

	:global(.kleri-morph-panel[data-kleri-morph^='morph'] > [data-kleri-morph-content]) {
		transform-origin: 0 0;
		will-change: transform, opacity;
	}

	/* A closing panel is on its way out: let clicks reach the page beneath. */
	:global(.kleri-morph-panel[data-kleri-morph$='-out']) {
		/* !important: bits-ui sets pointer-events inline. */
		pointer-events: none !important;
	}
</style>
