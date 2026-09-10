<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';

	/**
	 * The label row shared by every Kleri input component: the label itself, an
	 * optional hint (e.g. a slider's current value) and any validation errors.
	 * Renders nothing when there is nothing to show.
	 */
	interface Props {
		/** Text shown first in the row. */
		label?: string;
		/** Validation errors, rendered in destructive text after the label. */
		errors?: string[];
		/** Muted text rendered between the label and the errors. */
		hint?: string;
		/** `id` of the control this labels. When set, the label becomes a `<label for>`. */
		for?: string;
		/** `id` for the label element itself, for `aria-labelledby` associations. */
		id?: string;
		class?: ClassValue;
	}

	let { label, errors, hint, for: htmlFor, id, class: className }: Props = $props();

	let errorList = $derived(errors ?? []);
	let isVisible = $derived(Boolean(label) || Boolean(hint) || errorList.length > 0);
</script>

{#if isVisible}
	<div class={cn('inline-flex flex-row flex-wrap items-center align-middle', className)}>
		{#if label}
			{#if htmlFor}
				<label {id} for={htmlFor} class="indent-2">{label}</label>
			{:else}
				<span {id} class="indent-2">{label}</span>
			{/if}
		{/if}
		{#if hint}
			<span class="indent-2 font-spacemono text-xs text-muted-foreground">{hint}</span>
		{/if}
		{#each errorList as error, i (i)}
			<span class="indent-2 font-spacemono text-xs text-destructive">({error})</span>
		{/each}
	</div>
{/if}
