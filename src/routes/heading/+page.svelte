<script lang="ts">
	const headings = [
		{
			name: 'PrimaryHeading',
			description: 'Large animated heading with drop shadow for primary titles.',
			route: '/heading/primary-heading'
		},
		{
			name: 'SecondaryHeading',
			description: 'Monospace-styled secondary heading with accent color.',
			route: '/heading/secondary-heading'
		},
		{
			name: 'SubHeading',
			description: 'Sub heading with optional info and warning annotations.',
			route: '/heading/sub-heading'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Heading</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Heading</h1>
		<p class="text-muted-foreground text-lg">Typography components for page titles and section headers.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each headings as heading}
			<a
				href="{heading.route}"
				class="group rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
			>
				<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors mb-2">
					{heading.name}
				</h3>
				<p class="text-sm text-muted-foreground">{heading.description}</p>
			</a>
		{/each}
	</div>
</div>
