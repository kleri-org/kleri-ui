<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import KleriButton from '$lib/button/KleriButton/KleriButton.svelte';
	import { getCalendarContext } from '../context.js';
	import type { EditScope } from '../types.js';

	/** Asks whether a change to a recurring event applies to one instance or the series. */
	interface Props {
		action: 'edit' | 'delete' | 'move';
		onResolve: (scope: EditScope | null) => void;
	}

	let { action, onResolve }: Props = $props();
	const ctx = getCalendarContext();

	let open = $state(true);
	let scope = $state<EditScope>('this');
	let resolved = false;

	let title = $derived(
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

<DialogPrimitive.Root bind:open onOpenChange={(next) => !next && finish(null)}>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			class="fixed inset-0 z-[70] bg-black/50 data-open:animate-in data-open:fade-in-0"
		/>
		<DialogPrimitive.Content
			class="fixed top-1/2 left-1/2 z-[70] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-kleri border border-border bg-background p-5 shadow-2xl shadow-black/40 outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
		>
			<DialogPrimitive.Title class="text-lg font-semibold">{title}</DialogPrimitive.Title>
			<div class="mt-4 flex flex-col gap-1" role="radiogroup" aria-label={title}>
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
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
