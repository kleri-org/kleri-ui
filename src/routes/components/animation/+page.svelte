<script lang="ts">
	import MeteorAnimation from '$lib/animation/MeteorAnimation.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let meteorProps = $state({ number: 20 });
	const meteorSchema = {
		number: { type: 'number' as const, label: 'Meteor Count' }
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
			<span class="text-foreground">Animation</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Animation</h1>
		<p class="text-lg text-muted-foreground">Motion and visual effects for dynamic UIs.</p>
	</div>

	<!-- MeteorAnimation -->
	<section id="meteor-animation" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">MeteorAnimation</h2>
			<p class="text-muted-foreground">
				Animated meteor shower effect with random trajectories and glowing green tails.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="relative flex min-h-60 items-center justify-center overflow-hidden rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<MeteorAnimation number={meteorProps.number} />
				</div>
				<CodePreview component="MeteorAnimation" props={meteorProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={meteorSchema} bind:values={meteorProps} />
			</div>
		</div>
	</section>
</div>
