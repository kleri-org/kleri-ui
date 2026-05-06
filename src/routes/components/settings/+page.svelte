<script lang="ts">
	import SettingsOption from '$lib/settings/SettingsOption.svelte';
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import { PropControls, CodePreview } from '$lib/preview';

	let settingsProps = $state({
		name: 'Dark Mode',
		optionAtEnd: false
	});
	let switchValue = $state(true);

	const settingsSchema = {
		name: { type: 'string' as const, label: 'Setting Name' },
		optionAtEnd: { type: 'boolean' as const, label: 'Option at End' }
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
			<span class="text-foreground">Settings</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Settings</h1>
		<p class="text-lg text-muted-foreground">Configuration and preference controls.</p>
	</div>

	<!-- SettingsOption -->
	<section id="settings-option" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">SettingsOption</h2>
			<p class="text-muted-foreground">
				Layout component for settings rows with label and control snippets.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="w-full max-w-md">
						<SettingsOption optionAtEnd={settingsProps.optionAtEnd}>
							{#snippet name()}
								{settingsProps.name}
							{/snippet}
							{#snippet option()}
								<KleriSwitch bind:value={switchValue} />
							{/snippet}
						</SettingsOption>
					</div>
				</div>
				<CodePreview component="SettingsOption" props={settingsProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={settingsSchema} bind:values={settingsProps} />
			</div>
		</div>
	</section>
</div>
