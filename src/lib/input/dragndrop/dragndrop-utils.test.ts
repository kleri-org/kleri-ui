import { describe, expect, it, vi } from 'vitest';
import {
	createErrorTimer,
	formatBytes,
	getAcceptString,
	getDefaultSubText,
	getErrorSubText,
	getFileName,
	isAllowedFile,
	restingStatus
} from './dragndrop-utils.js';

describe('getErrorSubText', () => {
	it('uses "an" before a vowel-initial label', () => {
		expect(getErrorSubText(['image'])).toBe('Please upload an image file');
	});

	it('uses "a" before a consonant-initial label', () => {
		expect(getErrorSubText(['pdf'])).toBe('Please upload a PDF file');
	});

	it('agrees with the first label of a list, in either order', () => {
		expect(getErrorSubText(['image', 'pdf'])).toBe('Please upload an image or PDF file');
		expect(getErrorSubText(['pdf', 'image'])).toBe('Please upload a PDF or image file');
	});

	it('falls back to a generic message when nothing is allowed', () => {
		expect(getErrorSubText([])).toBe('Please upload a supported file');
	});

	it('uses an unknown type name verbatim, still picking the right article', () => {
		expect(getErrorSubText(['archive'])).toBe('Please upload an archive file');
		expect(getErrorSubText(['zip'])).toBe('Please upload a zip file');
	});
});

describe('getAcceptString', () => {
	it('joins the accept values of known types', () => {
		expect(getAcceptString(['image', 'pdf'])).toBe('image/*,application/pdf');
	});

	it('returns undefined when no filter is requested', () => {
		expect(getAcceptString([])).toBeUndefined();
		expect(getAcceptString(undefined)).toBeUndefined();
	});

	it('returns undefined rather than an empty accept for unknown types only', () => {
		expect(getAcceptString(['nope'])).toBeUndefined();
	});
});

describe('getDefaultSubText', () => {
	it('lists the allowed labels', () => {
		expect(getDefaultSubText(['image', 'pdf'])).toBe('Supports image and PDF files');
	});

	it('returns undefined when there is nothing to describe', () => {
		expect(getDefaultSubText([])).toBeUndefined();
	});
});

describe('formatBytes', () => {
	it('formats zero and non-positive values', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(-1)).toBe('0 B');
		expect(formatBytes(Number.NaN)).toBe('0 B');
	});

	it('scales through the common units', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(1024)).toBe('1 KB');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatBytes(1024 ** 3)).toBe('1 GB');
	});

	it('clamps to the largest known unit instead of printing "undefined"', () => {
		expect(formatBytes(1024 ** 6)).toBe('1024 PB');
		expect(formatBytes(1024 ** 8)).not.toContain('undefined');
	});
});

describe('getFileName', () => {
	it('reads the basename of a POSIX path', () => {
		expect(getFileName('/home/ishaan/logo.png')).toBe('logo.png');
	});

	it('reads the basename of a Windows path', () => {
		expect(getFileName('C:\\Users\\ishaan\\Pictures\\logo.png')).toBe('logo.png');
	});

	it('returns a bare name unchanged', () => {
		expect(getFileName('logo.png')).toBe('logo.png');
	});

	it('falls back to the input when the path ends in a separator', () => {
		expect(getFileName('/tmp/')).toBe('/tmp/');
	});
});

describe('isAllowedFile', () => {
	const file = (name: string, type = '') => new File(['x'], name, { type });

	it('accepts anything when no filter is given', () => {
		expect(isAllowedFile(file('notes.txt'), [])).toBe(true);
		expect(isAllowedFile(file('notes.txt'), undefined)).toBe(true);
	});

	it('matches on a wildcard MIME type', () => {
		expect(isAllowedFile(file('photo.png', 'image/png'), ['image'])).toBe(true);
	});

	it('falls back to the extension when the MIME type is missing', () => {
		expect(isAllowedFile(file('doc.pdf'), ['pdf'])).toBe(true);
	});

	it('rejects a file matching neither MIME nor extension', () => {
		expect(isAllowedFile(file('notes.txt', 'text/plain'), ['pdf'])).toBe(false);
	});
});

describe('restingStatus', () => {
	it('is idle with nothing selected and accepted otherwise', () => {
		expect(restingStatus(0)).toEqual({ state: 'idle' });
		expect(restingStatus(2)).toEqual({ state: 'accepted', fileCount: 2 });
	});
});

describe('createErrorTimer', () => {
	it('reverts once the delay elapses', () => {
		vi.useFakeTimers();
		const revert = vi.fn();
		const timer = createErrorTimer(revert);

		timer.start(3000);
		vi.advanceTimersByTime(2999);
		expect(revert).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(revert).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	it('restarting replaces the pending revert instead of stacking one', () => {
		vi.useFakeTimers();
		const revert = vi.fn();
		const timer = createErrorTimer(revert);

		timer.start(1000);
		vi.advanceTimersByTime(900);
		timer.start(1000);
		vi.advanceTimersByTime(900);
		expect(revert).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(revert).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	it('clear cancels a pending revert', () => {
		vi.useFakeTimers();
		const revert = vi.fn();
		const timer = createErrorTimer(revert);

		timer.start(1000);
		timer.clear();
		vi.advanceTimersByTime(5000);
		expect(revert).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});
