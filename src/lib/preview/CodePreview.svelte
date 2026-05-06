<script lang="ts">
	import { KleriButton } from '$lib';

	interface Props {
		component: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
	}

	let { component, props }: Props = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

	let copied = $state(false);

	function copyCode() {
		navigator.clipboard.writeText(code);
		copied = true;
	}
</script>

<div class="overflow-hidden rounded-lg border-2 border-border bg-card">
	<div class="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2">
		<span class="font-spacemono text-xs text-muted-foreground">Usage</span>
		<KleriButton
			class="w-auto px-3 py-1 text-xs"
			showSuccess={copied}
			successMessage="Copied!"
			onSuccessComplete={() => (copied = false)}
			onclick={copyCode}
		>
			Copy
		</KleriButton>
	</div>
	<pre class="overflow-x-auto p-4 font-spacemono text-sm text-foreground"><code>{code}</code></pre>
</div>
