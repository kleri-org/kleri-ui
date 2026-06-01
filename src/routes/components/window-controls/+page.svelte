<script lang="ts">
	import KleriWindowsControls from '$lib/tauri/KleriWindowsControls.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let windowControlsProps = $state({
		maximizable: true
	});

	const windowControlsSchema = {
		maximizable: { type: 'boolean' as const, label: 'Maximizable' }
	};
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Window Controls</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Window Controls</h1>
		<p class="text-lg text-muted-foreground">
			Native-style window title-bar controls for Tauri desktop apps.
		</p>
	</div>

	<!-- KleriWindowsControls -->
	<section id="kleri-windows-controls" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriWindowsControls</h2>
			<p class="text-muted-foreground">
				Platform-aware window controls that render minimize, maximize, and close buttons on Linux
				and Windows. Includes a draggable region and respects the
				<code class="rounded bg-muted px-1 py-0.5 text-sm">maximizable</code> prop.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="w-full max-w-md">
						<KleriWindowsControls maximizable={windowControlsProps.maximizable} />
					</div>
				</div>
				<CodePreview component="KleriWindowsControls" props={windowControlsProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={windowControlsSchema} bind:values={windowControlsProps} />
			</div>
		</div>
	</section>
</div>
