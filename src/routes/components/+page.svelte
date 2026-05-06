<script lang="ts">
	import {
		Heading1,
		MousePointerClick,
		TextCursorInput,
		MessageCircle,
		Sparkles,
		Settings,
		Wand2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	const categories = [
		{
			name: 'Heading',
			description: 'Primary, secondary, and sub headings',
			count: 3,
			comingSoon: false,
			route: '/components/heading',
			icon: Heading1
		},
		{
			name: 'Button',
			description: 'Interactive buttons and magic effects',
			count: 3,
			comingSoon: false,
			route: '/components/button',
			icon: MousePointerClick
		},
		{
			name: 'Input',
			description: 'Switches, text inputs, and form controls',
			count: 2,
			comingSoon: false,
			route: '/components/input',
			icon: TextCursorInput
		},
		{
			name: 'Tooltip',
			description: 'Contextual information overlays',
			count: 1,
			comingSoon: false,
			route: '/components/tooltip',
			icon: MessageCircle
		},
		{
			name: 'Animation',
			description: 'Motion and visual effects',
			count: 1,
			comingSoon: false,
			route: '/components/animation',
			icon: Sparkles
		},
		{
			name: 'Settings',
			description: 'Configuration and preference controls',
			count: 1,
			comingSoon: false,
			route: '/components/settings',
			icon: Settings
		},
		{
			name: 'Magic',
			description: 'Enchanted interactive components',
			count: 2,
			comingSoon: false,
			route: '/components/magic',
			icon: Wand2
		}
	];

	let cardsVisible = $state(false);
	let cardsContainer: HTMLDivElement | null = $state(null);

	onMount(() => {
		if (!cardsContainer) return;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						cardsVisible = true;
						observer.disconnect();
					}
				});
			},
			{ threshold: 0.1 }
		);
		observer.observe(cardsContainer);
		return () => observer.disconnect();
	});
</script>

<section class="px-8 pt-8 pb-16">
	<div bind:this={cardsContainer} class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center gap-3">
			<div class="h-px flex-1 bg-border/30"></div>
			<span class="font-spacemono text-xs tracking-wider text-muted-foreground uppercase">
				{categories.reduce((acc, c) => acc + c.count, 0)} Components
			</span>
			<div class="h-px flex-1 bg-border/30"></div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each categories as category, i (category.name)}
				{#if category.comingSoon}
					<div
						class="card-enter group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 opacity-60"
						class:visible={cardsVisible}
						style="transition-delay: {i * 80}ms;"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<category.icon class="h-5 w-5 text-muted-foreground" />
								<h3 class="font-semibold text-foreground">{category.name}</h3>
							</div>
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
						href={category.route}
						class="card-enter group relative rounded-xl border-2 border-border/50 bg-card/50 p-6 transition-all hover:border-kleri-green-2/50 hover:bg-card"
						class:visible={cardsVisible}
						style="transition-delay: {i * 80}ms;"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<category.icon
									class="h-5 w-5 text-muted-foreground transition-colors group-hover:text-kleri-green-2"
								/>
								<h3
									class="font-semibold text-foreground transition-colors group-hover:text-kleri-green-2"
								>
									{category.name}
								</h3>
							</div>
							<span
								class="rounded-full bg-kleri-green-3/20 px-2 py-1 font-spacemono text-xs text-kleri-green-2"
							>
								{category.count} component{category.count !== 1 ? 's' : ''}
							</span>
						</div>
						<p class="text-sm text-muted-foreground">{category.description}</p>
					</a>
				{/if}
			{/each}
		</div>
	</div>
</section>

<style>
	.card-enter {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.card-enter.visible {
		opacity: 1;
		transform: translateY(0);
	}
</style>
