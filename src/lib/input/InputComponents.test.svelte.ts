import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mail, Moon, Star } from '@lucide/svelte';
import KleriInput from './KleriInput.svelte';
import KleriCombobox from './KleriCombobox.svelte';
import KleriSelect from './KleriSelect.svelte';
import KleriTextarea from './KleriTextarea.svelte';
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

		await fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
		expect(input).toHaveAttribute('type', 'text');
		expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
	});

	it('renders without an icon and links the label to the input', () => {
		render(KleriInput, { props: { label: 'Email', placeholder: 'you@example.com' } });

		// The label is associated with the control, so it resolves by role + name.
		expect(screen.getByRole('textbox', { name: 'Email' })).toBe(
			screen.getByPlaceholderText('you@example.com')
		);
	});

	it('marks the field invalid, shakes it, and keeps `shake` out of the DOM', () => {
		const { container } = render(KleriInput, {
			props: { label: 'Name', placeholder: 'Name', errors: ['Required'], shake: true }
		});

		const input = screen.getByPlaceholderText('Name');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).not.toHaveAttribute('shake');
		expect(container.querySelector('.kleri-shake')).not.toBeNull();
	});

	it('calls onValueChange alongside a consumer oninput handler', async () => {
		const onValueChange = vi.fn();
		const oninput = vi.fn();
		render(KleriInput, {
			props: { placeholder: 'Email', value: '', onValueChange, oninput }
		});

		await fireEvent.input(screen.getByPlaceholderText('Email'), {
			target: { value: 'hello@kleri.org' }
		});

		expect(onValueChange).toHaveBeenCalledWith('hello@kleri.org');
		expect(oninput).toHaveBeenCalledTimes(1);
	});
});

describe('KleriCombobox', () => {
	afterEach(() => {
		cleanup();
	});

	const items = [
		{ value: 'svelte', label: 'Svelte', description: 'Compiler-first UI framework' },
		{ value: 'react', label: 'React', description: 'Component library for the web' }
	];

	it('opens, filters, and selects an option', async () => {
		render(KleriCombobox, {
			props: { label: 'Framework', placeholder: 'Search frameworks', items }
		});

		const input = screen.getByRole('combobox', { name: 'Framework' });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Open Framework' }), {
			button: 0,
			pointerType: 'mouse'
		});
		await fireEvent.input(input, { target: { value: 'svelte' } });
		expect(screen.getByText('Svelte')).toBeInTheDocument();
		expect(screen.queryByText('React')).not.toBeInTheDocument();

		const option = screen.getByText('Svelte');
		await fireEvent.pointerDown(option, { button: 0, pointerType: 'mouse' });
		await fireEvent.pointerUp(option, { button: 0, pointerType: 'mouse' });
		expect(input).toHaveValue('Svelte');
	});

	it('renders errors and prevents interaction when disabled', () => {
		render(KleriCombobox, {
			props: { label: 'Framework', items, errors: ['Choose one'], disabled: true }
		});

		expect(screen.getByText('(Choose one)')).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: 'Framework' })).toBeDisabled();
	});
});
describe('KleriSelect', () => {
	afterEach(() => {
		cleanup();
	});

	const items = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];

	async function choose(name: string) {
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Theme' }), {
			button: 0,
			pointerType: 'mouse'
		});
		const option = screen.getByRole('option', { name });
		await fireEvent.pointerDown(option, { button: 0, pointerType: 'mouse' });
		await fireEvent.pointerUp(option, { button: 0, pointerType: 'mouse' });
	}

	it('renders the placeholder and swaps it for the picked option', async () => {
		render(KleriSelect, {
			props: { label: 'Theme', placeholder: 'Pick a theme', items, value: '' }
		});

		expect(screen.getByText('Pick a theme')).toBeInTheDocument();
		expect(screen.getByText('Theme')).toBeInTheDocument();

		await choose('Dark');
		expect(screen.getByRole('button', { name: 'Theme' })).toHaveTextContent('Dark');
	});

	it('reports the new value and runs the picked option action', async () => {
		const onValueChange = vi.fn();
		const action = vi.fn();
		render(KleriSelect, {
			props: {
				label: 'Theme',
				items: [
					{ value: 'light', label: 'Light' },
					{ value: 'dark', label: 'Dark', action }
				],
				onValueChange
			}
		});

		await choose('Dark');

		expect(onValueChange).toHaveBeenCalledWith('dark');
		expect(action).toHaveBeenCalledTimes(1);
	});

	it('renders an item avatar in the trigger', async () => {
		const { container } = render(KleriSelect, {
			props: {
				label: 'Theme',
				items: [{ value: 'light', label: 'Light', avatarUrl: '/avatars/light.png' }]
			}
		});

		await choose('Light');

		expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/light.png');
	});

	it('prefers persistentIcon over the selected item icon', async () => {
		render(KleriSelect, {
			props: {
				label: 'Theme',
				persistentIcon: Star,
				items: [{ value: 'light', label: 'Light', icon: Moon }]
			}
		});

		await choose('Light');

		const trigger = screen.getByRole('button', { name: 'Theme' });
		expect(trigger.querySelector('svg')).toHaveClass('lucide-star');
	});

	it('forwards form attributes to the trigger', () => {
		render(KleriSelect, {
			props: {
				label: 'Theme',
				items,
				'data-fs-control': 'true',
				'aria-describedby': 'theme-desc'
			}
		});

		const trigger = screen.getByRole('button', { name: 'Theme' });
		expect(trigger).toHaveAttribute('data-fs-control', 'true');
		expect(trigger).toHaveAttribute('aria-describedby', 'theme-desc');
	});

	it('shows errors and blocks the trigger when disabled', () => {
		render(KleriSelect, {
			props: { label: 'Theme', items, errors: ['Pick one'], disabled: true }
		});

		expect(screen.getByText('(Pick one)')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Theme' })).toBeDisabled();
	});
});

describe('KleriTextarea', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders label, placeholder, required state, and an editable textarea', async () => {
		render(KleriTextarea, {
			props: {
				label: 'Bio',
				placeholder: 'Tell us about yourself',
				required: true,
				InputIcon: Mail,
				value: ''
			}
		});

		const textarea = screen.getByPlaceholderText('Tell us about yourself');
		expect(screen.getByText('Bio')).toBeInTheDocument();
		expect(textarea).toBeRequired();
		expect(textarea).toHaveAttribute('rows', '4');

		await fireEvent.input(textarea, { target: { value: 'Hello from kleri' } });
		expect(textarea).toHaveValue('Hello from kleri');
	});

	it('shows validation errors', () => {
		render(KleriTextarea, {
			props: { label: 'About', InputIcon: Mail, errors: ['Required', 'Too short'] }
		});

		expect(screen.getByText('(Required)')).toBeInTheDocument();
		expect(screen.getByText('(Too short)')).toBeInTheDocument();
	});

	it('calls onValueChange on input', async () => {
		const onValueChange = vi.fn();
		render(KleriTextarea, {
			props: { placeholder: 'Bio', value: '', onValueChange }
		});

		await fireEvent.input(screen.getByPlaceholderText('Bio'), { target: { value: 'Hello' } });
		expect(onValueChange).toHaveBeenCalledWith('Hello');
	});

	it('applies the shake animation when shake is true', () => {
		const { container } = render(KleriTextarea, {
			props: { label: 'Bio', shake: true }
		});

		expect(container.querySelector('.kleri-shake')).not.toBeNull();
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

	it('applies the shake animation when shake is true', () => {
		const { container } = render(KleriSlider, {
			props: { label: 'Amount', value: 5, type: 'single', shake: true }
		});

		expect(container.querySelector('.kleri-shake')).not.toBeNull();
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

	it('calls onValueChange when toggled', async () => {
		const onValueChange = vi.fn();
		render(KleriSwitch, {
			props: { ariaLabel: 'Enable sound', value: false, onValueChange }
		});

		await fireEvent.click(screen.getByRole('switch', { name: 'Enable sound' }));
		expect(onValueChange).toHaveBeenCalledWith(true);
	});

	it('supports the disabled state', () => {
		render(KleriSwitch, {
			props: { ariaLabel: 'Locked setting', disabled: true }
		});

		expect(screen.getByRole('switch', { name: 'Locked setting' })).toBeDisabled();
	});

	it('renders a label and errors like the other fields', () => {
		const { container } = render(KleriSwitch, {
			props: { label: 'Notifications', errors: ['Required'] }
		});

		expect(screen.getByText('Notifications')).toBeInTheDocument();
		expect(screen.getByText('(Required)')).toBeInTheDocument();
		expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
		expect(container.querySelector('.kleri-shake')).not.toBeNull();
	});
});
