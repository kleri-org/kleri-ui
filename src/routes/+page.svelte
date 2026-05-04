<script lang="ts">
	import { base } from '$app/paths';

	const categories = [
		{ name: 'Heading', description: 'Primary, secondary, and sub headings', count: 0, comingSoon: true },
		{ name: 'Button', description: 'Interactive buttons and magic effects', count: 2, comingSoon: false, route: '/button' },
		{ name: 'Input', description: 'Switches, text inputs, and form controls', count: 0, comingSoon: true },
		{ name: 'Tooltip', description: 'Contextual information overlays', count: 0, comingSoon: true },
		{ name: 'Animation', description: 'Motion and visual effects', count: 0, comingSoon: true },
		{ name: 'Settings', description: 'Configuration and preference controls', count: 0, comingSoon: true },
		{ name: 'Magic', description: 'Enchanted interactive components', count: 0, comingSoon: true }
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<h1 class="text-4xl font-bold text-foreground">Kleri UI</h1>
		<p class="text-muted-foreground text-lg">
			Interactive component preview — built with Svelte 5 and Tailwind CSS.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each categories as category}
			{#if category.comingSoon}
				<div class="group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 opacity-60">
					<div class="flex items-center justify-between mb-2">
						<h3 class="font-semibold text-foreground">{category.name}</h3>
						<span class="text-[10px] font-spacemono bg-muted/50 px-2 py-1 rounded-full text-muted-foreground"
							>Coming Soon</span
						>
					</div>
					<p class="text-sm text-muted-foreground">{category.description}</p>
				</div>
			{:else}
				<a
					href="{base}{category.route}"
					class="group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
				>
					<div class="flex items-center justify-between mb-2">
						<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors">
							{category.name}
						</h3>
						<span class="text-xs font-spacemono bg-kleri-green-3/20 text-kleri-green-2 px-2 py-1 rounded-full"
							>{category.count} component{category.count !== 1 ? 's' : ''}</span
						>
					</div>
					<p class="text-sm text-muted-foreground">{category.description}</p>
				</a>
			{/if}
		{/each}
	</div>
</div>
