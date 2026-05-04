<script lang="ts">
	import PrimaryHeading from '$lib/heading/PrimaryHeading.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Primary Heading'
	});

	const schema = {
		children: { type: 'string' as const, label: 'Heading Text' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/heading" class="transition-colors hover:text-kleri-green-2">Heading</a>
			<span>/</span>
			<span class="text-foreground">PrimaryHeading</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">PrimaryHeading</h1>
		<p class="text-lg text-muted-foreground">
			Large animated heading with Poppins font, drop shadow, and pointer-events disabled.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<PrimaryHeading>
					{props.children}
				</PrimaryHeading>
			</div>
			<CodePreview component="PrimaryHeading" {props} />
		</div>

		<!-- Controls -->
		<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
			<h2
				class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
			>
				Props
			</h2>
			<PropControls {schema} bind:values={props} />
		</div>
	</div>
</div>
