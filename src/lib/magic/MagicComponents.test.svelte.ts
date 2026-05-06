import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import KleriMagicButton from './KleriMagicButton.svelte';
import KleriMagicCard from './KleriMagicCard.svelte';

const snippet = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('KleriMagicButton', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders children in a real button', () => {
		render(KleriMagicButton, {
			props: { children: snippet('Magic action') }
		});

		expect(screen.getByRole('button', { name: 'Magic action' })).toBeInTheDocument();
	});

	it('passes button attributes through', () => {
		render(KleriMagicButton, {
			props: { children: snippet('Unavailable'), disabled: true, type: 'submit' }
		});

		const button = screen.getByRole('button', { name: 'Unavailable' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('type', 'submit');
	});

	it('handles pointer movement without crashing', async () => {
		render(KleriMagicButton, {
			props: { children: snippet('Hover me') }
		});

		await fireEvent.pointerEnter(screen.getByRole('presentation'));
		await fireEvent.pointerMove(screen.getByRole('button', { name: 'Hover me' }), {
			clientX: 10,
			clientY: 12
		});

		expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
	});
});

describe('KleriMagicCard', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders card children', () => {
		render(KleriMagicCard, {
			props: { children: snippet('Card content') }
		});

		expect(screen.getByText('Card content')).toBeInTheDocument();
	});

	it('applies custom classes to the outer card wrapper', () => {
		const { container } = render(KleriMagicCard, {
			props: { children: snippet('Styled content'), class: 'custom-card' }
		});

		expect(container.firstElementChild).toHaveClass('custom-card');
	});

	it('handles pointer movement without changing the content contract', async () => {
		const { container } = render(KleriMagicCard, {
			props: { children: snippet('Interactive content') }
		});

		await fireEvent.pointerMove(container.firstElementChild as Element, { clientX: 8, clientY: 9 });
		await fireEvent.pointerLeave(container.firstElementChild as Element);

		expect(screen.getByText('Interactive content')).toBeInTheDocument();
	});
});
