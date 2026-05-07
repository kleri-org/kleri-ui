import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsOption from './SettingsOption.svelte';

const snippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('SettingsOption', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders the setting name and option snippets', () => {
		render(SettingsOption, {
			props: { name: snippet('Theme'), option: snippet('Dark mode') }
		});

		expect(screen.getByText('Theme')).toBeInTheDocument();
		expect(screen.getByText('Dark mode')).toBeInTheDocument();
	});

	it('aligns the option at the end when requested', () => {
		const { container } = render(SettingsOption, {
			props: { name: snippet('Notifications'), option: snippet('Enabled'), optionAtEnd: true }
		});

		const optionWrapper = screen.getByText('Enabled').parentElement;
		expect(optionWrapper).toHaveClass('justify-self-end');
		expect(container.firstElementChild).toHaveClass('my-5');
	});
});
