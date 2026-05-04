<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import MeteorAnimation from '$lib/animation/MeteorAnimation.svelte';

	const { children } = $props();

	const categories = [
		{ name: 'Heading', items: [], comingSoon: true },
		{
			name: 'Button',
			comingSoon: false,
			items: [
				{ name: 'KleriButton', route: '/button/kleri-button' },
				{ name: 'KleriMagicButton', route: '/button/kleri-magic-button' }
			]
		},
		{ name: 'Input', items: [], comingSoon: true },
		{ name: 'Tooltip', items: [], comingSoon: true },
		{ name: 'Animation', items: [], comingSoon: true },
		{ name: 'Settings', items: [], comingSoon: true },
		{ name: 'Magic', items: [], comingSoon: true }
	];

	function isActive(route: string) {
		return page.url.pathname === route || page.url.pathname === route + '/';
	}
</script>

<svelte:head>
	<title>Kleri UI — Component Preview</title>
	<meta name="description" content="Interactive component preview for @kleri/ui" />
</svelte:head>

<!-- Background -->
<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
	<MeteorAnimation number={60} />
</div>

<!-- Layout -->
<div class="relative z-10 flex min-h-screen">
	<!-- Sidebar -->
	<aside class="flex w-64 flex-col border-r border-border/20 bg-background/80 backdrop-blur-xl">
		<div class="border-b border-border/20 p-6">
			<a href="/" class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-kleri-green-2 to-kleri-green-1"
				>
					<span class="text-sm font-bold text-white">K</span>
				</div>
				<div>
					<h1 class="text-lg leading-tight font-bold">Kleri UI</h1>
					<p class="font-spacemono text-xs text-muted-foreground">Component Preview</p>
				</div>
			</a>
		</div>

		<nav class="flex-1 overflow-y-auto p-4">
			<p class="mb-3 px-2 font-spacemono text-xs tracking-wider text-muted-foreground uppercase">
				Components
			</p>
			<ul class="space-y-1">
				{#each categories as category}
					<li>
						{#if category.comingSoon}
							<div
								class="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-60"
							>
								<span>{category.name}</span>
								<span class="rounded bg-muted/50 px-1.5 py-0.5 font-spacemono text-[10px]"
									>Soon</span
								>
							</div>
						{:else}
							<div class="rounded-lg px-3 py-2 text-sm font-medium text-foreground">
								{category.name}
							</div>
							{#if category.items.length > 0}
								<ul class="mt-1 ml-3 space-y-0.5 border-l border-border/30 pl-3">
									{#each category.items as item}
										<li>
											<a
												href={item.route}
												class="block rounded-md px-3 py-1.5 text-sm transition-colors {isActive(
													item.route
												)
													? 'bg-kleri-green-3/20 font-medium text-kleri-green-2'
													: 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}"
											>
												{item.name}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<div class="border-t border-border/20 p-4">
			<p class="text-center font-spacemono text-[10px] text-muted-foreground">
				© {new Date().getFullYear()} Kleri
			</p>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl p-8">
			{@render children()}
		</div>
	</main>
</div>
