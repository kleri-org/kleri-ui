import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ButtonGroupTestHost from '../../test/ButtonGroupTestHost.svelte';

describe('KleriButtonGroup', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders with role="group" and data-slot', () => {
		render(ButtonGroupTestHost);
		const group = screen.getByRole('group');
		expect(group).toBeInTheDocument();
		expect(group).toHaveAttribute('data-slot', 'button-group');
		expect(group).toHaveAttribute('data-orientation', 'horizontal');
	});

	it('applies horizontal orientation classes by default', () => {
		render(ButtonGroupTestHost);
		const group = screen.getByRole('group');
		expect(group).toHaveClass('flex');
		expect(group).not.toHaveClass('flex-col');
	});

	it('applies vertical orientation classes when specified', () => {
		render(ButtonGroupTestHost, { props: { orientation: 'vertical' } });
		const group = screen.getByRole('group');
		expect(group).toHaveClass('flex-col');
		expect(group).toHaveAttribute('data-orientation', 'vertical');
	});

	it('propagates size to child utility buttons via context', () => {
		render(ButtonGroupTestHost, { props: { size: 'sm' } });
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(2);
		buttons.forEach((btn) => {
			expect(btn).toHaveClass('text-sm');
		});
	});

	it('propagates variant to child utility buttons via context', () => {
		render(ButtonGroupTestHost, { props: { variant: 'outline' } });
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(2);
		buttons.forEach((btn) => {
			expect(btn).toHaveClass('border-border');
			expect(btn).toHaveClass('bg-transparent');
		});
	});

	it('renders a separator when included', () => {
		render(ButtonGroupTestHost, { props: { includeSeparator: true } });
		const separators = screen.getAllByRole('separator');
		expect(separators).toHaveLength(1);
		expect(separators[0]).toHaveAttribute('data-slot', 'button-group-separator');
	});

	it('renders text when included', () => {
		render(ButtonGroupTestHost, { props: { includeText: true } });
		expect(screen.getByText('https://')).toBeInTheDocument();
	});

	it('adds data-slot="button" to utility buttons', () => {
		render(ButtonGroupTestHost);
		const buttons = screen.getAllByRole('button');
		expect(buttons[0]).toHaveAttribute('data-slot', 'button');
		expect(buttons[1]).toHaveAttribute('data-slot', 'button');
	});
});
