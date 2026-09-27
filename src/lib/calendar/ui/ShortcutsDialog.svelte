<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { X } from '@lucide/svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarViewDefinition } from '../views/types.js';

	interface Props {
		open: boolean;
		views: CalendarViewDefinition[];
	}

	let { open = $bindable(), views }: Props = $props();
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

<DialogPrimitive.Root bind:open>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0"
		/>
		<DialogPrimitive.Content
			class="fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-kleri border border-border bg-background p-6 shadow-2xl outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
		>
			<div class="mb-4 flex items-center justify-between">
				<DialogPrimitive.Title class="text-lg font-semibold"
					>{ctx.labels.keyboardShortcuts}</DialogPrimitive.Title
				>
				<DialogPrimitive.Close
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
					aria-label={ctx.labels.close}
				>
					<X class="size-5" />
				</DialogPrimitive.Close>
			</div>
			<div class="grid gap-5 sm:grid-cols-2">
				{#each groups as group (group.title)}
					<section class={group.title === 'Events' ? 'sm:col-span-2' : ''}>
						<h3
							class="mb-2 font-spacemono text-[11px] tracking-wider text-muted-foreground uppercase"
						>
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
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
