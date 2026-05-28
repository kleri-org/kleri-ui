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
		ToggleRight,
		MessageCircle,
		Zap,
		Settings,
		SlidersHorizontal,
		Wand2,
		CreditCard,
		Upload,
		PanelRight,
		AppWindow
	} from '@lucide/svelte';

	const { children } = $props();

	const isHome = $derived(page.url.pathname === '/');

	const categories = [
		{
			name: 'Heading',
			route: '/components/heading',
			icon: Heading1,
			items: [
				{ name: 'PrimaryHeading', id: 'primary-heading', icon: Type },
				{ name: 'SecondaryHeading', id: 'secondary-heading', icon: Heading2 },
				{ name: 'SubHeading', id: 'sub-heading', icon: Heading3 }
			]
		},
		{
			name: 'Button',
			route: '/components/button',
			icon: MousePointerClick,
			items: [
				{ name: 'KleriButton', id: 'kleri-button', icon: MousePointerClick },
				{ name: 'KleriUtilityButton', id: 'kleri-utility-button', icon: Wrench },
				{ name: 'KleriButtonGroup', id: 'kleri-button-group', icon: Wrench },
				{ name: 'KleriMagicButton', id: 'kleri-magic-button', icon: Sparkles }
			]
		},
		{
			name: 'Input',
			route: '/components/input',
			icon: TextCursorInput,
			items: [
				{ name: 'KleriSwitch', id: 'kleri-switch', icon: ToggleLeft },
				{ name: 'KleriInput', id: 'kleri-input', icon: TextCursorInput },
				{ name: 'KleriToggleGroup', id: 'kleri-toggle-group', icon: ToggleRight },
				{ name: 'KleriDragNDrop', id: 'kleri-drag-n-drop', icon: Upload }
			]
		},
		{
			name: 'Tooltip',
			route: '/components/tooltip',
			icon: MessageCircle,
			items: [{ name: 'KleriTooltip', id: 'kleri-tooltip', icon: MessageCircle }]
		},
		{
			name: 'Animation',
			route: '/components/animation',
			icon: Zap,
			items: [{ name: 'MeteorAnimation', id: 'meteor-animation', icon: Zap }]
		},
		{
			name: 'Settings',
			route: '/components/settings',
			icon: Settings,
			items: [{ name: 'SettingsOption', id: 'settings-option', icon: SlidersHorizontal }]
		},
		{
			name: 'Magic',
			route: '/components/magic',
			icon: Wand2,
			items: [
				{ name: 'KleriMagicCard', id: 'kleri-magic-card', icon: CreditCard },
				{ name: 'KleriMagicButton', id: 'kleri-magic-button', icon: Sparkles }
			]
		},
		{
			name: 'Menu',
			route: '/components/menu',
			icon: PanelRight,
			items: [{ name: 'Popover', id: 'popover', icon: PanelRight }]
		},
		{
			name: 'Window Controls',
			route: '/components/window-controls',
			icon: AppWindow,
			items: [{ name: 'KleriWindowsControls', id: 'kleri-windows-controls', icon: AppWindow }]
		}
	];

	const allItemIds = $derived(categories.flatMap((c) => c.items.map((i) => i.id)));

	function isActivePath(route: string) {
		return page.url.pathname === route || page.url.pathname === route + '/';
	}

	let mainEl: HTMLElement;
	let currentHash = $state(page.url.hash);
	let isScrollingProgrammatically = $state(false);

	let observer: IntersectionObserver | null = null;
	let intersectingIds = new Set<string>();
	let scrollSpyScrollHandler: (() => void) | null = null;

	function setupScrollSpy() {
		if (!mainEl) return;

		if (observer) {
			observer.disconnect();
			observer = null;
		}
		if (scrollSpyScrollHandler) {
			mainEl.removeEventListener('scroll', scrollSpyScrollHandler);
			scrollSpyScrollHandler = null;
		}
		intersectingIds.clear();

		const path = page.url.pathname;
		if (!path.startsWith('/components/') || path === '/components' || path === '/components/')
			return;

		const sections = mainEl.querySelectorAll('section[id]');
		if (sections.length === 0) return;

		scrollSpyScrollHandler = () => {
			if (isScrollingProgrammatically) return;

			const scrollTop = mainEl.scrollTop;
			const clientHeight = mainEl.clientHeight;
			const scrollHeight = mainEl.scrollHeight;
			const centerY = scrollTop + clientHeight / 2;

			// Near top: highlight first section
			if (scrollTop < 120) {
				const firstId = (sections[0] as HTMLElement).id;
				if (currentHash !== '#' + firstId) {
					currentHash = '#' + firstId;
				}
				return;
			}

			// Near bottom: highlight last section
			if (scrollTop + clientHeight >= scrollHeight - 120) {
				const lastId = (sections[sections.length - 1] as HTMLElement).id;
				if (currentHash !== '#' + lastId) {
					currentHash = '#' + lastId;
				}
				return;
			}

			// Fallback: if nothing is intersecting, pick the section whose
			// vertical center is closest to the viewport center.
			if (intersectingIds.size === 0) {
				let closestId = '';
				let closestDist = Infinity;
				for (const section of sections) {
					const el = section as HTMLElement;
					const elCenter = el.offsetTop + el.offsetHeight / 2;
					const dist = Math.abs(elCenter - centerY);
					if (dist < closestDist) {
						closestDist = dist;
						closestId = el.id;
					}
				}
				if (closestId && currentHash !== '#' + closestId) {
					currentHash = '#' + closestId;
				}
			}
		};
		mainEl.addEventListener('scroll', scrollSpyScrollHandler, { passive: true });

		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = entry.target.id;
					if (entry.isIntersecting) {
						intersectingIds.add(id);
					} else {
						intersectingIds.delete(id);
					}
				}

				if (isScrollingProgrammatically) return;

				for (const id of allItemIds) {
					if (intersectingIds.has(id)) {
						if (currentHash !== '#' + id) {
							currentHash = '#' + id;
						}
						break;
					}
				}
			},
			{
				root: mainEl,
				rootMargin: '-40% 0px -40% 0px',
				threshold: 0
			}
		);

		sections.forEach((section) => observer!.observe(section));
	}

	function isActiveHash(hash: string) {
		return currentHash === '#' + hash;
	}

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	function smoothScrollTo(targetY: number, duration = 500) {
		if (!mainEl) return;
		isScrollingProgrammatically = true;
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
			} else {
				isScrollingProgrammatically = false;
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
		} else {
			currentHash = '';
		}

		requestAnimationFrame(() => {
			setupScrollSpy();
		});
	});

	onMount(() => {
		setupScrollSpy();
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
					{#each categories as category (category.name)}
						<li>
							<a
								href={category.route}
								class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActivePath(
									category.route
								)
									? 'bg-kleri-3/20 text-kleri-2'
									: 'text-foreground hover:bg-muted/30'}"
							>
								<category.icon class="h-4 w-4" />
								{category.name}
							</a>
							{#if category.items.length > 0}
								<ul class="mt-1 ml-3 space-y-0.5 border-l border-border/30 pl-3">
									{#each category.items as item (item.id)}
										<li>
											<a
												href="{category.route}#{item.id}"
												onclick={(e) => handleHashNav(e, category.route, item.id)}
												class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors {isActiveHash(
													item.id
												)
													? 'bg-kleri-3/20 font-medium text-kleri-2'
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
