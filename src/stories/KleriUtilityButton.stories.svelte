<script module>
	// @ts-nocheck
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import KleriUtilityButton from '$lib/button/KleriUtilityButton.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Button/KleriUtilityButton',
		component: KleriUtilityButton,
		tags: ['autodocs'],
		argTypes: {
			tooltip: { control: 'text' }
		},
		args: {
			onclick: fn()
		}
	});
</script>

<Story name="Default">
	{#snippet children(args)}
		<KleriUtilityButton {...args}>Utility Action</KleriUtilityButton>
	{/snippet}
</Story>

<Story name="With Tooltip" args={{ tooltip: 'This is a helpful tooltip' }}>
	{#snippet children(args)}
		<KleriUtilityButton {...args}>Hover me</KleriUtilityButton>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
	{#snippet children(args)}
		<KleriUtilityButton {...args}>Disabled</KleriUtilityButton>
	{/snippet}
</Story>
