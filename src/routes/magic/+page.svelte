<script lang="ts">
	const magic = [
		{
			name: 'KleriMagicCard',
			description: 'Card with an animated radial gradient border and inner glow that follows the cursor.',
			route: '/magic/kleri-magic-card'
		},
		{
			name: 'KleriMagicButton',
			description: 'Button with an animated radial gradient border and glow effect that follows the cursor.',
			route: '/magic/kleri-magic-button'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Magic</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Magic</h1>
		<p class="text-muted-foreground text-lg">Enchanted interactive components with cursor-following effects.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each magic as item}
			<a
				href="{item.route}"
				class="group rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
			>
				<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors mb-2">
					{item.name}
				</h3>
				<p class="text-sm text-muted-foreground">{item.description}</p>
			</a>
		{/each}
	</div>
</div>
