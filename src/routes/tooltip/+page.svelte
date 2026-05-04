<script lang="ts">
	const tooltips = [
		{
			name: 'KleriTooltip',
			description: 'Accessible tooltip with configurable side, offset, and arrow support.',
			route: '/tooltip/kleri-tooltip'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Tooltip</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Tooltip</h1>
		<p class="text-muted-foreground text-lg">Contextual information overlays and hints.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each tooltips as tooltip}
			<a
				href="{tooltip.route}"
				class="group rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
			>
				<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors mb-2">
					{tooltip.name}
				</h3>
				<p class="text-sm text-muted-foreground">{tooltip.description}</p>
			</a>
		{/each}
	</div>
</div>
