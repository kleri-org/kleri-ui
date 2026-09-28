<script lang="ts">
	import KleriMorphDialog from '$lib/dialog/KleriMorphDialog.svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarViewDefinition } from '../views/types.js';

	interface Props {
		open: boolean;
		views: CalendarViewDefinition[];
		/** Element the dialog morphs from, e.g. the toolbar button. */
		origin?: HTMLElement | null;
	}

	let { open = $bindable(), views, origin = null }: Props = $props();
	const ctx = getCalendarContext();

	let groups = $derived([
		{
			title: 'Navigation',
			items: [
				['T', ctx.labels.today],
				['J / N', ctx.labels.next],
				['K / P', ctx.labels.previous],
				['/', ctx.labels.search],
				['R', ctx.labels.refresh]
			]
		},
		{
			title: ctx.labels.views,
			items: views.filter((v) => v.shortcut).map((v) => [v.shortcut!.toUpperCase(), v.label])
		},
		{
			title: 'Events',
			items: [
				['C', ctx.labels.create],
				['E', ctx.labels.edit],
				['Delete', ctx.labels.delete],
				['Alt + ↑ / ↓', 'Move by one slot'],
				['Alt + Shift + ↑ / ↓', 'Change end time'],
				['Alt + ← / →', 'Move by one day'],
				['⌘/Ctrl + Enter', ctx.labels.save],
				['Esc', `${ctx.labels.close} / ${ctx.labels.cancel}`]
			]
		}
	]);
</script>

<KleriMorphDialog bind:open {origin} class="w-[calc(100vw-2rem)] max-w-lg">
	{#snippet title()}
		<span class="text-lg font-semibold">{ctx.labels.keyboardShortcuts}</span>
	{/snippet}
	<div class="grid gap-5 sm:grid-cols-2">
		{#each groups as group (group.title)}
			<section class={group.title === 'Events' ? 'sm:col-span-2' : ''}>
				<h3 class="mb-2 font-spacemono text-[11px] tracking-wider text-muted-foreground uppercase">
					{group.title}
				</h3>
				<dl class="flex flex-col gap-1.5">
					{#each group.items as [keys, label] (keys)}
						<div class="flex items-center justify-between gap-3 text-sm">
							<dt>{label}</dt>
							<dd>
								<kbd
									class="rounded-md border border-(--kc-line-strong) bg-muted/40 px-1.5 py-0.5 font-spacemono text-[11px]"
									>{keys}</kbd
								>
							</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/each}
	</div>
</KleriMorphDialog>
