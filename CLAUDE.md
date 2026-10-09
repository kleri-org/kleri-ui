# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@kleri/ui` — a Svelte 5 (runes) component library published to npm, plus a SvelteKit demo/docs site (`src/routes`) deployed to Cloudflare Workers (ui.kleri.org). Styling is Tailwind CSS 4 + daisyUI 5, primitives come from bits-ui, animation from motion-sv, icons from `@lucide/svelte`. Package manager is **bun**.

## Commands

```bash
bun run dev            # demo site at localhost:5173
bun run check          # wrangler types --check + svelte-check (CI runs `bun run gen` first)
bun run lint           # prettier --check + eslint
bun run format         # prettier --write + eslint --fix
bun run test:unit -- --run   # all vitest projects, once
bun run test:e2e       # playwright (builds + previews on :4173 itself; never reuses a running server)
bun run prepack        # build the library into dist/ (svelte-package + publint + copy styles)
```

Use `bun run test`, not `bun test` — the latter invokes bun's own test runner instead of vitest.

Single tests:

```bash
bunx vitest run src/lib/calendar/core/core.test.ts            # by file
bunx vitest run --project components -t "KleriButton"         # by project + name
bunx playwright test tests/e2e/calendar.e2e.ts --project=chromium
```

### Vitest projects (vite.config.ts)

File naming decides the environment:

- `*.test.ts` / `*.spec.ts` → `server` project (node) — pure logic, e.g. `calendar/core`, providers.
- `*.test.svelte.ts` → `components` project (happy-dom, `src/test/setup.ts`) — component tests with `@testing-library/svelte`. Host components for tests that need wrappers/context live in `src/test/`.
- `*.svelte.spec.ts` → `client` project (real Chromium via Playwright).

`expect.requireAssertions` is on: every test must make at least one assertion.

E2E specs live in `tests/e2e/*.e2e.ts` and run against the demo routes across desktop, mobile and tablet projects, including axe a11y checks.

## Architecture

### Library vs. demo site

- `src/lib/**` is the published package. `src/routes/**` is only the demo site; each `src/routes/components/<area>/+page.svelte` showcases an area using `PropControls` + `CodePreview` from `$lib/preview`. When adding or changing a component, update its demo page (e2e tests drive these pages) and the README's prop tables.
- Entry points are defined by `package.json` `exports`: `.` → `src/lib/index.ts`, plus subpaths `./calendar`, `./popover`, `./dragndrop`, `./magic`, `./tauri`, `./preview`, `./styles.css`. Each subpath has its own `index.ts`. A new subpath needs an `exports` entry; heavy or optional-peer-dependency code (Tauri, shiki-based preview) stays out of the root entry.
- Relative imports inside `src/lib` use explicit `.js` extensions (required by `svelte-package` output).
- `src/lib/styles/kleri-ui.css` is the consumer stylesheet (fonts, `kleri-theme.css` brand tokens like `--color-kleri-1..3`, tw-animate-css, light/dark tokens). `prepack` copies `src/lib/styles` to `dist/styles` verbatim. Brand colors are also exported as JS constants from `constants.ts`.
- Class merging uses `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge); components accept a `class` prop. Variants use `tailwind-variants`. Shared form-field chrome (label, icon sizing, border/error/shake shell) is centralized in `src/lib/input/field.ts` — reuse `fieldShell` rather than restyling inputs.
- Dialog/popover are shadcn-svelte-style wrappers around bits-ui (`components.json` is the shadcn config). `KleriMorphDialog` adds a morph-from-trigger animation (`dialog/morph.ts`); other components (e.g. calendar) should use these Kleri dialogs rather than raw bits-ui.

### Calendar (`src/lib/calendar`, exported as `@kleri/ui/calendar`)

The largest subsystem, layered:

- `core/` — framework-free logic: wall-clock date math, timezone conversion (`ZonedClock`), RRULE recurrence expansion, ICS parsing, overlap layout, free/busy, input sanitization (`safe.ts`). Unit-tested in node.
- `providers/` — the `CalendarProvider` interface (`types.ts`) with adapters: memory, Google, Microsoft, ICS feed, generic HTTP. Only `listCalendars`/`listEvents` are required; writes, RSVP, free/busy are optional and advertised via `capabilities`. `capabilities.recurrence` says whether the provider expands series itself or the store does.
- `store/calendar-store.svelte.ts` — `CalendarStore` (runes class): aggregates providers, namespaces their calendar ids, loads/prefetches visible ranges, expands recurrence, does optimistic CRUD and surfaces errors.
- `context.ts` — `getCalendarContext()` exposes config, store, formatters, labels and `actions` to views and UI parts.
- `views/` — **view registry**. A view is a `CalendarViewDefinition` (`range`, `step`, `title`, `component`) built by factories in `registry.ts` (`createTimeGridView`, `createMonthView`, `createAgendaView`). View components receive `CalendarViewProps` (date, range, occurrences in display time) and get everything else from context. New views (planned: timeline, chart) are added as new definitions in the registry, not by special-casing `KleriCalendar`.
- `ui/` — toolbar, sidebar, event editor/details, dialogs, field components. User-facing strings go through `labels.ts` for i18n.
- `KleriCalendar.svelte` composes all of the above.

### Releases

`.github/workflows/release.yml` publishes to npm on push to `main` when the `package.json` version has no matching `v<version>` tag — bump the version to release. CI on PRs runs lint, type check, unit and e2e tests.

## Svelte tooling (from AGENTS.md)

A Svelte MCP server is available. Use `list-sections` then `get-documentation` for Svelte 5 / SvelteKit questions, and run `svelte-autofixer` on any Svelte code you write until it reports no issues. Do not generate playground links for code written to project files.
