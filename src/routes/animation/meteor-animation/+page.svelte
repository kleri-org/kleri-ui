<script lang="ts">
	import MeteorAnimation from '$lib/animation/MeteorAnimation.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		number: 20
	});

	const schema = {
		number: { type: 'number' as const, label: 'Meteor Count' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/animation" class="transition-colors hover:text-kleri-green-2">Animation</a>
			<span>/</span>
			<span class="text-foreground">MeteorAnimation</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">MeteorAnimation</h1>
		<p class="text-lg text-muted-foreground">
			Animated meteor shower effect with random trajectories and glowing green tails.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="relative flex min-h-60 items-center justify-center overflow-hidden rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<MeteorAnimation number={props.number} />
			</div>
			<CodePreview component="MeteorAnimation" {props} />
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
