<script lang="ts">
	import { Popover } from 'bits-ui';
	import { CalendarDays } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from '$lib/input/KleriFieldLabel.svelte';
	import { FIELD_ROOT, describedBy, fieldErrorId, fieldShell } from '$lib/input/field.js';
	import { getCalendarContext } from '../../context.js';
	import MiniCalendar from '../MiniCalendar.svelte';

	/** A date picker: a Kleri field that opens a mini month. */
	interface Props {
		value: Date;
		label?: string;
		min?: Date;
		errors?: string[];
		onValueChange?: (date: Date) => void;
		class?: string;
	}

	let {
		value = $bindable(),
		label,
		min,
		errors,
		onValueChange,
		class: className
	}: Props = $props();
	const ctx = getCalendarContext();
	const uid = $props.id();
	const errorId = fieldErrorId(uid);
	let open = $state(false);
	let hasErrors = $derived((errors?.length ?? 0) > 0);
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} {errorId} for={uid} />
	<Popover.Root bind:open>
		<Popover.Trigger
			id={uid}
			aria-label={label
				? `${label}: ${ctx.formatters.fullDate(value)}`
				: ctx.formatters.fullDate(value)}
			aria-invalid={hasErrors || undefined}
			aria-describedby={describedBy(hasErrors && errorId)}
			class={cn(fieldShell({ hasErrors }), 'text-left')}
		>
			<CalendarDays class="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
			<span class="truncate"
				>{ctx.formatters.mediumDate(value)}{value.getFullYear() !== ctx.today.getFullYear()
					? `, ${value.getFullYear()}`
					: ''}</span
			>
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				side="bottom"
				align="start"
				sideOffset={6}
				class="kleri-dropdown z-[60] w-64 rounded-kleri border border-border/50 kleri-glass p-3 text-popover-foreground shadow-xl outline-hidden"
			>
				<MiniCalendar
					{value}
					{min}
					onSelect={(day) => {
						value = day;
						onValueChange?.(day);
						open = false;
					}}
				/>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>
