<script lang="ts">
	import {
		Popover,
		PopoverTrigger,
		PopoverContent,
		PopoverHeader,
		PopoverTitle,
		PopoverDescription,
		PopoverClose
	} from '$lib/menus/popover';
	import { PropControls } from '$lib/preview';
	import { KleriButton } from '$lib';
	import { getHighlighter } from '$lib/utils/highlighter';
	import { X } from '@lucide/svelte';
	import { onMount } from 'svelte';

	// --------------------------------------------------------------------------
	// --- Popover ---
	// --------------------------------------------------------------------------
	let popoverProps = $state({
		sideOffset: 4,
		align: 'center' as const
	});

	const popoverSchema = {
		sideOffset: { type: 'number' as const, label: 'Side Offset' },
		align: { type: 'string' as const, label: 'Align (center / start / end)' }
	};

	// --- Code preview ---
	let highlightedHtml = $state('');
	let copied = $state(false);

	function buildUsageCode(sideOffset: number, align: string): string {
		// break up '<script' and '</script' so Svelte's parser doesn't treat them as real tags
		const S = '<' + 'script';
		const SE = '</' + 'script';
		return [
			`${S} lang="ts">`,
			'  import {',
			'    Popover,',
			'    PopoverTrigger,',
			'    PopoverContent,',
			'    PopoverHeader,',
			'    PopoverTitle,',
			'    PopoverDescription,',
			'    PopoverClose',
			"  } from '$lib/menus/popover';",
			"  import { X } from '@lucide/svelte';",
			`${SE}>`,
			'',
			'<Popover>',
			'  <PopoverTrigger',
			'    class="rounded-kleri border-2 border-border bg-card px-4 py-2',
			'           text-sm font-medium text-foreground transition-colors',
			'           hover:border-kleri-2"',
			'  >',
			'    Open Popover',
			'  </PopoverTrigger>',
			`  <PopoverContent sideOffset={${sideOffset}} align="${align}">`,
			'    <PopoverHeader>',
			'      <PopoverTitle>About Kleri</PopoverTitle>',
			'      <PopoverDescription>',
			'        Kleri is a modern UI toolkit built with Svelte 5 and Tailwind CSS.',
			'      </PopoverDescription>',
			'    </PopoverHeader>',
			'    <div class="flex flex-col gap-2">',
			'      <div class="h-px bg-border/50"></div>',
			'      <div class="flex items-center gap-2 px-1">',
			'        <span class="font-spacemono text-xs text-muted-foreground">v1.0.0</span>',
			'      </div>',
			'    </div>',
			'    <PopoverClose',
			'      class="absolute top-2 right-2 rounded-sm p-1',
			'             text-muted-foreground transition-colors',
			'             hover:text-foreground"',
			'    >',
			'      <X class="h-4 w-4" />',
			'    </PopoverClose>',
			'  </PopoverContent>',
			'</Popover>'
		].join('\n');
	}

	const usageCode = $derived(buildUsageCode(popoverProps.sideOffset, popoverProps.align));

	onMount(async () => {
		const highlighter = await getHighlighter();
		highlightedHtml = highlighter.codeToHtml(usageCode, {
			lang: 'svelte',
			themes: { light: 'kleri-light', dark: 'kleri-dark' }
		});
	});

	$effect(() => {
		// re-highlight when props change
		void getHighlighter().then((highlighter) => {
			highlightedHtml = highlighter.codeToHtml(usageCode, {
				lang: 'svelte',
				themes: { light: 'kleri-light', dark: 'kleri-dark' }
			});
		});
	});

	function copyCode() {
		navigator.clipboard.writeText(usageCode);
		copied = true;
	}
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Menu</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Menu</h1>
		<p class="text-lg text-muted-foreground">Popover menus, dropdowns, and contextual overlays.</p>
	</div>

	<!-- Popover -->
	<section id="popover" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">Popover</h2>
			<p class="text-muted-foreground">
				Displays rich content in a portal triggered by a button. Supports custom alignment and
				offset.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<Popover>
						<PopoverTrigger
							class="rounded-kleri border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-kleri-2"
						>
							Open Popover
						</PopoverTrigger>
						<PopoverContent sideOffset={popoverProps.sideOffset} align={popoverProps.align}>
							<PopoverHeader>
								<PopoverTitle>About Kleri</PopoverTitle>
								<PopoverDescription>
									Kleri is a modern UI toolkit built with Svelte 5 and Tailwind CSS.
								</PopoverDescription>
							</PopoverHeader>
							<div class="flex flex-col gap-2">
								<div class="h-px bg-border/50"></div>
								<div class="flex items-center gap-2 px-1">
									<span class="font-spacemono text-xs text-muted-foreground">v1.0.0</span>
								</div>
							</div>
							<PopoverClose
								class="absolute top-2 right-2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
							>
								<X class="h-4 w-4" />
							</PopoverClose>
						</PopoverContent>
					</Popover>
				</div>
				<div class="overflow-hidden rounded-lg border-2 border-border bg-card">
				<div
					class="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2"
				>
					<span class="font-spacemono text-xs text-foreground">Usage</span>
					<KleriButton
						class="w-auto px-3 py-1 text-xs"
						showSuccess={copied}
						successMessage="Copied!"
						onSuccessComplete={() => (copied = false)}
						onclick={copyCode}
					>
						Copy
					</KleriButton>
				</div>

				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					role="region"
					aria-label="Popover usage example"
					tabindex="0"
					class="overflow-x-auto"
				>
					{#if highlightedHtml}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html highlightedHtml}
					{:else}
						<pre class="p-4 font-spacemono text-sm text-foreground"><code>{usageCode}</code></pre>
					{/if}
				</div>
			</div>
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={popoverSchema} bind:values={popoverProps} />
			</div>
		</div>
	</section>
</div>
