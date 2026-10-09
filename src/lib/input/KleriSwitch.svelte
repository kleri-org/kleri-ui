<script lang="ts">
	import { Switch } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import { FIELD_ROOT, describedBy, fieldErrorId } from './field.js';

	interface Props {
		/** Checked state. Bindable. */
		value?: boolean;
		/** Text shown above the switch. Omit to render the switch on its own. */
		label?: string;
		/** Validation errors. Shown under the label, announced, and shake the switch. */
		errors?: string[];
		disabled?: boolean;
		required?: boolean;
		name?: string;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new state whenever the switch is toggled. */
		onValueChange?: (value: boolean) => void;
		/**
		 * Accessible name for a switch rendered without a `label`. When `label`
		 * is set the rendered `<label for>` names the control instead.
		 */
		ariaLabel?: string;
		/** Extra description ids, merged with the switch's own error id. */
		'aria-describedby'?: string;
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
		'aria-describedby': ariaDescribedBy,
		id,
		class: className
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);
	let errorId = $derived(fieldErrorId(controlId));

	let hasErrors = $derived((errors?.length ?? 0) > 0);
	let isLabelled = $derived(Boolean(label) || hasErrors);
</script>

<!-- Standalone switches stay inline; a labelled switch becomes a full field. -->
<div class={cn(isLabelled ? FIELD_ROOT : 'inline-flex', className)}>
	<KleriFieldLabel {label} {errors} {errorId} for={controlId} />

	<Switch.Root
		id={controlId}
		{name}
		{required}
		{disabled}
		bind:checked={value}
		onCheckedChange={(checked) => onValueChange?.(checked)}
		aria-label={ariaLabel ?? (isLabelled ? undefined : 'Toggle switch')}
		aria-invalid={hasErrors || undefined}
		aria-describedby={describedBy(hasErrors && errorId, ariaDescribedBy)}
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
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* --primary is Lagoon on light (3.8:1 on Paper) and Sea Glass on dark, so the
	   on state clears 3:1 in both themes (WCAG 1.4.11). */
	:global(.kleri-switch[data-state='checked']) {
		background: var(--primary);
		border-color: var(--primary);
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
		/* Paper in both themes: the thumb has to read against Mist, Night's
		   muted track and both teals. The hairline keeps it off Mist. */
		background-color: oklch(1 0 0);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.3),
			0 0 0 1px color-mix(in oklab, var(--color-kleri-ink) 18%, transparent);
		transform: translateX(0.125rem);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	:global(.kleri-switch[data-state='checked'] .kleri-switch-thumb) {
		transform: translateX(1.3125rem);
	}
</style>
