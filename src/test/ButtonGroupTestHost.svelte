<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Component } from 'svelte';
	import KleriButtonGroup from '$lib/button/KleriButtonGroup/KleriButtonGroup.svelte';
	import type { ButtonGroupItem } from '$lib/button/KleriButtonGroup/types.js';

	interface Props {
		orientation?: 'horizontal' | 'vertical';
		size?: 'sm' | 'lg';
		variant?: 'default' | 'outline' | 'ghost' | 'secondary';
		includeSeparator?: boolean;
		includeText?: boolean;
		separatorCount?: number;
		textContent?: string;
		className?: string;
		groupId?: string;
		ariaLabel?: string;
		buttonLabels?: string[];
		buttonIcons?: (Component | undefined)[];
		buttonTooltips?: (string | undefined)[];
		buttonDisabled?: boolean[];
		buttonOnclicks?: (((e: MouseEvent) => void) | undefined)[];
		buttonClasses?: (string | undefined)[];
		customItems?: ButtonGroupItem[];
	}

	let {
		orientation,
		size,
		variant,
		includeSeparator = false,
		includeText = false,
		separatorCount,
		textContent = 'https://',
		className,
		groupId,
		ariaLabel,
		buttonLabels,
		buttonIcons,
		buttonTooltips,
		buttonDisabled,
		buttonOnclicks,
		buttonClasses,
		customItems
	}: Props = $props();

	const items: ButtonGroupItem[] = $derived(
		customItems ?? [
			...(includeText ? [{ type: 'text' as const, content: textContent }] : []),
			...(buttonLabels ?? ['One', 'Two']).map((label, i) => ({
				type: 'button' as const,
				label,
				icon: buttonIcons?.[i],
				tooltip: buttonTooltips?.[i],
				disabled: buttonDisabled?.[i],
				onclick: buttonOnclicks?.[i],
				class: buttonClasses?.[i]
			})),
			...Array(separatorCount ?? (includeSeparator ? 1 : 0)).fill({ type: 'separator' as const })
		]
	);
</script>

<Tooltip.Provider>
	<KleriButtonGroup
		{orientation}
		{size}
		{variant}
		{items}
		class={className}
		id={groupId}
		aria-label={ariaLabel}
	/>
</Tooltip.Provider>
