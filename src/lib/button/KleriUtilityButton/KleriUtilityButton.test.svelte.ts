import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TooltipProviderTestHost from '../../../test/TooltipProviderTestHost.svelte';

describe('KleriUtilityButton', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders children inside a button', () => {
		render(TooltipProviderTestHost, {
			props: { mode: 'utility-button', buttonText: 'Utility action' }
		});

		expect(screen.getByRole('button', { name: 'Utility action' })).toBeInTheDocument();
	});

	it('passes button attributes and custom classes to the trigger button', () => {
		render(TooltipProviderTestHost, {
			props: {
				mode: 'utility-button',
				buttonText: 'Disabled action',
				disabled: true,
				class: 'extra-class'
			}
		});

		const button = screen.getByRole('button', { name: 'Disabled action' });
		expect(button).toBeDisabled();
		expect(button).toHaveClass('extra-class');
	});
});
