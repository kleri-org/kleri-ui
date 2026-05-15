export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/**
 * Checks whether a file path or name ends with a known image extension.
 * Comparison is case-insensitive.
 */
export function isImageFile(pathOrName: string): boolean {
	const lower = pathOrName.toLowerCase();
	return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
