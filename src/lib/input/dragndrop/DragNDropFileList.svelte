<script lang="ts">
	import { fade } from 'svelte/transition';
	import { FileText, Files, X } from '@lucide/svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/menus/popover/index.js';
	import { KleriButtonGroup } from '$lib/button/KleriButtonGroup/index.js';
	import type { DropzoneEntry } from './dragndrop-props.js';

	/**
	 * The corner affordance shared by both dropzones: a badge showing how many
	 * files are held, a popover listing them with per-row removal, and a
	 * "remove all" button.
	 */
	interface Props {
		entries: DropzoneEntry[];
		/** Removes the entry at `index`. */
		onRemove: (index: number) => void;
		/** Removes every entry. */
		onRemoveAll: () => void;
		size?: 'xs' | 'sm' | 'lg';
		/** Which edge of the trigger the popover aligns to. */
		align?: 'start' | 'center' | 'end';
		/** Extra classes for the popover panel. */
		contentClass?: string;
		/** Extra classes for both group buttons. */
		buttonClass?: string;
	}

	let {
		entries,
		onRemove,
		onRemoveAll,
		size,
		align = 'end',
		contentClass = 'w-80',
		buttonClass = ''
	}: Props = $props();

	let open = $state(false);

	function removeAll() {
		open = false;
		onRemoveAll();
	}

	function remove(index: number) {
		if (entries.length <= 1) open = false;
		onRemove(index);
	}
</script>

{#if entries.length > 0}
	<div transition:fade={{ duration: 150 }}>
		<Popover bind:open>
			<PopoverTrigger>
				{#snippet child({ props: popoverProps })}
					<KleriButtonGroup
						{size}
						onclick={(e) => e.stopPropagation()}
						items={[
							{
								type: 'button',
								label: '',
								icon: Files,
								tooltip: `${entries.length} file${entries.length !== 1 ? 's' : ''}`,
								triggerProps: popoverProps,
								class: `rounded-r-none ${buttonClass}`
							},
							{
								type: 'button',
								label: '',
								icon: X,
								tooltip: 'Remove all files',
								onclick: removeAll,
								class: `rounded-l-none border-l-0 ${buttonClass}`
							}
						]}
					/>
				{/snippet}
			</PopoverTrigger>
			<PopoverContent class={contentClass} {align} sideOffset={4}>
				<div class="max-h-64 space-y-1.5 overflow-y-auto">
					{#each entries as entry, i (entry.key)}
						<div
							class="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2"
						>
							<FileText class="size-4 shrink-0 text-muted-foreground/60" />
							<span class="flex-1 truncate text-sm text-foreground">
								{entry.name}
							</span>
							{#if entry.meta}
								<span class="shrink-0 text-xs text-muted-foreground/60">{entry.meta}</span>
							{/if}
							<button
								type="button"
								aria-label={`Remove ${entry.name}`}
								class="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-destructive"
								onclick={() => remove(i)}
							>
								<X class="size-3.5" />
							</button>
						</div>
					{/each}
				</div>
			</PopoverContent>
		</Popover>
	</div>
{/if}
