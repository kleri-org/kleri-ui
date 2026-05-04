<script lang="ts">
	interface Props {
		component: string;
		props: Record<string, any>;
	}

	let { component, props }: Props = $props();

	function formatValue(value: any): string {
		if (typeof value === 'boolean') return `{${value}}`;
		if (typeof value === 'number') return `{${value}}`;
		if (typeof value === 'string') return `"${value}"`;
		return String(value);
	}

	let code = $derived.by(() => {
		const entries = Object.entries(props).filter(([key]) => key !== 'children');
		const propLines = entries.map(([key, value]) => `  ${key}=${formatValue(value)}`);

		if (props.children) {
			return `<${component}${propLines.length > 0 ? '\n' + propLines.join('\n') + '\n' : ' '}>
  ${props.children}
</${component}>`;
		}

		return `<${component}${propLines.length > 0 ? '\n' + propLines.join('\n') + '\n' : ''}/>`;
	});

	function copyCode() {
		navigator.clipboard.writeText(code);
	}
</script>

<div class="overflow-hidden rounded-lg border-2 border-border bg-card">
	<div class="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2">
		<span class="font-spacemono text-xs text-muted-foreground">Usage</span>
		<button
			onclick={copyCode}
			class="font-spacemono text-xs text-kleri-green-2 transition-colors hover:text-kleri-green-1"
		>
			Copy
		</button>
	</div>
	<pre class="overflow-x-auto p-4 font-spacemono text-sm text-foreground"><code>{code}</code></pre>
</div>
