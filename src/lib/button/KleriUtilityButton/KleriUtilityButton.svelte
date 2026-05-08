<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '$lib/utils';
	import { cn } from '$lib/utils';
	import { mergeProps } from 'bits-ui';
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { getButtonGroupContext } from '../KleriButtonGroup/context.js';

	type ButtonProps = WithElementRef<HTMLButtonAttributes>;

	interface ExtendedButtonProps extends ButtonProps {
		tooltip?: string;
		size?: 'sm' | 'lg';
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
	}

	let {
		children,
		class: className,
		tooltip,
		size: sizeProp,
		variant: variantProp,
		...restProps
	}: ExtendedButtonProps = $props();

	const groupCtx = getButtonGroupContext();
	const size = $derived(sizeProp ?? groupCtx?.size ?? 'sm');
	const variant = $derived(variantProp ?? groupCtx?.variant ?? 'default');

	const sizeClasses = {
		sm: 'text-sm px-3 py-2',
		lg: 'text-base px-4 py-2'
	};

	const variantClasses = {
		default: 'bg-none text-white hover:bg-accent hover:text-black',
		outline: 'bg-transparent border-border text-foreground hover:bg-accent hover:text-black',
		ghost: 'bg-transparent border-transparent text-foreground hover:bg-accent hover:text-black',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-black'
	};
</script>

<KleriTooltip side="bottom" sideOffset={5}>
	{#snippet trigger(triggerProps)}
		{@const btnProps = mergeProps(triggerProps, restProps, {
			class: cn(
				'btn w-full align-center rounded-kleri border-2 ring-0 font-normal hover:shadow-black/50 hover:ring-0 disabled:cursor-not-allowed disabled:kleri-bg disabled:text-black disabled:ring-0 disabled:shadow-none disabled:border-none',
				sizeClasses['sm'],
				sizeClasses[size],
				variantClasses[variant],
				className
			)
		})}
		<button data-slot="button" {...btnProps}>
			{@render children?.()}
		</button>
	{/snippet}
	{#if tooltip}<p>{tooltip}</p>{/if}
</KleriTooltip>
