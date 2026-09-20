<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { Check, ChevronsUpDown, Search } from '@lucide/svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import {
		FIELD_CONTROL,
		FIELD_ICON_SIZE,
		FIELD_ICON_STROKE,
		FIELD_ROOT,
		fieldShell,
		type FieldIcon
	} from './field.js';

	export type KleriComboboxItem = {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	};

	interface Props {
		/** Options to pick from. */
		items: KleriComboboxItem[];
		/** Value of the selected item. Bindable. */
		value?: string;
		/** Whether the options list is open. Bindable. */
		open?: boolean;
		/** Text shown above the field. */
		label?: string;
		placeholder?: string;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		/** Allow clearing the selection by picking the selected item again. */
		allowDeselect?: boolean;
		/** Validation errors. Shown next to the label and shake the field. */
		errors?: string[];
		/** Message shown when no item matches the search. */
		emptyText?: string;
		/** Leading icon component. @default Search */
		InputIcon?: FieldIcon;
		/** Draw the resting border. @default true */
		withBorder?: boolean;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new value whenever the selection changes. */
		onValueChange?: (value: string) => void;
		/** Called with the new state whenever the options list opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** Accessible name for the search input. Falls back to `label`, then `placeholder`. */
		ariaLabel?: string;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
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
		errors,
		emptyText = 'No matching options.',
		InputIcon = Search,
		withBorder = true,
		shake = false,
		onValueChange,
		onOpenChange,
		ariaLabel,
		id,
		class: className
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);

	let searchValue = $state('');
	let hasErrors = $derived((errors?.length ?? 0) > 0);
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

	/**
	 * Clicking the field is a request to see the options, exactly like the
	 * chevron. Without this the list only appears once the user types.
	 */
	function handleInputClick() {
		if (!open) open = true;
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) searchValue = '';
		onOpenChange?.(nextOpen);
	}
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} for={controlId} />

	<Combobox.Root
		type="single"
		{items}
		bind:value
		bind:open
		{name}
		{required}
		{disabled}
		{allowDeselect}
		onValueChange={(next) => onValueChange?.(next)}
		onOpenChange={handleOpenChange}
	>
		<div
			class={fieldShell({ withBorder, hasErrors, disabled })}
			class:kleri-shake={hasErrors || shake}
		>
			<InputIcon
				size={FIELD_ICON_SIZE}
				strokeWidth={FIELD_ICON_STROKE}
				class="shrink-0 text-foreground"
				aria-hidden="true"
			/>
			<Combobox.Input
				id={controlId}
				{placeholder}
				aria-label={ariaLabel ?? label ?? placeholder}
				aria-invalid={hasErrors || undefined}
				oninput={handleInput}
				onclick={handleInputClick}
				class={FIELD_CONTROL}
			/>
			<Combobox.Trigger
				aria-label={`Open ${label ?? 'options'}`}
				class="flex size-6 shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:text-kleri-2 focus-visible:text-kleri-2 focus-visible:outline-hidden disabled:cursor-not-allowed"
			>
				<ChevronsUpDown size={19} strokeWidth={FIELD_ICON_STROKE} aria-hidden="true" />
			</Combobox.Trigger>
		</div>

		<Combobox.Portal>
			<Combobox.Content
				sideOffset={8}
				class="z-50 w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] overflow-hidden rounded-kleri border-2 border-border bg-popover p-1 text-popover-foreground shadow-xl outline-hidden"
			>
				<Combobox.Viewport class="kleri-scrollbar max-h-64 overflow-y-auto p-1">
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
</div>
