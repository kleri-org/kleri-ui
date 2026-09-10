<script lang="ts">
	import type { FormEventHandler, HTMLInputAttributes } from 'svelte/elements';
	import type { ClassValue } from 'clsx';
	import type { WithElementRef } from '$lib/utils.js';

	import { cn } from '$lib/utils.js';
	import { Eye, EyeOff } from '@lucide/svelte';
	import KleriFieldLabel from './KleriFieldLabel.svelte';
	import {
		FIELD_CONTROL,
		FIELD_ICON_SIZE,
		FIELD_ICON_STROKE,
		FIELD_ROOT,
		fieldShell,
		type FieldIcon
	} from './field.js';

	type Props = {
		/** Current value. Bindable. */
		value?: string | number | null;
		/** Text shown above the field. */
		label?: string;
		/** Validation errors. Shown next to the label and shake the field. */
		errors?: string[];
		/** Leading icon component, e.g. a `@lucide/svelte` icon. */
		InputIcon?: FieldIcon;
		placeholder?: string;
		/** Any native input type. `password` adds a visibility toggle. */
		type?: string;
		required?: boolean;
		disabled?: boolean;
		/** Draw the resting border. @default true */
		withBorder?: boolean;
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new value on every input event. */
		onValueChange?: (value: string) => void;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
		class?: ClassValue;
	} & WithElementRef<HTMLInputAttributes, HTMLInputElement>;

	let {
		value = $bindable(''),
		label,
		errors,
		InputIcon,
		class: className,
		withBorder = true,
		placeholder = '',
		required = false,
		disabled = false,
		type = 'text',
		shake = false,
		onValueChange,
		oninput,
		id,
		ref = $bindable<HTMLInputElement | null>(null),
		...restProps
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);

	let isPasswordVisible = $state(false);
	let currentInputType = $derived(
		type === 'password' ? (isPasswordVisible ? 'text' : 'password') : type
	);

	let hasErrors = $derived((errors?.length ?? 0) > 0);

	const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
		onValueChange?.(event.currentTarget.value);
		oninput?.(event);
	};
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} for={controlId} />

	<!-- Main Input -->
	<div
		class={fieldShell({ withBorder, hasErrors, disabled })}
		class:kleri-shake={hasErrors || shake}
	>
		{#if InputIcon}
			<InputIcon
				size={FIELD_ICON_SIZE}
				strokeWidth={FIELD_ICON_STROKE}
				class="shrink-0 text-foreground"
			/>
		{/if}

		<input
			id={controlId}
			bind:this={ref}
			type={currentInputType}
			{required}
			{disabled}
			{placeholder}
			aria-invalid={hasErrors || undefined}
			class={FIELD_CONTROL}
			bind:value
			{...restProps}
			oninput={handleInput}
		/>

		{#if type === 'password'}
			<button
				type="button"
				{disabled}
				aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
				aria-pressed={isPasswordVisible}
				class="flex shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:text-kleri-2 focus-visible:text-kleri-2 focus-visible:outline-hidden disabled:cursor-not-allowed"
				onclick={(e) => {
					e.preventDefault();
					isPasswordVisible = !isPasswordVisible;
				}}
			>
				{#if isPasswordVisible}
					<EyeOff size={FIELD_ICON_SIZE} strokeWidth={FIELD_ICON_STROKE} />
				{:else}
					<Eye size={FIELD_ICON_SIZE} strokeWidth={FIELD_ICON_STROKE} />
				{/if}
			</button>
		{/if}
	</div>
</div>
