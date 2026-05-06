import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KleriButton from './KleriButton.svelte';

describe('KleriButton', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders children', () => {
		render(KleriButton, {
			props: { children: () => 'Click me' }
		});
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('shows success state when showSuccess is true', () => {
		render(KleriButton, {
			props: { showSuccess: true, successMessage: 'Done!' }
		});
		expect(screen.getByText('Done!')).toBeInTheDocument();
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('calls onSuccessComplete after successTimeout', async () => {
		vi.useFakeTimers();
		const onSuccessComplete = vi.fn();

		render(KleriButton, {
			props: {
				showSuccess: true,
				successTimeout: 1000,
				onSuccessComplete
			}
		});

		vi.advanceTimersByTime(1000);
		expect(onSuccessComplete).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});
});
