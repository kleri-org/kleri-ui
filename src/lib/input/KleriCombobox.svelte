<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { Check, ChevronsUpDown, Search } from '@lucide/svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	export type KleriComboboxItem = {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	};

	interface Props {
		items: KleriComboboxItem[];
		value?: string;
		open?: boolean;
		label?: string;
		placeholder?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		allowDeselect?: boolean;
		errors?: string[];
		emptyText?: string;
		ariaLabel?: string;
		class?: ClassValue;
	}

	let {
		items,
		value = $bindable(''),
		open = $bindable(false),
		label,
		placeholder = 'Search options…',
		name,
		required = false,
		disabled = false,
		allowDeselect = false,
		errors = [],
		emptyText = 'No matching options.',
		ariaLabel,
		class: className
	}: Props = $props();

	let searchValue = $state('');
	let hasErrors = $derived(errors.length > 0);
	let filteredItems = $derived(
		searchValue.trim() === ''
			? items
			: items.filter((item) => {
					const query = searchValue.toLowerCase();
					return `${item.label} ${item.description ?? ''}`.toLowerCase().includes(query);
				})
	);

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		searchValue = event.currentTarget.value;
	}

	function handleOpenChange(nextOpen: boolean) {
		open = nextOpen;
		if (!nextOpen) searchValue = '';
	}
</script>

<label class={cn('block w-full text-sm font-medium select-none', className)}>
	{#if label || hasErrors}
		<div class="inline-flex flex-row items-center align-middle">
			{#if label}
				<p class="indent-2">{label}</p>
			{/if}
			{#each errors as error, index (index)}
				<p class="indent-2 font-spacemono text-xs text-red-400">({error})</p>
			{/each}
		</div>
	{/if}

	<Combobox.Root
		type="single"
		{items}
		bind:value
		bind:open
		{name}
		{required}
		{disabled}
		{allowDeselect}
		onOpenChange={handleOpenChange}
	>
		<div
			class={cn(
				'my-1 flex w-full items-center gap-2 overflow-hidden rounded-kleri border-2 border-border bg-transparent py-3 pr-3 pl-4 transition-colors focus-within:kleri-border dark:focus-within:kleri-border-dark',
				hasErrors && 'border-red-400 focus-within:border-red-400'
			)}
			class:shake-it={hasErrors}
		>
			<Search size={22} strokeWidth={2.5} class="shrink-0 text-foreground" aria-hidden="true" />
			<Combobox.Input
				{placeholder}
				aria-label={ariaLabel ?? label ?? placeholder}
				aria-invalid={hasErrors || undefined}
				oninput={handleInput}
				class="min-w-0 flex-1 border-0 bg-transparent px-1 text-foreground placeholder-muted-foreground outline-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed"
			/>
			<Combobox.Trigger
				aria-label={`Open ${label ?? 'options'}`}
				class="flex size-6 shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:text-kleri-2 focus-visible:text-kleri-2 focus-visible:outline-hidden disabled:cursor-not-allowed"
			>
				<ChevronsUpDown size={19} strokeWidth={2.5} aria-hidden="true" />
			</Combobox.Trigger>
		</div>

		<Combobox.Portal>
			<Combobox.Content
				sideOffset={8}
				class="z-50 w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] overflow-hidden rounded-kleri border-2 border-border bg-popover p-1 text-popover-foreground shadow-xl outline-hidden"
			>
				<Combobox.Viewport class="max-h-64 overflow-y-auto p-1">
					{#each filteredItems as item (item.value)}
						<Combobox.Item
							value={item.value}
							label={item.label}
							disabled={item.disabled}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-hidden transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-kleri-2/20 data-highlighted:text-foreground"
						>
							{#snippet children({ selected })}
								<div class="min-w-0 flex-1">
									<div class="truncate">{item.label}</div>
									{#if item.description}
										<div class="mt-0.5 truncate font-spacemono text-xs text-muted-foreground">
											{item.description}
										</div>
									{/if}
								</div>
								{#if selected}
									<Check
										size={18}
										strokeWidth={2.75}
										class="shrink-0 text-kleri-2"
										aria-hidden="true"
									/>
								{/if}
							{/snippet}
						</Combobox.Item>
					{:else}
						<p class="px-3 py-5 text-center font-spacemono text-xs text-muted-foreground">
							{emptyText}
						</p>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
</label>

<style>
	@keyframes shake-it {
		0%,
		100% {
			transform: translateX(0);
		}

		20% {
			transform: translateX(-7px);
		}

		40% {
			transform: translateX(6px);
		}

		60% {
			transform: translateX(-4px);
		}

		80% {
			transform: translateX(2px);
		}
	}

	.shake-it {
		animation: shake-it 0.5s ease-in-out;
	}

	:global([data-combobox-viewport]) {
		scrollbar-width: thin;
		scrollbar-color: var(--color-kleri-2) transparent;
	}

	:global([data-combobox-viewport]::-webkit-scrollbar) {
		width: 8px;
	}

	:global([data-combobox-viewport]::-webkit-scrollbar-thumb) {
		background: var(--color-kleri-2);
		border: 2px solid transparent;
		border-radius: 9999px;
		background-clip: padding-box;
	}
</style>
