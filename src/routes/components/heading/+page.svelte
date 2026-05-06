<script lang="ts">
	import PrimaryHeading from '$lib/heading/PrimaryHeading.svelte';
	import SecondaryHeading from '$lib/heading/SecondaryHeading.svelte';
	import SubHeading from '$lib/heading/SubHeading.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let primaryProps = $state({ children: 'Primary Heading' });
	const primarySchema = { children: { type: 'string' as const, label: 'Heading Text' } };

	let secondaryProps = $state({ children: 'Secondary Heading' });
	const secondarySchema = { children: { type: 'string' as const, label: 'Heading Text' } };

	let subProps = $state({
		children: 'Sub Heading',
		info: 'This and the warning are optional',
		warning: 'Keeping them empty will make them disappear'
	});
	const subSchema = {
		children: { type: 'string' as const, label: 'Heading Text' },
		info: {
			type: 'string' as const,
			label: 'Info Message'
		},
		warning: {
			type: 'string' as const,
			label: 'Warning Message'
		}
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
			<span class="text-foreground">Heading</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Heading</h1>
		<p class="text-lg text-muted-foreground">
			Typography components for page titles and section headers.
		</p>
	</div>

	<!-- PrimaryHeading -->
	<section id="primary-heading" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">PrimaryHeading</h2>
			<p class="text-muted-foreground">
				Large animated heading with Poppins font, drop shadow, and pointer-events disabled.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<PrimaryHeading>{primaryProps.children}</PrimaryHeading>
				</div>
				<CodePreview component="PrimaryHeading" props={primaryProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={primarySchema} bind:values={primaryProps} />
			</div>
		</div>
	</section>

	<!-- SecondaryHeading -->
	<section id="secondary-heading" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">SecondaryHeading</h2>
			<p class="text-muted-foreground">
				Monospace-styled secondary heading with primary color and green drop shadow.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<SecondaryHeading>{secondaryProps.children}</SecondaryHeading>
				</div>
				<CodePreview component="SecondaryHeading" props={secondaryProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={secondarySchema} bind:values={secondaryProps} />
			</div>
		</div>
	</section>

	<!-- SubHeading -->
	<section id="sub-heading" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">SubHeading</h2>
			<p class="text-muted-foreground">Sub heading with optional info and warning annotations.</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<SubHeading info={subProps.info || undefined} warning={subProps.warning || undefined}>
						{subProps.children}
					</SubHeading>
				</div>
				<CodePreview component="SubHeading" props={subProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={subSchema} bind:values={subProps} />
			</div>
		</div>
	</section>
</div>
