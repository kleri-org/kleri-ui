<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Tooltip } from 'bits-ui';
	import KleriUiLogo from '../assetes/KleriUiLogo.svelte';
	import {
		Heading1,
		Heading2,
		Heading3,
		Type,
		MousePointerClick,
		Wrench,
		Sparkles,
		TextCursorInput,
		ToggleLeft,
		MessageCircle,
		Zap,
		Settings,
		SlidersHorizontal,
		Wand2,
		CreditCard
	} from 'lucide-svelte';

	const { children } = $props();

	const isHome = $derived(page.url.pathname === '/');

	const categories = [
		{
			name: 'Heading',
			route: '/heading',
			icon: Heading1,
			items: [
				{ name: 'PrimaryHeading', id: 'primary-heading', icon: Type },
				{ name: 'SecondaryHeading', id: 'secondary-heading', icon: Heading2 },
				{ name: 'SubHeading', id: 'sub-heading', icon: Heading3 }
			]
		},
		{
			name: 'Button',
			route: '/button',
			icon: MousePointerClick,
			items: [
				{ name: 'KleriButton', id: 'kleri-button', icon: MousePointerClick },
				{ name: 'KleriUtilityButton', id: 'kleri-utility-button', icon: Wrench },
				{ name: 'KleriMagicButton', id: 'kleri-magic-button', icon: Sparkles }
			]
		},
		{
			name: 'Input',
			route: '/input',
			icon: TextCursorInput,
			items: [
				{ name: 'KleriSwitch', id: 'kleri-switch', icon: ToggleLeft },
				{ name: 'KleriInput', id: 'kleri-input', icon: TextCursorInput }
			]
		},
		{
			name: 'Tooltip',
			route: '/tooltip',
			icon: MessageCircle,
			items: [{ name: 'KleriTooltip', id: 'kleri-tooltip', icon: MessageCircle }]
		},
		{
			name: 'Animation',
			route: '/animation',
			icon: Zap,
			items: [{ name: 'MeteorAnimation', id: 'meteor-animation', icon: Zap }]
		},
		{
			name: 'Settings',
			route: '/settings',
			icon: Settings,
			items: [{ name: 'SettingsOption', id: 'settings-option', icon: SlidersHorizontal }]
		},
		{
			name: 'Magic',
			route: '/magic',
			icon: Wand2,
			items: [
				{ name: 'KleriMagicCard', id: 'kleri-magic-card', icon: CreditCard },
				{ name: 'KleriMagicButton', id: 'kleri-magic-button', icon: Sparkles }
			]
		}
	];

	function isActivePath(route: string) {
		return page.url.pathname === route || page.url.pathname === route + '/';
	}

	let mainEl: HTMLElement;
	let currentHash = $state(page.url.hash);

	function isActiveHash(hash: string) {
		return currentHash === '#' + hash;
	}

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	function smoothScrollTo(targetY: number, duration = 500) {
		if (!mainEl) return;
		const startY = mainEl.scrollTop;
		const diff = targetY - startY;
		let startTime: number | null = null;

		function step(timestamp: number) {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);
			const eased = easeOutCubic(progress);
			mainEl.scrollTop = startY + diff * eased;
			if (progress < 1) {
				requestAnimationFrame(step);
			}
		}

		requestAnimationFrame(step);
	}

	function scrollToId(id: string) {
		if (!mainEl) return;
		const el = document.getElementById(id);
		if (!el) return;
		const offset = 48;
		const targetY = Math.max(0, el.offsetTop - offset);
		smoothScrollTo(targetY);
	}

	function handleHashNav(e: MouseEvent, route: string, id: string) {
		if (isActivePath(route)) {
			e.preventDefault();
			scrollToId(id);
			currentHash = '#' + id;
			history.replaceState(null, '', `${route}#${id}`);
		}
	}

	afterNavigate(({ to }) => {
		if (to?.url?.hash && mainEl) {
			currentHash = to.url.hash;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					scrollToId(to.url.hash.slice(1));
				});
			});
		}
	});

	onMount(() => {
		if (page.url.hash && mainEl) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					scrollToId(page.url.hash.slice(1));
				});
			});
		}
	});
</script>

<svelte:head>
	<title>Kleri UI — Component Preview</title>
	<meta name="description" content="Interactive component preview for @kleri/ui" />
</svelte:head>

<!-- Layout -->
<div class="relative z-10 flex h-screen overflow-hidden">
	{#if !isHome}
		<!-- Sidebar -->
		<aside
			class="sticky top-0 flex h-screen w-64 flex-col border-r border-border/20 bg-background/80 backdrop-blur-xl"
		>
			<div class="border-b border-border/20 p-6">
				<a href="/" class="flex items-center gap-3">
					<KleriUiLogo class="h-8 w-auto" />
					<div>
						<h1 class="text-lg leading-tight font-bold">Kleri UI</h1>
						<p class="font-spacemono text-xs text-muted-foreground">Component Preview</p>
					</div>
				</a>
			</div>

			<nav class="custom-scrollbar flex-1 overflow-y-auto p-4">
				<p class="mb-3 px-2 font-spacemono text-xs tracking-wider text-muted-foreground uppercase">
					Components
				</p>
				<ul class="space-y-1">
					{#each categories as category}
						<li>
							<a
								href={category.route}
								class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActivePath(
									category.route
								)
									? 'bg-kleri-green-3/20 text-kleri-green-2'
									: 'text-foreground hover:bg-muted/30'}"
							>
								<category.icon class="h-4 w-4" />
								{category.name}
							</a>
							{#if category.items.length > 0}
								<ul class="mt-1 ml-3 space-y-0.5 border-l border-border/30 pl-3">
									{#each category.items as item}
										<li>
											<a
												href="{category.route}#{item.id}"
												onclick={(e) => handleHashNav(e, category.route, item.id)}
												class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors {isActiveHash(
													item.id
												)
													? 'bg-kleri-green-3/20 font-medium text-kleri-green-2'
													: 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}"
											>
												<item.icon class="h-3.5 w-3.5" />
												{item.name}
											</a>
										</li>
									{/each}
								</ul>
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
	{/if}

	<!-- Main Content -->
	<main bind:this={mainEl} class="flex-1 overflow-y-auto">
		<div class="mx-auto {isHome ? '' : 'max-w-5xl p-8'}">
			<Tooltip.Provider>
				{@render children()}
			</Tooltip.Provider>
		</div>
	</main>
</div>
