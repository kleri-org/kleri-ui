import type { Page } from '@playwright/test';

/**
 * Navigate to a route and resolve only once Svelte has hydrated the page.
 *
 * The preview server renders the app on the server, so the markup is present and
 * looks interactive before `hydrate()` attaches listeners. Interacting inside that
 * window is silently dropped — the DOM never reacts — which makes tests flake.
 * The root layout sets `data-hydrated` on `<html>` when its effect flushes, so
 * waiting for it closes that window exactly instead of racing a fixed timeout.
 */
export async function gotoHydrated(page: Page, url: string): Promise<void> {
	await page.goto(url);
	await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' });
}
