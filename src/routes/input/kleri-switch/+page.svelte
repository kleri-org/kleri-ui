<script lang="ts">
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		value: false,
		disabled: false,
		ariaLabel: 'Toggle switch'
	});

	const schema = {
		value: { type: 'boolean' as const, label: 'Checked' },
		disabled: { type: 'boolean' as const, label: 'Disabled' },
		ariaLabel: { type: 'string' as const, label: 'Aria Label' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/input" class="transition-colors hover:text-kleri-green-2">Input</a>
			<span>/</span>
			<span class="text-foreground">KleriSwitch</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriSwitch</h1>
		<p class="text-lg text-muted-foreground">
			Accessible toggle switch with animated thumb and gradient checked state.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<KleriSwitch
					bind:value={props.value}
					disabled={props.disabled}
					ariaLabel={props.ariaLabel}
				/>
			</div>
			<CodePreview component="KleriSwitch" {props} />
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
