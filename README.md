<p align="center">
  <img src="static/KleriUiLogo.svg" alt="KleriUI Logo" width="406" height="306" />
</p>

# @kleri/ui

A Svelte 5 component library built with Tailwind CSS 4, bits-ui, and motion-sv. Features brand-consistent components with Kleri green theming, animated effects, and accessible primitives.

## Installation

```bash
bun add @kleri/ui
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| svelte | ^5.0.0 |
| bits-ui | ^2.18.0 |
| @lucide/svelte | ^1.14.0 |
| tailwindcss | ^4.2.0 |
| daisyui | ^5.5.0 |

## Setup

### 1. Import styles

```js
// src/app.html or layout
import '@kleri/ui/styles.css';
```

### 2. Configure Tailwind

Ensure your Tailwind config includes the Kleri theme. The CSS exports CSS variables for `--color-kleri-green-1`, `--color-kleri-green-2`, and `--color-kleri-green-3`, along with custom fonts (Poppins, Space Mono).

### 3. Use components

```svelte
<script>
  import { KleriButton, KleriInput, KleriMagicCard } from '@kleri/ui';
</script>

<KleriButton>Click me</KleriButton>
```

---

## Components

### Buttons

#### KleriButton

Primary action button with success state support.

```svelte
<script>
  import { KleriButton } from '@kleri/ui';
  let success = $state(false);
</script>

<KleriButton
  {showSuccess}
  successMessage="Done!"
  successTimeout={2000}
  onSuccessComplete={() => (success = false)}
>
  Submit
</KleriButton>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSuccess` | `boolean` | `false` | Show checkmark + success message |
| `successMessage` | `string` | `"Success!"` | Message shown on success |
| `successTimeout` | `number` | `2000` | Milliseconds before callback fires |
| `onSuccessComplete` | `() => void` | — | Callback after success timeout |
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### KleriUtilityButton

Secondary button with optional tooltip.

```svelte
<KleriUtilityButton tooltip="Save changes">
  Save
</KleriUtilityButton>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tooltip` | `string` | — | Tooltip text shown on hover |
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### KleriMagicButton

Button with animated gradient border spotlight that follows the cursor.

```svelte
<script>
  import { KleriMagicButton } from '@kleri/ui';
</script>

<KleriMagicButton
  gradientSize={150}
  gradientColor="rgb(132, 204, 184)"
  gradientOpacity={0.1}
>
  Hover me
</KleriMagicButton>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gradientSize` | `number` | `150` | Radius of gradient circle in px |
| `gradientColor` | `string` | `KLERI_GREEN_2` | Inner glow overlay color |
| `gradientOpacity` | `number` | `0.1` | Inner glow opacity |
| `gradientFrom` | `string` | `KLERI_GREEN_2` | Border spotlight start color |
| `gradientTo` | `string` | `KLERI_GREEN_1` | Border spotlight end color |
| `class` | `ClassValue` | — | Additional CSS classes |

---

### Inputs

#### KleriInput

Text input with label, error display, icon, and password toggle.

```svelte
<script>
  import { KleriInput } from '@kleri/ui';
  import { KeyRound } from 'lucide-svelte';
  let value = $state('');
  let errors = $state([]);
</script>

<KleriInput
  bind:value
  label="Email"
  bind:errors
  placeholder="you@example.com"
  InputIcon={KeyRound}
  type="text"
  withBorder={true}
  required={true}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` (bindable) | — | Input value |
| `label` | `string` | — | Label text |
| `errors` | `string[]` (bindable) | `[]` | Error messages (shakes input) |
| `placeholder` | `string` | `""` | Placeholder text |
| `type` | `string` | `"text"` | Input type (`"password"` enables toggle) |
| `InputIcon` | `Component` | — | Icon component (lucide-svelte compatible) |
| `withBorder` | `boolean` | `true` | Show border |
| `required` | `boolean` | — | HTML required attribute |
| `shake` | `boolean` | `false` | Trigger shake animation |
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### KleriSwitch

Toggle switch with Kleri green checked state.

```svelte
<script>
  import { KleriSwitch } from '@kleri/ui';
  let checked = $state(false);
</script>

<KleriSwitch bind:value={checked} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `boolean` (bindable) | `false` | Checked state |
| `onChecked` | `(checked: boolean) => void` | — | Change callback |
| `disabled` | `boolean` | `false` | Disabled state |
| `ariaLabel` | `string` | `"Toggle switch"` | Accessibility label |
| `class` | `ClassValue` | — | Additional CSS classes |

---

### Headings

#### PrimaryHeading

Large animated gradient heading (Poppins, 5xl, bold).

```svelte
<PrimaryHeading>Welcome to Kleri</PrimaryHeading>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### SecondaryHeading

Bold heading with Space Mono font and green shadow (4xl).

```svelte
<SecondaryHeading>Dashboard</SecondaryHeading>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### SubHeading

Medium heading (Poppins, 2xl) with optional info and warning banners.

```svelte
<SubHeading info="This is a note" warning="Be careful">
  Settings
</SubHeading>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `info` | `string` | — | Info text with InfoIcon |
| `warning` | `string` | — | Warning text with TriangleAlert |
| `class` | `ClassValue` | — | Additional CSS classes |

---

### Cards & Containers

#### KleriMagicCard

Card with animated gradient border spotlight that follows the cursor.

```svelte
<script>
  import { KleriMagicCard } from '@kleri/ui';
</script>

<KleriMagicCard gradientSize={200}>
  <h2 class="text-lg font-bold">Card Title</h2>
  <p class="mt-2">Card content goes here.</p>
</KleriMagicCard>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gradientSize` | `number` | `200` | Radius of gradient circle in px |
| `gradientColor` | `string` | `KLERI_GREEN_2` | Inner glow overlay color |
| `gradientOpacity` | `number` | `0.15` | Inner glow opacity |
| `gradientFrom` | `string` | `KLERI_GREEN_2` | Border spotlight start color |
| `gradientTo` | `string` | `KLERI_GREEN_1` | Border spotlight end color |
| `class` | `ClassValue` | — | Additional CSS classes |

---

#### KleriTooltip

Accessible tooltip powered by bits-ui.

```svelte
<script>
  import { KleriTooltip } from '@kleri/ui';
</script>

<KleriTooltip side="top" sideOffset={5} arrow={true}>
  {#snippet trigger(props)}
    <button {...props}>Hover me</button>
  {/snippet}
  Tooltip content here
</KleriTooltip>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` (bindable) | `false` | Open state |
| `trigger` | `Snippet<[{ props }]>` | — | Trigger element snippet |
| `children` | `Snippet` | — | Tooltip content |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Tooltip placement |
| `sideOffset` | `number` | — | Offset from trigger |
| `arrow` | `boolean` | `false` | Show arrow |
| `disabled` | `boolean` | `false` | Disable tooltip |
| `triggerProps` | `Tooltip.TriggerProps` | `{}` | Props forwarded to trigger |

---

#### SettingsOption

Settings row with label and control in a 3-column grid.

```svelte
<script>
  import { SettingsOption, KleriSwitch } from '@kleri/ui';
  let enabled = $state(true);
</script>

<SettingsOption>
  {#snippet name()}
    Enable feature
  {/snippet}
  {#snippet option()}
    <KleriSwitch bind:value={enabled} />
  {/snippet}
</SettingsOption>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `Snippet` | — | Label content |
| `option` | `Snippet` | — | Control content |
| `optionAtEnd` | `boolean` | `false` | Align option to end |
| `class` | `ClassValue` | — | Additional CSS classes |

---

### Animation

#### MeteorAnimation

Shooting meteors background effect with Kleri green tails.

```svelte
<script>
  import { MeteorAnimation } from '@kleri/ui';
</script>

<div class="relative overflow-hidden">
  <MeteorAnimation number={100} />
</div>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `number` | `number` | `100` | Number of meteors per direction |

---

#### AnimatedGridPattern

Animated SVG grid with fading squares using motion-sv.

```svelte
<script>
  import { AnimatedGridPattern } from '@kleri/ui';
</script>

<div class="relative overflow-hidden">
  <AnimatedGridPattern
    width={40}
    height={40}
    numSquares={50}
    maxOpacity={0.5}
    duration={4}
  />
</div>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `40` | Grid cell width in px |
| `height` | `number` | `40` | Grid cell height in px |
| `x` | `number` | `-1` | Pattern X offset |
| `y` | `number` | `-1` | Pattern Y offset |
| `strokeDasharray` | `number` | `0` | Grid line dash pattern |
| `numSquares` | `number` | `50` | Number of animated squares |
| `maxOpacity` | `number` | `0.5` | Maximum square opacity |
| `duration` | `number` | `4` | Animation duration in seconds |
| `repeatDelay` | `number` | `0.5` | Delay between animation repeats |
| `class` | `string` | — | Additional CSS classes |

---

### Preview Utilities

Exported from `@kleri/ui/preview` for documentation and playground use.

#### CodePreview

Shows formatted usage code with a copy button.

```svelte
<script>
  import { CodePreview } from '@kleri/ui/preview';
</script>

<CodePreview component="KleriButton" props={{ showSuccess: false, children: "Click" }} />
```

| Prop | Type | Description |
|------|------|-------------|
| `component` | `string` | Component name |
| `props` | `Record<string, any>` | Props to render in code |

---

#### PropControls

Dynamic form controls generated from a schema.

```svelte
<script>
  import { PropControls } from '@kleri/ui/preview';
  import type { PropSchema } from '@kleri/ui/preview';

  const schema = $derived({/** @type {PropSchema} */ ({
    label: { type: 'string', label: 'Label' },
    enabled: { type: 'boolean', label: 'Enabled' },
    count: { type: 'number', label: 'Count' }
  })});
  let values = $state({ label: '', enabled: false, count: 0 });
</script>

<PropControls {schema} bind:values />
```

---

## Theme

### Brand Colors

Exported as constants and CSS variables:

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `KLERI_GREEN_1` | `rgb(25, 96, 114)` | `--color-kleri-green-1` |
| `KLERI_GREEN_2` | `rgb(132, 204, 184)` | `--color-kleri-green-2` |
| `KLERI_GREEN_3` | `rgb(35, 145, 144)` | `--color-kleri-green-3` |

### Fonts

| Family | Weights |
|--------|---------|
| Poppins | 400, 500, 600, 700 |
| Space Mono | 400, 700 |

### CSS Utilities

| Utility | Description |
|---------|-------------|
| `kleri-bg` | Linear gradient background (green-1 → green-2) |
| `kleri-text` | Gradient text (green-1 → green-2 → green-3) |
| `kleri-text-animation` | Animated gradient text (500% background size) |
| `kleri-border` | Animated gradient border (light mode) |
| `kleri-border-dark` | Animated gradient border (dark mode) |
| `bg-kleri_blur` | 30% background with 40px blur |

### Border Radius

The `rounded-kleri` utility maps to `--radius-xl` (default `0.625rem + 4px = 1rem`).

---

## Utilities

### `cn(...inputs: ClassValue[])`

Merges Tailwind classes using clsx + tailwind-merge.

```ts
import { cn } from '@kleri/ui';
const classes = cn('p-4', true && 'bg-red-500', 'text-lg');
```

### `WithElementRef<T, U>`

Extends a props type with an optional `ref?: U | null`.

### `WithoutChild<T>` / `WithoutChildren<T>` / `WithoutChildrenOrChild<T>`

Omits `child`, `children`, or both from a type.

---

## Dark Mode

The library supports a `.dark` class on any ancestor element. All color variables swap automatically. The `@custom-variant dark` selector (`&:is(.dark *)`) is configured in the CSS.

---

## Development

```bash
bun install
bun run dev          # Start dev server
bun run test:unit    # Run unit tests (vitest)
bun run test:e2e     # Run e2e tests (playwright)
bun run build        # Build library
bun run format       # Format with prettier
```

## License

See [LICENSE](./LICENSE) file.
