# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(A Svelte 5 component library. Its main consumers are Tauri desktop apps with SvelteKit frontends, and it is also used in ordinary SvelteKit web apps. The docs site at ui.kleri.org is a SvelteKit site deployed to Cloudflare Workers.)

## Users

- **Primary: the Kleri apps.** `@kleri/ui` is the shared interface layer for Kleri's own products: `kleri-app/kleri-desktop` (a local-first practice-management app for Indian law firms) and `kleri-compress/compress-app`. What these apps need decides what gets built and how it behaves.
- **Secondary: outside SvelteKit developers.** The package is public on npm under the MIT license. Developers outside Kleri are a real audience, and the API, README and docs site should serve them. Their needs never override the Kleri apps' needs.

## Product Purpose

An opinionated Svelte 5 component library that gives every Kleri app the same brand, behaviour and accessibility without each app re-implementing them. Success means a Kleri app builds its interface from `@kleri/ui` instead of writing one-off components, and an outside developer can install it, follow the README and docs, and ship with it.

## Positioning

- **Opinionated, branded defaults.** The library is not a neutral headless kit. It ships the Kleri brand (colours, fonts, gradients, motion) on top of accessible bits-ui primitives.
- **Desktop-app aware.** It has first-class Tauri support: window controls and native drag-and-drop under `@kleri/ui/tauri`. It also works in transparent windows (daisyUI themes are turned off).
- **Real application components, not just primitives.** It includes a full calendar (`@kleri/ui/calendar`) with Google, Microsoft, ICS, HTTP and in-memory providers, recurrence, time zones, scheduling and a pluggable view registry.

## Operating Context

- Consumers install the package and import `@kleri/ui/styles.css` into a Tailwind CSS 4 + daisyUI 5 setup. Peer dependencies are svelte 5, bits-ui, `@lucide/svelte`, tailwindcss and daisyui, plus optional Tauri plugins.
- ui.kleri.org is the **public documentation site**. Outside developers use it to decide whether to adopt the library and to learn how to use it. It also has a live preview for each component with prop controls, and the e2e and accessibility suites run against it.
- A release happens on push to `main` whenever the `package.json` version is new.

## Capabilities and Constraints

- **Areas:** buttons and button groups, inputs (input, textarea, select, combobox, switch, slider, drag-and-drop), headings, tooltip, dialog and morph dialog, popover, toggle group, settings option, "magic" effects (card, button, animated beam), animations (meteors, grid pattern), code preview and prop controls, Tauri components, and the calendar.
- **Constraints:** Svelte 5 runes only; Tailwind CSS 4 and daisyUI 5. Light and dark themes are both required and must stay at parity; dark mode is applied with a `.dark` class on an ancestor element. Components must work in transparent Tauri windows.
- **Planned:** timeline and chart views for the calendar, added through the existing view registry.

## Brand Commitments

- The name is **Kleri** (product) and **@kleri/ui** (package). The logo is at `static/KleriUiLogo.svg`.
- The brand colours are `KLERI_COLOR_1` `rgb(25, 96, 114)`, `KLERI_COLOR_2` `rgb(132, 204, 184)` and `KLERI_COLOR_3` `rgb(35, 145, 144)`. The fonts are Poppins and Space Mono. These are shared with the Kleri apps, so changing them changes every app.
- The current tagline on the docs site is "A handcrafted component library built with Svelte 5 and Tailwind CSS."

## Evidence on Hand

- Real evidence: the components themselves, the live demos under `src/routes/components/`, the README's prop tables, and the two Kleri apps that use the package.
- There are no download numbers, outside adopters, testimonials or benchmarks. Do not invent any.

## Product Principles

1. **Kleri apps first.** A component exists because a Kleri app needs it. Public usefulness is a welcome result, not the reason to build something.
2. **One brand, enforced in the library.** Brand, motion and field styling live here so apps don't drift. Apps extend these components; they don't restyle them.
3. **Accessible by construction.** Build on accessible primitives and keep every component keyboard-operable and screen-reader-correct in both themes.
4. **Documented as it ships.** A change to a component's API isn't finished until its README entry and docs-site demo match it.
5. **Extend, don't special-case.** Complex components grow through extension points, such as calendar providers and the view registry, rather than branching inside the core.

## Accessibility & Inclusion

WCAG 2.2 AA is the target for every component, in both light and dark themes. The Playwright suite includes axe checks (`tests/e2e/a11y.e2e.ts`) on desktop, mobile and tablet viewports. User-facing calendar strings go through `labels.ts`, so consumers can localise them.
