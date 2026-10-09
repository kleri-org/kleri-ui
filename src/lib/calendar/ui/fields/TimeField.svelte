<script lang="ts">
	import { Select } from 'bits-ui';
	import { Check, Clock } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from '$lib/input/KleriFieldLabel.svelte';
	import { FIELD_ROOT, describedBy, fieldErrorId, fieldShell } from '$lib/input/field.js';
	import { getCalendarContext } from '../../context.js';
	import { atMinutes } from '../../core/date.js';

	/**
	 * A time-of-day picker in `step`-minute increments. With `durationFrom`
	 * (the start, in minutes) each option also shows the resulting duration,
	 * and earlier times are left out — the classic end-time list.
	 */
	interface Props {
		/** Minutes past midnight. */
		value: number;
		label?: string;
		step?: number;
		durationFrom?: number;
		errors?: string[];
		onValueChange?: (minutes: number) => void;
		class?: string;
	}

	let {
		value = $bindable(),
		label,
		step = 15,
		durationFrom,
		errors,
		onValueChange,
		class: className
	}: Props = $props();
	const ctx = getCalendarContext();
	const uid = $props.id();
	const errorId = fieldErrorId(uid);

	let options = $derived.by(() => {
		const minutes = new Set<number>();
		const from = durationFrom !== undefined ? durationFrom + step : 0;
		// An end list runs up to midnight; overnight events change the end date instead.
		const to = durationFrom !== undefined ? 24 * 60 : 24 * 60 - step;
		for (let m = from; m <= to; m += step) minutes.add(m);
		// Keep off-grid times (e.g. 9:05 from another app) selectable.
		if (value !== undefined && !Number.isNaN(value)) minutes.add(value);
		return [...minutes]
			.sort((a, b) => a - b)
			.map((m) => {
				const time = ctx.formatters.time(atMinutes(ctx.today, m));
				const label =
					durationFrom !== undefined
						? `${time}${m >= 24 * 60 ? ' +1' : ''} · ${ctx.formatters.duration(m - durationFrom)}`
						: time;
				return { value: String(m), label, time };
			});
	});
	let selected = $derived(options.find((o) => o.value === String(value)));
	let hasErrors = $derived((errors?.length ?? 0) > 0);
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} {errorId} for={uid} />
	<Select.Root
		type="single"
		items={options}
		value={String(value)}
		onValueChange={(next) => {
			value = Number(next);
			onValueChange?.(value);
		}}
	>
		<Select.Trigger
			id={uid}
			aria-label={label ? `${label}: ${selected?.time ?? ''}` : selected?.time}
			aria-invalid={hasErrors || undefined}
			aria-describedby={describedBy(hasErrors && errorId)}
			class={cn(fieldShell({ hasErrors }), 'text-left', hasErrors && 'kleri-shake')}
		>
			<Clock class="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
			<span class="truncate font-spacemono text-[13px]">{selected?.time ?? '--:--'}</span>
		</Select.Trigger>
		<Select.Portal>
			<Select.Content
				sideOffset={6}
				class="kleri-dropdown z-[60] w-[var(--bits-select-anchor-width)] min-w-44 overflow-hidden rounded-kleri border border-border/50 kleri-glass p-1 text-popover-foreground shadow-xl outline-hidden"
			>
				<Select.Viewport class="kleri-scrollbar max-h-60 overflow-y-auto p-1">
					{#each options as option (option.value)}
						<Select.Item
							value={option.value}
							label={option.label}
							class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 font-spacemono text-xs outline-hidden data-highlighted:bg-kleri-2/20 data-selected:text-brand"
						>
							{#snippet children({ selected: isSelected })}
								<span>{option.label}</span>
								{#if isSelected}<Check class="size-3.5 shrink-0" strokeWidth={3} />{/if}
							{/snippet}
						</Select.Item>
					{/each}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
</div>
