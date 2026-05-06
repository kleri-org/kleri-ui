import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TooltipProviderTestHost from '../../test/TooltipProviderTestHost.svelte';

describe('KleriTooltip', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders its trigger snippet', () => {
		render(TooltipProviderTestHost, {
			props: { triggerText: 'Tooltip trigger', contentText: 'Tooltip content' }
		});

		expect(screen.getByRole('button', { name: 'Tooltip trigger' })).toBeInTheDocument();
	});

	it('renders content when controlled open', async () => {
		render(TooltipProviderTestHost, {
			props: { open: true, triggerText: 'Open trigger', contentText: 'Visible tooltip' }
		});

		expect(await screen.findByText('Visible tooltip')).toBeInTheDocument();
	});
});
