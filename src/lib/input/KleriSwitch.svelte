<script lang="ts">
	import { Switch } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import { FIELD_ROOT } from './field.js';

	interface Props {
		/** Checked state. Bindable. */
		value?: boolean;
		/** Text shown above the switch. Omit to render the switch on its own. */
		label?: string;
		/** Validation errors. Shown next to the label and shake the switch. */
		errors?: string[];
		disabled?: boolean;
		required?: boolean;
		name?: string;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new state whenever the switch is toggled. */
		onValueChange?: (value: boolean) => void;
		/** Accessible name. Falls back to `label`. */
		ariaLabel?: string;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
		class?: ClassValue;
	}

	let {
		value = $bindable(false),
		label,
		errors,
		disabled = false,
		required = false,
		name,
		shake = false,
		onValueChange,
		ariaLabel,
		id,
		class: className
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);

	let hasErrors = $derived((errors?.length ?? 0) > 0);
	let isLabelled = $derived(Boolean(label) || hasErrors);
</script>

<!-- Standalone switches stay inline; a labelled switch becomes a full field. -->
<div class={cn(isLabelled ? FIELD_ROOT : 'inline-flex', className)}>
	<KleriFieldLabel {label} {errors} for={controlId} />

	<Switch.Root
		id={controlId}
		{name}
		{required}
		{disabled}
		bind:checked={value}
		onCheckedChange={(checked) => onValueChange?.(checked)}
		aria-label={ariaLabel ?? (isLabelled ? undefined : 'Toggle switch')}
		aria-invalid={hasErrors || undefined}
		class={cn('kleri-switch', isLabelled && 'my-1', (hasErrors || shake) && 'kleri-shake')}
	>
		<Switch.Thumb class="kleri-switch-thumb" />
	</Switch.Root>
</div>

<style>
	/* Scoped by class rather than `[data-switch-root]` so the styles never leak
	   onto other bits-ui switches in the consuming app. */
	:global(.kleri-switch) {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 2.75rem;
		height: 1.5rem;
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

	:global(.kleri-switch:focus-visible) {
		outline: 2px solid var(--color-kleri-2);
		outline-offset: 2px;
	}

	:global(.kleri-switch[data-state='checked']) {
		background: var(--color-kleri-2);
	}

	:global(.kleri-switch[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(.kleri-switch-thumb) {
		display: block;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 9999px;
		background-color: white;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
		transform: translateX(0.125rem);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	:global(.kleri-switch[data-state='checked'] .kleri-switch-thumb) {
		transform: translateX(1.3125rem);
	}
</style>
