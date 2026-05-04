<script lang="ts">
	import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Magic Button',
		gradientSize: 150,
		gradientOpacity: 0.25,
		disabled: false
	});

	const schema = {
		children: { type: 'string' as const, label: 'Button Text' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
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
			<span class="text-foreground">KleriMagicButton</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriMagicButton</h1>
		<p class="text-lg text-muted-foreground">
			Button with an animated radial gradient border and glow effect that follows the cursor.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<KleriMagicButton
					gradientSize={props.gradientSize}
					gradientOpacity={props.gradientOpacity}
					disabled={props.disabled}
				>
					{props.children}
				</KleriMagicButton>
			</div>
			<CodePreview component="KleriMagicButton" {props} />
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
