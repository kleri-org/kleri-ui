<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils';
	import { cn } from '$lib/utils';
	import { mergeProps } from 'bits-ui';
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { getButtonGroupContext } from '../KleriButtonGroup/context.js';

	type ButtonProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement>;

	interface ExtendedButtonProps extends ButtonProps {
		tooltip?: string;
		size?: 'xs' | 'sm' | 'lg';
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
		triggerProps?: Record<string, unknown>;
	}

	let {
		ref = $bindable<HTMLButtonElement | null>(null),
		children,
		class: className,
		tooltip,
		size: sizeProp,
		variant: variantProp,
		triggerProps = {},
		...restProps
	}: ExtendedButtonProps = $props();

	const groupCtx = getButtonGroupContext();
	const size = $derived(sizeProp ?? groupCtx?.size ?? 'sm');
	const variant = $derived(variantProp ?? groupCtx?.variant ?? 'default');

	const BASE =
		'btn w-fit align-center rounded-kleri border-2 ring-0 font-normal hover:shadow-black/50 hover:ring-0 disabled:cursor-not-allowed disabled:bg-muted disabled:ring-0 disabled:shadow-none';

	const sizeClasses = {
		xs: 'text-xs px-2 h-8 rounded-md',
		sm: 'text-sm px-3 py-1',
		lg: 'text-base px-4 py-2'
	};

	const variantClasses = {
		default: 'bg-none text-white hover:bg-accent hover:text-black border-muted-foreground',
		outline: 'bg-transparent border-border text-foreground hover:bg-accent hover:text-black',
		ghost: 'bg-none border-transparent text-foreground hover:bg-accent hover:text-black',
		secondary:
			'bg-secondary text-secondary-foreground hover:bg-accent hover:text-black border-muted-foreground'
	};

	// `sm` first so the smaller sizes inherit its vertical padding; `size` then
	// overrides whatever it sets of its own.
	const buttonClass = $derived(
		cn(BASE, sizeClasses['sm'], sizeClasses[size], variantClasses[variant], className)
	);
</script>

{#snippet button(extraProps: Record<string, unknown>)}
	{@const btnProps = mergeProps(extraProps, triggerProps, restProps, { class: buttonClass })}
	<button bind:this={ref} data-slot="button" {...btnProps}>
		{@render children?.()}
	</button>
{/snippet}

{#if tooltip}
	<KleriTooltip side="bottom" sideOffset={5} delayDuration={0}>
		{#snippet trigger(tooltipTriggerProps)}
			{@render button(tooltipTriggerProps)}
		{/snippet}
		<p>{tooltip}</p>
	</KleriTooltip>
{:else}
	{@render button({})}
{/if}
