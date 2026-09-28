<script lang="ts">
	import { cn } from '$lib/utils.js';
	import KleriButton from '$lib/button/KleriButton/KleriButton.svelte';
	import KleriMorphDialog from '$lib/dialog/KleriMorphDialog.svelte';
	import { getCalendarContext } from '../context.js';
	import type { EditScope } from '../types.js';

	/** Asks whether a change to a recurring event applies to one instance or the series. */
	interface Props {
		action: 'edit' | 'delete' | 'move';
		onResolve: (scope: EditScope | null) => void;
		/** Fires after the close animation, once the dialog can be unmounted. */
		onClosed?: () => void;
	}

	let { action, onResolve, onClosed }: Props = $props();
	const ctx = getCalendarContext();

	let open = $state(true);
	let scope = $state<EditScope>('this');
	let resolved = false;

	let heading = $derived(
		action === 'delete'
			? ctx.labels.deleteRecurring
			: action === 'move'
				? ctx.labels.moveRecurring
				: ctx.labels.editRecurring
	);

	function finish(result: EditScope | null) {
		if (resolved) return;
		resolved = true;
		open = false;
		onResolve(result);
	}
</script>

<KleriMorphDialog
	bind:open
	origin={null}
	onOpenChange={(next) => !next && finish(null)}
	onClose={onClosed}
	class="z-[70] w-[calc(100vw-2rem)] max-w-sm"
>
	{#snippet title()}
		<span class="text-lg font-semibold">{heading}</span>
	{/snippet}
	<div class="flex flex-col gap-1" role="radiogroup" aria-label={heading}>
		{#each [['this', ctx.labels.thisEvent], ['all', ctx.labels.allEvents]] as [value, label] (value)}
			<label
				class={cn(
					'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/40',
					scope === value && 'bg-kleri-2/10'
				)}
			>
				<input
					type="radio"
					name="scope"
					{value}
					bind:group={scope}
					class="size-4 border-2 border-border text-kleri-3 focus:ring-kleri-2"
				/>
				{label}
			</label>
		{/each}
	</div>
	<div class="mt-5 flex justify-end gap-2">
		<button
			type="button"
			class="rounded-kleri border-2 border-border px-4 py-1.5 text-sm hover:border-kleri-2"
			onclick={() => finish(null)}
		>
			{ctx.labels.cancel}
		</button>
		<KleriButton class="w-auto px-6 py-1.5 text-sm" onclick={() => finish(scope)}
			>{ctx.labels.confirm}</KleriButton
		>
	</div>
</KleriMorphDialog>
