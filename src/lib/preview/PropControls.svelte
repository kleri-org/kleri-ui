<script lang="ts">
	import {
		KleriInput,
		KleriSelect,
		KleriSwitch,
		KleriToggleGroup,
		KleriToggleGroupItem
	} from '$lib';
	import { Type, Hash } from '@lucide/svelte';

	export type PropType = 'boolean' | 'string' | 'number' | 'choice';

	export type PropSchema = {
		[key: string]: {
			type: PropType;
			label: string;
			/** Allowed values for a `choice` prop. Up to four render as a toggle group, more as a select. */
			options?: readonly string[];
			/** One line explaining what the prop does, shown under the control. */
			description?: string;
		};
	};

	interface Props {
		schema: PropSchema;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		values: Record<string, any>;
	}

	let { schema, values = $bindable() }: Props = $props();

	const uid = $props.id();
	/** Choices up to this many fit side by side as a toggle group. */
	const MAX_TOGGLE_OPTIONS = 4;
</script>

<div class="space-y-4">
	{#each Object.entries(schema) as [key, config] (key)}
		{@const descriptionId = config.description ? `${uid}-${key}-description` : undefined}
		<div class="space-y-1.5">
			{#if config.type === 'boolean'}
				<p class="text-sm font-medium text-foreground">{config.label}</p>
				<div class="flex items-center gap-3">
					<KleriSwitch
						ariaLabel={config.label}
						aria-describedby={descriptionId}
						bind:value={values[key]}
					/>
					<span class="font-spacemono text-sm text-muted-foreground">
						{values[key] ? 'true' : 'false'}
					</span>
				</div>
			{:else if config.type === 'string'}
				<KleriInput
					label={config.label}
					type="text"
					bind:value={values[key]}
					InputIcon={Type}
					aria-describedby={descriptionId}
				/>
			{:else if config.type === 'number'}
				<KleriInput
					label={config.label}
					type="number"
					bind:value={values[key]}
					InputIcon={Hash}
					aria-describedby={descriptionId}
				/>
			{:else if config.type === 'choice'}
				{@const options = config.options ?? []}
				{#if options.length <= MAX_TOGGLE_OPTIONS}
					<p id="{uid}-{key}-label" class="text-sm font-medium text-foreground">{config.label}</p>
					<KleriToggleGroup
						type="single"
						size="sm"
						variant="outline"
						aria-labelledby="{uid}-{key}-label"
						aria-describedby={descriptionId}
						class="flex-wrap"
						bind:value={
							() => values[key],
							// A single toggle group clears its value when the active item is
							// pressed again; a prop always needs one of its options.
							(next: string) => {
								if (next) values[key] = next;
							}
						}
					>
						{#each options as option (option)}
							<KleriToggleGroupItem value={option} class="font-spacemono">
								{option}
							</KleriToggleGroupItem>
						{/each}
					</KleriToggleGroup>
				{:else}
					<KleriSelect
						label={config.label}
						items={options.map((option) => ({ value: option, label: option }))}
						bind:value={values[key]}
						aria-describedby={descriptionId}
					/>
				{/if}
			{/if}
			{#if config.description}
				<p id={descriptionId} class="ps-2 font-spacemono text-xs text-muted-foreground">
					{config.description}
				</p>
			{/if}
		</div>
	{/each}
</div>
