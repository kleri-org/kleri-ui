<script lang="ts">
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
		<div class="space-y-1.5">
			<label class="text-sm font-medium text-foreground" for="control-{key}">
				{config.label}
			</label>

			{#if config.type === 'boolean'}
				<div class="flex items-center gap-3">
					<button
						id="control-{key}"
						type="button"
						role="switch"
						aria-label={config.label}
						aria-checked={values[key]}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-kleri-green-2 focus:ring-offset-2 focus:ring-offset-background focus:outline-none {values[
							key
						]
							? 'bg-kleri-green-3'
							: 'bg-muted'}"
						onclick={() => (values[key] = !values[key])}
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {values[
								key
							]
								? 'translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
					<span class="font-spacemono text-sm text-muted-foreground">
						{values[key] ? 'true' : 'false'}
					</span>
				</div>
			{:else if config.type === 'string'}
				<input
					id="control-{key}"
					type="text"
					bind:value={values[key]}
					class="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-kleri-green-2 focus:outline-none"
				/>
			{:else if config.type === 'number'}
				<input
					id="control-{key}"
					type="number"
					bind:value={values[key]}
					class="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-spacemono text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-kleri-green-2 focus:outline-none"
				/>
			{/if}
		</div>
	{/each}
</div>
