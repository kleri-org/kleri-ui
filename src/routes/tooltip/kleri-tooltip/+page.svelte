<script lang="ts">
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Tooltip content',
		side: 'bottom' as const,
		sideOffset: 5,
		arrow: false,
		disabled: false
	});

	const schema = {
		children: { type: 'string' as const, label: 'Tooltip Text' },
		sideOffset: { type: 'number' as const, label: 'Side Offset' },
		arrow: { type: 'boolean' as const, label: 'Show Arrow' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/tooltip" class="transition-colors hover:text-kleri-green-2">Tooltip</a>
			<span>/</span>
			<span class="text-foreground">KleriTooltip</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriTooltip</h1>
		<p class="text-lg text-muted-foreground">
			Accessible tooltip with configurable side, offset, and optional arrow.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<KleriTooltip
					side={props.side}
					sideOffset={props.sideOffset}
					arrow={props.arrow}
					disabled={props.disabled}
				>
					{#snippet trigger(triggerProps)}
						<button
							{...triggerProps}
							class="rounded-kleri border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-kleri-green-2"
						>
							Hover me
						</button>
					{/snippet}
					<p>{props.children}</p>
				</KleriTooltip>
			</div>
			<CodePreview component="KleriTooltip" {props} />
		</div>

		<!-- Controls -->
		<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
			<h2
				class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
			>
				Props
			</h2>
			<PropControls {schema} bind:values={props} />
		</div>
	</div>
</div>
