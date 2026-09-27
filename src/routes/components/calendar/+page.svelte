<script lang="ts">
	import { onDestroy } from 'svelte';
	import { KleriButton } from '$lib';
	import { PropControls } from '$lib/preview';
	import { getHighlighter } from '$lib/utils/highlighter';
	import { CalendarStore, KleriCalendar, isValidTimeZone } from '$lib/calendar/index.js';
	import {
		buildDemoProviders,
		CONTACTS,
		DEMO_CONFERENCING,
		DEMO_INTEGRATIONS,
		SELF
	} from './demo-data.js';

	// --------------------------------------------------------------------------
	// Live demo
	// --------------------------------------------------------------------------
	const store = new CalendarStore({
		providers: buildDemoProviders(),
		persistKey: 'kleri-ui-demo-calendar'
	});
	onDestroy(() => store.destroy());

	let view = $state('week');
	let date = $state(new Date());

	let calendarProps = $state({
		hideWeekends: false,
		showWeekNumbers: false,
		readOnly: false,
		hour12: true,
		dimPastEvents: true,
		timeZone: '',
		slotDuration: 15,
		hourHeight: 52
	});

	const calendarSchema = {
		hideWeekends: { type: 'boolean' as const, label: 'Hide Weekends' },
		showWeekNumbers: { type: 'boolean' as const, label: 'Week Numbers' },
		readOnly: { type: 'boolean' as const, label: 'Read Only' },
		hour12: { type: 'boolean' as const, label: '12-hour Clock' },
		dimPastEvents: { type: 'boolean' as const, label: 'Dim Past Events' },
		timeZone: { type: 'string' as const, label: 'Time Zone (e.g. Asia/Tokyo)' },
		slotDuration: { type: 'number' as const, label: 'Snap (minutes)' },
		hourHeight: { type: 'number' as const, label: 'Hour Height (px)' }
	};

	let timeZone = $derived(
		calendarProps.timeZone.trim() && isValidTimeZone(calendarProps.timeZone.trim())
			? calendarProps.timeZone.trim()
			: undefined
	);
	let slotDuration = $derived(
		[5, 10, 15, 20, 30, 60].includes(Number(calendarProps.slotDuration))
			? Number(calendarProps.slotDuration)
			: 15
	);
	let hourHeight = $derived(Math.min(120, Math.max(32, Number(calendarProps.hourHeight) || 52)));

	// --------------------------------------------------------------------------
	// Code samples
	// --------------------------------------------------------------------------
	const S = '<' + 'script';
	const SE = '</' + 'script';

	function buildUsageCode(p: typeof calendarProps): string {
		const attrs = [
			'  {store}',
			'  bind:view',
			'  bind:date',
			p.hideWeekends && '  hideWeekends',
			p.showWeekNumbers && '  showWeekNumbers',
			p.readOnly && '  readOnly',
			!p.hour12 && '  hour12={false}',
			!p.dimPastEvents && '  dimPastEvents={false}',
			timeZone && `  timeZone="${timeZone}"`,
			slotDuration !== 15 && `  slotDuration={${slotDuration}}`,
			hourHeight !== 52 && `  hourHeight={${hourHeight}}`,
			'  self={{ email: "you@kleri.org", name: "You" }}',
			'  {contacts}',
			'  {integrations}'
		].filter(Boolean);
		return [
			`${S} lang="ts">`,
			'  import {',
			'    CalendarStore,',
			'    KleriCalendar,',
			'    createMemoryProvider,',
			'    createGoogleCalendarProvider',
			"  } from '@kleri/ui/calendar';",
			'',
			'  const store = new CalendarStore({',
			'    providers: [',
			"      createMemoryProvider({ calendars: [{ id: 'work', name: 'Work' }] })",
			'    ],',
			"    persistKey: 'my-app-calendar'",
			'  });',
			'',
			"  let view = $state('week');",
			'  let date = $state(new Date());',
			`${SE}>`,
			'',
			'<div class="h-[720px]">',
			'  <KleriCalendar',
			...attrs.map((a) => `  ${a}`),
			'  />',
			'</div>'
		].join('\n');
	}

	const integrationCode = [
		"import { createGoogleCalendarProvider, createMicrosoftCalendarProvider, createIcsFeedProvider } from '@kleri/ui/calendar';",
		'',
		'// Your app owns OAuth; the adapter only needs a token getter.',
		'store.addProvider(',
		'  createGoogleCalendarProvider({',
		'    account: user.email,',
		'    getAccessToken: ({ forceRefresh }) => auth.getGoogleToken({ forceRefresh })',
		'  })',
		');',
		'',
		'store.addProvider(',
		'  createMicrosoftCalendarProvider({',
		'    account: user.email,',
		"    getAccessToken: () => msal.acquireTokenSilent({ scopes: ['Calendars.ReadWrite'] }).then((r) => r.accessToken)",
		'  })',
		');',
		'',
		'// Read-only iCalendar feeds (Apple, holidays, shared "secret address" URLs…).',
		'// Most feeds lack CORS headers, so route them through your backend.',
		'store.addProvider(',
		'  createIcsFeedProvider({',
		"    url: 'webcal://example.com/team.ics',",
		'    proxy: (url) => `/api/ics?url=${encodeURIComponent(url)}`',
		'  })',
		');',
		'',
		'// Anything else: implement the CalendarProvider interface.',
		'const myBackend: CalendarProvider = {',
		"  id: 'acme', kind: 'acme', label: 'Acme',",
		"  capabilities: { write: true, freeBusy: false, recurrence: 'provider' },",
		'  listCalendars: () => api.calendars(),',
		'  listEvents: ({ calendarId, start, end, signal }) => api.events(calendarId, start, end, { signal }),',
		'  createEvent: (calendarId, draft) => api.create(calendarId, draft)',
		'};'
	].join('\n');

	const customViewCode = [
		"import { defaultCalendarViews, type CalendarViewDefinition } from '@kleri/ui/calendar';",
		"import TimelineView from './TimelineView.svelte';",
		'',
		'const timelineView: CalendarViewDefinition = {',
		"  id: 'timeline',",
		"  label: 'Timeline',",
		"  shortcut: 'l',",
		'  component: TimelineView,',
		'  range: (date, ctx) => ({ start: startOfWeek(date, ctx.weekStartsOn), end: addDays(startOfWeek(date, ctx.weekStartsOn), 14) }),',
		'  step: (date, dir) => addDays(date, 14 * dir),',
		'  title: (range, ctx) => formatDateRange(ctx.locale, range.start, addDays(range.end, -1))',
		'};',
		'',
		'// <KleriCalendar views={[...defaultCalendarViews, timelineView]} />',
		'',
		'// Inside TimelineView.svelte — the calendar context gives you everything:',
		'// const ctx = getCalendarContext();',
		'// ctx.actions.open(occurrence, element)      → details popover',
		'// ctx.actions.move(occurrence, start, end)   → drag-to-reschedule, with recurring prompts',
		'// ctx.actions.create({ start, end, allDay }) → quick create / scheduling dialog'
	].join('\n');

	const usageCode = $derived(buildUsageCode(calendarProps));

	let highlighted = $state<Record<string, string>>({});
	let copied = $state<string | null>(null);

	$effect(() => {
		const samples = {
			usage: [usageCode, 'svelte'],
			integrations: [integrationCode, 'tsx'],
			views: [customViewCode, 'tsx']
		};
		void getHighlighter().then((highlighter) => {
			highlighted = Object.fromEntries(
				Object.entries(samples).map(([key, [code, lang]]) => [
					key,
					highlighter.codeToHtml(code, {
						lang,
						themes: { light: 'kleri-light', dark: 'kleri-dark' }
					})
				])
			);
		});
	});

	function copy(key: string, code: string) {
		navigator.clipboard.writeText(code);
		copied = key;
	}
</script>

{#snippet codeBlock(key: string, code: string, label: string)}
	<div class="overflow-hidden rounded-lg border-2 border-border bg-card">
		<div class="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2">
			<span class="font-spacemono text-xs text-foreground">{label}</span>
			<KleriButton
				class="w-auto px-3 py-1 text-xs"
				showSuccess={copied === key}
				successMessage="Copied!"
				onSuccessComplete={() => (copied = null)}
				onclick={() => copy(key, code)}
			>
				Copy
			</KleriButton>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div role="region" aria-label="{label} example" tabindex="0" class="overflow-x-auto">
			{#if highlighted[key]}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html highlighted[key]}
			{:else}
				<pre class="p-4 font-spacemono text-sm text-foreground"><code>{code}</code></pre>
			{/if}
		</div>
	</div>
{/snippet}

<div class="space-y-16">
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Calendar</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Calendar</h1>
		<p class="text-lg text-muted-foreground">
			Scheduling with day, week, month and agenda views, drag-and-drop, recurring events, time zones
			and Google, Outlook and iCalendar integrations.
		</p>
	</div>

	<section id="kleri-calendar" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriCalendar</h2>
			<p class="text-muted-foreground">
				Drag on the grid to schedule, drag events to move them, pull their bottom edge to resize.
				Add guests in the editor to see their availability and suggested times. Press <kbd
					class="rounded border border-border px-1 font-spacemono text-xs">?</kbd
				> for shortcuts.
			</p>
		</div>

		<div class="h-[760px]">
			<KleriCalendar
				{store}
				bind:view
				bind:date
				hideWeekends={calendarProps.hideWeekends}
				showWeekNumbers={calendarProps.showWeekNumbers}
				readOnly={calendarProps.readOnly}
				hour12={calendarProps.hour12}
				dimPastEvents={calendarProps.dimPastEvents}
				{timeZone}
				{slotDuration}
				{hourHeight}
				self={SELF}
				contacts={CONTACTS}
				integrations={DEMO_INTEGRATIONS}
				conferenceProviders={DEMO_CONFERENCING}
			/>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				{@render codeBlock('usage', usageCode, 'Usage')}
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={calendarSchema} bind:values={calendarProps} />
			</div>
		</div>
	</section>

	<section id="calendar-integrations" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Integrations</h2>
			<p class="text-muted-foreground">
				Every source is a <code class="font-spacemono text-sm">CalendarProvider</code>. Google
				Calendar, Microsoft Graph and iCalendar feeds ship built in, with token refresh, retries and
				backoff. Pass <code class="font-spacemono text-sm">integrations</code> to power the “Add calendar”
				dialog.
			</p>
		</div>
		{@render codeBlock('integrations', integrationCode, 'Providers')}
	</section>

	<section id="calendar-custom-views" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Custom views</h2>
			<p class="text-muted-foreground">
				Views are plain definitions. Timeline or chart views plug in alongside the built-ins and
				reuse the same data, popovers and scheduling flows through the calendar context.
			</p>
		</div>
		{@render codeBlock('views', customViewCode, 'Custom view')}
	</section>
</div>
