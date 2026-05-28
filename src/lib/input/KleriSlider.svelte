<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	interface KleriSliderProps {
		label?: string;
		errors?: string[];
		showValue?: boolean;
		valueFormatter?: (value: number) => string;
		class?: ClassValue;
	}

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = 'horizontal',
		class: className,
		label,
		errors = [],
		showValue = true,
		valueFormatter = (v: number) => String(v),
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & KleriSliderProps = $props();

	let displayValue = $derived.by(() => {
		if (Array.isArray(value)) {
			return value.map(valueFormatter).join(' – ');
		}
		return value !== undefined ? valueFormatter(value as number) : '';
	});

	let hasErrors = $derived(errors.length > 0);
</script>

<label class="block w-full select-none">
	<!-- Label and Value -->
	{#if label || showValue}
		<div class="inline-flex w-full flex-row items-center justify-between align-middle">
			{#if label}
				<p class="indent-2 text-sm font-medium">{label}</p>
			{:else}
				<span></span>
			{/if}
			{#if showValue}
				<p class="pr-1 font-spacemono text-xs text-muted-foreground">{displayValue}</p>
			{/if}
		</div>
	{/if}

	<!-- Slider -->
	<div class={cn('my-1 w-full', hasErrors && 'shake-it')}>
		<SliderPrimitive.Root
			bind:ref
			bind:value={value as never}
			{orientation}
			data-slot="slider"
			class={cn(
				'relative flex touch-none items-center select-none',
				'data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
				'data-disabled:cursor-not-allowed data-disabled:opacity-50',
				className
			)}
			{...restProps}
		>
			{#snippet children({ thumbItems })}
				<span
					data-slot="slider-track"
					data-orientation={orientation}
					class={cn(
						'relative grow overflow-hidden rounded-kleri bg-muted',
						'data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full',
						'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2'
					)}
				>
					<SliderPrimitive.Range
						data-slot="slider-range"
						class={cn(
							'absolute rounded-kleri select-none',
							'data-[orientation=horizontal]:h-full',
							'data-[orientation=vertical]:w-full',
							'bg-primary'
						)}
					/>
				</span>
				{#each thumbItems as thumb (thumb.index)}
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						index={thumb.index}
						class={cn(
							'relative block shrink-0 cursor-grab rounded-full border-2 bg-white',
							'size-4 transition-all duration-150 ease-out',
							'border-[var(--color-kleri-3)]',
							'shadow-sm',
							'after:absolute after:-inset-2 after:rounded-full',
							'hover:scale-110 hover:shadow-md',
							'focus-visible:ring-2 focus-visible:ring-[var(--color-kleri-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden',
							'active:scale-105 active:cursor-grabbing',
							'disabled:pointer-events-none disabled:opacity-50'
						)}
					/>
				{/each}
			{/snippet}
		</SliderPrimitive.Root>
	</div>

	<!-- Errors -->
	{#if hasErrors}
		<div class="flex flex-row flex-wrap gap-x-2 pt-0.5 pl-2">
			{#each errors as error, i (i)}
				<p class="font-spacemono text-xs text-red-400">({error})</p>
			{/each}
		</div>
	{/if}
</label>

<style>
	@keyframes shake-it {
		0% {
			transform: translateX(0);
		}
		10% {
			transform: translateX(-9px);
		}
		20% {
			transform: translateX(8px);
		}
		30% {
			transform: translateX(-7px);
		}
		40% {
			transform: translateX(6px);
		}
		50% {
			transform: translateX(-5px);
		}
		60% {
			transform: translateX(4px);
		}
		70% {
			transform: translateX(-3px);
		}
		80% {
			transform: translateX(2px);
		}
		90% {
			transform: translateX(-1px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.shake-it {
		animation: shake-it 0.5s ease-in-out;
	}
</style>
