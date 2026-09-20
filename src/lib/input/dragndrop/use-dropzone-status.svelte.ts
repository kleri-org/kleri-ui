import { restingStatus, type DropzoneStatus } from './dragndrop-utils.js';

/**
 * Keeps a dropzone's badge in step with its file list.
 *
 * Both dropzones expose `files` as a bindable prop, so the consumer can clear
 * or splice it behind the component's back; without this the badge kept showing
 * a stale count. An error or an in-flight drag is left alone — the error has its
 * own timer, and a hover ends on its own.
 */
export function syncDropzoneStatus(
	getCount: () => number,
	getStatus: () => DropzoneStatus,
	setStatus: (next: DropzoneStatus) => void
) {
	$effect(() => {
		const current = getStatus();
		if (current.state === 'error' || current.state === 'hover') return;

		const resting = restingStatus(getCount());
		if (current.state === 'idle' && resting.state === 'idle') return;
		if (
			current.state === 'accepted' &&
			resting.state === 'accepted' &&
			current.fileCount === resting.fileCount
		) {
			return;
		}

		setStatus(resting);
	});
}
