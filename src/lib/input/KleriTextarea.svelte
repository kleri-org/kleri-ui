<script lang="ts">
	import type { Component } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import type { ClassValue } from 'clsx';
	import type { WithElementRef } from '$lib/utils';

	import { cn } from '$lib/utils';

	type Props = {
		value?: string | null;
		label?: string;
		errors?: string[];
		InputIcon?: Component;
		placeholder?: string;
		required?: boolean;
		withBorder?: boolean;
		rows?: number;
		/** Controls the textarea resize behavior. Mirrors the CSS `resize` property. */
		resize?: 'none' | 'y' | 'x' | 'both';
		shake?: boolean;
		class?: ClassValue;
	} & WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement>;

	let {
		value = $bindable<string | null>(''),
		label,
		errors = $bindable(),
		InputIcon,
		class: className,
		withBorder = true,
		placeholder = '',
		required,
		rows = 4,
		resize = 'none',
		shake = false,
		ref = $bindable<HTMLTextAreaElement | null>(null),
		...restProps
	}: Props = $props();

	let hasErrors = $derived((errors?.length ?? 0) > 0);

	let borderClasses = $derived(
		withBorder ? 'border-border border-2' : 'border-2 border-transparent'
	);

	let resizeClass = $derived(
		resize === 'y'
			? 'resize-y'
			: resize === 'x'
				? 'resize-x'
				: resize === 'both'
					? 'resize'
					: 'resize-none'
	);
</script>

<label class={cn('block w-full text-sm font-medium select-none', className)}>
	<!-- Label and Errors -->
	{#if label || hasErrors}
		<div class="inline-flex flex-row items-center align-middle">
			{#if label}
				<p class="indent-2">
					{label}
				</p>
			{/if}
			{#if hasErrors}
				{#each errors as error, i (i)}
					<p class="indent-2 font-spacemono text-xs text-red-400">
						({error})
					</p>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Main Textarea -->
	<div
		class={cn(
			'my-1 flex w-full flex-row items-start gap-2 overflow-hidden rounded-kleri py-3 pl-4 outline-black focus-within:kleri-border focus:ring-black focus:outline-black active:ring-black active:outline-black dark:focus-within:kleri-border-dark',
			borderClasses,
			hasErrors && 'border-red-400 focus-within:border-red-400 focus:border-red-400'
		)}
		class:shake-it={hasErrors || shake}
	>
		{#if InputIcon}
			<InputIcon size={22} strokeWidth={2.5} class="mt-1 shrink-0 text-foreground" />
		{/if}

		<textarea
			bind:this={ref}
			value={value ?? ''}
			oninput={(e) => (value = e.currentTarget.value)}
			{required}
			{rows}
			{placeholder}
			aria-invalid={hasErrors || undefined}
			class={cn(
				'w-full flex-1 resize-none border-0 bg-transparent px-1 text-foreground placeholder-muted-foreground outline-none focus:ring-0 focus:outline-none',
				resizeClass
			)}
			{...restProps}
		></textarea>
	</div>
</label>

<style>
	@keyframes shake-it {
		0% {
			transform: translateX(0);
		}

		10% {
			transform: translateX(-9px);
		}

		20% {
			transform: translateX(8px);
		}

		30% {
			transform: translateX(-7px);
		}

		40% {
			transform: translateX(6px);
		}

		50% {
			transform: translateX(-5px);
		}

		60% {
			transform: translateX(4px);
		}

		70% {
			transform: translateX(-3px);
		}

		80% {
			transform: translateX(2px);
		}

		90% {
			transform: translateX(-1px);
		}

		100% {
			transform: translateX(0);
		}
	}

	.shake-it {
		animation: shake-it 0.5s ease-in-out;
	}

	textarea {
		outline: none;
		scrollbar-width: thin;
		scrollbar-color: var(--color-kleri-2) transparent;
	}

	textarea::-webkit-scrollbar {
		width: 8px;
	}

	textarea::-webkit-scrollbar-track {
		background: transparent;
	}

	textarea::-webkit-scrollbar-thumb {
		background-color: var(--color-kleri-2);
		border-radius: 9999px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	textarea::-webkit-scrollbar-thumb:hover {
		background-color: color-mix(in srgb, var(--color-kleri-2) 80%, white);
	}

	textarea:focus {
		outline: none;
		box-shadow: none;
	}
</style>
