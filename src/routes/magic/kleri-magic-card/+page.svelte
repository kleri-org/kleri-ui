<script lang="ts">
	import KleriMagicCard from '$lib/magic/KleriMagicCard.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Magic Card',
		gradientSize: 200,
		gradientOpacity: 0.15
	});

	const schema = {
		children: { type: 'string' as const, label: 'Card Content' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/magic" class="transition-colors hover:text-kleri-green-2">Magic</a>
			<span>/</span>
			<span class="text-foreground">KleriMagicCard</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriMagicCard</h1>
		<p class="text-lg text-muted-foreground">
			Card with an animated radial gradient border and inner glow that follows the cursor.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<KleriMagicCard
					gradientSize={props.gradientSize}
					gradientOpacity={props.gradientOpacity}
				>
					<h3 class="text-lg font-semibold">{props.children}</h3>
					<p class="text-sm text-muted-foreground">Hover over this card to see the magic effect.</p>
				</KleriMagicCard>
			</div>
			<CodePreview component="KleriMagicCard" {props} />
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
