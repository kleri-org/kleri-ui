---
name: Kleri UI
description: A handcrafted Svelte 5 component library for the Kleri apps, outlined and teal-lit.
colors:
  deep-harbour: 'rgb(25, 96, 114)'
  sea-glass: 'rgb(132, 204, 184)'
  lagoon: 'rgb(35, 145, 144)'
  paper: 'oklch(1 0 0)'
  ink: 'oklch(0.145 0 0)'
  night: 'oklch(0.145 0 0)'
  night-raised: 'oklch(0.205 0 0)'
  night-ink: 'oklch(0.985 0 0)'
  mist: 'oklch(0.9 0 0)'
  slate-text: 'oklch(0.356 0 0)'
  graphite-line: 'oklch(0.8 0 0)'
  ember: 'oklch(0.577 0.245 27.325)'
  ember-night: 'oklch(0.704 0.191 22.216)'
  kleri-ink: 'oklch(0.145 0 0)'
  graphite-line-night: 'oklch(0.4 0 0)'
typography:
  display:
    fontFamily: 'Poppins, sans-serif'
    fontSize: '3rem'
    fontWeight: 700
    lineHeight: 1.5
  headline:
    fontFamily: 'Space Mono, monospace'
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: 1.5
  title:
    fontFamily: 'Poppins, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.33
  body:
    fontFamily: 'Poppins, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.43
  label:
    fontFamily: 'Space Mono, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.33
  micro:
    fontFamily: 'Poppins, sans-serif'
    fontSize: '10px'
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  kleri: '14px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '10px'
  lg: '16px'
  xl: '24px'
components:
  button-primary:
    backgroundColor: '{colors.lagoon}'
    textColor: '{colors.kleri-ink}'
    rounded: '{rounded.kleri}'
    padding: '8px'
    typography: '{typography.body}'
  button-utility:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.kleri}'
    padding: '4px 12px'
  button-utility-hover:
    backgroundColor: '{colors.sea-glass}'
    textColor: '{colors.ink}'
  field:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.kleri}'
    padding: '8px 12px 8px 16px'
    typography: '{typography.body}'
  tooltip:
    textColor: '{colors.ink}'
    rounded: '{rounded.kleri}'
    padding: '8px'
    typography: '{typography.label}'
  popover:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.kleri}'
    padding: '10px'
    width: '288px'
  dialog:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.kleri}'
    padding: '24px'
    width: '512px'
  card:
    backgroundColor: '{colors.paper}'
    rounded: '{rounded.kleri}'
    padding: '24px'
  switch-track:
    backgroundColor: '{colors.mist}'
    rounded: '{rounded.full}'
    width: '44px'
    height: '24px'
  switch-track-on:
    backgroundColor: '{colors.lagoon}'
  toggle-item:
    rounded: '{rounded.kleri}'
    padding: '0 12px'
    height: '36px'
---

# Design System: Kleri UI

## Overview

**Creative North Star: "The Tidewater Desk"**

Kleri UI is a calm working surface for people who use it all day: a monochrome desk of outlined tools, with a teal current running underneath. Most of the time that current stays out of sight. It shows when a hand arrives: a field takes focus and its outline turns into a moving teal gradient, a button is hovered and fills with the brand gradient, a toggle is switched on and glows sea-glass. At rest the interface is neutral and quiet. When you interact with it, it answers in teal.

The form language is **outlined and tactile**. Fields, buttons and tooltips have fine 1px outlines and generous 14px corners, so the controls read as distinct objects you can pick up, not flat text sitting on a page. The density is that of a desktop app, not a marketing site: labels are small, text sits around 14px, and the calendar goes down to 10–11px for event metadata. Space Mono gives labels, hints, errors and tooltips an instrument-panel precision next to Poppins' rounded geometry.

This is a branded system and it must not read as a generic, unbranded shadcn/zinc kit. The bits-ui and shadcn scaffolding underneath is plumbing. Teal interaction states, the quiet hairline outline and the Poppins/Space Mono pairing are what make it Kleri.

**Key Characteristics:**

- Neutral surfaces at rest; teal shows up through interaction and on brand moments.
- Quiet 1px outlines and 14px (`rounded-kleri`) corners on every interactive shell.
- Poppins for content, Space Mono for labels, hints, errors and tooltips.
- Flat page surfaces; shadows and blur appear only on floating layers.
- Light and dark themes kept equal, switched with a `.dark` ancestor.
- Every looping or decorative motion is gated behind `prefers-reduced-motion`.

## Colors

The palette is a monochrome desk plus one family of three teals, deepest to lightest, which always appear together in the brand gradients.

### Primary

- **Lagoon Teal** (`lagoon`): The light-theme `--primary`. It fills the primary action button (`KleriButton`) and colours SecondaryHeading text, and it is the darkest step anchoring the gradient border. In dark mode the roles swap: Lagoon becomes `--accent`.
- **Sea Glass Mint** (`sea-glass`): The light-theme `--accent` and the dark-theme `--primary` and `--brand`. Against Paper it is only 1.9:1, so in light mode it is a fill, never text. It is the hover fill for utility buttons, the "on" state of switches on dark, the scrollbar thumb, the calendar's today tint (7%) and selection (22%), and the focus/hover colour for inline field affordances such as the password toggle.

### Secondary

- **Deep Harbour Teal** (`deep-harbour`): The light-theme `--brand`: links, today markers, success icons and SubHeadings (7.1:1 on Paper). It anchors the light-theme `kleri-text` and `kleri-border` gradients (Deep Harbour ↔ Lagoon). It stays out of text-bearing fills, because ink on it is only 2.8:1, so `kleri-bg` runs Lagoon → Sea Glass instead. In dark mode its gradient role passes to Lagoon (Lagoon ↔ Sea Glass).

### Neutral

- **Paper** (`paper`) / **Ink** (`ink`): Light-theme background and foreground. Cards and popovers are also Paper.
- **Night** (`night`) / **Night Ink** (`night-ink`): Dark-theme background and foreground. **Night Raised** (`night-raised`) is the dark-theme card and popover surface, one step above Night.
- **Mist** (`mist`): Light-theme `--muted`. It is the switch track, the toggle rest fill (at 30%) and the disabled button fill.
- **Slate Text** (`slate-text`): Light-theme muted foreground, used for hints, placeholders and past calendar events. In dark mode it becomes `oklch(0.66 0 0)` (5.8:1 on Night Raised).
- **Graphite Line** (`graphite-line`, `graphite-line-night` in dark mode): `--border`. It draws the 1px field and button outlines and is deliberately quiet: `oklch(0.8 0 0)` is 1.9:1 on Paper and `oklch(0.4 0 0)` is 2.15:1 on Night. This sits below the WCAG 1.4.11 3:1 guideline by choice; the resting outline is a hint, and focus (2px teal gradient), hover and error states carry the 3:1 signal. Floating edges (dialogs, popovers, dropdowns, tooltips, toasts) use it at 50% (`border-border/50`), and dividers inside them at 30%.
- **Kleri Ink** (`kleri-ink`): A theme-invariant near-black for text and edges on brand fills (`kleri-bg`, `bg-primary`, toggles that are on), which keep their colour in both themes. It clears 5.2:1 on Lagoon and 10.7:1 on Sea Glass.
- **Ember** (`ember`, `ember-night` in dark mode): `--destructive`. Used for error borders, error text and delete actions.

### Named Rules

**The Current Rule.** Teal is reserved for focus, hover, the selected state and brand marks. A resting control is drawn in neutrals; if a screen is teal before anyone touches it, something is wrong.

**The Role Swap Rule.** Lagoon and Sea Glass swap the `--primary` and `--accent` roles between themes, so the lighter teal always carries interaction against the darker surface. Use the semantic tokens (`primary`, `accent`, `brand`, `ring`), never a hard-coded `kleri-1/2`, wherever theme parity matters.

**The Ink Rule.** Every fill names its ink. Brand fills take `text-kleri-ink`, semantic fills take their `*-foreground`, and user-chosen colours (calendar swatches, avatars) take `readableInk()` from `calendar/core/color.ts`. Never hard-code `text-black` or `text-white` on a coloured surface.

**The Focus Rule.** Focus is a solid teal ring (`--ring`: Lagoon on light, Sea Glass on dark), drawn as a 2px outline 2px off the element by the base layer. Fields replace it with the animated gradient border. Never remove an outline without drawing a replacement.

**The Mixed Tint Rule.** Low-contrast surfaces (grid lines, event fills, today/selection washes) are built with `color-mix(in oklab, …)` from foreground or brand colours, not from new grey tokens. That keeps them correct in both themes automatically.

## Typography

**Display Font:** Poppins (with sans-serif)
**Body Font:** Poppins (with sans-serif). The consuming app sets it on `body`; components inherit it.
**Label/Mono Font:** Space Mono (with monospace)

**Character:** Poppins is round and friendly, Space Mono is engineered and exact. Together they read as a well-labelled instrument: content in Poppins, while the small text that explains, warns or annotates is in Space Mono.

### Hierarchy

- **Display** (700, fluid 2rem–3rem, 1.5): `PrimaryHeading` only. Animated `kleri-text-animation` gradient, balanced wrapping on narrow screens, not selectable. One per screen at most.
- **Headline** (Space Mono 700, fluid 1.5rem–2.25rem, 1.5): `SecondaryHeading`. Wraps balanced on narrow screens. Primary-coloured with a soft Sea Glass drop shadow. Section-level titles.
- **Title** (700, 1.5rem): `SubHeading`. Brand-coloured (`text-brand`), optionally followed by Space Mono info/warning lines.
- **Body** (500, 0.875rem): the working size. Field roots, popovers, toggle items and most component text sit here.
- **Label** (Space Mono 400, 0.75rem): field hints and errors (indented), tooltips (0.875rem), nav section labels (uppercase, wide tracking on the docs site).
- **Micro** (500, 10–11px; 10px is the floor): calendar-only. Event times, week numbers and dense metadata inside the grid.

### Named Rules

**The Annotation Rule.** If text explains, warns, hints or labels something, set it in Space Mono. If it is the content itself, set it in Poppins.

## Layout

Components are full-width by default (`FIELD_ROOT` is `block w-full`) and the consuming app owns the page layout. Spacing follows Tailwind's 4px scale. The recurring steps are 4px (field vertical margin), 8px (gaps and shell padding), 10px (popover padding and gap), 16px (field shell left padding, dialog gaps) and 24px (card and dialog padding).

The field shell is asymmetric on purpose: 16px leading, 12px trailing, 8px vertical. That leaves room for a leading icon (22px, stroke 2.5) and a trailing affordance without changing the height. Settings rows are a 3-column grid, with the label spanning two columns and the control in the third, at 48px row height.

Breakpoints are Tailwind's defaults (sm 640, md 768, lg 1024, xl 1280). The docs site uses a fixed 256px sidebar beside a scrolling content column. The calendar collapses its sidebar and adapts its views on mobile and tablet. The e2e suite covers Pixel 5, iPhone 13 and iPad Mini viewports.

## Elevation & Depth

The system is **flat at rest and lifts only when something floats**. Page-level surfaces (fields, buttons, cards, settings rows) have no shadow; they are separated by outlines and the occasional `bg-card` step. Depth appears only on layers that leave the document flow, and there it is paired with motion and often with blur.

### Shadow Vocabulary

- **Float** (`shadow-md` + 1px border ring): popovers and dropdown panels (select, combobox).
- **Modal** (`shadow-lg shadow-black/40` over the `kleri-scrim` overlay, black at 45% + 6px blur): dialogs.
- **Hover hint** (`shadow-black/50` on hover): buttons, a faint press-ready darkening rather than a lift.
- **Selection ring** (`0 0 0 2px background, 0 0 0 4px event-color`): selected calendar events. A ring, not a shadow.

### Glass

- **Floating glass** (`kleri-glass`): popover colour at 80% + 20px blur at 1.6× saturation. Every menu, select/combobox list, popover, date picker, day-overflow panel and toast uses it, so the page stays visible as context under a floating layer. It falls back to the solid popover fill without `backdrop-filter` support or under `prefers-reduced-transparency`. Any new menu (context menu, dropdown menu) takes `kleri-glass` with `kleri-dropdown`.
- **Scrim** (`kleri-scrim`): black at 45% + 6px blur behind dialogs and the calendar's overlay sidebar; solid 60% black under reduced transparency.
- **Tooltip glass**: `bg-background/60` + `backdrop-blur-lg`, inside a 1px outline.
- **Blur panel** (`bg-kleri_blur`): background at 30% + 40px blur, for overlays in transparent Tauri windows. The docs sidebar uses the same idea (`bg-background/80 backdrop-blur-xl`).

### Named Rules

**The Float Rule.** A shadow means "this is above the page." If a surface doesn't overlay anything, it gets an outline, not a shadow.

## Shapes

One corner radius dominates: **14px** (`rounded-kleri`, `--radius` + 4px) on every interactive shell (fields, buttons, tooltips, popovers, dialogs, cards, toggle items). Smaller radii are for nested or compact parts only: 10px (`rounded-lg`) for nav items and small toggles, 8px (`rounded-md`) for menu rows and xs buttons, and full pills for switches, avatars, scrollbar thumbs and the docs CTA.

Outlines are **1px solid** everywhere at rest, kept quiet so the page never shouts; the 2px weight is reserved for the teal focus ring, the slider thumb and the calendar visibility checkboxes. Passive structure goes lighter still: dialog edges, popover rings and calendar grid lines (which are 9%/16% foreground mixes, not `--border`). Calendar events have a square-ish body with a **3px leading stripe** in the calendar's colour.

## Components

The components are outlined and tactile: quiet 1px outlines, generous rounding, and a calm resting state that comes alive in teal when touched.

### Buttons

- **Shape:** 14px corners, 1px outline.
- **Primary (`KleriButton`):** `bg-primary` fill, Kleri Ink text and 1px outline, full width, 8px padding, Poppins 400. Hover swaps the fill for the `kleri-bg` gradient (Lagoon → Sea Glass). Disabled drops to Lagoon at 50% with no outline. A success state replaces the label with a check and message that zooms in on an overshoot spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`, 0.5s).
- **Utility (`KleriUtilityButton`):** fits its content. Variants: default and outline (both `border` outline), ghost (no outline), secondary (secondary fill). Every variant rests in `text-foreground`, then fills with the accent and switches to `accent-foreground` on hover. Sizes: xs (32px tall, 8px corners, `kleri-hit` on touch), sm, lg. An optional tooltip wraps it.
- **Toggle group items:** 36px tall (28px sm with `kleri-hit`, 40px lg), Mist at 30% at rest, and filled with the `kleri-bg` gradient and Kleri Ink when on. Focus shows the teal ring. They press down to 97% scale (150ms ease-out).

### Inputs / Fields

- **Style:** the `fieldShell()` box: 1px Graphite Line outline, transparent fill, 14px corners, 8px 12px 8px 16px padding, a leading 22px icon and a chrome-free control inside. `withBorder={false}` keeps a transparent 1px border so nothing shifts.
- **Focus:** the outline becomes the animated `kleri-border` gradient (Deep Harbour ↔ Lagoon on light, Lagoon ↔ Sea Glass with `kleri-border-dark`; 5s loop, still under reduced motion). It is painted on a masked `::before`, so the field stays transparent on cards and in transparent Tauri windows. This is the system's main moment of brand colour.
- **Error:** an Ember outline, which keeps the gradient off while errors show, plus the `kleri-shake` decaying shake (0.5s, motion-safe only). Focusing an errored field draws the solid teal ring 2px outside the Ember border, so focus never disappears. Error text sits on its own line under the label in Space Mono xs, in Ember, with no brackets; it is a polite live region the control points at with `aria-describedby`.
- **Disabled:** 60% opacity, not-allowed cursor.
- **Label block (`KleriFieldLabel`):** label and hint on one wrapping row, errors on their own lines underneath, all indented 8px.
- **Options:** highlighted dropdown options (select, combobox) fill with `accent` at 45% on light and 35% on dark (`FIELD_OPTION`).

### Switch

- 44 × 24px pill, Mist track with a 1.5px muted-foreground outline at 40%, 18px Paper thumb with a hairline ink ring. When on, the track fills with `--primary` (Lagoon on light, Sea Glass on dark), so the on state clears 3:1 in both themes. Focus is the `--ring` outline. The colour transition is 200ms.

### Slider

- 8px track: the unfilled part is a 50% foreground mix (not `--muted`) so it clears 3:1 in both themes, and the filled part is `kleri-bg`. 16px Paper thumb with a `primary` outline; focus adds a 2px `ring` ring 2px off the thumb.

### Cards / Containers

- **Corner Style:** 14px.
- **Background:** `bg-card` (Paper / Night Raised).
- **Shadow Strategy:** none at rest (see the Float Rule).
- **Internal Padding:** 24px.
- **Magic Card:** a 1px gradient spotlight border that follows the cursor (Sea Glass → Deep Harbour, 200px radius) plus an inner 15% glow, faded in on hover over 300ms. This is the one place a resting card glows, and only under the pointer.

### Floating layers (tooltip, popover, dropdown, dialog)

- **Tooltip:** glass (background at 60%, large blur), 1px outline at 50% `border`, 14px corners, Space Mono text, a 40% foreground arrow. Shows instantly (0ms delay) under utility buttons.
- **Popover / dropdowns:** 288px wide, `kleri-glass` surface, a 1px ring at 50% `border`, Float shadow, 10px padding. The `kleri-dropdown` motion grows the panel out of its trigger from whichever side it opened: 220ms `cubic-bezier(0.16, 1, 0.3, 1)` in from a 6px offset at 96% scale, 140ms `cubic-bezier(0.4, 0, 1, 1)` out. With reduced motion this becomes a plain fade.
- **Dialog:** centred, 512px max, Paper surface, 1px `border` edge at 50%, Modal shadow, 24px padding, 16px gap, over a 60% black overlay. Zoom-and-fade in over 200ms. `KleriMorphDialog` morphs out of its trigger instead.

### Calendar Event (signature)

- The `kleri-event` surface: the calendar colour mixed 22% into the background (32% on hover), text mixed 30% toward the event colour, and a 3px solid leading stripe in the full colour.
- RSVP and lifecycle states are set by data attributes so every view matches. Tentative events get 135° diagonal hatching. "Needs action" events are hollow, with an inset 1px ring at 70%. Declined events are struck through at 55% opacity. Pending events breathe in opacity (1.4s, motion-safe). Selected events get a double ring.
- **Past events fade by losing saturation (9% tint, muted text), not opacity, so text keeps AA contrast.**

### Navigation (docs site)

- A fixed 256px glass sidebar with a 20% border hairline. Uppercase Space Mono section labels; Poppins 14px items at 500, 10px corners, a 16px icon and a nested list behind a 30% left rule.

## Do's and Don'ts

### Do:

- **Do** build every new field on `fieldShell()`, `FIELD_CONTROL` and `KleriFieldLabel` so it gets the hairline outline, the gradient focus border and the shake on error for free.
- **Do** use `rounded-kleri` (14px) for any new interactive shell, and save smaller radii for nested rows and compact parts.
- **Do** use semantic tokens (`primary`, `accent`, `muted`, `border`, `destructive`) so the Lagoon/Sea Glass role swap keeps both themes equal.
- **Do** build new low-contrast surfaces with `color-mix(in oklab, …)` from foreground or brand colours, as the calendar tokens do.
- **Do** set hints, errors, tooltips and other annotation text in Space Mono.
- **Do** gate every looping or decorative animation behind `prefers-reduced-motion: no-preference`, and give each one a fade or still fallback. In Svelte, read `prefersReducedMotion` from `svelte/motion` for motion-sv loops.
- **Do** put `kleri-hit` on any control under 44px so touch users get a full-size target, and show hover-revealed controls on `pointer-coarse`.
- **Do** use `kleri-dropdown` and `kleri-glass` for any new menu or floating panel instead of writing new entrance motion or a solid fill.

### Don't:

- **Don't** let the system read as a generic shadcn/zinc kit: no unstyled shadcn defaults, no neutral `--primary`. Quiet 1px outlines are fine; what must survive is the teal interaction states.
- **Don't** put shadows on surfaces that don't float (see the Float Rule).
- **Don't** fade past or inactive content with opacity when it carries text; lower its saturation instead, as past calendar events do.
- **Don't** hard-code `kleri-1/2/3`, `text-black` or `text-white` where a semantic token exists, or light and dark themes drift apart (see the Ink Rule).
- **Don't** add new grey tokens for grid lines or washes; mix them from `--color-foreground`.
- **Don't** add daisyUI themes or solid body backgrounds inside components; consumers run in transparent Tauri windows.
