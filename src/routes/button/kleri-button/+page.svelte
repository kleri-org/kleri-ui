<script lang="ts">
	import KleriButton from '$lib/button/KleriButton.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Click me',
		showSuccess: false,
		successMessage: 'Success!',
		successTimeout: 2000,
		disabled: false
	});

	const schema = {
		children: { type: 'string' as const, label: 'Button Text' },
		showSuccess: { type: 'boolean' as const, label: 'Show Success' },
		successMessage: { type: 'string' as const, label: 'Success Message' },
		successTimeout: { type: 'number' as const, label: 'Timeout (ms)' },
		disabled: { type: 'boolean' as const, label: 'Disabled' }
	};

	function handleSuccessComplete() {
		props.showSuccess = false;
	}
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/button" class="transition-colors hover:text-kleri-green-2">Button</a>
			<span>/</span>
			<span class="text-foreground">KleriButton</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriButton</h1>
		<p class="text-lg text-muted-foreground">
			Primary action button with built-in success state, animated feedback, and disabled state.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<KleriButton
					showSuccess={props.showSuccess}
					successMessage={props.successMessage}
					successTimeout={props.successTimeout}
					disabled={props.disabled}
					onSuccessComplete={handleSuccessComplete}
				>
					{props.children}
				</KleriButton>
			</div>
			<CodePreview component="KleriButton" {props} />
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
