import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mail } from '@lucide/svelte';
import KleriInput from './KleriInput.svelte';
import KleriSwitch from './KleriSwitch.svelte';
import KleriSlider from './KleriSlider.svelte';

describe('KleriInput', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders label, placeholder, required state, and an editable input', async () => {
		render(KleriInput, {
			props: {
				label: 'Email',
				placeholder: 'you@example.com',
				required: true,
				InputIcon: Mail,
				value: ''
			}
		});

		const input = screen.getByPlaceholderText('you@example.com');
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(input).toBeRequired();

		await fireEvent.input(input, { target: { value: 'hello@kleri.org' } });
		expect(input).toHaveValue('hello@kleri.org');
	});

	it('shows validation errors', () => {
		render(KleriInput, {
			props: { label: 'Name', InputIcon: Mail, errors: ['Required', 'Too short'] }
		});

		expect(screen.getByText('(Required)')).toBeInTheDocument();
		expect(screen.getByText('(Too short)')).toBeInTheDocument();
	});

	it('toggles password visibility', async () => {
		render(KleriInput, {
			props: { type: 'password', placeholder: 'Password', InputIcon: Mail, value: 'secret' }
		});

		const input = screen.getByPlaceholderText('Password');
		expect(input).toHaveAttribute('type', 'password');

		await fireEvent.click(screen.getByRole('button'));
		expect(input).toHaveAttribute('type', 'text');
	});
});

describe('KleriSlider', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders label and value display', () => {
		render(KleriSlider, {
			props: { label: 'Volume', value: 42, showValue: true, type: 'single' }
		});

		expect(screen.getByText('Volume')).toBeInTheDocument();
		expect(screen.getByText('42')).toBeInTheDocument();
	});

	it('formats value with custom formatter', () => {
		render(KleriSlider, {
			props: {
				label: 'Progress',
				value: 75,
				showValue: true,
				type: 'single',
				valueFormatter: (v: number) => `${v}%`
			}
		});

		expect(screen.getByText('75%')).toBeInTheDocument();
	});

	it('shows validation errors', () => {
		render(KleriSlider, {
			props: { label: 'Amount', value: 5, type: 'single', errors: ['Too low', 'Minimum is 10'] }
		});

		expect(screen.getByText('(Too low)')).toBeInTheDocument();
		expect(screen.getByText('(Minimum is 10)')).toBeInTheDocument();
	});

	it('supports the disabled state', () => {
		render(KleriSlider, {
			props: { label: 'Locked', value: 50, type: 'single', disabled: true }
		});

		const slider = screen.getByRole('slider');
		expect(slider).toHaveAttribute('data-disabled');
		expect(slider).toHaveAttribute('aria-disabled', 'true');
	});

	it('hides value when showValue is false', () => {
		render(KleriSlider, {
			props: { label: 'Hidden', value: 99, type: 'single', showValue: false }
		});

		expect(screen.queryByText('99')).not.toBeInTheDocument();
	});
});

describe('KleriSwitch', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders with an accessible label and checked state', () => {
		render(KleriSwitch, {
			props: { ariaLabel: 'Enable notifications', value: true }
		});

		const switchControl = screen.getByRole('switch', { name: 'Enable notifications' });
		expect(switchControl).toBeInTheDocument();
		expect(switchControl).toHaveAttribute('data-state', 'checked');
	});

	it('calls onChecked when toggled', async () => {
		const onChecked = vi.fn();
		render(KleriSwitch, {
			props: { ariaLabel: 'Enable sound', value: false, onChecked }
		});

		await fireEvent.click(screen.getByRole('switch', { name: 'Enable sound' }));
		expect(onChecked).toHaveBeenCalledWith(true);
	});

	it('supports the disabled state', () => {
		render(KleriSwitch, {
			props: { ariaLabel: 'Locked setting', disabled: true }
		});

		expect(screen.getByRole('switch', { name: 'Locked setting' })).toBeDisabled();
	});
});
