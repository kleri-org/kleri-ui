<script lang="ts">
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let tooltipProps = $state({
		children: 'Tooltip content',
		side: 'bottom' as const,
		sideOffset: 5,
		arrow: false,
		disabled: false
	});
	const tooltipSchema = {
		children: { type: 'string' as const, label: 'Tooltip Text' },
		sideOffset: { type: 'number' as const, label: 'Side Offset' },
		arrow: { type: 'boolean' as const, label: 'Show Arrow' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
	};
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Tooltip</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Tooltip</h1>
		<p class="text-lg text-muted-foreground">Contextual information overlays and hints.</p>
	</div>

	<!-- KleriTooltip -->
	<section id="kleri-tooltip" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriTooltip</h2>
			<p class="text-muted-foreground">
				Accessible tooltip with configurable side, offset, and optional arrow.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriTooltip
						side={tooltipProps.side}
						sideOffset={tooltipProps.sideOffset}
						arrow={tooltipProps.arrow}
						disabled={tooltipProps.disabled}
					>
						{#snippet trigger(triggerProps)}
							<button
								{...triggerProps}
								class="rounded-kleri border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-kleri-2"
							>
								Hover me
							</button>
						{/snippet}
						<p>{tooltipProps.children}</p>
					</KleriTooltip>
				</div>
				<CodePreview component="KleriTooltip" props={tooltipProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={tooltipSchema} bind:values={tooltipProps} />
			</div>
		</div>
	</section>
</div>
