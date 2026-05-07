import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import PrimaryHeading from './PrimaryHeading.svelte';
import SecondaryHeading from './SecondaryHeading.svelte';
import SubHeading from './SubHeading.svelte';

const snippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('heading components', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders a primary heading with children and custom classes', () => {
		render(PrimaryHeading, {
			props: { children: snippet('Primary title'), class: 'custom-heading' }
		});

		const heading = screen.getByRole('heading', { name: 'Primary title', level: 1 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveClass('custom-heading');
	});

	it('renders a secondary heading with children', () => {
		render(SecondaryHeading, {
			props: { children: snippet('Secondary title') }
		});

		expect(screen.getByRole('heading', { name: 'Secondary title', level: 1 })).toBeInTheDocument();
	});

	it('renders subheading info and warning messages when provided', () => {
		render(SubHeading, {
			props: { children: snippet('Section title'), info: 'Helpful context', warning: 'Careful now' }
		});

		expect(screen.getByRole('heading', { name: /Section title/ })).toBeInTheDocument();
		expect(screen.getByText('Helpful context')).toBeInTheDocument();
		expect(screen.getByText('Careful now')).toBeInTheDocument();
	});
});
