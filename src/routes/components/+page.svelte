<script lang="ts">
	import {
		Heading1,
		MousePointerClick,
		TextCursorInput,
		MessageCircle,
		Sparkles,
		Settings,
		Wand,
		PanelRight,
		AppWindow,
		CalendarDays
	} from '@lucide/svelte';
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
			description: 'Interactive buttons, groups, and magic effects',
			count: 4,
			comingSoon: false,
			route: '/components/button',
			icon: MousePointerClick
		},
		{
			name: 'Input',
			description: 'Switches, text inputs, and form controls',
			count: 8,
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
			count: 3,
			comingSoon: false,
			route: '/components/magic',
			icon: Wand
		},
		{
			name: 'Menu',
			description: 'Popover menus, dialogs, and overlays',
			count: 2,
			comingSoon: false,
			route: '/components/menu',
			icon: PanelRight
		},
		{
			name: 'Calendar',
			description: 'Scheduling, recurring events and calendar integrations',
			count: 1,
			comingSoon: false,
			route: '/components/calendar',
			icon: CalendarDays
		},
		{
			name: 'Window Controls',
			description: 'Native-style window title-bar controls for Tauri apps',
			count: 1,
			comingSoon: false,
			route: '/components/window-controls',
			icon: AppWindow
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

<section class="pb-16">
	<div bind:this={cardsContainer} class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center gap-2 sm:gap-3">
			<h1
				class="shrink-0 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl"
			>
				Components
			</h1>
			<div class="h-px min-w-4 flex-1 bg-border/30"></div>
			<span
				class="shrink-0 font-spacemono text-xs tracking-wider whitespace-nowrap text-muted-foreground uppercase"
			>
				{categories.reduce((acc, c) => acc + c.count, 0)} Components
			</span>
			<div class="h-px min-w-4 flex-1 bg-border/30"></div>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each categories as category, i (category.name)}
				{#if category.comingSoon}
					<div
						class={[
							'card-enter group relative flex h-full flex-col rounded-kleri border border-border/50 bg-card/50 p-5 opacity-60 sm:p-6',
							{ visible: cardsVisible }
						]}
						style="transition-delay: {i * 80}ms;"
					>
						<div class="mb-3 flex items-start justify-between gap-3">
							<div class="flex min-w-0 items-center gap-2">
								<category.icon class="h-5 w-5 shrink-0 text-muted-foreground" />
								<h3 class="min-w-0 leading-snug font-semibold text-foreground">{category.name}</h3>
							</div>
							<span
								class="shrink-0 rounded-full bg-muted/50 px-2 py-1 font-spacemono text-[10px] whitespace-nowrap text-muted-foreground"
							>
								Coming Soon
							</span>
						</div>
						<p class="flex-1 text-sm leading-relaxed text-foreground/80">{category.description}</p>
					</div>
				{:else}
					<a
						href={category.route}
						class={[
							'card-enter group relative flex h-full flex-col rounded-kleri border border-border/50 bg-card/50 p-5 transition-all hover:border-kleri-2/50 hover:bg-card sm:p-6',
							{ visible: cardsVisible }
						]}
						style="transition-delay: {i * 80}ms;"
					>
						<div class="mb-3 flex items-start justify-between gap-3">
							<div class="flex min-w-0 items-center gap-2">
								<category.icon
									class="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-brand"
								/>
								<h3
									class="min-w-0 leading-snug font-semibold text-foreground transition-colors group-hover:text-brand"
								>
									{category.name}
								</h3>
							</div>
							<span
								class="shrink-0 rounded-full bg-kleri-3/20 px-2 py-1 font-spacemono text-xs whitespace-nowrap text-brand"
							>
								{category.count} component{category.count !== 1 ? 's' : ''}
							</span>
						</div>
						<p class="flex-1 text-sm leading-relaxed text-foreground/80">{category.description}</p>
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

	@media (prefers-reduced-motion: reduce) {
		.card-enter {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
