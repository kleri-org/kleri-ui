# Code Context — E2E Testing Reconnaissance

## 1. Project Structure

```
kleri-ui/
├── .github/workflows/ci.yml      # CI pipeline (lint → typecheck → unit → e2e)
├── .svelte-kit/                   # SvelteKit generated output (gitignored)
├── dist/                          # Published library build
├── node_modules/
├── src/
│   ├── app.d.ts                   # Cloudflare platform types
│   ├── app.html                   # HTML shell (dark class, no theme toggle)
│   ├── assets/                    # SVG logos
│   ├── lib/                       # Component library source
│   │   ├── animation/
│   │   ├── button/
│   │   ├── heading/
│   │   ├── input/
│   │   ├── magic/
│   │   ├── preview/               # Dev-only preview utilities (CodePreview, PropControls)
│   │   ├── settings/
│   │   ├── styles/                # kleri-ui.css (tailwind theme)
│   │   ├── tooltip/
│   │   ├── index.ts               # Public API exports
│   │   ├── constants.ts           # Brand color constants
│   │   └── utils.ts               # cn(), type helpers
│   ├── routes/
│   │   ├── +layout.svelte         # App shell (sidebar nav, scroll spy, tooltip provider)
│   │   ├── +layout.ts             # export const prerender = true
│   │   ├── +page.svelte           # Landing hero page (logo, CTA → /components)
│   │   ├── layout.css             # Tailwind imports, CSS vars, custom scrollbar
│   │   └── components/
│   │       ├── +page.svelte       # Category card grid (7 categories)
│   │       ├── animation/
│   │       ├── button/
│   │       ├── heading/
│   │       ├── input/
│   │       ├── magic/
│   │       ├── settings/
│   │       └── tooltip/
│   ├── test/
│   │   └── setup.ts               # @testing-library/jest-dom/vitest import
│   └── tests/
│       └── vitest-examples/       # Two example vitest browser tests (non-functional demo)
├── static/                        # favicon.svg, KleriUiLogo.svg
├── playwright.config.ts           # E2E config (already exists)
├── svelte.config.js               # adapter-cloudflare, runes mode
├── vite.config.ts                 # vitest config with 3 projects
├── vitest.shims.d.ts              # Vitest browser types
├── wrangler.jsonc                 # Cloudflare Workers config
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
├── .prettierignore
├── .npmrc                         # engine-strict=true
├── .gitignore
├── AGENTS.md
└── README.md
```

**No `tests/`, `e2e/`, `playwright/`, or `cypress/` directories exist at the top level.** The only test-related directories are `src/test/` (setup) and `src/tests/` (vitest-examples).

---

## 2. Existing Test Infrastructure

### package.json scripts

| Script | Command | Notes |
|---|---|---|
| `test:unit` | `vitest` | Runs vitest (all 3 projects: client, server, components) |
| `test:e2e` | `playwright install && playwright test` | Installs + runs Playwright |
| `test` | `bun run test:unit -- --run && bun run test:e2e` | Combined runner |

### Dev Dependencies (test-related)

| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.59.1 | E2E test runner |
| `playwright` | ^1.59.1 | Browser automation (also used by vitest browser provider) |
| `vitest` | ^4.1.5 | Unit/component test runner |
| `@vitest/browser-playwright` | ^4.1.5 | Vitest browser provider using Playwright |
| `@vitest/coverage-v8` | ^4.1.5 | Coverage |
| `@testing-library/svelte` | ^5.3.1 | Svelte component testing |
| `@testing-library/jest-dom` | ^6.9.1 | DOM matchers |
| `vitest-browser-svelte` | ^2.1.1 | Svelte integration for vitest browser |
| `happy-dom` | ^20.9.0 | DOM environment for component tests |

### Playwright Config (`playwright.config.ts`)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testMatch: '**/*.e2e.{ts,js}'
});
```

**Key observations:**
- Uses `npm run build && npm run preview` (not `bun`) — may work due to `npm run` resolving `bun` via package.json scripts, but **inconsistent with rest of project which uses `bun`**.
- Runs against Vite preview on port 4173.
- Test pattern: `**/*.e2e.{ts,js}` — no `.e2e.*` files exist yet.
- No `globalSetup`, `globalTeardown`, `projects`, or `retries` configured.
- No `.env` / `.env.test` files exist (`.env.*` is gitignored except `.env.example` and `.env.test`).

### Vitest Config (embedded in `vite.config.ts`)

Three project modes configured via `vitest/config`:

| Project | Environment | Include Pattern | Description |
|---|---|---|---|
| `client` | browser (chromium via `@vitest/browser-playwright`) | `src/**/*.svelte.spec.{js,ts}` | Browser-based Svelte spec tests |
| `server` | node | `src/**/*.{test,spec}.{js,ts}` (excl. svelte.spec) | Pure unit tests |
| `components` | happy-dom with setup | `src/**/*.test.svelte.ts` | Component tests with DOM |

---

## 3. Existing Test Patterns

### Component tests (`*.test.svelte.ts`)

Located alongside components in `src/lib/`. 9 test files found:

- `AnimationComponents.test.svelte.ts`
- `KleriButton.test.svelte.ts`
- `KleriUtilityButton.test.svelte.ts`
- `HeadingComponents.test.svelte.ts`
- `InputComponents.test.svelte.ts`
- `MagicComponents.test.svelte.ts`
- `PreviewComponents.test.svelte.ts`
- `SettingsOption.test.svelte.ts`
- `KleriTooltip.test.svelte.ts`

**Pattern** (from KleriButton.test.svelte.ts):
```ts
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';

describe('KleriButton', () => {
	afterEach(() => { cleanup(); });
	it('renders children', () => {
		render(KleriButton, { props: { children: createRawSnippet(() => ({ render: () => 'Click me' })) } });
		expect(screen.getByRole('button')).toBeInTheDocument();
	});
});
```

**Key patterns:**
- Uses `@testing-library/svelte` for rendering.
- Uses `createRawSnippet` for Svelte 5 snippet children.
- Tests focus on: rendering presence, state changes (success states), callback invocation, and error states.

### Vitest browser spec examples (`*.svelte.spec.ts`)

Located in `src/tests/vitest-examples/`:
- `Welcome.svelte.spec.ts` — uses `vitest/browser` page API and `vitest-browser-svelte` render.
- `greet.spec.ts` — simple unit test.

**Pattern** (from Welcome.svelte.spec.ts):
```ts
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Welcome from './Welcome.svelte';

it('renders greetings for host and guest', async () => {
	render(Welcome, { host: 'SvelteKit', guest: 'Vitest' });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Hello, SvelteKit!');
});
```

### E2E tests

**None exist yet.** The `playwright.config.ts` expects `**/*.e2e.{ts,js}` but no matching files are present.

---

## 4. SvelteKit Integration Points

### Adapter

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

kit: {
	adapter: adapter({ routes: { include: ['/*'], exclude: ['<all>'] } }),
	alias: { $lib: 'src/lib' }
}
```

- Deployed to Cloudflare Workers (via `wrangler deploy`).
- The app is **fully prerendered** (`export const prerender = true` in `+layout.ts`).
- No server-side routes, no API endpoints, no form actions, no load functions with server data.

### Build & Preview

- `bun run dev` → `vite dev`
- `bun run build` → `vite build` (static output)
- `bun run preview` → `vite preview` (static preview server, default port 4173)
- The Playwright config uses `npm run build && npm run preview` — but `npm run build` resolves to `vite build` via package.json scripts (works because npm calls the script, not bun directly; but `npm` may not be installed — check constraints).

### Cloudflare/Wrangler

- `wrangler.jsonc` configures a Cloudflare Workers deployment at `ui.kleri.org`.
- `bun run deploy` → `vite build && wrangler deploy`.
- `compatibility_flags: ["nodejs_compat"]`.

### No .env files

No `.env`, `.env.example`, or `.env.test` files exist. The project has no runtime environment variables.

---

## 5. CI/CD Pipeline

### `.github/workflows/ci.yml`

Four jobs running on `pull_request` to `main`/`master`:

| Job | Steps | Notes |
|---|---|---|
| `lint` | checkout → setup bun → install → `bun run lint` | Fastest (~30s) |
| `typecheck` | checkout → setup bun + Node 22 → install → `bun run check` | Uses Node 22 for SvelteKit sync |
| `test-unit` | checkout → setup bun → install → `bunx playwright install --with-deps chromium` → `bun run test:unit -- --run` | Installs Chromium for vitest browser tests |
| `test-e2e` | checkout → setup bun → install → `bunx playwright install --with-deps chromium` → `bun run build` → `bun run test:e2e` | Builds then runs Playwright |

**Key:**
- Uses `oven-sh/setup-bun@v2` with `bun-version: latest`.
- All jobs use `bun install --frozen-lockfile`.
- E2E job already exists in CI — just needs test files.
- No Docker, Docker Compose, or other CI systems found.

---

## 6. Constraints

| Constraint | Detail |
|---|---|
| **Package manager** | `bun` (enforced via `bun.lock` and `.npmrc` `engine-strict=true`) |
| **Node version** | Not explicitly pinned in `.nvmrc` or `engines` in package.json, but CI uses Node 22 for typecheck |
| **Build command** | `bun run build` → `vite build` (static) |
| **Preview command** | `bun run preview` → `vite preview` (port 4173) |
| **Playwright config uses `npm run`** | `webServer.command: 'npm run build && npm run preview'` — this relies on npm being available. In CI this works because `oven-sh/setup-bun` doesn't install npm. However, `npm run build` delegates to the same scripts in package.json, which call `vite build` — but npm might not be on $PATH. **Risk: CI e2e job may fail because `npm` is not installed.** Fix: change to `bun run build && bun run preview` in Playwright config. |
| **Deploy target** | Cloudflare Workers (adapter-cloudflare) |
| **Static site** | Fully prerendered — no SSR, no server endpoints, no auth |
| **Tailwind** | v4 with `@tailwindcss/vite` plugin |
| **Svelte** | v5 (runes mode forced via compilerOptions) |
| **UI framework** | bits-ui (tooltip primitives) + lucide-svelte (icons) + motion-sv (animations) |
| **Components** | 7 categories, 14 components, all stateless/visual |

---

## 7. Relevant Source Code Patterns (User Flows for E2E)

### Routes map

| Route | Content | E2E Test Opportunities |
|---|---|---|
| `/` (landing) | Hero with animated grid, logo, subtitle, "Explore Components" CTA link | Page load, animation presence, CTA link navigation |
| `/components` | Category card grid (7 categories, animated entrance) | Card visibility, navigation to each category, component count badges |
| `/components/button` | 3 button sub-sections with prop controls & live preview | KleriButton click → success state, disabled state, KleriUtilityButton tooltip hover, KleriMagicButton cursor gradient |
| `/components/heading` | 3 heading components with prop controls | PrimaryHeading gradient text rendering |
| `/components/input` | KleriSwitch toggle, KleriInput with error/shake | Switch toggle, input typing, error shake animation, password type toggle |
| `/components/tooltip` | KleriTooltip with prop controls | Tooltip show/hide on hover, arrow, positioning |
| `/components/animation` | MeteorAnimation | Rendering check |
| `/components/settings` | SettingsOption with switch | Label + control layout |
| `/components/magic` | KleriMagicCard, KleriMagicButton | Cursor-following gradient interaction |

### Key interaction patterns

1. **Navigation**: Sidebar with 7 category links + sub-item hash links. Scroll spy updates active state on scroll. Hash-based section jumping with smooth scroll.
2. **Prop Controls**: Each component page has a live `PropControls` panel + `CodePreview` — users can toggle boolean props, edit strings/numbers, and see the component update in real time.
3. **KleriButton**: Click triggers success state (checkmark, message, disabled). `onSuccessComplete` fires after timeout. This is the only callback-heavy component.
4. **KleriInput**: Supports `type="password"` (toggle visibility), error array → shake animation, `withBorder` toggle.
5. **KleriSwitch**: Toggle with disabled state.
6. **KleriTooltip**: Hover trigger, configurable placement, arrow toggle.
7. **Layout**: Dark mode only (`<html class="dark">`), no theme toggle.

### What E2E tests should cover

- Landing page loads and CTA link navigates to `/components`
- Sidebar navigation to each category page
- Hash-based deep-linking (`/components/button#kleri-button`)
- KleriButton click → success state → auto-revert
- KleriInput error state (shake animation)
- KleriSwitch toggle on/off
- KleriTooltip appears on hover
- PropControls interactivity (boolean toggle, string edit)
- Responsive layout (sidebar visibility on mobile)

---

## Clarification Questions

1. **Playwright config inconsistency**: The `webServer` command uses `npm run build && npm run preview` but the rest of the project uses `bun`. In CI (Ubuntu with only bun installed), `npm` may not exist. Should we fix this to `bun run build && bun run preview`?

2. **Test file location**: Where should E2E tests live? Common conventions include:
   - `tests/e2e/` (top-level) — or `e2e/` at root
   - Following the existing `**/*.e2e.{ts,js}` pattern in Playwright config
   - Any preference on file organization (e.g., `tests/e2e/landing.e2e.ts`) vs `src/routes/**/*.e2e.ts`?

3. **`.env.test`**: The `.gitignore` has `!.env.test` but no `.env.test` file exists. Do we need environment variables (e.g., `BASE_URL`, `CI`, test tokens) for E2E tests?

4. **CI e2e job currently runs `bun run test:e2e` which calls `playwright install && playwright test`** — but `playwright install` is already done in a prior step. Is this intentional (redundant install) or should the script be `playwright test` only?

5. **Page Object Model preference**: What pattern should E2E tests follow — raw Playwright test blocks, structured Page Object Models, or a mixed approach?

6. **Auth flows**: The app has no authentication or API calls. Are there any planned features that would add auth, form submission, or server interaction that E2E tests should reserve space for?

7. **Viewport/responsive testing**: Should E2E tests cover specific breakpoints (mobile, tablet, desktop)?

8. **Accessibility checks**: Should E2E tests include automatic a11y audits (via `@axe-core/playwright`) as part of the test suite?
