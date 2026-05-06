<script lang="ts">
	import KleriButton from '$lib/button/KleriButton.svelte';
	import KleriUtilityButton from '$lib/button/KleriUtilityButton.svelte';
	import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let kleriButtonProps = $state({
		children: 'Click me',
		showSuccess: false,
		successMessage: 'Success!',
		successTimeout: 2000,
		disabled: false
	});
	const kleriButtonSchema = {
		children: { type: 'string' as const, label: 'Button Text' },
		showSuccess: { type: 'boolean' as const, label: 'Show Success' },
		successMessage: { type: 'string' as const, label: 'Success Message' },
		successTimeout: { type: 'number' as const, label: 'Timeout (ms)' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
	};
	function handleSuccessComplete() {
		kleriButtonProps.showSuccess = false;
	}

	let utilityProps = $state({ children: 'Utility', tooltip: 'Click to perform action' });
	const utilitySchema = {
		children: { type: 'string' as const, label: 'Button Text' },
		tooltip: { type: 'string' as const, label: 'Tooltip' }
	};

	let magicButtonProps = $state({
		children: 'Magic Button',
		gradientSize: 150,
		gradientColor: 'rgb(132, 204, 184)',
		gradientOpacity: 0.25,
		gradientFrom: 'rgb(132, 204, 184)',
		gradientTo: 'rgb(25, 96, 114)'
	});
	const magicButtonSchema = {
		children: { type: 'string' as const, label: 'Button Text' },
		gradientSize: { type: 'number' as const, label: 'Gradient Size (px)' },
		gradientColor: { type: 'string' as const, label: 'Gradient Color' },
		gradientOpacity: { type: 'number' as const, label: 'Gradient Opacity' },
		gradientFrom: { type: 'string' as const, label: 'Gradient From' },
		gradientTo: { type: 'string' as const, label: 'Gradient To' }
	};
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-green-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Button</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Button</h1>
		<p class="text-lg text-muted-foreground">
			Interactive buttons with states, effects, and feedback.
		</p>
	</div>

	<!-- KleriButton -->
	<section id="kleri-button" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriButton</h2>
			<p class="text-muted-foreground">
				Primary action button with built-in success state, animated feedback, and disabled state.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriButton
						showSuccess={kleriButtonProps.showSuccess}
						successMessage={kleriButtonProps.successMessage}
						successTimeout={kleriButtonProps.successTimeout}
						disabled={kleriButtonProps.disabled}
						onSuccessComplete={handleSuccessComplete}
					>
						{kleriButtonProps.children}
					</KleriButton>
				</div>
				<CodePreview component="KleriButton" props={kleriButtonProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={kleriButtonSchema} bind:values={kleriButtonProps} />
			</div>
		</div>
	</section>

	<!-- KleriUtilityButton -->
	<section id="kleri-utility-button" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriUtilityButton</h2>
			<p class="text-muted-foreground">
				Utility button with built-in tooltip support and hover effects.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriUtilityButton tooltip={utilityProps.tooltip}>
						{utilityProps.children}
					</KleriUtilityButton>
				</div>
				<CodePreview component="KleriUtilityButton" props={utilityProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={utilitySchema} bind:values={utilityProps} />
			</div>
		</div>
	</section>

	<!-- KleriMagicButton -->
	<section id="kleri-magic-button" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriMagicButton</h2>
			<p class="text-muted-foreground">
				Button with an animated radial gradient border that follows the cursor and an inner glow
				effect.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriMagicButton
						gradientSize={magicButtonProps.gradientSize}
						gradientColor={magicButtonProps.gradientColor}
						gradientOpacity={magicButtonProps.gradientOpacity}
						gradientFrom={magicButtonProps.gradientFrom}
						gradientTo={magicButtonProps.gradientTo}
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
