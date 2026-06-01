<script lang="ts">
	import { onMount } from 'svelte';
	import KleriMagicCard from '$lib/magic/KleriMagicCard.svelte';
	import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
	import KleriAnimatedBeam from '$lib/magic/KleriAnimatedBeam.svelte';
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

	// Animated Beam demo
	let beamContainerRef: HTMLDivElement | null = $state(null);
	let beamFromRef: HTMLDivElement | null = $state(null);
	let beamToRef: HTMLDivElement | null = $state(null);
	let beamMounted = $state(false);

	let beamProps = $state({
		curvature: 0,
		reverse: false,
		pathWidth: 3,
		pathOpacity: 0.15,
		startXOffset: 0,
		startYOffset: 0,
		endXOffset: 0,
		endYOffset: 0,
		duration: 6,
		delay: 0,
		beamLength: 0.1,
		interval: 0
	});

	const beamSchema = {
		curvature: { type: 'number' as const, label: 'Curvature' },
		reverse: { type: 'boolean' as const, label: 'Reverse' },
		pathWidth: { type: 'number' as const, label: 'Path Width' },
		pathOpacity: { type: 'number' as const, label: 'Path Opacity' },
		startXOffset: { type: 'number' as const, label: 'Start X Offset' },
		startYOffset: { type: 'number' as const, label: 'Start Y Offset' },
		endXOffset: { type: 'number' as const, label: 'End X Offset' },
		endYOffset: { type: 'number' as const, label: 'End Y Offset' },
		duration: { type: 'number' as const, label: 'Duration' },
		delay: { type: 'number' as const, label: 'Delay' },
		beamLength: { type: 'number' as const, label: 'Beam Length' },
		interval: { type: 'number' as const, label: 'Interval' }
	};

	onMount(() => {
		beamMounted = true;
	});
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
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
						<p class="text-sm text-muted-foreground">
							Hover over this card to see the magic effect.
						</p>
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

	<!-- KleriAnimatedBeam -->
	<section id="kleri-animated-beam" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriAnimatedBeam</h2>
			<p class="text-muted-foreground">
				Animated gradient beam connecting two elements with customizable curvature and Kleri-themed
				colors.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="relative flex min-h-60 items-center justify-center overflow-hidden rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div
						bind:this={beamContainerRef}
						class="relative flex w-full items-center justify-between"
					>
						<div
							bind:this={beamFromRef}
							class="z-10 flex items-center justify-center rounded-lg border-2 bg-kleri-3 px-4 py-2 font-spacemono text-sm text-foreground"
						>
							From
						</div>
						<div
							bind:this={beamToRef}
							class="z-10 flex items-center justify-center rounded-lg border-2 bg-kleri-2 px-4 py-2 font-spacemono text-sm text-foreground"
						>
							To
						</div>

						{#if beamMounted}
							<KleriAnimatedBeam
								containerRef={beamContainerRef}
								fromRef={beamFromRef}
								toRef={beamToRef}
								curvature={beamProps.curvature}
								reverse={beamProps.reverse}
								pathWidth={beamProps.pathWidth}
								pathOpacity={beamProps.pathOpacity}
								startXOffset={beamProps.startXOffset}
								startYOffset={beamProps.startYOffset}
								endXOffset={beamProps.endXOffset}
								endYOffset={beamProps.endYOffset}
								duration={beamProps.duration}
								delay={beamProps.delay}
								beamLength={beamProps.beamLength}
								interval={beamProps.interval}
							/>
						{/if}
					</div>
				</div>
				<CodePreview component="KleriAnimatedBeam" props={beamProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={beamSchema} bind:values={beamProps} />
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
