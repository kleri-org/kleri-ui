import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mail } from '@lucide/svelte';
import KleriInput from './KleriInput.svelte';
import KleriSwitch from './KleriSwitch.svelte';

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
