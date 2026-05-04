<script lang="ts">
	import SubHeading from '$lib/heading/SubHeading.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let props = $state({
		children: 'Sub Heading',
		info: '',
		warning: ''
	});

	const schema = {
		children: { type: 'string' as const, label: 'Heading Text' },
		info: { type: 'string' as const, label: 'Info Message' },
		warning: { type: 'string' as const, label: 'Warning Message' }
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-green-2">Kleri UI</a>
			<span>/</span>
			<a href="/heading" class="transition-colors hover:text-kleri-green-2">Heading</a>
			<span>/</span>
			<span class="text-foreground">SubHeading</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">SubHeading</h1>
		<p class="text-lg text-muted-foreground">
			Sub heading with optional info and warning annotations.
		</p>
	</div>

	<!-- Preview + Controls -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Preview -->
		<div class="space-y-4 lg:col-span-2">
			<div
				class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
			>
				<SubHeading info={props.info || undefined} warning={props.warning || undefined}>
					{props.children}
				</SubHeading>
			</div>
			<CodePreview component="SubHeading" {props} />
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
