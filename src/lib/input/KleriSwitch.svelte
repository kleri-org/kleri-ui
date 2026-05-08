<script lang="ts">
	import { Switch } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	// Props
	interface Props {
		value?: boolean;
		onChecked?: (checked: boolean) => void;
		disabled?: boolean;
		class?: ClassValue;
		ariaLabel?: string;
	}

	let {
		value: checked = $bindable(false),
		onChecked,
		disabled = false,
		class: className,
		ariaLabel = 'Toggle switch'
	}: Props = $props();

	// Handler
	function handleChange(value: boolean) {
		onChecked?.(value);
	}
</script>

<Switch.Root
	class={cn('ml-3 scale-125', className)}
	bind:checked
	onCheckedChange={handleChange}
	{disabled}
	aria-label={ariaLabel}
>
	<Switch.Thumb />
</Switch.Root>

<style>
	:global([data-switch-root]) {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 2.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		background-color: var(--muted);
		border: 1.5px solid color-mix(in srgb, var(--muted-foreground) 40%, transparent);
		padding: 0;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			opacity 0.2s ease;
		flex-shrink: 0;
	}

	:global([data-switch-root][data-state='checked']) {
		background: var(--color-kleri-2);
	}

	:global([data-switch-root][data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global([data-switch-thumb]) {
		display: block;
		width: 0.9rem;
		height: 0.9rem;
		border-radius: 9999px;
		background-color: white;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
		transform: translateX(0.125rem);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	:global([data-switch-root][data-state='checked'] [data-switch-thumb]) {
		transform: translateX(1.125rem);
	}
</style>
