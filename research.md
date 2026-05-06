# Research: Playwright E2E Testing with SvelteKit — Modern Best Practices (2026)

## Summary

Playwright is the undisputed default E2E testing framework for SvelteKit in 2026 (~6.5M weekly downloads, Microsoft-backed). The canonical setup uses `npx sv add playwright` to scaffold everything, or manual installation of `@playwright/test` with a `webServer`-based `playwright.config.ts` that starts the SvelteKit preview server. Bun has partial compatibility — `bun add -d @playwright/test` works for install, but `connectOverCDP()` requires a runtime patch for WebSocket support. CI integration via GitHub Actions is well-documented with first-class sharding, retry, and blob-report merging support.

---

## Findings

### 1. Playwright + SvelteKit Setup — The Canonical Path

**The recommended way is the Svelte CLI add-on.** Run `npx sv add playwright` in an existing SvelteKit project. This:
- Adds `@playwright/test` as a dev dependency
- Creates a `playwright.config.(ts|js)` with SvelteKit-appropriate defaults
- Adds `test` and `test:e2e` scripts to `package.json`
- Updates `.gitignore` (adds `/test-results/`, `/playwright-report/`, `/playwright/.cache/`)
- Creates a demo test in `tests/`

**Manual installation** is also straightforward:
```bash
bun add -d @playwright/test
npx playwright install
```

**Current versions (as of May 2026):** The SvelteKit repo was using `@playwright/test@1.59.1` in its most recent update (March 2026). Playwright 1.x is the stable line; there is no 2.x in production yet. Playwright browsers are installed via `npx playwright install` (with `--with-deps` for system libraries).

**Key config pattern — the `webServer` option:** Unlike unit tests, Playwright needs a running SvelteKit server. The modern pattern uses the `webServer` config option (not `baseURL` alone) to auto-start the preview server:

```ts
// playwright.config.ts — modern SvelteKit setup
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'bun run build && bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

**Important:** The SvelteKit preview server defaults to port **4173** (Vite's default), not 3000. Early SvelteKit templates used port 3000, which caused timeouts in CI — a known issue tracked in sveltejs/kit#5429. Always use 4173 unless you've explicitly changed `previewOptions.port` in `svelte.config.js`.

[Source: Svelte CLI Docs — playwright](https://svelte.dev/docs/cli/playwright)  
[Source: Playwright — Best Practices](https://playwright.dev/docs/best-practices)  
[Source: Playwright — CI Configuration](https://playwright.dev/docs/ci)  
[Source: sveltejs/learn.svelte.dev playwright.config.ts](https://github.com/sveltejs/learn.svelte.dev/blob/main/playwright.config.ts)

---

### 2. Project Structure Conventions

The `npx sv add playwright` scaffold creates a `tests/` directory at the project root. The modern recommended structure for a non-trivial SvelteKit project:

```
project-root/
├── tests/
│   ├── public/                    # Tests for unauthenticated pages
│   │   ├── homepage.spec.ts
│   │   ├── blog.spec.ts
│   │   └── seo.spec.ts
│   ├── admin/                     # Tests for authenticated pages
│   │   ├── dashboard.spec.ts
│   │   └── settings.spec.ts
│   ├── api/                       # Tests for +server.js/ts endpoints
│   │   └── api.spec.ts
│   ├── fixtures/
│   │   ├── auth.fixture.ts        # Custom auth fixtures
│   │   └── data.fixtures.ts       # Test data factories
│   ├── pages/                     # Page Object Models
│   │   ├── HomePage.ts
│   │   ├── LoginPage.ts
│   │   └── DashboardPage.ts
│   ├── helpers/
│   │   ├── api.helper.ts          # API call helpers
│   │   └── db.helper.ts           # Database seeds/teardowns
│   ├── auth.setup.ts              # Global auth setup (setup project)
│   └── example.spec.ts
├── playwright/
│   ├── .auth/                     # Auth state files (gitignored)
│   │   └── user.json
│   └── fixtures.ts                # Shared fixture overrides
├── playwright.config.ts
└── playwright-report/             # Generated reports (gitignored)
```

**Page Object Model** is the standard pattern for maintainable tests:
```ts
// tests/pages/LoginPage.ts
import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('/dashboard');
  }
}
```

**Test fixtures** in Playwright provide isolated, composable setup. The `playwright/fixtures.ts` pattern overrides the built-in fixtures to add project-specific setup (e.g., authenticated state per worker, database seeding).

[Source: Playwright — Page Object Models](https://playwright.dev/docs/pom)  
[Source: Playwright — Fixtures](https://playwright.dev/docs/test-fixtures)  
[Source: Playwright — Authentication](https://playwright.dev/docs/auth)  
[Source: ECOSIRE — Playwright E2E Testing Guide](https://ecosire.com/blog/playwright-e2e-testing-guide)

---

### 3. SvelteKit-Specific Testing Patterns

**Testing SSR (Server-Side Rendering):** Playwright's default `page.goto()` tests the fully rendered page including SSR. To verify that content is server-rendered (not just client-hydrated), check the HTML source:
```ts
test('page content is server-rendered', async ({ page }) => {
  const response = await page.goto('/');
  const html = await response?.text();
  expect(html).toContain('<h1>Expected SSR content</h1>');
});
```
Use `sveltekit-playwright-fetch-mock` (by markjaquith) to mock `fetch()` calls made during SSR, which Playwright's browser-level `page.route()` cannot intercept (those happen on the server, not in the browser).

**Testing Form Actions (SvelteKit `+page.server.ts`):**
```ts
test('form action succeeds', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Message').fill('Hello world');
  await page.getByRole('button', { name: 'Submit' }).click();
  // SvelteKit form actions return a redirect or re-render
  await expect(page.getByText('Message sent successfully')).toBeVisible();
  // Check URL after redirect
  expect(page.url()).toContain('/contact?success=true');
});
```

**Testing API Routes (`+server.js`/`+server.ts` endpoints):**
```ts
import { test, expect } from '@playwright/test';

test('API endpoint returns JSON', async ({ request }) => {
  const response = await request.get('/api/data');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty('items');
});

test('API endpoint rejects unauthorized', async ({ request }) => {
  const response = await request.post('/api/admin', {
    data: { action: 'delete' },
  });
  expect(response.status()).toBe(401);
});
```

**Authentication in E2E Tests — the `storageState` pattern (recommended):**
1. Create `tests/auth.setup.ts` that logs in once and saves cookies/localStorage to `playwright/.auth/user.json`
2. Configure a `setup` project in `playwright.config.ts` with `dependencies: ['setup']`
3. All other projects use `storageState: 'playwright/.auth/user.json'`

```ts
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFile });
});
```

For tests that modify server-side state, use **one account per parallel worker** — the worker-scoped fixture pattern with `testInfo.parallelIndex` as the account key.

**SPA Navigation:** Playwright's `page.goto()` triggers full page loads. For testing client-side navigation (SvelteKit's `<a>` links that use the router), use `page.click()` followed by `page.waitForURL()`:
```ts
await page.getByRole('link', { name: 'About' }).click();
await page.waitForURL('/about');
await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();
```

**Known cookie timing issue with SvelteKit:** Cookies set during SSR (e.g., session cookies from SvelteKit's `cookies.set()`) are not available to Playwright's `page.context().addCookies()` before the page renders. The workaround is to add cookies via the `storageState` fixture or use `context.addCookies()` on a fresh context before navigation, ensuring the cookie is set on the right domain/path.

[Source: Playwright — Authentication](https://playwright.dev/docs/auth)  
[Source: markjaquith/sveltekit-playwright-fetch-mock](https://github.com/markjaquith/sveltekit-playwright-fetch-mock)  
[Source: ray.run — SvelteKit Cookie Timing Issue](https://ray.run/discord-forum/threads/15810-testing-sveltekit-app-my-cookies-arent-being-set-until-after-the-page-renders)  
[Source: Okupter — E2E Testing with SvelteKit and Playwright](https://www.okupter.com/blog/e2e-testing-with-sveltekit-and-playwright)

---

### 4. CI Integration (GitHub Actions)

**Minimum viable workflow:**
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - uses: actions/upload-artifact@v5
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

**Sharded workflow (recommended for suites >50 tests):**
```yaml
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    steps:
      - uses: actions/checkout@v5
      - run: bun install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 1

  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: bun install --frozen-lockfile
      - uses: actions/download-artifact@v5
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v5
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

**Key CI configuration flags:**
- `retries: process.env.CI ? 2 : 0` — re-run flaky tests up to 2 times in CI
- `workers: process.env.CI ? 1 : undefined` — single worker per CI runner for stability (parallelism via sharding instead)
- `forbidOnly: !!process.env.CI` — prevents `test.only` from being committed
- `reporter: [['html'], ['github']]` — `github` reporter annotates PRs directly
- `trace: 'on-first-retry'` — captures full trace only on tests that need a retry
- `screenshot: 'only-on-failure'` and `video: 'retain-on-failure'` — diagnostic artifacts

**Browser caching** is not recommended by Playwright (download time ≈ cache restore time), but if used, key the cache to `package-lock.json` hash and include a fallback `install-deps` step for system libraries on cache hit.

[Source: Playwright — CI Guide](https://playwright.dev/docs/ci)  
[Source: Playwright — Sharding](https://playwright.dev/docs/test-sharding)  
[Source: Playwright — Retries](https://playwright.dev/docs/test-retries)  
[Source: goGreenlit — Playwright CI/CD Integration 2026](https://www.gogreenlit.com/blog/playwright-cicd-integration/)

---

### 5. Bun Compatibility

**Installation works fine:**
```bash
bun add -d @playwright/test
npx playwright install --with-deps
```

**Running tests works** for the vast majority of use cases. `bunx playwright test` runs tests successfully with Chromium, Firefox, and WebKit.

**Known issue — `connectOverCDP()` is broken in Bun.** The root cause: Playwright bundles the `ws` library (WebSocket), so Bun cannot intercept the `import 'ws'` to provide its native WebSocket polyfill. Additionally, Bun's HTTP client doesn't support protocol upgrades (HTTP → WebSocket) like Node's `http` module does. This affects:
- `browserType.connectOverCDP()` — used for connecting to Chrome DevTools Protocol endpoints
- Remote browser connections (Browserbase, Playwright Cloud, etc.)

**Workaround:** Apply a Bun patch via `patchedDependencies` in `package.json`. The patch modifies `node_modules/playwright-core/lib/utilsBundle.js` to replace the bundled `ws` usage with Bun's native `WebSocket`. See [Mateusz Kelner's guide](https://www.mateuszkelner.com/blog/make-playwright-work-with-bun) for the exact patch.

**Official stance:** The Playwright team closed feature requests for Bun support (issues #27139, #34632, #38095) as "not planned," preferring to wait for Bun to implement HTTP upgrade support. The Playwright `@playwright/test` package has a PR (#28875) adding a `"bun"` export condition, but full compatibility is not guaranteed by the maintainers.

**For this project (kleri-ui):** Unless you're using `connectOverCDP()`, Bun should work out of the box for standard E2E tests. Use `bun add -d @playwright/test` and `bunx playwright test` as direct replacements for npm/pnpm equivalents.

[Source: microsoft/playwright#27139 — Bun Compatibility](https://github.com/microsoft/playwright/issues/27139)  
[Source: microsoft/playwright#29301 — Install fails with Bun](https://github.com/microsoft/playwright/issues/29301)  
[Source: microsoft/playwright#33891 — Node.js path requirement](https://github.com/microsoft/playwright/issues/33891)  
[Source: Mateusz Kelner — Make Playwright Work with Bun](https://www.mateuszkelner.com/blog/make-playwright-work-with-bun)  
[Source: microsoft/playwright#28875 — Add Bun support PR](https://github.com/microsoft/playwright/pull/28875)

---

### 6. Tooling Ecosystem

| Tool | Purpose | Integration |
|---|---|---|
| **VS Code Extension** (`ms-playwright.playwright`) | In-editor test runner, gutter run/debug, step-through debugging, locator picker | Install from marketplace; adds "Testing" sidebar with full test tree |
| **Trace Viewer** (`npx playwright show-trace`) | Post-mortem debug: network requests, DOM snapshots, console logs, timings | Opens from any `trace.zip` file; also available via VS Code extension |
| **UI Mode** (`npx playwright test --ui`) | Interactive browser-based test runner with live preview, locator explorer, timeline | Runs alongside the app; similar to Cypress's interactive mode |
| **Codegen** (`npx playwright codegen`) | Record user interactions into test code | Opens a browser where clicks/inputs are recorded as Playwright code |
| **ESLint plugin** (`eslint-plugin-playwright`) | Lint rules for Playwright best practices — flags `waitForTimeout`, missing awaits, etc. | Add to ESLint config |
| **Playwright Test for VSCode** | Rich test tree, time-travel debugging, step-through with DOM snapshots | Part of the main VS Code extension |

**Recommended VS Code settings entry** (add to `.vscode/settings.json`):
```json
{
  "playwright.reuseBrowser": true,
  "playwright.env": {
    "PW_EXPERIMENTAL_TS_ESM": "1"
  }
}
```

The **CI pipeline should publish reports as PR comments** to maximize visibility. Use `actions/github-script@v7` to post a status comment with a direct link to the HTML report artifact.

[Source: Playwright — Trace Viewer](https://playwright.dev/docs/trace-viewer)  
[Source: Playwright — UI Mode](https://playwright.dev/docs/test-ui-mode)  
[Source: Playwright — VS Code Extension](https://playwright.dev/docs/getting-started-vscode)

---

### 7. Current Landscape: Playwright vs Cypress vs Others (2026)

**Playwright is the clear recommendation for SvelteKit E2E testing in 2026.** Here's the evidence:

| Metric | Playwright | Cypress | Selenium | Puppeteer |
|---|---|---|---|---|
| Weekly downloads | ~6.5M | ~5.2M | ~4M | ~3.1M |
| QA adoption rate | **45.1%** | 14.4% | 22.1% (declining) | N/A |
| Y/Y growth | **+235%** | Plateaued | Declining | Stable |
| Browser support | Chromium, Firefox, **WebKit** | Chrome, Firefox, Edge | All | Chrome, Firefox |
| Parallel execution | **Built-in, free** | Paid (Cypress Cloud) | Via grid | Manual |
| Auto-waiting | ✅ Excellent | ✅ Good | ❌ Manual | ❌ Manual |
| Trace viewer | ✅ Built-in | ⚠️ Video only | ❌ | ❌ |
| Component testing | ❌ | ✅ Excellent | ❌ | ❌ |
| Cross-browser | ✅ Same API | ⚠️ Limited | ✅ | ⚠️ Chromium-focused |

**Why Playwright wins for SvelteKit specifically:**
- Cross-browser support (including WebKit/Safari) — critical for SvelteKit apps targeting all platforms
- First-class TypeScript and ESM support — matches SvelteKit's TypeScript-first approach
- `request` fixture for testing `+server.js` API routes without a browser
- Network interception via `page.route()` — useful for mocking external APIs during SSR testing
- No paid cloud dependency for parallel execution (Cypress requires Cypress Cloud)

**Cypress** remains strong for teams that need component testing alongside E2E in one framework, but SvelteKit already has `@sveltejs/vite-plugin-svelte` + Vitest for component testing — so that advantage is moot for SvelteKit projects.

**Newer alternatives worth watching:**
- **Playwright Components** (experimental) — may eventually bridge the component testing gap
- **WebDriverIO** — minor player, no specific SvelteKit advantages
- **Vitest Browser Mode** — emerging for component-level browser testing, not a full E2E replacement

**Verdict:** Start with Playwright. It's the industry standard, has the best SvelteKit integration, and has the strongest momentum.

[Source: PkgPulse — Playwright vs Cypress vs Puppeteer 2026](https://www.pkgpulse.com/blog/playwright-vs-cypress-vs-puppeteer-e2e-testing-2026)  
[Source: Crosscheck — Selenium vs Playwright vs Cypress 2026](https://crosscheck.cloud/blogs/selenium-vs-playwright-vs-cypress-2026-comparison)  
[Source: ContextQA — Playwright vs Selenium vs Cypress 2026](https://contextqa.com/blog/what-is-playwright-vs-selenium-vs-cypress-2026/)  
[Source: DevTools Research — Playwright vs Cypress vs Selenium 2026](https://devtoolswatch.com/en/playwright-vs-cypress-vs-selenium-2026)

---

## Gaps

What could not be confidently answered from this research:

1. **Specific `@playwright/test` version latest** — The most recently referenced version in the SvelteKit repo is 1.59.1 (March 2026). The exact latest version on npm should be checked at setup time via `bun add -d @playwright/test@latest`.

2. **bun + `webServer` config compatibility** — The `webServer` config option uses Node's `child_process` under the hood. I could not find definitive documentation on whether using `bun run build && bun run preview` as the webServer command is fully stable in CI. Spot-checking is recommended.

3. **SvelteKit 5-specific load function testing** — SvelteKit's new `load` function API (universal vs server, `export function load` vs `export const load`) may have specific testing caveats (e.g., streaming with `defer`). The `sveltekit-playwright-fetch-mock` tool helps with SSR fetch mocking, but deeper patterns for testing streaming responses in E2E were not found.

4. **Playwright Component Testing for Svelte** — Playwright has experimental component testing support, but I found no evidence of Svelte/SvelteKit support specifically. This area is still maturing.

## Suggested next steps

1. **Scaffold:** Run `npx sv add playwright` and inspect the generated config/setup
2. **Verify bun compatibility:** Run `bunx playwright test` on the generated demo test
3. **Write auth setup:** Implement `tests/auth.setup.ts` for the app's auth flow
4. **Set up CI:** Add the GitHub Actions workflow (start with unsharded, add sharding when tests exceed ~50)
5. **Configure VS Code:** Install `ms-playwright.playwright` extension
6. **Capture findings for this project:** Note any bun-specific issues encountered during the actual setup

[Source: markjaquith/sveltekit-playwright-fetch-mock](https://github.com/markjaquith/sveltekit-playwright-fetch-mock)  
[Source: spuxx.dev — SvelteKit Playwright MSW](https://spuxx.dev/blog/2024/sveltekit-playwright-msw)

---

## Sources

### Kept
- **Svelte CLI Docs — playwright** (https://svelte.dev/docs/cli/playwright) — Canonical setup reference; official Svelte docs
- **Playwright — Best Practices** (https://playwright.dev/docs/best-practices) — Official guidance on test structure, isolation, and resilience
- **Playwright — Authentication** (https://playwright.dev/docs/auth) — Official auth patterns; covers storageState, setup projects, roles
- **Playwright — CI** (https://playwright.dev/docs/ci) — Official CI configurations for all major providers
- **Playwright — Fixtures** (https://playwright.dev/docs/test-fixtures) — Official fixture system documentation
- **Playwright — Page Object Models** (https://playwright.dev/docs/pom) — Official POM documentation
- **Playwright — Retries** (https://playwright.dev/docs/test-retries) — Official retry configuration reference
- **Playwright — Sharding** (https://playwright.dev/docs/test-sharding) — Official sharding documentation
- **Okupter — E2E Testing with SvelteKit and Playwright** (https://www.okupter.com/blog/e2e-testing-with-sveltekit-and-playwright) — Practical SvelteKit-specific walkthrough with real examples
- **goGreenlit — Playwright CI/CD Integration 2026** (https://www.gogreenlit.com/blog/playwright-cicd-integration/) — Excellent CI best practices, sharding, reporting, and common pitfalls
- **Mateusz Kelner — Make Playwright Work with Bun** (https://www.mateuszkelner.com/blog/make-playwright-work-with-bun) — Only detailed technical writeup on the Bun+Playwright WebSocket issue; includes patch
- **PkgPulse — Playwright vs Cypress vs Puppeteer 2026** (https://www.pkgpulse.com/blog/playwright-vs-cypress-vs-puppeteer-e2e-testing-2026) — Comprehensive 2026 comparison with download data and feature matrix
- **ContextQA — Playwright vs Selenium vs Cypress 2026** (https://contextqa.com/blog/what-is-playwright-vs-selenium-vs-cypress-2026/) — Adoption rate stats (45.1% Playwright, 22.1% Selenium, 14.4% Cypress)
- **crosscheck.cloud — 2026 Comparison** (https://crosscheck.cloud/blogs/selenium-vs-playwright-vs-cypress-2026-comparison) — Market share and growth data
- **GitHub Issues: microsoft/playwright#27139, #29301, #33891, #34632, #38095** — Primary source for Bun compatibility status
- **markjaquith/sveltekit-playwright-fetch-mock** (https://github.com/markjaquith/sveltekit-playwright-fetch-mock) — Only tool specifically addressing SSR fetch mocking in SvelteKit+Playwright
- **ray.run — SvelteKit Cookie Timing** (https://ray.run/discord-forum/threads/15810-testing-sveltekit-app-my-cookies-arent-being-set-until-after-the-page-renders) — Documents the known cookie timing issue with SvelteKit SSR

### Dropped
- **Haseeb Majid — Code Coverage from Playwright** — Covers Istanbul instrumentation, useful but tangential to the core setup question
- **kyllerss/sveltekit-vitest-and-playwright** — A demo repo showing both Vitest and Playwright configured; useful reference but no original guidance beyond what official docs provide
- **spuxx.dev — Playwright MSW** — Covers MSW integration which is an advanced pattern, not core setup
- **PacktPub Svelte TDD book** — Behind a paywall; chapter references confirm patterns but don't add new actionable info
- **StackCompare — Pricing comparison** — Focused on cost analysis, not relevant to the technical setup question
