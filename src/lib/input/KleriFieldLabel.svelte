<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';

	/**
	 * The label block shared by every Kleri input component: the label and an
	 * optional hint (e.g. a slider's current value) on one row, with any
	 * validation errors on their own lines underneath.
	 */
	interface Props {
		/** Text shown first in the row. */
		label?: string;
		/** Validation errors, each rendered on its own line in destructive text. */
		errors?: string[];
		/** Muted text rendered after the label. */
		hint?: string;
		/** `id` of the control this labels. When set, the label becomes a `<label for>`. */
		for?: string;
		/** `id` for the label element itself, for `aria-labelledby` associations. */
		id?: string;
		/**
		 * `id` for the error list. When set, the list stays mounted as a polite
		 * live region (empty while there are no errors) so new errors are
		 * announced, and the control can point at it with `aria-describedby`.
		 */
		errorId?: string;
		class?: ClassValue;
	}

	let { label, errors, hint, for: htmlFor, id, errorId, class: className }: Props = $props();

	let errorList = $derived(errors ?? []);
	let hasRow = $derived(Boolean(label) || Boolean(hint));
	let isVisible = $derived(hasRow || errorList.length > 0 || Boolean(errorId));
</script>

{#if isVisible}
	<div class={cn('flex flex-col', className)}>
		{#if hasRow}
			<div class="flex flex-row flex-wrap items-baseline gap-x-2 ps-2">
				{#if label}
					{#if htmlFor}
						<label {id} for={htmlFor}>{label}</label>
					{:else}
						<span {id}>{label}</span>
					{/if}
				{/if}
				{#if hint}
					<span class="font-spacemono text-xs text-muted-foreground">{hint}</span>
				{/if}
			</div>
		{/if}
		{#if errorId || errorList.length > 0}
			<div id={errorId} aria-live={errorId ? 'polite' : undefined} class="ps-2">
				{#each errorList as error, i (i)}
					<p class="font-spacemono text-xs text-destructive">{error}</p>
				{/each}
			</div>
		{/if}
	</div>
{/if}
