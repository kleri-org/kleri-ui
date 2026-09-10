import { fireEvent, render, within } from '@testing-library/svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import KleriDragNDrop from './KleriDragNDrop.svelte';

const BLOB_URL = 'blob:mock-image-url';

beforeAll(() => {
	// happy-dom does not implement the Web Animations API that Svelte's
	// `transition:*` directives rely on.
	const proto = Element.prototype as unknown as Record<string, unknown>;
	if (typeof proto['animate'] !== 'function') {
		proto['animate'] = () => ({
			finished: Promise.resolve(),
			cancel() {},
			finish() {},
			play() {},
			pause() {}
		});
	}
	// happy-dom does not implement object URLs; stub them deterministically.
	URL.createObjectURL = vi.fn(() => BLOB_URL);
	URL.revokeObjectURL = vi.fn();
});

function makeDataTransfer(files: File[]): DataTransfer {
	const dt = new DataTransfer();
	for (const file of files) {
		dt.items.add(file);
	}
	return dt;
}

describe('KleriDragNDrop image preview', () => {
	it('renders an image preview thumbnail when an image is dropped', async () => {
		const { container } = render(KleriDragNDrop);
		const zone = within(container).getByLabelText('File Upload Dropzone');

		const image = new File(['fake-bytes'], 'photo.png', { type: 'image/png' });
		await fireEvent.drop(zone, { dataTransfer: makeDataTransfer([image]) });
		await tick();

		const preview = container.querySelector('img') as HTMLImageElement;
		expect(preview).toBeTruthy();
		expect(preview.getAttribute('src')).toBe(BLOB_URL);
		expect(preview.getAttribute('draggable')).toBe('false');
		// count label still shows above the preview
		expect(within(container).getByText('1 file selected')).toBeTruthy();
	});

	it('falls back to the file-count label (no preview) for non-image files', async () => {
		const { container } = render(KleriDragNDrop);
		const zone = within(container).getByLabelText('File Upload Dropzone');

		const pdf = new File(['fake-bytes'], 'doc.pdf', { type: 'application/pdf' });
		await fireEvent.drop(zone, { dataTransfer: makeDataTransfer([pdf]) });
		await tick();

		expect(container.querySelector('img')).toBeNull();
		expect(within(container).getByText('1 file selected')).toBeTruthy();
	});

	it('revokes the previous object URL when a new image replaces it', async () => {
		const { container } = render(KleriDragNDrop);
		const zone = within(container).getByLabelText('File Upload Dropzone');

		const a = new File(['x'], 'a.png', { type: 'image/png' });
		const b = new File(['y'], 'b.png', { type: 'image/png' });

		await fireEvent.drop(zone, { dataTransfer: makeDataTransfer([a]) });
		await tick();

		const revoke = vi.spyOn(URL, 'revokeObjectURL');
		await fireEvent.drop(zone, { dataTransfer: makeDataTransfer([a, b]) });
		await tick();

		// multiple defaults to true: both accepted, latest image (b) wins the preview
		expect(container.querySelector('img')).toBeTruthy();
		expect(revoke).toHaveBeenCalled();
	});
});
