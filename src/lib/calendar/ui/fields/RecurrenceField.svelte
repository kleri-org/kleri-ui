<script lang="ts">
	import { Repeat } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriSelect from '$lib/input/KleriSelect.svelte';
	import KleriToggleGroup from '$lib/toggle/KleriToggleGroup.svelte';
	import KleriToggleGroupItem from '$lib/toggle/KleriToggleGroupItem.svelte';
	import { getCalendarContext } from '../../context.js';
	import { addMonths, weekdayOrder } from '../../core/date.js';
	import {
		WEEKDAY_CODES,
		describeRecurrence,
		matchRecurrencePreset,
		recurrencePresets,
		weekdayOrdinalInMonth,
		type RecurrenceFrequency,
		type RecurrenceRule
	} from '../../core/recurrence.js';
	import DateField from './DateField.svelte';

	/** "Repeat" select with the usual presets and a full custom rule builder. */
	interface Props {
		value: RecurrenceRule | null;
		/** First occurrence (wall clock). */
		start: Date;
		errors?: string[];
	}

	let { value = $bindable(null), start, errors }: Props = $props();
	const ctx = getCalendarContext();
	const locale = $derived(ctx.config.locale);

	let presets = $derived(recurrencePresets(start, locale));
	let matched = $derived(matchRecurrencePreset(value, start, locale));
	let customOpen = $state(false);
	let showCustom = $derived(customOpen || matched === 'custom');

	let items = $derived([
		...presets.map((p) => ({ value: p.id, label: p.label })),
		{
			value: 'custom',
			label:
				matched === 'custom' && value
					? describeRecurrence(value, { locale, start })
					: ctx.labels.customRepeat
		}
	]);

	function pick(id: string) {
		if (id === 'custom') {
			customOpen = true;
			value ??= { freq: 'WEEKLY', byDay: [{ day: WEEKDAY_CODES[start.getDay()] }] };
			return;
		}
		customOpen = false;
		value = presets.find((p) => p.id === id)?.rule ?? null;
	}

	const FREQUENCIES: { value: RecurrenceFrequency; one: string; many: string }[] = [
		{ value: 'DAILY', one: 'day', many: 'days' },
		{ value: 'WEEKLY', one: 'week', many: 'weeks' },
		{ value: 'MONTHLY', one: 'month', many: 'months' },
		{ value: 'YEARLY', one: 'year', many: 'years' }
	];

	function update(patch: Partial<RecurrenceRule>) {
		if (!value) return;
		const next: RecurrenceRule = { ...value, ...patch };
		for (const key of Object.keys(patch) as (keyof RecurrenceRule)[]) {
			if (patch[key] === undefined) delete next[key];
		}
		value = next;
	}

	function setFrequency(freq: RecurrenceFrequency) {
		const code = WEEKDAY_CODES[start.getDay()];
		update({
			freq,
			byDay: freq === 'WEEKLY' ? [{ day: code }] : undefined,
			byMonthDay: freq === 'MONTHLY' ? [start.getDate()] : undefined,
			byMonth: undefined,
			bySetPos: undefined
		});
	}

	let weekdays = $derived(weekdayOrder(ctx.config.weekStartsOn).map((i) => WEEKDAY_CODES[i]));
	let selectedDays = $derived(
		value?.byDay?.filter((d) => d.nth === undefined).map((d) => d.day) ?? []
	);

	let ordinal = $derived(weekdayOrdinalInMonth(start));
	let monthlyMode = $derived(
		value?.byDay?.some((d) => d.nth === -1)
			? 'last'
			: value?.byDay?.some((d) => d.nth)
				? 'nth'
				: 'day'
	);
	let monthlyItems = $derived.by(() => {
		const code = WEEKDAY_CODES[start.getDay()];
		const out = [
			{
				value: 'day',
				label:
					presets.find((p) => p.id === 'monthly-day')?.label ?? `Monthly on day ${start.getDate()}`
			}
		];
		if (ordinal.nth <= 4) {
			out.push({ value: 'nth', label: presets.find((p) => p.id === 'monthly-nth')?.label ?? code });
		}
		if (ordinal.last)
			out.push({
				value: 'last',
				label: presets.find((p) => p.id === 'monthly-last')?.label ?? code
			});
		return out;
	});

	function setMonthlyMode(mode: string) {
		const code = WEEKDAY_CODES[start.getDay()];
		if (mode === 'day') update({ byMonthDay: [start.getDate()], byDay: undefined });
		else
			update({
				byMonthDay: undefined,
				byDay: [{ day: code, nth: mode === 'last' ? -1 : ordinal.nth }]
			});
	}

	let endMode = $derived(value?.count ? 'after' : value?.until ? 'on' : 'never');

	function setEndMode(mode: string) {
		if (mode === 'never') update({ count: undefined, until: undefined });
		else if (mode === 'after') update({ count: value?.count ?? 10, until: undefined });
		else {
			const until = new Date(value?.until ?? addMonths(start, 3));
			until.setHours(23, 59, 59, 0);
			update({ until, count: undefined });
		}
	}

	const inputClass =
		'w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center font-spacemono text-sm outline-none focus:border-kleri-2 focus:ring-0';
</script>

<div class="flex flex-col gap-2">
	<KleriSelect
		{items}
		value={showCustom ? 'custom' : matched}
		label={ctx.labels.repeat}
		persistentIcon={Repeat}
		{errors}
		onValueChange={pick}
	/>

	{#if showCustom && value}
		<div
			class="flex flex-col gap-3 rounded-kleri border border-dashed border-(--kc-line-strong) p-3 text-sm"
		>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-muted-foreground">{ctx.labels.every}</span>
				<input
					type="number"
					min="1"
					max="99"
					class={inputClass}
					aria-label={ctx.labels.every}
					value={value.interval ?? 1}
					oninput={(e) => {
						const n = Math.max(1, Math.min(99, Number(e.currentTarget.value) || 1));
						update({ interval: n > 1 ? n : undefined });
					}}
				/>
				<KleriToggleGroup
					type="single"
					size="sm"
					variant="outline"
					value={value.freq}
					onValueChange={(next: string) => next && setFrequency(next as RecurrenceFrequency)}
				>
					{#each FREQUENCIES as f (f.value)}
						<KleriToggleGroupItem value={f.value}
							>{(value.interval ?? 1) > 1 ? f.many : f.one}</KleriToggleGroupItem
						>
					{/each}
				</KleriToggleGroup>
			</div>

			{#if value.freq === 'WEEKLY'}
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-muted-foreground">{ctx.labels.repeatOn}</span>
					<KleriToggleGroup
						type="multiple"
						size="sm"
						value={selectedDays}
						onValueChange={(next: string[]) => {
							const days = next.length ? next : [WEEKDAY_CODES[start.getDay()]];
							update({ byDay: weekdays.filter((d) => days.includes(d)).map((day) => ({ day })) });
						}}
					>
						{#each weekdays as code (code)}
							{@const sample = new Date(2024, 0, 7 + WEEKDAY_CODES.indexOf(code))}
							<KleriToggleGroupItem
								value={code}
								aria-label={ctx.formatters.weekdayLong(sample)}
								class="w-8 px-0"
							>
								{ctx.formatters.weekdayNarrow(sample)}
							</KleriToggleGroupItem>
						{/each}
					</KleriToggleGroup>
				</div>
			{:else if value.freq === 'MONTHLY'}
				<KleriSelect
					items={monthlyItems}
					value={monthlyMode}
					ariaLabel={ctx.labels.repeatOn}
					onValueChange={setMonthlyMode}
				/>
			{/if}

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-muted-foreground">{ctx.labels.ends}</span>
				<KleriToggleGroup
					type="single"
					size="sm"
					variant="outline"
					value={endMode}
					onValueChange={(next: string) => next && setEndMode(next)}
				>
					<KleriToggleGroupItem value="never">{ctx.labels.never}</KleriToggleGroupItem>
					<KleriToggleGroupItem value="on">{ctx.labels.onDate}</KleriToggleGroupItem>
					<KleriToggleGroupItem value="after">{ctx.labels.after}</KleriToggleGroupItem>
				</KleriToggleGroup>
				{#if endMode === 'on' && value.until}
					<DateField
						value={value.until}
						min={start}
						class="w-44"
						onValueChange={(d) => {
							const until = new Date(d);
							until.setHours(23, 59, 59, 0);
							update({ until });
						}}
					/>
				{:else if endMode === 'after'}
					<span class="flex items-center gap-2">
						<input
							type="number"
							min="1"
							max="999"
							class={inputClass}
							aria-label={ctx.labels.occurrences}
							value={value.count ?? 10}
							oninput={(e) =>
								update({ count: Math.max(1, Math.min(999, Number(e.currentTarget.value) || 1)) })}
						/>
						<span class="text-muted-foreground">{ctx.labels.occurrences}</span>
					</span>
				{/if}
			</div>

			<p class={cn('font-spacemono text-xs text-brand')}>
				{describeRecurrence(value, { locale, start })}
			</p>
		</div>
	{/if}
</div>
