<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';
	import KleriUtilityButton from '$lib/button/KleriUtilityButton/KleriUtilityButton.svelte';

	interface Props {
		mode?: 'tooltip' | 'utility-button';
		open?: boolean;
		triggerText?: string;
		contentText?: string;
		buttonText?: string;
		tooltip?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		mode = 'tooltip',
		open = false,
		triggerText = 'Trigger',
		contentText = 'Tooltip content',
		buttonText = 'Action',
		tooltip,
		disabled = false,
		class: className
	}: Props = $props();
</script>

<Tooltip.Provider>
	{#if mode === 'utility-button'}
		<KleriUtilityButton {tooltip} {disabled} class={className}>{buttonText}</KleriUtilityButton>
	{:else}
		<KleriTooltip bind:open>
			{#snippet trigger(props)}
				<button {...props}>{triggerText}</button>
			{/snippet}
			{contentText}
		</KleriTooltip>
	{/if}
</Tooltip.Provider>
