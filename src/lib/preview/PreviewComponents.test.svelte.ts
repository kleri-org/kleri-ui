import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CodePreview from './CodePreview.svelte';
import PropControls, { type PropSchema } from './PropControls.svelte';

describe('CodePreview', () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('renders formatted self-closing usage code', () => {
		render(CodePreview, {
			props: { component: 'KleriButton', props: { disabled: true, count: 2, label: 'Save' } }
		});

		expect(screen.getByText('Usage')).toBeInTheDocument();
		expect(screen.getByText(/<KleriButton/)).toHaveTextContent('disabled={true}');
		expect(screen.getByText(/<KleriButton/)).toHaveTextContent('count={2}');
		expect(screen.getByText(/<KleriButton/)).toHaveTextContent('label="Save"');
	});

	it('copies the generated code and shows success state', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);

		render(CodePreview, {
			props: { component: 'KleriButton', props: { children: 'Click me', disabled: false } }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

		expect(writeText).toHaveBeenCalledWith(expect.stringContaining('<KleriButton'));
		expect(screen.getByRole('button', { name: /Copied!/ })).toBeDisabled();
	});
});

describe('PropControls', () => {
	afterEach(() => {
		cleanup();
	});

	const schema: PropSchema = {
		enabled: { type: 'boolean', label: 'Enabled' },
		label: { type: 'string', label: 'Label' },
		count: { type: 'number', label: 'Count' }
	};

	it('renders controls for boolean, string, and number props', () => {
		render(PropControls, {
			props: { schema, values: { enabled: true, label: 'Launch', count: 3 } }
		});

		expect(screen.getByRole('switch', { name: 'Enabled' })).toBeInTheDocument();
		expect(screen.getByText('true')).toBeInTheDocument();
		expect(screen.getByText('Label')).toBeInTheDocument();
		expect(screen.getByText('Count')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Launch')).toBeInTheDocument();
		expect(screen.getByDisplayValue(3)).toBeInTheDocument();
	});

	it('updates text and number inputs', async () => {
		render(PropControls, {
			props: { schema, values: { enabled: false, label: 'Before', count: 1 } }
		});

		const labelInput = screen.getByDisplayValue('Before');
		const countInput = screen.getByDisplayValue(1);

		await fireEvent.input(labelInput, { target: { value: 'After' } });
		await fireEvent.input(countInput, { target: { value: '5' } });

		expect(labelInput).toHaveValue('After');
		expect(countInput).toHaveValue(5);
	});
});
