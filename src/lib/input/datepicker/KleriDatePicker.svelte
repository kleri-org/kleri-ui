<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import { Calendar as CalendarIcon, ChevronDown } from '@lucide/svelte';
	import { cn } from '#lib/utils.js';
	import * as Popover from '#lib/menus/popover/index.js';
	import KleriFieldLabel from '../KleriFieldLabel.svelte';
	import {
		FIELD_ICON_SIZE,
		FIELD_ICON_STROKE,
		FIELD_ROOT,
		describedBy,
		fieldErrorId,
		fieldShell
	} from '../field.js';
	import { Calendar } from './calendar/index.js';

	/**
	 * Attributes that land on the trigger button — the `aria-*`/`data-*` set a
	 * formsnap `Form.Control` snippet spreads in, plus any consumer onClick.
	 */
	type TriggerAttributes = Omit<
		PopoverPrimitive.TriggerProps,
		'children' | 'child' | 'id' | 'class' | 'disabled' | 'ref' | 'name'
	>;

	type CalendarProps = ComponentProps<typeof Calendar>;

	type Props = TriggerAttributes & {
		/** Selected date. Bindable. Any `@internationalized/date` value, e.g. a `CalendarDate`. */
		value?: DateValue;
		/** Whether the calendar popover is open. Bindable. */
		open?: boolean;
		/** Text shown above the field. */
		label?: string;
		/** Text shown in the trigger while no date is picked. */
		placeholder?: string;
		/** Validation errors. Shown under the label, announced, and shake the field. */
		errors?: string[];
		/** Name of the hidden input (ISO date, e.g. `2026-11-12`), for native form submission. */
		name?: string;
		disabled?: boolean;
		/** Draw the resting border. @default true */
		withBorder?: boolean;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Earliest selectable date. */
		minValue?: DateValue;
		/** Latest selectable date. */
		maxValue?: DateValue;
		/** Return `true` to disable a date, e.g. weekends or booked days. */
		isDateDisabled?: (date: DateValue) => boolean;
		/** BCP 47 locale for the trigger text and the calendar. @default 'en-US' */
		locale?: string;
		/** How the selected date reads in the trigger. @default { dateStyle: 'long' } */
		formatOptions?: Intl.DateTimeFormatOptions;
		/** Month/year header: plain label, or dropdowns for fast jumps. @default 'label' */
		captionLayout?: CalendarProps['captionLayout'];
		/** First day of the week, `0` = Sunday … `6` = Saturday. */
		weekStartsOn?: CalendarProps['weekStartsOn'];
		/** Keep the date selected when it is clicked again, instead of clearing it. @default false */
		preventDeselect?: boolean;
		/** Called with the new value whenever the selection changes. */
		onValueChange?: (value: DateValue | undefined) => void;
		/** Called with the new state whenever the popover opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Accessible name for the trigger. Without it a labelled picker is named by
		 * its label plus the chosen date, and an unlabelled one by `placeholder`.
		 */
		ariaLabel?: string;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
		class?: ClassValue;
	};

	let {
		value = $bindable(),
		open = $bindable(false),
		label,
		placeholder = 'Pick a date',
		errors,
		name,
		disabled = false,
		withBorder = true,
		shake = false,
		minValue,
		maxValue,
		isDateDisabled,
		locale = 'en-US',
		formatOptions = { dateStyle: 'long' },
		captionLayout = 'label',
		weekStartsOn,
		preventDeselect = false,
		onValueChange,
		onOpenChange,
		ariaLabel,
		id,
		'aria-describedby': ariaDescribedBy,
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);
	let labelId = $derived(`${controlId}-label`);
	let valueId = $derived(`${controlId}-value`);
	let errorId = $derived(fieldErrorId(controlId));

	let hasErrors = $derived((errors?.length ?? 0) > 0);
	/** formsnap marks the control invalid before Kleri gets any `errors` of its own. */
	let isInvalid = $derived(hasErrors ? true : restProps['aria-invalid']);

	let formatter = $derived(new DateFormatter(locale, formatOptions));
	let display = $derived(value ? formatter.format(value.toDate(getLocalTimeZone())) : '');

	function handleValueChange(next: DateValue | undefined) {
		onValueChange?.(next);
		// Picking a day finishes the job; clearing one leaves the popover as it was.
		if (next) open = false;
	}
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel id={labelId} {label} {errors} {errorId} for={controlId} />

	<Popover.Root bind:open {onOpenChange}>
		<Popover.Trigger
			{...restProps}
			id={controlId}
			{disabled}
			data-slot="field-shell"
			aria-label={ariaLabel ?? (label ? undefined : display || placeholder)}
			aria-labelledby={ariaLabel || !label ? undefined : `${labelId} ${valueId}`}
			aria-invalid={isInvalid}
			aria-describedby={describedBy(hasErrors && errorId, ariaDescribedBy)}
			class={cn(
				fieldShell({ withBorder, hasErrors, disabled }),
				'cursor-pointer justify-between text-left',
				disabled && 'cursor-not-allowed',
				(hasErrors || shake) && 'kleri-shake'
			)}
		>
			<div class="flex min-w-0 flex-1 flex-row items-center gap-3 text-foreground">
				<CalendarIcon
					size={FIELD_ICON_SIZE}
					strokeWidth={FIELD_ICON_STROKE}
					class="shrink-0 text-foreground"
					aria-hidden="true"
				/>
				{#if value}
					<span id={valueId} class="truncate">{display}</span>
				{:else}
					<span id={valueId} class="truncate text-muted-foreground">{placeholder}</span>
				{/if}
			</div>

			<ChevronDown
				size={FIELD_ICON_SIZE}
				strokeWidth={FIELD_ICON_STROKE}
				class="shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
		</Popover.Trigger>

		<Popover.Content align="start" sideOffset={8} class="w-auto gap-0 p-0">
			<Calendar
				type="single"
				bind:value
				{locale}
				{captionLayout}
				{weekStartsOn}
				{minValue}
				{maxValue}
				{isDateDisabled}
				{preventDeselect}
				onValueChange={handleValueChange}
			/>
		</Popover.Content>
	</Popover.Root>

	{#if name}
		<input type="hidden" {name} value={value?.toString() ?? ''} {disabled} />
	{/if}
</div>
