<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		ChevronLeft,
		ChevronRight,
		Globe,
		Keyboard,
		PanelLeft,
		Plus,
		RefreshCw,
		Search,
		X
	} from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriToggleGroup from '$lib/toggle/KleriToggleGroup.svelte';
	import KleriToggleGroupItem from '$lib/toggle/KleriToggleGroupItem.svelte';
	import KleriSelect from '$lib/input/KleriSelect.svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarViewDefinition } from '../views/types.js';

	interface Props {
		title: string;
		views: CalendarViewDefinition[];
		view: string;
		search: string;
		sidebarOpen: boolean;
		showSidebarToggle: boolean;
		onViewChange: (view: string) => void;
		onToday: () => void;
		onStep: (direction: 1 | -1) => void;
		onToggleSidebar: () => void;
		onCreate: () => void;
		onShortcuts: () => void;
		/** Search input element, so the `/` shortcut can focus it. */
		searchInput?: HTMLInputElement | null;
		extra?: Snippet;
	}

	let {
		title,
		views,
		view,
		search = $bindable(''),
		sidebarOpen,
		showSidebarToggle,
		onViewChange,
		onToday,
		onStep,
		onToggleSidebar,
		onCreate,
		onShortcuts,
		searchInput = $bindable(null),
		extra
	}: Props = $props();

	const ctx = getCalendarContext();

	let switcherViews = $derived(views.filter((v) => !v.hidden));
	let busy = $derived(ctx.store.isLoading || ctx.store.isSaving);
	let canCreate = $derived(!ctx.config.readOnly && ctx.store.writableCalendars.length > 0);
	let searchOpen = $state(false);
	let showSearch = $derived(searchOpen || search.length > 0);

	const iconButton =
		'flex size-9 shrink-0 items-center justify-center rounded-kleri text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none';
</script>

<div
	class="flex flex-wrap items-center gap-2 border-b border-(--kc-line) px-3 py-2.5 @4xl:flex-nowrap @4xl:px-4"
>
	{#if showSidebarToggle}
		<button
			type="button"
			class={iconButton}
			aria-label={ctx.labels.toggleSidebar}
			aria-expanded={sidebarOpen}
			onclick={onToggleSidebar}
		>
			<PanelLeft class="size-5" />
		</button>
	{/if}

	<button
		type="button"
		class="h-9 shrink-0 rounded-kleri border-2 border-border px-3.5 text-sm font-medium transition-colors hover:border-kleri-2 hover:bg-kleri-2/10 focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
		title="{ctx.formatters.fullDate(ctx.today)} (T)"
		onclick={onToday}
	>
		{ctx.labels.today}
	</button>

	<div class="flex shrink-0 items-center">
		<button
			type="button"
			class={iconButton}
			aria-label={ctx.labels.previous}
			title="{ctx.labels.previous} (K)"
			onclick={() => onStep(-1)}
		>
			<ChevronLeft class="size-5" />
		</button>
		<button
			type="button"
			class={iconButton}
			aria-label={ctx.labels.next}
			title="{ctx.labels.next} (J)"
			onclick={() => onStep(1)}
		>
			<ChevronRight class="size-5" />
		</button>
	</div>

	<h2
		class="min-w-24 flex-1 truncate text-lg font-semibold @4xl:text-xl"
		aria-live="polite"
		aria-atomic="true"
	>
		{title}
	</h2>

	<div class="flex shrink-0 items-center gap-1">
		{#if !ctx.config.clock.isSystem}
			<span
				class="hidden items-center gap-1 rounded-full border border-(--kc-line-strong) px-2 py-0.5 font-spacemono text-[11px] text-muted-foreground @2xl:flex"
				title={ctx.labels.timeZone}
			>
				<Globe class="size-3" />
				{ctx.config.clock.timeZone.split('/').pop()?.replaceAll('_', ' ')}
			</span>
		{/if}

		{#if showSearch}
			<div
				class="flex h-9 w-44 items-center gap-1.5 rounded-kleri border-2 border-border px-2.5 transition-colors focus-within:kleri-border @4xl:w-56 dark:focus-within:kleri-border-dark"
			>
				<Search class="size-4 shrink-0 text-muted-foreground" />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={searchInput}
					bind:value={search}
					type="search"
					autofocus
					placeholder={ctx.labels.search}
					aria-label={ctx.labels.search}
					class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							search = '';
							searchOpen = false;
						}
					}}
					onblur={() => {
						if (!search) searchOpen = false;
					}}
				/>
				{#if search}
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground"
						aria-label={ctx.labels.clearSearch}
						onclick={() => (search = '')}
					>
						<X class="size-3.5" />
					</button>
				{/if}
			</div>
		{:else}
			<button
				type="button"
				class={iconButton}
				aria-label={ctx.labels.search}
				title="{ctx.labels.search} (/)"
				onclick={() => (searchOpen = true)}
			>
				<Search class="size-[18px]" />
			</button>
		{/if}

		<button
			type="button"
			class={iconButton}
			aria-label={ctx.labels.refresh}
			title={busy ? ctx.labels.syncing : ctx.labels.refresh}
			onclick={() => ctx.store.refresh()}
		>
			<RefreshCw class={cn('size-[18px]', busy && 'animate-spin text-kleri-1 dark:text-kleri-2')} />
		</button>
		<button
			type="button"
			class={cn(iconButton, 'hidden @4xl:flex')}
			aria-label={ctx.labels.keyboardShortcuts}
			title="{ctx.labels.keyboardShortcuts} (?)"
			onclick={onShortcuts}
		>
			<Keyboard class="size-[18px]" />
		</button>
	</div>

	<div class="max-@md:w-full flex items-center gap-2">
		<div class="hidden @4xl:block">
			<KleriToggleGroup
				type="single"
				value={view}
				size="sm"
				variant="outline"
				aria-label={ctx.labels.views}
				onValueChange={(next: string) => next && onViewChange(next)}
			>
				{#each switcherViews as v (v.id)}
					<KleriToggleGroupItem
						value={v.id}
						title={v.shortcut ? `${v.label} (${v.shortcut.toUpperCase()})` : v.label}
					>
						{#if v.icon}<v.icon aria-hidden="true" />{/if}
						{v.label}
					</KleriToggleGroupItem>
				{/each}
			</KleriToggleGroup>
		</div>
		<div class="max-@md:flex-1 w-36 min-w-0 @4xl:hidden">
			<KleriSelect
				items={switcherViews.map((v) => ({ value: v.id, label: v.label, icon: v.icon }))}
				value={view}
				ariaLabel={ctx.labels.views}
				class="[&_button]:py-1 [&>div]:my-0"
				onValueChange={(next) => next && onViewChange(next)}
			/>
		</div>
		{#if !sidebarOpen && canCreate}
			<button
				type="button"
				class="flex h-9 shrink-0 items-center gap-1.5 rounded-kleri border-2 border-black bg-primary px-3 text-sm font-medium text-black transition-colors hover:kleri-bg focus-visible:ring-2 focus-visible:ring-kleri-2 focus-visible:outline-none"
				aria-label={ctx.labels.create}
				title="{ctx.labels.create} (C)"
				onclick={onCreate}
			>
				<Plus class="size-4" strokeWidth={2.5} />
				<span class="hidden @xl:inline">{ctx.labels.create}</span>
			</button>
		{/if}
		{@render extra?.()}
	</div>
</div>
