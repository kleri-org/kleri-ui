// Barrel file for drag-and-drop components and utilities

// Components
export { default as DragNDropChrome } from './DragNDropChrome.svelte';
export { default as KleriDragNDrop } from './KleriDragNDrop.svelte';

// Utilities
export {
	isAllowedFile,
	getAcceptString,
	getDefaultSubText,
	getErrorSubText,
	FILE_TYPE_REGISTRY,
	IMAGE_EXTENSIONS,
	isImageFile,
	type FileTypeEntry,
	type FileTypeName
} from './dragndrop-utils.js';
