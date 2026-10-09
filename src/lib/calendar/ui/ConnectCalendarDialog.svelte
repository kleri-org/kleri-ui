<script lang="ts">
	import { ChevronRight, Link2, Loader2 } from '@lucide/svelte';
	import KleriMorphDialog from '$lib/dialog/KleriMorphDialog.svelte';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import KleriSelect from '$lib/input/KleriSelect.svelte';
	import KleriDragNDrop from '$lib/input/dragndrop/KleriDragNDrop.svelte';
	import { getCalendarContext } from '../context.js';
	import type { CalendarIntegration } from '../types.js';
	import type { CalendarProvider } from '../providers/types.js';
	import { createIcsFeedProvider } from '../providers/ics-feed.js';
	import { parseICS } from '../core/ics.js';
	import ProviderIcon from './ProviderIcon.svelte';

	/**
	 * "Add calendar": connect accounts via the app's integrations, subscribe to
	 * an iCalendar URL, or import an .ics file.
	 */
	interface Props {
		open: boolean;
		integrations: CalendarIntegration[];
		/** Show the "Subscribe from URL" form. */
		allowSubscribe?: boolean;
		/** Show the ".ics import" dropzone. */
		allowImport?: boolean;
		/** Rewrites feed URLs, e.g. through a CORS proxy on your backend. */
		icsProxy?: (url: string) => string;
		onConnected: (provider: CalendarProvider) => void;
		onImported: (count: number) => void;
		/** Element the dialog morphs from, e.g. the sidebar's "Add calendar" button. */
		origin?: HTMLElement | null;
	}

	let {
		open = $bindable(),
		integrations,
		allowSubscribe = true,
		allowImport = true,
		icsProxy,
		onConnected,
		onImported,
		origin = null
	}: Props = $props();
	const ctx = getCalendarContext();

	let connecting = $state<string | null>(null);
	let connectError = $state<string | null>(null);
	/** Bumped by every connect and cancel; a stale attempt's outcome is dropped. */
	let attempt = 0;
	let url = $state('');
	let urlErrors = $state<string[]>([]);
	let subscribing = $state(false);
	let importTarget = $state('new');
	let importing = $state(false);
	let importErrors = $state<string[]>([]);

	let targets = $derived([
		{ value: 'new', label: 'New read-only calendar' },
		...ctx.store.writableCalendars.map((c) => ({ value: c.id, label: `Copy into ${c.name}` }))
	]);

	function message(error: unknown) {
		return error instanceof Error ? error.message : String(error);
	}

	async function connect(integration: CalendarIntegration) {
		const current = ++attempt;
		connecting = integration.id;
		connectError = null;
		try {
			const provider = await integration.connect();
			if (provider && current === attempt) {
				onConnected(provider);
				open = false;
			}
		} catch (error) {
			if (current === attempt) connectError = message(error);
		} finally {
			if (current === attempt) connecting = null;
		}
	}

	function cancelConnect() {
		const integration = integrations.find((i) => i.id === connecting);
		if (!integration?.cancel) return;
		attempt++;
		connecting = null;
		integration.cancel();
	}

	// Closing the dialog abandons a sign-in still waiting on the browser.
	$effect(() => {
		if (!open && connecting !== null) cancelConnect();
	});

	let cancellable = $derived(integrations.find((i) => i.id === connecting)?.cancel !== undefined);

	async function subscribe(e: SubmitEvent) {
		e.preventDefault();
		const value = url.trim();
		if (!/^(https?|webcal):\/\//i.test(value)) {
			urlErrors = ['Enter an http(s):// or webcal:// address'];
			return;
		}
		subscribing = true;
		urlErrors = [];
		try {
			const provider = createIcsFeedProvider({ url: value, proxy: icsProxy });
			if (ctx.store.getSource(provider.id))
				throw new Error('You are already subscribed to this calendar');
			await provider.listCalendars();
			onConnected(provider);
			url = '';
			open = false;
		} catch (error) {
			urlErrors = [message(error)];
		} finally {
			subscribing = false;
		}
	}

	async function importFile(files: File[]) {
		const file = files[0];
		if (!file) return;
		importing = true;
		importErrors = [];
		try {
			const text = await file.text();
			if (importTarget === 'new') {
				const provider = createIcsFeedProvider({
					text,
					id: `ics:file:${file.name}:${file.size}`,
					label: 'Imported',
					name: file.name.replace(/\.[^.]+$/, '')
				});
				if (ctx.store.getSource(provider.id)) throw new Error('This file was already imported');
				await provider.listCalendars();
				onConnected(provider);
				onImported((parseICS(text).events ?? []).length);
			} else {
				const parsed = parseICS(text);
				// Overrides of recurring series can't be replayed as plain creates; skip them.
				const events = parsed.events.filter(
					(ev) => !ev.recurringEventId && ev.status !== 'cancelled'
				);
				let count = 0;
				for (const ev of events) {
					await ctx.store.createEvent(importTarget, {
						title: ev.title,
						start: ev.start,
						end: ev.end,
						allDay: ev.allDay,
						description: ev.description,
						location: ev.location,
						recurrence: ev.recurrence,
						transparency: ev.transparency,
						reminders: ev.reminders
					});
					count++;
				}
				onImported(count);
			}
			open = false;
		} catch (error) {
			importErrors = [message(error)];
		} finally {
			importing = false;
		}
	}
</script>

<KleriMorphDialog bind:open {origin} class="w-[calc(100vw-2rem)] max-w-lg">
	{#snippet title()}
		<span class="text-lg font-semibold">{ctx.labels.connectTitle}</span>
	{/snippet}
	{#snippet description()}
		{ctx.labels.connectDescription}
	{/snippet}
	<div class="flex flex-col gap-6">
		{#if integrations.length}
			<ul class="flex flex-col gap-2">
				{#each integrations as integration (integration.id)}
					<li>
						<button
							type="button"
							disabled={connecting !== null}
							class="group flex w-full items-center gap-3 rounded-kleri border border-border p-3 text-left transition-colors hover:border-kleri-2 hover:bg-kleri-2/5 disabled:cursor-wait disabled:opacity-70"
							onclick={() => connect(integration)}
						>
							<span
								class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/40"
							>
								{#if integration.icon}
									<integration.icon class="size-5" />
								{:else}
									<ProviderIcon kind={integration.id} class="size-5" />
								{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block font-medium">{integration.label}</span>
								{#if integration.description}
									<span class="block text-xs text-muted-foreground">{integration.description}</span>
								{/if}
							</span>
							{#if connecting === integration.id}
								<Loader2
									class="size-5 animate-spin text-brand"
									aria-label={ctx.labels.connecting}
								/>
							{:else}
								<ChevronRight
									class="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								/>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if connecting !== null && cancellable}
				<div class="-mt-4 flex items-center justify-between gap-3">
					<p class="indent-2 text-xs text-muted-foreground" role="status">
						{ctx.labels.connectWaiting}
					</p>
					<button
						type="button"
						class="shrink-0 rounded-kleri border border-border px-4 py-1.5 text-sm transition-colors hover:border-kleri-2"
						onclick={cancelConnect}
					>
						{ctx.labels.cancel}
					</button>
				</div>
			{/if}
			{#if connectError}
				<p class="-mt-4 font-spacemono text-xs text-destructive" role="alert">{connectError}</p>
			{/if}
		{/if}

		{#if allowSubscribe}
			<form class="flex flex-col gap-1" onsubmit={subscribe}>
				<KleriInput
					bind:value={url}
					label={ctx.labels.subscribeUrl}
					placeholder="webcal://…"
					type="url"
					InputIcon={Link2}
					errors={urlErrors}
				/>
				<div class="flex items-center justify-between gap-3">
					<p class="indent-2 text-xs text-muted-foreground">{ctx.labels.subscribeUrlHint}</p>
					<button
						type="submit"
						disabled={subscribing || !url.trim()}
						class="flex shrink-0 items-center gap-2 rounded-kleri border border-border px-4 py-1.5 text-sm transition-colors hover:border-kleri-2 disabled:opacity-50"
					>
						{#if subscribing}<Loader2 class="size-4 animate-spin" />{/if}
						{ctx.labels.subscribe}
					</button>
				</div>
			</form>
		{/if}

		{#if allowImport}
			<div class="flex flex-col gap-2">
				<KleriSelect items={targets} bind:value={importTarget} label={ctx.labels.importInto} />
				<KleriDragNDrop
					label={ctx.labels.importFile}
					allowedTypes={['ics']}
					multiple={false}
					disabled={importing}
					errors={importErrors}
					mainText={importing ? ctx.labels.connecting : 'Drop an .ics file or click to browse'}
					onDrop={importFile}
				/>
			</div>
		{/if}
	</div>
</KleriMorphDialog>
