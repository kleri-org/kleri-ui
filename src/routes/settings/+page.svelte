<script lang="ts">
	const settings = [
		{
			name: 'SettingsOption',
			description: 'Layout component for settings rows with label and control slots.',
			route: '/settings/settings-option'
		}
	];
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm text-muted-foreground font-spacemono mb-2">
			<a href="/" class="hover:text-kleri-green-2 transition-colors">Kleri UI</a>
			<span>/</span>
			<span class="text-foreground">Settings</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Settings</h1>
		<p class="text-muted-foreground text-lg">Configuration and preference controls.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each settings as setting}
			<a
				href="{setting.route}"
				class="group rounded-xl border-2 border-border/50 bg-card/50 p-6 hover:border-kleri-green-2/50 hover:bg-card transition-all"
			>
				<h3 class="font-semibold text-foreground group-hover:text-kleri-green-2 transition-colors mb-2">
					{setting.name}
				</h3>
				<p class="text-sm text-muted-foreground">{setting.description}</p>
			</a>
		{/each}
	</div>
</div>
