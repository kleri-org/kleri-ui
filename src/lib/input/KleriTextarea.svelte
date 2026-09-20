<script lang="ts">
	import type { FormEventHandler, HTMLTextareaAttributes } from 'svelte/elements';
	import type { ClassValue } from 'clsx';
	import type { WithElementRef } from '$lib/utils.js';

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

	type Props = {
		/** Current value. Bindable. */
		value?: string | null;
		/** Text shown above the field. */
		label?: string;
		/** Validation errors. Shown next to the label and shake the field. */
		errors?: string[];
		/** Leading icon component, e.g. a `@lucide/svelte` icon. */
		InputIcon?: FieldIcon;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		/** Draw the resting border. @default true */
		withBorder?: boolean;
		rows?: number;
		/** Controls the textarea resize behavior. Mirrors the CSS `resize` property. */
		resize?: 'none' | 'y' | 'x' | 'both';
		/** Play the shake animation. Errors trigger it on their own. */
		shake?: boolean;
		/** Called with the new value on every input event. */
		onValueChange?: (value: string) => void;
		/** Id of the control. Auto-generated when omitted, and used to link the label. */
		id?: string;
		class?: ClassValue;
	} & WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement>;

	let {
		value = $bindable<string | null>(''),
		label,
		errors,
		InputIcon,
		class: className,
		withBorder = true,
		placeholder = '',
		required = false,
		disabled = false,
		rows = 4,
		resize = 'none',
		shake = false,
		onValueChange,
		oninput,
		id,
		ref = $bindable<HTMLTextAreaElement | null>(null),
		...restProps
	}: Props = $props();

	const uid = $props.id();
	let controlId = $derived(id ?? uid);

	let hasErrors = $derived((errors?.length ?? 0) > 0);

	const RESIZE_CLASSES = {
		none: 'resize-none',
		y: 'resize-y',
		x: 'resize-x',
		both: 'resize'
	} as const;

	let resizeClass = $derived(RESIZE_CLASSES[resize]);

	const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
		onValueChange?.(event.currentTarget.value);
		oninput?.(event);
	};
</script>

<div class={cn(FIELD_ROOT, className)}>
	<KleriFieldLabel {label} {errors} for={controlId} />

	<!-- Main Textarea -->
	<div
		class={fieldShell({ withBorder, hasErrors, disabled, align: 'start' })}
		class:kleri-shake={hasErrors || shake}
	>
		{#if InputIcon}
			<InputIcon
				size={FIELD_ICON_SIZE}
				strokeWidth={FIELD_ICON_STROKE}
				class="mt-0.5 shrink-0 text-foreground"
			/>
		{/if}

		<textarea
			id={controlId}
			bind:this={ref}
			{required}
			{disabled}
			{rows}
			{placeholder}
			aria-invalid={hasErrors || undefined}
			class={cn(FIELD_CONTROL, 'kleri-scrollbar', resizeClass)}
			bind:value
			{...restProps}
			oninput={handleInput}></textarea>
	</div>
</div>
