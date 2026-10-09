<script lang="ts">
	import { Popover } from 'bits-ui';
	import {
		AlertCircle,
		Check,
		Eye,
		Lock,
		Palette,
		RefreshCw,
		RotateCcw,
		Unplug
	} from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';
	import { readableInk } from '../core/color.js';
	import { KLERI_CALENDAR_PALETTE, type CalendarSource } from '../store/calendar-store.svelte.js';
	import type { CalendarInfo } from '../types.js';
	import ProviderIcon from './ProviderIcon.svelte';

	/** Connected sources with their calendars: visibility, color and sync state. */
	interface Props {
		/** Called for sources whose credentials expired. Defaults to a plain refresh. */
		onReconnect?: (source: CalendarSource) => void;
		/** Offer "Disconnect" on each source. */
		onDisconnect?: (source: CalendarSource) => void;
		/** Limit "Disconnect" to the sources this accepts. Defaults to all. */
		canDisconnect?: (source: CalendarSource) => boolean;
	}

	let { onReconnect, onDisconnect, canDisconnect }: Props = $props();
	const ctx = getCalendarContext();

	let groups = $derived(
		ctx.store.sources.map((source) => ({
			source,
			calendars: ctx.store.calendars.filter((c) => c.sourceId === source.provider.id)
		}))
	);

	function syncedLabel(source: CalendarSource): string | undefined {
		return source.lastSyncedAt
			? ctx.labels.lastSynced(ctx.formatters.relative(source.lastSyncedAt, new Date()))
			: undefined;
	}
</script>

{#snippet calendarRow(calendar: CalendarInfo)}
	{@const visible = ctx.store.isVisible(calendar.id)}
	<li class="group/cal relative flex items-center rounded-lg transition-colors hover:bg-muted/40">
		<button
			type="button"
			role="checkbox"
			aria-checked={visible}
			class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
			onclick={() => ctx.store.toggleCalendar(calendar.id)}
		>
			<span
				class="flex size-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors"
				style:border-color={calendar.color}
				style:background-color={visible ? calendar.color : 'transparent'}
				aria-hidden="true"
			>
				{#if visible}<Check
						class="size-3"
						color={readableInk(calendar.color)}
						strokeWidth={3.5}
					/>{/if}
			</span>
			<span class="min-w-0 flex-1 truncate" class:text-muted-foreground={!visible}
				>{calendar.name}</span
			>
			{#if calendar.readOnly}
				<Lock class="size-3 shrink-0 text-muted-foreground" aria-label={ctx.labels.readOnly} />
			{/if}
		</button>
		<!-- Overlaid on hover/focus so names keep their full width at rest. -->
		<div
			class="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-linear-to-l from-background from-60% pr-1 pl-6 opacity-0 transition-opacity group-focus-within/cal:pointer-events-auto group-focus-within/cal:opacity-100 group-hover/cal:pointer-events-auto group-hover/cal:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100"
		>
			<button
				type="button"
				class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
				aria-label="{ctx.labels.showOnly}: {calendar.name}"
				title={ctx.labels.showOnly}
				onclick={() => ctx.store.showOnly(calendar.id)}
			>
				<Eye class="size-3.5" />
			</button>
			<Popover.Root>
				<Popover.Trigger
					class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
					aria-label="{ctx.labels.changeColor}: {calendar.name}"
					title={ctx.labels.changeColor}
				>
					<Palette class="size-3.5" />
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						side="right"
						align="start"
						sideOffset={6}
						class="kleri-dropdown z-50 grid w-44 grid-cols-5 gap-2 rounded-kleri border border-border/50 kleri-glass p-3 shadow-xl outline-hidden"
					>
						{#each KLERI_CALENDAR_PALETTE as color (color)}
							<Popover.Close
								class={cn(
									'flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none',
									calendar.color === color && 'ring-2 ring-foreground/60'
								)}
								style="background-color: {color}"
								aria-label={color}
								onclick={() => ctx.store.setColor(calendar.id, color)}
							>
								{#if calendar.color === color}<Check
										class="size-3.5"
										color={readableInk(color)}
										strokeWidth={3}
									/>{/if}
							</Popover.Close>
						{/each}
						<Popover.Close
							class="col-span-5 mt-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
							onclick={() => ctx.store.setColor(calendar.id, null)}
						>
							<RotateCcw class="size-3" />
							{ctx.labels.defaultColor}
						</Popover.Close>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
		</div>
	</li>
{/snippet}

<div class="flex flex-col gap-3">
	{#each groups as { source, calendars } (source.provider.id)}
		<section aria-label={source.provider.label}>
			<header class="group/src mb-1 flex items-center gap-2 px-2">
				<ProviderIcon kind={source.provider.kind} class="size-3.5 shrink-0" />
				<div class="min-w-0 flex-1">
					<h3
						class="truncate font-spacemono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
					>
						{source.provider.label}
					</h3>
					{#if source.provider.account}
						<p class="truncate text-[11px] text-muted-foreground">{source.provider.account}</p>
					{/if}
				</div>
				{#if source.status === 'loading'}
					<RefreshCw
						class="size-3.5 shrink-0 animate-spin text-brand"
						aria-label={ctx.labels.syncing}
					/>
				{:else if source.status === 'error'}
					<button
						type="button"
						class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-destructive hover:bg-destructive/10"
						title={source.error}
						onclick={() => ctx.store.refresh(source.provider.id)}
					>
						<AlertCircle class="size-3.5" />
						{ctx.labels.retry}
					</button>
				{:else}
					<button
						type="button"
						class="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-focus-within/src:opacity-100 group-hover/src:opacity-100 hover:bg-muted/60 hover:text-foreground"
						aria-label="{ctx.labels.refresh}: {source.provider.label}"
						title={syncedLabel(source)}
						onclick={() => ctx.store.refresh(source.provider.id)}
					>
						<RefreshCw class="size-3.5" />
					</button>
				{/if}
				{#if onDisconnect && source.status !== 'loading' && (canDisconnect?.(source) ?? true)}
					<button
						type="button"
						class="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-focus-within/src:opacity-100 group-hover/src:opacity-100 hover:bg-muted/60 hover:text-destructive"
						aria-label="{ctx.labels.disconnect}: {source.provider.label}"
						onclick={() => onDisconnect(source)}
					>
						<Unplug class="size-3.5" />
					</button>
				{/if}
			</header>

			{#if source.status === 'unauthorized'}
				<div
					class="mx-2 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs"
				>
					<span class="min-w-0 truncate text-destructive" title={source.error}
						>{source.error ?? 'Signed out'}</span
					>
					<button
						type="button"
						class="shrink-0 rounded-md border border-destructive/50 px-2 py-0.5 font-medium text-destructive hover:bg-destructive/15"
						onclick={() =>
							onReconnect ? onReconnect(source) : ctx.store.refresh(source.provider.id)}
					>
						{ctx.labels.reconnect}
					</button>
				</div>
			{:else if calendars.length === 0 && source.status === 'loading'}
				<ul class="flex flex-col gap-1 px-2" aria-hidden="true">
					{#each [0, 1] as i (i)}
						<li class="h-6 animate-pulse rounded-md bg-muted/40"></li>
					{/each}
				</ul>
			{:else}
				<ul class="flex flex-col">
					{#each calendars as calendar (calendar.id)}
						{@render calendarRow(calendar)}
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>
