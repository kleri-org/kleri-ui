import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import KleriMorphDialog from './KleriMorphDialog.svelte';

const title = createRawSnippet(() => ({ render: () => '<span>Settings</span>' }));
const children = createRawSnippet(() => ({ render: () => '<p>Dialog body</p>' }));

describe('KleriMorphDialog', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders the default trigger and no dialog while closed', () => {
		render(KleriMorphDialog, { props: { title, children, buttonText: 'Open settings' } });

		expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('opens from the trigger and renders its content', async () => {
		render(KleriMorphDialog, { props: { title, children, buttonText: 'Open settings' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText('Dialog body')).toBeInTheDocument();
	});

	it('fires onClose once, only after closing, and unmounts the dialog', async () => {
		const onClose = vi.fn();
		const onOpenChange = vi.fn();
		render(KleriMorphDialog, {
			props: { title, children, buttonText: 'Open settings', onClose, onOpenChange }
		});

		expect(onClose).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
		const dialog = await screen.findByRole('dialog');
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		const close = dialog.querySelector<HTMLElement>('[data-dialog-close]')!;
		await fireEvent.click(close);

		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
	});

	it('renders when controlled open', async () => {
		render(KleriMorphDialog, { props: { title, children, open: true } });

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
	});
});
