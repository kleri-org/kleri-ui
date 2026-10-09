---
target: Input components
total_score: 21
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: 'file:/Users/ishaan/Documents/Github/kleri/kleri-ui/src/routes/components/input/+page.svelte'
target_fingerprint: 'sha256:3d16b6898b1791720af7f63c5d8178f9fb5cdb2956166d2f3be3178fb1594f4c'
target_path: /Users/ishaan/Documents/Github/kleri/kleri-ui/src/routes/components/input/+page.svelte
timestamp: 2026-10-08T09-56-07Z
slug: src-routes-components-input-page-svelte
---

# Critique: Input components (src/routes/components/input/+page.svelte)

Method: dual-agent, source-based (browser extension not connected; no visual or overlay evidence).

## Design Health Score: 21/40 (Acceptable)

| #   | Heuristic                       | Score | Key Issue                                                                                                |
| --- | ------------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| 1   | Visibility of System Status     | 2     | Errored fields lose their focus indicator; Select trigger hides its value from screen readers            |
| 2   | Match System / Real World       | 3     | Plain language, but "Shake" is a user-facing prop and demo data is generic                               |
| 3   | User Control and Freedom        | 2     | No playground reset; combobox demo can't be cleared                                                      |
| 4   | Consistency and Standards       | 2     | Error placement contradicts DESIGN.md; Switch hard-codes kleri-2; mixed radii; ToggleGroup on Input page |
| 5   | Error Prevention                | 1     | Enum props are free text; min>max allowed; copyable code often invalid                                   |
| 6   | Recognition Rather Than Recall  | 2     | Enum values must be read from label and retyped; password toggle undiscoverable                          |
| 7   | Flexibility and Efficiency      | 2     | Copy and anchors exist; no TOC, no states gallery                                                        |
| 8   | Aesthetic and Minimalist Design | 3     | Calm, but 8 identical stage+code+props blocks with large empty stages                                    |
| 9   | Error Recovery                  | 2     | Terse "(Invalid input)", not announced, no guidance                                                      |
| 10  | Help and Documentation          | 2     | No import line, no prop tables on page, misleading snippets                                              |

## Design Specificity

Components are authored for Kleri (fieldShell anatomy, masked gradient focus ring, Space Mono annotations, kleri-dropdown motion). The docs page around them is a generic shadcn-style template with interchangeable demo data. Detector: 1 advisory (KleriSwitch.svelte:112 rgba shadow, false positive).

## Priority Issues

1. [P1] Errored field has no focus indicator: field.ts:61-63 swaps focus ring for static border-destructive; FIELD_CONTROL is outline-none. harden.
2. [P1] Errors not linked/announced: KleriFieldLabel.svelte:42-44 bare spans, no id/aria-describedby/live region; inline "(error)" contradicts DESIGN.md. harden, clarify.
3. [P1] Generated Usage code doesn't run: CodePreview.svelte:17-38 emits {{...}} inside arrays, icon: {Sun}, value="" not bind:value, empty ToggleGroup, Slider missing type. harden.
4. [P1] Low-contrast focus/state on Switch and Slider (light): KleriSwitch.svelte:93,98 kleri-2 outline/track ~1.9:1; KleriSlider.svelte:91 ring-kleri-2/50. colorize + harden.
5. [P2] Prop playground undercuts components: free-text enums, Shake as only error path, no disabled, no states strip, ungrouped 8 sections, duplicate "Props" h2s. shape, layout.

## Persona Red Flags

- Alex: free-text enums accept garbage; no reset; no TOC; combobox not clearable.
- Sam: no focus on errored fields; errors unannounced; KleriSelect.svelte:153 aria-label overrides value; Switch/Slider focus contrast; dropzone aria-label overrides visible label; 8 duplicate Props h2s; breadcrumb not a nav.
- Jordan: broken copied snippets; no import path; password toggle undiscoverable; Shake/With Border unexplained.

## Minor Observations

Dropzone copy casing and hard-coded green/red result line; ungated scale-105 hover; full-teal Copy buttons at rest; option highlight bg-kleri-2/20 faint; no required marker; disabled label not dimmed; error re-shake only on first add.

## Questions to Consider

- Why not show rest/focus/error/disabled side by side, since that is the whole Tidewater thesis?
- Should the playground be built from KleriSelect/ToggleGroup/Slider?
- Does inline "(error)" survive a 60-char legal-form validation message?
