<script module>
	// @ts-nocheck
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import KleriButton from '$lib/button/KleriButton.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Button/KleriButton',
		component: KleriButton,
		tags: ['autodocs'],
		argTypes: {
			showSuccess: { control: 'boolean' },
			successMessage: { control: 'text' },
			successTimeout: { control: 'number' }
		},
		args: {
			onclick: fn(),
			showSuccess: false,
			successMessage: 'Success!',
			successTimeout: 2000
		}
	});
</script>

<Story name="Default">
	{#snippet children(args)}
		<KleriButton {...args}>Click me</KleriButton>
	{/snippet}
</Story>

<Story name="Success" args={{ showSuccess: true }}>
	{#snippet children(args)}
		<KleriButton {...args}>Save</KleriButton>
	{/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
	{#snippet children(args)}
		<KleriButton {...args}>Disabled</KleriButton>
	{/snippet}
</Story>
