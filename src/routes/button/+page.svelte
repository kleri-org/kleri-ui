<script lang="ts">
	const buttons = [
		{
			name: 'KleriButton',
			description: 'Primary action button with success state and loading feedback.',
			route: '/button/kleri-button'
		},
		{
			name: 'KleriUtilityButton',
			description: 'Utility button with built-in tooltip support.',
			route: '/button/kleri-utility-button'
		},
		{
			name: 'KleriMagicButton',
			description: 'Button with an animated radial gradient border and glow effect.',
			route: '/button/kleri-magic-button'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Button</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Button</h1>
		<p class="text-muted-foreground text-lg">Interactive buttons with states, effects, and feedback.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each buttons as button}
			<a
				href="{button.route}"
				class="group rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
			>
				<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors mb-2">
					{button.name}
				</h3>
				<p class="text-sm text-muted-foreground">{button.description}</p>
			</a>
		{/each}
	</div>
</div>
