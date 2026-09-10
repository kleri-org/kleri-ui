<script lang="ts">
	import { Avatar, Select, type Select as SelectPrimitive } from 'bits-ui';
	import { Check, ChevronDown } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import {
		FIELD_ICON_SIZE,
		FIELD_ICON_STROKE,
		FIELD_ROOT,
		fieldShell,
		type FieldIcon
	} from './field.js';

	/** One option of a `KleriSelect`. */
	export interface KleriSelectItem<T extends string = string> {
		/** Value the select reports when this option is picked. */
		value: T;
		/** Text of the option, in the list and in the trigger. */
		label: string;
		/** Avatar image URL. Tauri file paths must be resolved with `convertFileSrc` first. */
		avatarUrl?: string | null;
		/** Icon component, e.g. a `@lucide/svelte` icon. Falls back inside the avatar. */
		icon?: Component;
		/** Run when this option becomes the selected one. */
		action?: () => void;
		disabled?: boolean;
	}

	/**
	 * Attributes that land on the trigger button — the `aria-*`/`data-*` set a
	 * formsnap `Form.Control` snippet spreads in, plus any consumer onClick.
	 */
	type TriggerAttributes = Omit<
		SelectPrimitive.TriggerProps,
		'children' | 'child' | 'id' | 'class' | 'disabled' | 'ref' | 'name'
	>;

	type Props = TriggerAttributes & {
		/** Options to pick from. */
		items: KleriSelectItem[];
		/** Value of the selected item. Bindable. */
		value?: string;
		/** Whether the options list is open. Bindable. */
		open?: boolean;
		/** Text shown above the field. */
		label?: string;
		placeholder?: string;
		/** Icon always shown in the trigger, ahead of an item's own icon. */
		persistentIcon?: FieldIcon;
		/** Validation errors. Shown next to the label and shake the field. */
		errors?: string[];
		/** Name of the hidden input, for native form submission. */
		name?: string;
		required?: boolean;
		disabled?: boolean;
		/** Draw the resting border. @default true */
		withBorder?: boolean;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new value whenever the selection changes. */
		onValueChange?: (value: string) => void;
		/** Called with the new state whenever the options list opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** Accessible name for the trigger. Falls back to `label`, then `placeholder`. */
		ariaLabel?: string;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
		class?: ClassValue;
	};

	let {
		items,
		value = $bindable(''),
		open = $bindable(false),
		label,
		placeholder = 'Select an option',
		persistentIcon,
		errors,
		name,
		required = false,
		disabled = false,
		withBorder = true,
		shake = false,
		onValueChange,
		onOpenChange,
		ariaLabel,
		id,
		class: className,
		...restProps
	}: Props = $props();

	/** Icons inside a trigger avatar have less room than the standalone ones. */
	const AVATAR_ICON_SIZE = 14;

	const uid = $props.id();
	let controlId = $derived(id ?? uid);

	let hasErrors = $derived((errors?.length ?? 0) > 0);
	/** formsnap marks the control invalid before Kleri gets any `errors` of its own. */
	let isInvalid = $derived(hasErrors ? true : restProps['aria-invalid']);
	let selectedItem = $derived(items.find((item) => item.value === value));
	let triggerIcon = $derived(persistentIcon ?? selectedItem?.icon);

	function handleValueChange(next: string) {
		onValueChange?.(next);
		items.find((item) => item.value === next)?.action?.();
	}
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} for={controlId} />

	<Select.Root
		type="single"
		{items}
		bind:value
		bind:open
		{name}
		{required}
		{disabled}
		onValueChange={handleValueChange}
		onOpenChange={(next) => onOpenChange?.(next)}
	>
		<Select.Trigger
			{...restProps}
			id={controlId}
			aria-label={ariaLabel ?? label ?? placeholder}
			aria-invalid={isInvalid}
			class={cn(
				fieldShell({ withBorder, hasErrors, disabled }),
				'justify-between text-left',
				(hasErrors || shake) && 'kleri-shake'
			)}
		>
			<div class="flex min-w-0 flex-1 flex-row items-center gap-3 text-foreground">
				{#if selectedItem}
					{#if selectedItem.avatarUrl}
						<Avatar.Root class="size-6 shrink-0 overflow-hidden rounded-full">
							<Avatar.Image
								src={selectedItem.avatarUrl}
								alt={selectedItem.label}
								class="size-full rounded-full object-cover"
							/>
							<Avatar.Fallback
								class="flex size-full items-center justify-center rounded-full bg-muted"
							>
								{#if triggerIcon}
									{@const Icon = triggerIcon}
									<Icon
										size={AVATAR_ICON_SIZE}
										strokeWidth={FIELD_ICON_STROKE}
										aria-hidden="true"
									/>
								{/if}
							</Avatar.Fallback>
						</Avatar.Root>
					{:else if triggerIcon}
						{@const Icon = triggerIcon}
						<Icon
							size={FIELD_ICON_SIZE}
							strokeWidth={FIELD_ICON_STROKE}
							class="shrink-0"
							aria-hidden="true"
						/>
					{/if}
					<span class="truncate">{selectedItem.label}</span>
				{:else}
					{#if triggerIcon}
						{@const Icon = triggerIcon}
						<Icon
							size={FIELD_ICON_SIZE}
							strokeWidth={FIELD_ICON_STROKE}
							class="shrink-0"
							aria-hidden="true"
						/>
					{/if}
					<span class="truncate text-muted-foreground">{placeholder}</span>
				{/if}
			</div>

			<ChevronDown
				size={FIELD_ICON_SIZE}
				strokeWidth={FIELD_ICON_STROKE}
				class="shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
		</Select.Trigger>

		<Select.Portal>
			<Select.Content
				sideOffset={8}
				class="z-50 w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] overflow-hidden rounded-kleri border-2 border-border bg-popover p-1 text-popover-foreground shadow-xl outline-hidden"
			>
				<Select.Viewport class="kleri-scrollbar max-h-64 overflow-y-auto p-1">
					{#each items as item (item.value)}
						<Select.Item
							value={item.value}
							label={item.label}
							disabled={item.disabled}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-hidden transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-50 data-highlighted:bg-kleri-2/20 data-highlighted:text-foreground"
						>
							{#snippet children({ selected })}
								{#if item.avatarUrl}
									<Avatar.Root class="size-6 shrink-0 overflow-hidden rounded-full">
										<Avatar.Image
											src={item.avatarUrl}
											alt={item.label}
											class="size-full rounded-full object-cover"
										/>
										<Avatar.Fallback
											class="flex size-full items-center justify-center rounded-full bg-muted"
										>
											{#if item.icon}
												{@const ItemIcon = item.icon}
												<ItemIcon
													size={AVATAR_ICON_SIZE}
													strokeWidth={FIELD_ICON_STROKE}
													aria-hidden="true"
												/>
											{/if}
										</Avatar.Fallback>
									</Avatar.Root>
								{:else if item.icon}
									{@const ItemIcon = item.icon}
									<ItemIcon
										size={FIELD_ICON_SIZE}
										strokeWidth={FIELD_ICON_STROKE}
										class="shrink-0 text-foreground"
										aria-hidden="true"
									/>
								{/if}
								<span class="min-w-0 flex-1 truncate">{item.label}</span>
								{#if selected}
									<Check
										size={18}
										strokeWidth={2.75}
										class="shrink-0 text-kleri-2"
										aria-hidden="true"
									/>
								{/if}
							{/snippet}
						</Select.Item>
					{/each}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
</div>
