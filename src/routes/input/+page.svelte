<script lang="ts">
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let switchProps = $state({
		value: false,
		disabled: false,
		ariaLabel: 'Toggle switch'
	});
	const switchSchema = {
		value: { type: 'boolean' as const, label: 'Checked' },
		disabled: { type: 'boolean' as const, label: 'Disabled' },
		ariaLabel: { type: 'string' as const, label: 'Aria Label' }
	};

	let inputProps = $state({
		value: '',
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'text',
		required: false,
		withBorder: true,
		shake: false,
		errors: [] as string[]
	});
	const inputSchema = {
		label: { type: 'string' as const, label: 'Label' },
		placeholder: { type: 'string' as const, label: 'Placeholder' },
		type: { type: 'string' as const, label: 'Type' },
		required: { type: 'boolean' as const, label: 'Required' },
		withBorder: { type: 'boolean' as const, label: 'With Border' },
		shake: { type: 'boolean' as const, label: 'Shake' }
	};

	$effect(() => {
		if (inputProps.shake) {
			inputProps.errors = ['Invalid input'];
		} else {
			inputProps.errors = [];
		}
	});
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Input</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Input</h1>
		<p class="text-lg text-muted-foreground">Form controls, switches, and text inputs.</p>
	</div>

	<!-- KleriSwitch -->
	<section id="kleri-switch" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriSwitch</h2>
			<p class="text-muted-foreground">
				Accessible toggle switch with animated thumb and gradient checked state.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriSwitch
						bind:value={switchProps.value}
						disabled={switchProps.disabled}
						ariaLabel={switchProps.ariaLabel}
					/>
				</div>
				<CodePreview component="KleriSwitch" props={switchProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={switchSchema} bind:values={switchProps} />
			</div>
		</div>
	</section>

	<!-- KleriInput -->
	<section id="kleri-input" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriInput</h2>
			<p class="text-muted-foreground">
				Text input with label, error states, password visibility toggle, and shake animation.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="w-full max-w-sm">
						<KleriInput
							bind:value={inputProps.value}
							label={inputProps.label}
							placeholder={inputProps.placeholder}
							type={inputProps.type}
							required={inputProps.required}
							withBorder={inputProps.withBorder}
							bind:errors={inputProps.errors}
						/>
					</div>
				</div>
				<CodePreview component="KleriInput" props={inputProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={inputSchema} bind:values={inputProps} />
			</div>
		</div>
	</section>
</div>
