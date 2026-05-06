<script lang="ts">
	import { KleriInput, KleriSwitch } from '$lib';
	import { Type, Hash } from '@lucide/svelte';

	export type PropType = 'boolean' | 'string' | 'number';

	export type PropSchema = {
		[key: string]: {
			type: PropType;
			label: string;
		};
	};

	interface Props {
		schema: PropSchema;
		values: Record<string, any>;
	}

	let { schema, values = $bindable() }: Props = $props();
</script>

<div class="space-y-4">
	{#each Object.entries(schema) as [key, config]}
		{#if config.type === 'boolean'}
			<div class="space-y-1.5">
				<p class="text-sm font-medium text-foreground">
					{config.label}
				</p>
				<div class="flex items-center gap-3">
					<KleriSwitch
						ariaLabel={config.label}
						bind:value={values[key]}
					/>
					<span class="font-spacemono text-sm text-muted-foreground">
						{values[key] ? 'true' : 'false'}
					</span>
				</div>
			</div>
		{:else if config.type === 'string'}
			<KleriInput
				label={config.label}
				type="text"
				bind:value={values[key]}
				InputIcon={Type}
			/>
		{:else if config.type === 'number'}
			<KleriInput
				label={config.label}
				type="number"
				bind:value={values[key]}
				InputIcon={Hash}
			/>
		{/if}
	{/each}
</div>
