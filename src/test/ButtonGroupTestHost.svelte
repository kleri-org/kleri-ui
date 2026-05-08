<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import KleriButtonGroup from '$lib/button/KleriButtonGroup.svelte';
	import type { ButtonGroupItem } from '$lib/button/button-group-types.js';

	interface Props {
		orientation?: 'horizontal' | 'vertical';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
		includeSeparator?: boolean;
		includeText?: boolean;
	}

	let {
		orientation,
		size,
		variant,
		includeSeparator = false,
		includeText = false
	}: Props = $props();

	const items: ButtonGroupItem[] = $derived([
		...(includeText ? [{ type: 'text' as const, content: 'https://' }] : []),
		{ type: 'button' as const, label: 'One' },
		...(includeSeparator ? [{ type: 'separator' as const }] : []),
		{ type: 'button' as const, label: 'Two' }
	]);
</script>

<Tooltip.Provider>
	<KleriButtonGroup {orientation} {size} {variant} {items} />
</Tooltip.Provider>
