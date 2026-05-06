<script module>
	// @ts-nocheck
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import { User, Lock, Mail } from '@lucide/svelte';

	const { Story } = defineMeta({
		title: 'Input/KleriInput',
		component: KleriInput,
		tags: ['autodocs'],
		argTypes: {
			label: { control: 'text' },
			placeholder: { control: 'text' },
			type: {
				control: { type: 'select' },
				options: ['text', 'password', 'email', 'number']
			},
			required: { control: 'boolean' },
			withBorder: { control: 'boolean' },
			shake: { control: 'boolean' }
		},
		args: {
			value: '',
			label: '',
			placeholder: '',
			type: 'text',
			required: false,
			withBorder: true,
			shake: false
		}
	});
</script>

<Story name="Default" args={{ placeholder: 'Enter text...' }} />

<Story name="With Label" args={{ label: 'Username', placeholder: 'johndoe' }} />

<Story
	name="With Icon"
	args={{ label: 'Email', placeholder: 'you@example.com', InputIcon: Mail }}
/>

<Story
	name="Password"
	args={{ label: 'Password', placeholder: '••••••••', type: 'password', InputIcon: Lock }}
/>

<Story
	name="With Error"
	args={{
		label: 'Username',
		placeholder: 'johndoe',
		errors: ['This field is required'],
		shake: true
	}}
/>

<Story
	name="No Border"
	args={{ label: 'Search', placeholder: 'Type to search...', withBorder: false }}
/>

<Story name="Required" args={{ label: 'Full Name', placeholder: 'Jane Doe', required: true }} />
