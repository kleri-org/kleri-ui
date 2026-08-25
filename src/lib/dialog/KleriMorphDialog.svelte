<script lang="ts">
	import { Dialog, type WithoutChild } from 'bits-ui';
	import type { Component, Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { type ClassValue } from 'clsx';
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { X, Eraser } from '@lucide/svelte';

	type Props = Dialog.RootProps & {
		open?: boolean;
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
		onClose?: () => void;
	};

	let {
		open = $bindable(false),
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
	let contentElement = $state<HTMLElement | null>(null);
	let buttonRect: DOMRect | null = $state(null);
	let contentRect: DOMRect | null = $state(null);
	let isAnimating = $state(false);
	let isClosing = $state(false);
	let internalOpen = $state(false);

	function handleTriggerClick() {
		if (triggerElement) {
			buttonRect = triggerElement.getBoundingClientRect();
			isAnimating = true;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen && internalOpen) {
			isClosing = true;
			if (triggerElement) {
				buttonRect = triggerElement.getBoundingClientRect();
			}
			setTimeout(() => {
				open = false;
				internalOpen = false;
			}, 300);
		} else if (newOpen) {
			open = true;
			internalOpen = true;
			// The morph-open state forces nowrap + hidden overflow so the dialog
			// doesn't reflow mid-animation; it must not persist past the animation
			// or wrapped content stays clipped while the dialog is open. A timeout
			// (not animationend) because the keyframes reference CSS vars that are
			// unset on the first frame, which can prevent the event from firing.
			setTimeout(() => {
				if (internalOpen && !isClosing) isAnimating = false;
			}, 300);
		}
	}

	$effect(() => {
		if (open && contentElement && !contentRect) {
			requestAnimationFrame(() => {
				if (contentElement) {
					contentRect = contentElement.getBoundingClientRect();
				}
			});
		}

		if (!open && !internalOpen) {
			setTimeout(() => {
				isClosing = false;
				isAnimating = false;
				buttonRect = null;
				contentRect = null;
			}, 50);

			if (onClose) {
				onClose();
			}
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange} {...restProps}>
	{#if trigger}
		<Dialog.Trigger bind:ref={triggerElement} onclick={handleTriggerClick}>
			{@render trigger()}
		</Dialog.Trigger>
	{:else}
		<Dialog.Trigger
			bind:ref={triggerElement}
			onclick={handleTriggerClick}
			class={cn(
				'w-full rounded-kleri border-2 border-black bg-primary p-2 px-4 text-base font-normal text-background ring-0 transition-opacity duration-200 hover:text-black hover:ring-0 hover:shadow-black/50 hover:kleri-bg disabled:cursor-not-allowed disabled:border-none disabled:bg-primary/50 disabled:text-black disabled:shadow-none disabled:ring-0',
				(open || isClosing) && 'opacity-0',
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
			class="data-closed:fade-out-0 data-open:fade-in-0 data-closed:animate-out data-open:animate-in fixed inset-0 z-50 bg-black/60 data-closed:duration-200 data-open:duration-300"
		/>
		<Dialog.Content
			bind:ref={contentElement}
			preventScroll={false}
			{...contentProps}
			class={cn(
				'fixed z-50 rounded-kleri border border-border bg-background shadow-xl shadow-black/40 outline-none',
				isAnimating && buttonRect && contentRect && internalOpen ? 'morph-open' : '',
				isClosing && buttonRect && contentRect ? 'morph-close' : '',
				!isAnimating && !isClosing ? 'dialog-final' : '',
				className
			)}
			style={buttonRect && contentRect
				? `
					--start-left: ${buttonRect.left}px;
					--start-top: ${buttonRect.top}px;
					--start-width: ${buttonRect.width}px;
					--start-height: ${buttonRect.height}px;
					--end-width: ${contentRect.width}px;
					--end-height: ${contentRect.height}px;
				`
				: undefined}
		>
			<div class="dialog-inner">
				<Dialog.Title
					class="sticky top-0 z-10 flex w-full flex-row flex-nowrap items-center justify-between border-b border-border/50 bg-background/80 px-8 py-4 backdrop-blur-xl"
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
										class="cursor-pointer rounded-md p-2 hover:bg-yellow-100/20 hover:text-yellow-400"
									>
										<Eraser class="size-4" />
									</button>
								{/snippet}
								Reset Form
							</KleriTooltip>
						{/if}

						<Dialog.Close
							class="z-20 cursor-pointer focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
						>
							<div
								class="group flex h-full flex-col items-center justify-center rounded-md p-2 align-middle hover:bg-red-100/20"
							>
								<X class="size-5 text-foreground group-hover:text-red-400" />
							</div>
						</Dialog.Close>
					</div>
				</Dialog.Title>

				{#if description}
					<Dialog.Description class="px-8 pt-3 text-sm text-nowrap text-muted-foreground">
						{@render description()}
					</Dialog.Description>
				{/if}

				<div class="no-scrollbar max-h-[60vh] overflow-y-auto px-8 pt-4 pb-5">
					{@render children?.()}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.dialog-inner {
		width: 100%;
		height: auto;
		overflow: visible;
		will-change: opacity;
		position: relative;
	}

	:global(.dialog-final) {
		width: var(--end-width);
		/* Height stays content-driven: text wraps and dynamic content (tab
		   switches, form errors) change it after the open animation. The close
		   animation re-locks it from --end-height. */
		height: auto;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	:global(.morph-open) {
		animation: morphOpen 0.3s ease-out forwards;
		overflow: hidden;
		text-wrap: nowrap;
	}

	:global(.morph-close) {
		animation: morphClose 0.3s ease-in forwards;
		overflow: hidden;
		text-wrap: nowrap;
	}

	@keyframes morphOpen {
		0% {
			left: var(--start-left);
			top: var(--start-top);
			width: var(--start-width);
			height: var(--start-height);
			max-width: none;
			max-height: none;
			transform: translate(0, 0);
			opacity: 1;
			filter: blur(10px);
		}
		100% {
			left: 50%;
			top: 50%;
			width: var(--end-width);
			height: var(--end-height);
			max-width: var(--end-width);
			max-height: var(--end-height);
			transform: translate(-50%, -50%);
			opacity: 1;
			filter: blur(0);
		}
	}

	@keyframes morphClose {
		0% {
			left: 50%;
			top: 50%;
			width: var(--end-width);
			height: var(--end-height);
			max-width: var(--end-width);
			max-height: var(--end-height);
			transform: translate(-50%, -50%);
			opacity: 1;
		}
		100% {
			left: var(--start-left);
			top: var(--start-top);
			width: var(--start-width);
			height: var(--start-height);
			max-width: none;
			max-height: none;
			transform: translate(0, 0);
			opacity: 1;
		}
	}
</style>
