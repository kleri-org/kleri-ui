import { CalendarProviderError, type AccessTokenGetter, type ProviderErrorCode } from './types.js';

export interface HttpClientOptions {
	baseUrl: string;
	getAccessToken?: AccessTokenGetter;
	/** Custom `fetch`, e.g. one routed through your backend. @default globalThis.fetch */
	fetch?: typeof fetch;
	/** Retries for 429/5xx/network failures. @default 3 */
	maxRetries?: number;
	/** Extra headers on every request. */
	headers?: Record<string, string>;
}

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	query?: Record<string, string | number | boolean | undefined | null>;
	body?: unknown;
	headers?: Record<string, string>;
	signal?: AbortSignal;
}

export interface HttpClient {
	/** `path` is appended to `baseUrl` unless it is already absolute. */
	request<T>(path: string, options?: RequestOptions): Promise<T>;
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted)
			return reject(new CalendarProviderError('Request aborted', { code: 'aborted' }));
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new CalendarProviderError('Request aborted', { code: 'aborted' }));
		};
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

function codeForStatus(status: number): ProviderErrorCode {
	if (status === 401) return 'auth';
	if (status === 403) return 'forbidden';
	if (status === 404 || status === 410) return 'not-found';
	if (status === 409 || status === 412) return 'conflict';
	if (status === 429) return 'rate-limit';
	if (status === 400 || status === 422) return 'invalid';
	return 'unknown';
}

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as {
			error?: { message?: string } | string;
			message?: string;
		};
		if (typeof body.error === 'string') return body.error;
		return body.error?.message ?? body.message ?? response.statusText;
	} catch {
		return response.statusText || `HTTP ${response.status}`;
	}
}

function retryDelay(attempt: number, response?: Response): number {
	const header = response?.headers.get('Retry-After');
	if (header) {
		const seconds = Number(header);
		if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
		const date = Date.parse(header);
		if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 30_000));
	}
	return Math.min(500 * 2 ** attempt, 8000) + Math.random() * 250;
}

/**
 * A small JSON client for REST calendar APIs: bearer auth with one forced
 * token refresh on 401, exponential backoff honouring `Retry-After`, abort
 * support, and errors normalised to `CalendarProviderError`.
 */
export function createHttpClient(options: HttpClientOptions): HttpClient {
	const { baseUrl, getAccessToken, maxRetries = 3, headers: baseHeaders = {} } = options;
	const doFetch =
		options.fetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));

	async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
		const url = new URL(/^https?:\/\//.test(path) ? path : `${baseUrl}${path}`);
		for (const [key, value] of Object.entries(init.query ?? {})) {
			if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
		}

		let forceRefresh = false;
		for (let attempt = 0; ; attempt++) {
			const headers: Record<string, string> = {
				Accept: 'application/json',
				...baseHeaders,
				...init.headers
			};
			if (getAccessToken) {
				let token: string;
				try {
					token = await getAccessToken({ forceRefresh });
				} catch (error) {
					// A failed sign-in is an auth problem the user can fix by reconnecting.
					throw new CalendarProviderError(
						error instanceof Error && error.message ? error.message : 'Sign-in required',
						{ code: 'auth', cause: error }
					);
				}
				headers.Authorization = `Bearer ${token}`;
			}
			if (init.body !== undefined) headers['Content-Type'] = 'application/json';

			let response: Response;
			try {
				response = await doFetch(url.toString(), {
					method: init.method ?? 'GET',
					headers,
					body: init.body === undefined ? undefined : JSON.stringify(init.body),
					signal: init.signal
				});
			} catch (error) {
				if (init.signal?.aborted) {
					throw new CalendarProviderError('Request aborted', { code: 'aborted', cause: error });
				}
				if (attempt < maxRetries) {
					await sleep(retryDelay(attempt), init.signal);
					continue;
				}
				throw new CalendarProviderError('Network error — check your connection', {
					code: 'network',
					retryable: true,
					cause: error
				});
			}

			if (response.ok) {
				if (response.status === 204 || response.headers.get('Content-Length') === '0')
					return undefined as T;
				const text = await response.text();
				return (text ? JSON.parse(text) : undefined) as T;
			}

			if (response.status === 401 && getAccessToken && !forceRefresh) {
				forceRefresh = true;
				continue;
			}
			if (RETRYABLE.has(response.status) && attempt < maxRetries) {
				await sleep(retryDelay(attempt, response), init.signal);
				continue;
			}
			throw new CalendarProviderError(await readErrorMessage(response), {
				code: codeForStatus(response.status),
				status: response.status,
				retryable: RETRYABLE.has(response.status)
			});
		}
	}

	return { request };
}
