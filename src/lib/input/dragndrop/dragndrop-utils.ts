// ---------------------------------------------------------------------------
// File-type definitions & helpers for KleriDragNDrop
// ---------------------------------------------------------------------------

/**
 * A named file type that the dropzone knows how to validate, accept in the
 * file picker, and describe in auto-generated help text.
 *
 * Built‑in: `"image"`, `"pdf"`.  Pass any string to the registry to add
 * custom types without touching component code.
 */
export type FileTypeName = string;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface FileTypeEntry {
	/** File extensions (lowercase, including the dot) */
	extensions: string[];
	/** MIME type for browser‑based checks (e.g. `"application/pdf"`) */
	mime: string;
	/** Value used in the HTML `<input accept>` attribute */
	accept: string;
	/** Human‑readable label for auto‑generated help text */
	label: string;
}

export const FILE_TYPE_REGISTRY: Record<FileTypeName, FileTypeEntry> = {
	image: {
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
		mime: 'image/*',
		accept: 'image/*',
		label: 'image'
	},
	pdf: {
		extensions: ['.pdf'],
		mime: 'application/pdf',
		accept: 'application/pdf',
		label: 'PDF'
	}
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a file matches the given allowed‑types list.
 *
 * Tries the browser‑provided MIME type first; falls back to the file
 * extension when the MIME is empty or unknown (common with drag‑and‑drop on
 * some platforms).
 *
 * @returns `true` when the file is allowed **or** when `allowedTypes` is
 *          empty / undefined (meaning “allow everything”).
 */
export function isAllowedFile(file: File, allowedTypes?: FileTypeName[]): boolean {
	// No filter → accept everything.
	if (!allowedTypes || allowedTypes.length === 0) return true;

	for (const typeName of allowedTypes) {
		const entry = FILE_TYPE_REGISTRY[typeName];
		if (!entry) continue;

		// 1. MIME check (when available)
		if (file.type) {
			if (entry.mime.endsWith('/*')) {
				// e.g. "image/*"
				const prefix = entry.mime.slice(0, -1); // "image/"
				if (file.type.startsWith(prefix)) return true;
			} else if (file.type === entry.mime) {
				return true;
			}
		}

		// 2. Extension fallback
		const lower = file.name.toLowerCase();
		if (entry.extensions.some((ext) => lower.endsWith(ext))) {
			return true;
		}
	}

	return false;
}

// ---------------------------------------------------------------------------
// Accept string for <input type=file>
// ---------------------------------------------------------------------------

/**
 * Builds the `accept` attribute value for a native file input.
 *
 * @example
 *   getAcceptString(['image', 'pdf'])  // "image/*,application/pdf"
 *   getAcceptString(['pdf'])           // "application/pdf"
 *   getAcceptString(['image'])         // "image/*"
 *   getAcceptString([])                // undefined (no filter)
 */
export function getAcceptString(allowedTypes?: FileTypeName[]): string | undefined {
	if (!allowedTypes || allowedTypes.length === 0) return undefined;

	const accepts = allowedTypes.map((t) => FILE_TYPE_REGISTRY[t]?.accept).filter(Boolean);

	return accepts.length > 0 ? accepts.join(',') : undefined;
}

// ---------------------------------------------------------------------------
// Auto‑generated sub‑text
// ---------------------------------------------------------------------------

/**
 * Generates a human‑readable hint describing the allowed file types.
 *
 * @example
 *   getDefaultSubText(['image'])              // "Supports image files"
 *   getDefaultSubText(['pdf'])                // "Supports PDF files"
 *   getDefaultSubText(['image', 'pdf'])       // "Supports image and PDF files"
 *   getDefaultSubText(undefined)              // undefined
 */
export function getDefaultSubText(allowedTypes?: FileTypeName[]): string | undefined {
	if (!allowedTypes || allowedTypes.length === 0) return undefined;

	const labels = allowedTypes.map((t) => FILE_TYPE_REGISTRY[t]?.label).filter(Boolean) as string[];

	if (labels.length === 0) return undefined;

	const list = new Intl.ListFormat('en', {
		style: 'long',
		type: 'conjunction'
	}).format(labels);

	return `Supports ${list} files`;
}

// ---------------------------------------------------------------------------
// Error message generation
// ---------------------------------------------------------------------------

/** `"a"` or `"an"` for `word`, based on its first letter. */
function indefiniteArticle(word: string): string {
	return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

/**
 * Generates an error message telling the user what file types are expected.
 *
 * @example
 *   getErrorSubText(['image', 'pdf'])  // "Please upload an image or PDF file"
 *   getErrorSubText(['pdf', 'image'])  // "Please upload a PDF or image file"
 *   getErrorSubText(['pdf'])           // "Please upload a PDF file"
 *   getErrorSubText([])                // "Please upload a supported file"
 */
export function getErrorSubText(allowedTypes: FileTypeName[]): string {
	const labels = allowedTypes.map((t) => FILE_TYPE_REGISTRY[t]?.label ?? t);

	if (labels.length === 0) return 'Please upload a supported file';

	const list =
		labels.length === 1
			? labels[0]
			: new Intl.ListFormat('en', { style: 'long', type: 'disjunction' }).format(labels);

	// The article agrees with the first label ("an image", "a PDF"), not with a
	// hard-coded "an" that read wrong for every consonant-initial type.
	return `Please upload ${indefiniteArticle(labels[0])} ${list} file`;
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/**
 * Formats a byte count for display.
 *
 * @example
 *   formatBytes(0)          // "0 B"
 *   formatBytes(1536)       // "1.5 KB"
 *   formatBytes(2 ** 60)    // "1 PB"  (clamped to the largest known unit)
 */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

	const k = 1024;
	// Clamped: past ~1 TB the unclamped index ran off the end of the unit list
	// and rendered "1.2 undefined".
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), BYTE_UNITS.length - 1);
	const value = bytes / Math.pow(k, exponent);

	return `${parseFloat(value.toFixed(1))} ${BYTE_UNITS[exponent]}`;
}

/**
 * Extracts the file name from a full path, handling both POSIX (`/`) and
 * Windows (`\\`) separators — Tauri reports native paths, so a Windows build
 * otherwise showed the entire `C:\\Users\\...` path as the "name".
 */
export function getFileName(path: string): string {
	const name = path.split(/[\\/]/).pop();
	return name && name.length > 0 ? name : path;
}

// ---------------------------------------------------------------------------
// Dropzone status
// ---------------------------------------------------------------------------

/** The single source of truth for a dropzone's visual state. */
export type DropzoneStatus =
	| { state: 'idle' }
	| { state: 'hover' }
	| { state: 'accepted'; fileCount: number }
	| { state: 'error'; message: string };

/** `accepted` when anything is selected, `idle` otherwise. */
export function restingStatus(count: number): DropzoneStatus {
	return count > 0 ? { state: 'accepted', fileCount: count } : { state: 'idle' };
}

/**
 * A single pending "revert to idle" timer.
 *
 * Both dropzones need exactly this: show an error, drop back to idle after
 * `errorDuration`, and never fire after the component is gone.
 */
export function createErrorTimer(revert: () => void) {
	let handle: ReturnType<typeof setTimeout> | null = null;

	return {
		/** Cancels any pending revert. */
		clear() {
			if (handle !== null) {
				clearTimeout(handle);
				handle = null;
			}
		},
		/** Restarts the timer; `clear()` (e.g. from `onDestroy`) cancels it. */
		start(delayMs: number) {
			this.clear();
			handle = setTimeout(() => {
				handle = null;
				revert();
			}, delayMs);
		}
	};
}

// ---------------------------------------------------------------------------
// Legacy helpers (kept for internal / downstream compatibility)
// ---------------------------------------------------------------------------

export const IMAGE_EXTENSIONS = FILE_TYPE_REGISTRY.image.extensions;

/** @deprecated Use {@link isAllowedFile} instead. */
export function isImageFile(pathOrName: string): boolean {
	const lower = pathOrName.toLowerCase();
	return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
