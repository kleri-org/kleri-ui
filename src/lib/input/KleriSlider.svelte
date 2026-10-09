<script lang="ts">
	import { Slider } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import { FIELD_ROOT, describedBy, fieldErrorId } from './field.js';

	interface Props {
		/** Text shown above the slider. */
		label?: string;
		/** Current value: a number for `single`, an array for `multiple`. Bindable. */
		value?: number | number[];
		/** Show the (formatted) value next to the label. */
		showValue?: boolean;
		/** `single` for one thumb, `multiple` for a range. @default 'single' */
		type?: 'single' | 'multiple';
		/** Formats each value for display, and for screen readers as `aria-valuetext`. */
		valueFormatter?: (value: number) => string;
		/** Validation errors. Shown under the label, announced, and shake the slider. */
		errors?: string[];
		disabled?: boolean;
		min?: number;
		max?: number;
		step?: number;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new value whenever the slider changes. */
		onValueChange?: (value: number | number[]) => void;
		/** Accessible name for the thumbs. Falls back to `label`. */
		ariaLabel?: string;
		/** Id of the label element, used to link it to the slider. Auto-generated when omitted. */
		id?: string;
		class?: ClassValue;
	}

	let {
		label,
		value = $bindable(0),
		showValue = false,
		type = 'single',
		valueFormatter = (v: number) => String(v),
		errors,
		disabled = false,
		min = 0,
		max = 100,
		step = 1,
		shake = false,
		onValueChange,
		ariaLabel,
		id,
		class: className
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);
	let errorId = $derived(fieldErrorId(controlId));

	let hasErrors = $derived((errors?.length ?? 0) > 0);
	let displayValue = $derived(
		Array.isArray(value) ? value.map(valueFormatter).join(' – ') : valueFormatter(value as number)
	);
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel
		id={controlId}
		{label}
		{errors}
		{errorId}
		hint={showValue ? displayValue : undefined}
	/>

	<!-- Slider -->
	<div class="my-1 w-full" class:kleri-shake={hasErrors || shake}>
		<Slider.Root
			{type}
			bind:value={
				// `type` decides whether bits-ui wants a number or a number[]; the
				// public `value` prop covers both, so the cast is unavoidable here.
				value as never
			}
			{min}
			{max}
			{step}
			{disabled}
			onValueChange={((next: number | number[]) => onValueChange?.(next)) as never}
			aria-labelledby={label ? controlId : undefined}
			class="relative flex w-full touch-none items-center select-none data-disabled:cursor-not-allowed data-disabled:opacity-50"
		>
			{#snippet children({ thumbItems })}
				<!-- A foreground mix, not --muted, so the unfilled track clears 3:1 in both themes. -->
				<span
					class="relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-foreground)_50%,transparent)]"
				>
					<Slider.Range class="absolute h-full rounded-full kleri-bg" />
				</span>
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb
						index={thumb.index}
						aria-label={ariaLabel ?? label}
						aria-valuetext={valueFormatter(thumb.value)}
						aria-describedby={describedBy(hasErrors && errorId)}
						class="relative block size-4 shrink-0 cursor-pointer rounded-full border-2 border-primary bg-background shadow-md ring-ring/40 ring-offset-background select-none after:absolute after:-inset-2 hover:ring-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden active:ring-2 data-disabled:pointer-events-none data-disabled:opacity-50"
					/>
				{/each}
			{/snippet}
		</Slider.Root>
	</div>
</div>
