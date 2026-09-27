import type { ProviderEvent } from '../types.js';
import { parseICS, type ParsedCalendar } from '../core/ics.js';
import { isEventRelevant } from './shared.js';
import { CalendarProviderError, type CalendarProvider } from './types.js';

/**
 * A read-only subscription to an iCalendar feed: public holiday calendars,
 * a colleague's shared Apple/Google/Outlook "secret address", sports fixtures…
 *
 * Browsers only fetch feeds that send CORS headers, which most don't. Route
 * them through your own backend with `proxy` (or a custom `fetch`).
 */
export interface IcsFeedProviderOptions {
	/** Feed URL; `webcal://` is rewritten to `https://`. */
	url?: string;
	/** Static iCalendar content, instead of a URL. */
	text?: string;
	/** @default derived from the URL */
	id?: string;
	/** Sidebar group label. @default 'Subscriptions' */
	label?: string;
	/** Calendar name. @default the feed's X-WR-CALNAME */
	name?: string;
	color?: string;
	/** Rewrites the URL before fetching, e.g. `(url) => '/api/ics?url=' + encodeURIComponent(url)`. */
	proxy?: (url: string) => string;
	fetch?: typeof fetch;
	/** Re-download the feed after this many ms. @default 300000 (5 min) */
	ttl?: number;
}

const FEED_CALENDAR_ID = 'feed';

function hashString(value: string): string {
	let hash = 0;
	for (let i = 0; i < value.length; i++) hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
	return (hash >>> 0).toString(36);
}

export function createIcsFeedProvider(options: IcsFeedProviderOptions): CalendarProvider {
	const { text, label = 'Subscriptions', ttl = 300_000 } = options;
	const url = options.url?.replace(/^webcal:\/\//i, 'https://');
	if (!url && text === undefined) {
		throw new CalendarProviderError('Provide either `url` or `text`', { code: 'invalid' });
	}
	const id = options.id ?? `ics:${hashString(url ?? text ?? '')}`;
	const doFetch =
		options.fetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));

	let cache: { parsed: ParsedCalendar; at: number } | null = null;
	let inflight: Promise<ParsedCalendar> | null = null;

	/**
	 * One download shared by every caller. It deliberately ignores the callers'
	 * signals: the store aborts a range load as soon as the user pages on, and
	 * that must not cancel the fetch the next range is waiting for.
	 */
	function download(): Promise<ParsedCalendar> {
		inflight ??= (async () => {
			let content = text;
			if (content === undefined) {
				let response: Response;
				try {
					response = await doFetch(options.proxy ? options.proxy(url!) : url!);
				} catch (error) {
					throw new CalendarProviderError('Could not reach the calendar feed', {
						code: 'network',
						retryable: true,
						cause: error
					});
				}
				if (!response.ok) {
					throw new CalendarProviderError(`Calendar feed answered ${response.status}`, {
						code:
							response.status === 404 ? 'not-found' : response.status === 401 ? 'auth' : 'unknown',
						status: response.status
					});
				}
				content = await response.text();
			}
			if (!/BEGIN:VCALENDAR/i.test(content)) {
				throw new CalendarProviderError('That address is not an iCalendar feed', {
					code: 'invalid'
				});
			}
			const parsed = parseICS(content, { calendarId: FEED_CALENDAR_ID });
			cache = { parsed, at: Date.now() };
			return parsed;
		})().finally(() => {
			inflight = null;
		});
		return inflight;
	}

	async function load(signal?: AbortSignal): Promise<ParsedCalendar> {
		if (cache && Date.now() - cache.at < ttl) return cache.parsed;
		const shared = download();
		if (!signal) return shared;
		const aborted = () => new CalendarProviderError('Request aborted', { code: 'aborted' });
		if (signal.aborted) throw aborted();
		return new Promise<ParsedCalendar>((resolve, reject) => {
			const onAbort = () => reject(aborted());
			signal.addEventListener('abort', onAbort, { once: true });
			shared.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
		});
	}

	return {
		id,
		kind: 'ics',
		label,
		account: url ? new URL(url).hostname : undefined,
		capabilities: { write: false, freeBusy: false, recurrence: 'client' },

		async listCalendars(signal) {
			const parsed = await load(signal);
			return [
				{
					id: FEED_CALENDAR_ID,
					name: options.name ?? parsed.name ?? 'Subscribed calendar',
					color: options.color ?? parsed.color,
					description: parsed.description,
					timeZone: parsed.timeZone,
					readOnly: true
				}
			];
		},

		async listEvents({ start, end, signal }) {
			const parsed = await load(signal);
			return parsed.events
				.filter((event) => isEventRelevant(event, start, end))
				.map((event): ProviderEvent => ({ ...event, readOnly: true }));
		}
	};
}
