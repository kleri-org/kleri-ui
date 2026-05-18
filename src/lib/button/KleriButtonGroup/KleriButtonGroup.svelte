<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { setButtonGroupContext } from './context.js';
	import KleriUtilityButton from '../KleriUtilityButton/KleriUtilityButton.svelte';
	import type { ButtonGroupItem } from './types.js';

	interface ButtonGroupProps extends WithElementRef<HTMLAttributes<HTMLDivElement>> {
		orientation?: 'horizontal' | 'vertical';
		size?: 'sm' | 'lg';
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
		items: ButtonGroupItem[];
	}

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'horizontal',
		size,
		variant,
		items,
		...restProps
	}: ButtonGroupProps = $props();

	const ctx = $state<{ size?: typeof size; variant?: typeof variant }>({});
	$effect(() => {
		ctx.size = size;
		ctx.variant = variant;
	});
	setButtonGroupContext(ctx);
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="button-group"
	data-orientation={orientation}
	class={cn(
		'flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10',
		orientation === 'vertical' && 'flex-col',
		className
	)}
	{...restProps}
>
	{#each items as item, i (i)}
		{#if item.type === 'button'}
			<KleriUtilityButton
				tooltip={item.tooltip}
				disabled={item.disabled}
				class={cn('flex flex-row items-center justify-center', item.class)}
				onclick={item.onclick}
				triggerProps={item.triggerProps}
			>
				{#if item.icon}
					<item.icon strokeWidth="2.2" class={cn('h-4 w-4', item.label ? 'mr-2' : '')} />
				{/if}
				{item.label}
			</KleriUtilityButton>
		{:else if item.type === 'separator'}
			<div
				data-slot="button-group-separator"
				role="separator"
				aria-orientation={orientation}
				class={cn(
					'my-1.5 self-stretch border bg-border',
					orientation === 'vertical' ? 'my-3 h-px' : 'mx-3 w-px'
				)}
			></div>
		{:else if item.type === 'text'}
			<div data-slot="button-group-text" class="flex items-center px-3 py-2 text-sm">
				{item.content}
			</div>
		{/if}
	{/each}
</div>

<style>
	:global(
		[data-slot='button-group'][data-orientation='horizontal']
			> [data-slot='button']:has(+ [data-slot='button'])
	) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	:global(
		[data-slot='button-group'][data-orientation='horizontal']
			> [data-slot='button']
			+ [data-slot='button']
	) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left-width: 0;
	}
	:global(
		[data-slot='button-group'][data-orientation='vertical']
			> [data-slot='button']:has(+ [data-slot='button'])
	) {
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
	:global(
		[data-slot='button-group'][data-orientation='vertical']
			> [data-slot='button']
			+ [data-slot='button']
	) {
		border-top-right-radius: 0;
		border-top-left-radius: 0;
		border-top-width: 0;
	}
</style>
