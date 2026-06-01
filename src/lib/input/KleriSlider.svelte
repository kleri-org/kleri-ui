<script lang="ts">
	import { Slider } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	interface Props {
		label?: string;
		value?: number | number[];
		showValue?: boolean;
		type?: 'single' | 'multiple';
		valueFormatter?: (value: number) => string;
		errors?: string[];
		disabled?: boolean;
		min?: number;
		max?: number;
		step?: number;
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
		class: className
	}: Props = $props();

	let displayValue = $derived(
		Array.isArray(value) ? value.map(valueFormatter).join(' – ') : valueFormatter(value as number)
	);
</script>

<label class="block w-full text-sm font-medium select-none">
	<!-- Label and Value/Errors -->
	<div class="inline-flex flex-row items-center align-middle">
		{#if label}
			<p class="indent-2">{label}</p>
		{/if}
		{#if showValue}
			<p class="indent-2 font-spacemono text-xs text-muted-foreground">
				{displayValue}
			</p>
		{/if}
		{#if errors}
			{#each errors as error, i (i)}
				<p class="indent-2 font-spacemono text-xs text-red-400">
					({error})
				</p>
			{/each}
		{/if}
	</div>

	<!-- Slider -->
	<div class={cn('my-1 w-full', errors && errors.length > 0 && 'shake-it', className)}>
		<Slider.Root
			{type}
			bind:value={value as never}
			{min}
			{max}
			{step}
			{disabled}
			class="relative flex w-full touch-none items-center select-none data-disabled:opacity-50"
		>
			{#snippet children({ thumbItems })}
				<span class="relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full bg-muted">
					<Slider.Range class="absolute h-full rounded-full kleri-bg" />
				</span>
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb
						index={thumb.index}
						class="relative block size-4 shrink-0 cursor-pointer rounded-full border-2 border-white bg-white shadow-md ring-kleri-2/50 select-none after:absolute after:-inset-2 hover:ring-2 focus-visible:ring-2 focus-visible:outline-hidden active:ring-2 disabled:pointer-events-none disabled:opacity-50"
					/>
				{/each}
			{/snippet}
		</Slider.Root>
	</div>
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

	.kleri-bg {
		background: linear-gradient(90deg, var(--color-kleri-1), var(--color-kleri-2));
	}
</style>
