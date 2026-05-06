<script lang="ts">
	import KleriMagicCard from '$lib/magic/KleriMagicCard.svelte';
	import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let magicCardProps = $state({
		children: 'Magic Card',
		gradientSize: 200,
		gradientOpacity: 0.15
	});
	const magicCardSchema = {
		children: { type: 'string' as const, label: 'Card Content' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' }
	};

	let magicButtonProps = $state({
		children: 'Magic Button',
		gradientSize: 150,
		gradientOpacity: 0.25,
		disabled: false
	});
	const magicButtonSchema = {
		children: { type: 'string' as const, label: 'Button Text' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
	};
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Magic</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Magic</h1>
		<p class="text-lg text-muted-foreground">
			Enchanted interactive components with cursor-following effects.
		</p>
	</div>

	<!-- KleriMagicCard -->
	<section id="kleri-magic-card" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriMagicCard</h2>
			<p class="text-muted-foreground">
				Card with an animated radial gradient border and inner glow that follows the cursor.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriMagicCard
						gradientSize={magicCardProps.gradientSize}
						gradientOpacity={magicCardProps.gradientOpacity}
					>
						<h3 class="text-lg font-semibold">{magicCardProps.children}</h3>
						<p class="text-sm text-muted-foreground">Hover over this card to see the magic effect.</p>
					</KleriMagicCard>
				</div>
				<CodePreview component="KleriMagicCard" props={magicCardProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={magicCardSchema} bind:values={magicCardProps} />
			</div>
		</div>
	</section>

	<!-- KleriMagicButton -->
	<section id="kleri-magic-button" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriMagicButton</h2>
			<p class="text-muted-foreground">
				Button with an animated radial gradient border and glow effect that follows the cursor.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriMagicButton
						gradientSize={magicButtonProps.gradientSize}
						gradientOpacity={magicButtonProps.gradientOpacity}
						disabled={magicButtonProps.disabled}
					>
						{magicButtonProps.children}
					</KleriMagicButton>
				</div>
				<CodePreview component="KleriMagicButton" props={magicButtonProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={magicButtonSchema} bind:values={magicButtonProps} />
			</div>
		</div>
	</section>
</div>
