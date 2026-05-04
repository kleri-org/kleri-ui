<script lang="ts">
	import KleriInput from '$lib/input/KleriInput.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		value: '',
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'text',
		required: false,
		withBorder: true,
		shake: false,
		errors: [] as string[]
	});

	const schema = {
		label: { type: 'string' as const, label: 'Label' },
		placeholder: { type: 'string' as const, label: 'Placeholder' },
		type: { type: 'string' as const, label: 'Type' },
		required: { type: 'boolean' as const, label: 'Required' },
		withBorder: { type: 'boolean' as const, label: 'With Border' },
		shake: { type: 'boolean' as const, label: 'Shake' }
	};

	$effect(() => {
		if (props.shake) {
			props.errors = ['Invalid input'];
		} else {
			props.errors = [];
		}
	});
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/input" class="transition-colors hover:text-kleri-green-2">Input</a>
			<span>/</span>
			<span class="text-foreground">KleriInput</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">KleriInput</h1>
		<p class="text-lg text-muted-foreground">
			Text input with label, error states, password visibility toggle, and shake animation.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<div class="w-full max-w-sm">
					<KleriInput
						bind:value={props.value}
						label={props.label}
						placeholder={props.placeholder}
						type={props.type}
						required={props.required}
						withBorder={props.withBorder}
						bind:errors={props.errors}
					/>
				</div>
			</div>
			<CodePreview component="KleriInput" {props} />
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
