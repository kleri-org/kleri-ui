<script lang="ts">
	const categories = [
		{
			name: 'Heading',
			description: 'Primary, secondary, and sub headings',
			count: 3,
			comingSoon: false,
			route: '/heading'
		},
		{
			name: 'Button',
			description: 'Interactive buttons and magic effects',
			count: 3,
			comingSoon: false,
			route: '/button'
		},
		{
			name: 'Input',
			description: 'Switches, text inputs, and form controls',
			count: 2,
			comingSoon: false,
			route: '/input'
		},
		{
			name: 'Tooltip',
			description: 'Contextual information overlays',
			count: 1,
			comingSoon: false,
			route: '/tooltip'
		},
		{
			name: 'Animation',
			description: 'Motion and visual effects',
			count: 1,
			comingSoon: false,
			route: '/animation'
		},
		{
			name: 'Settings',
			description: 'Configuration and preference controls',
			count: 1,
			comingSoon: false,
			route: '/settings'
		},
		{
			name: 'Magic',
			description: 'Enchanted interactive components',
			count: 2,
			comingSoon: false,
			route: '/magic'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<h1 class="text-4xl font-bold text-foreground">Kleri UI</h1>
		<p class="text-lg text-muted-foreground">
			Interactive component preview — built with Svelte 5 and Tailwind CSS.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each categories as category}
			{#if category.comingSoon}
				<div class="group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 opacity-60">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="font-semibold text-foreground">{category.name}</h3>
						<span
							class="rounded-full bg-muted/50 px-2 py-1 font-spacemono text-[10px] text-muted-foreground"
						>
							Coming Soon
						</span>
					</div>
					<p class="text-sm text-muted-foreground">{category.description}</p>
				</div>
			{:else}
				<a
					href="{category.route}"
					class="group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 transition-all hover:border-kleri-green-2/50 hover:bg-card"
				>
					<div class="mb-2 flex items-center justify-between">
						<h3
							class="font-semibold text-foreground transition-colors group-hover:text-kleri-green-2"
						>
							{category.name}
						</h3>
						<span
							class="rounded-full bg-kleri-green-3/20 px-2 py-1 font-spacemono text-xs text-kleri-green-2"
							>{category.count} component{category.count !== 1 ? 's' : ''}</span
						>
					</div>
					<p class="text-sm text-muted-foreground">{category.description}</p>
				</a>
			{/if}
		{/each}
	</div>
</div>
