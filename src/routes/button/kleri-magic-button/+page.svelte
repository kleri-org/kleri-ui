<script lang="ts">
	import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Magic Button',
		gradientSize: 150,
		gradientColor: 'rgb(132, 204, 184)',
		gradientOpacity: 0.25,
		gradientFrom: 'rgb(132, 204, 184)',
		gradientTo: 'rgb(25, 96, 114)'
	});

	const schema = {
		children: { type: 'string' as const, label: 'Button Text' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size (px)' },
		gradientColor: { type: 'string' as const, label: 'Gradient Color' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' },
		gradientFrom: { type: 'string' as const, label: 'Gradient From' },
		gradientTo: { type: 'string' as const, label: 'Gradient To' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<a href="/button" class="hover:text-kleri-green-2 transition-colors">Button</a>
			<span>/</span>
			<span class="text-foreground">KleriMagicButton</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriMagicButton</h1>
		<p class="text-muted-foreground text-lg">
			Button with an animated radial gradient border that follows the cursor and an inner glow
			effect.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Preview -->
		<div class="lg:col-span-2 space-y-4">
			<div class="rounded-xl border-2 border-border/50 bg-card/30 p-12 flex items-center justify-center min-h-[240px]">
				<KleriMagicButton
					gradientSize={props.gradientSize}
					gradientColor={props.gradientColor}
					gradientOpacity={props.gradientOpacity}
					gradientFrom={props.gradientFrom}
					gradientTo={props.gradientTo}
				>
					{props.children}
				</KleriMagicButton>
			</div>
			<CodePreview component="KleriMagicButton" {props} />
		</div>

		<!-- Controls -->
		<div class="rounded-xl border-2 border-border/50 bg-card/30 p-6 h-fit">
			<h2 class="text-sm font-semibold text-foreground mb-4 font-spacemono uppercase tracking-wider">
				Props
			</h2>
			<PropControls {schema} bind:values={props} />
		</div>
	</div>
</div>
