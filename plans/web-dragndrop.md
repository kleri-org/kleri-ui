# Plan: Web KleriDragNDrop — Shared UI via Chrome Component

## Context

`KleriDragNDrop` currently exists only for Tauri at `src/lib/tauri/input/KleriDragNDrop.svelte`, exported via `@kleri/ui/tauri`. The component mixes three concerns: UI chrome (dropzone markup, icon, text, preview), Tauri-specific I/O (`getCurrentWebview().onDragDropEvent`, `convertFileSrc`, `open()`), and file-type filtering logic.

Goal: add a web version that uses native HTML5 drag/drop + `<input type="file">` without duplicating the UI.

## Approach

**Composition pattern** — extract a shared, presentational `DragNDropChrome.svelte` that renders the dropzone shell. Both the existing Tauri wrapper and a new web wrapper import the chrome and wire their own platform I/O. The chrome is purely presentational + event-forwarding: it accepts DOM event handler props and spreads them onto the root element.

Also simplify to **single-file only** on both platforms.

## Files to modify

| File                                        | Action                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/lib/input/DragNDropChrome.svelte`      | **Create** — shared presentational component                                               |
| `src/lib/input/dragndrop-utils.ts`          | **Create** — shared constants (`IMAGE_EXTENSIONS`, `isImageFile`)                          |
| `src/lib/tauri/input/KleriDragNDrop.svelte` | **Rewrite** — wrap chrome; single-file; import shared utils                                |
| `src/lib/input/KleriDragNDrop.svelte`       | **Create** — web wrapper; hidden `<input type="file">`; HTML5 drag/drop                    |
| `src/lib/index.ts`                          | **Edit** — add `export { default as KleriDragNDrop } from './input/KleriDragNDrop.svelte'` |

## Reuse

- `src/lib/utils.ts` — `WithElementRef` type
- `@lucide/svelte` — `Upload` icon (reused in chrome)
- Shared constants/filtering extracted from current Tauri component:
  - `IMAGE_EXTENSIONS` array
  - `isImageFile()` function

## Shared Chrome Contract

```ts
// DragNDropChrome.svelte props
{
    isHovering: boolean;
    imagePreview: string | null;
    mainText: string;
    subText?: string;
    label?: string;
    class?: string;
    ariaLabel?: string;        // default "File Upload Dropzone"
    onclick?: (e: MouseEvent) => void;
    onkeydown?: (e: KeyboardEvent) => void;
    ondragover?: (e: DragEvent) => void;
    ondragenter?: (e: DragEvent) => void;
    ondragleave?: (e: DragEvent) => void;
    ondrop?: (e: DragEvent) => void;
} & WithElementRef<HTMLAttributes<HTMLDivElement>>
```

The chrome spreads `onclick`, `onkeydown`, `ondragover`, `ondragenter`, `ondragleave`, `ondrop`, and any `...restProps` onto its root `<div>`.

## Wrapper Contracts

### Tauri (`src/lib/tauri/input/KleriDragNDrop.svelte`)

```ts
{
    onImageDrop?: (path: string) => void;
    onDocumentDrop?: (path: string) => void;
    onDrop?: (path: string) => void;
    accept?: 'images' | 'any';
    class?: string;
    label?: string;
    mainText?: string;
    subText?: string;
}
```

Uses `getCurrentWebview().onDragDropEvent`, `convertFileSrc`, `open()`.

### Web (`src/lib/input/KleriDragNDrop.svelte`)

```ts
{
    onImageDrop?: (file: File) => void;
    onDocumentDrop?: (file: File) => void;
    onDrop?: (file: File) => void;
    accept?: 'images' | 'any';
    class?: string;
    label?: string;
    mainText?: string;
    subText?: string;
}
```

Uses HTML5 drag/drop events, hidden `<input type="file">`, `URL.createObjectURL`/`revokeObjectURL`.

## Steps

- [ ] 1. Create `src/lib/input/dragndrop-utils.ts` — extract `IMAGE_EXTENSIONS` and `isImageFile` from Tauri component.
- [ ] 2. Create `src/lib/input/DragNDropChrome.svelte` — cut the UI markup from Tauri component, parameterize with props (isHovering, imagePreview, event forwarders, etc.).
- [ ] 3. Rewrite `src/lib/tauri/input/KleriDragNDrop.svelte` — import chrome + shared utils; own isHovering/drag-listeners; change to single-file (`open({ multiple: false })`); pass isHovering + imagePreview + event handlers to chrome.
- [ ] 4. Create `src/lib/input/KleriDragNDrop.svelte` — import chrome + shared utils; own isHovering with enter-counter; hidden `<input type="file" accept="image/*">` on images mode; HTML5 drag/drop handlers; `URL.createObjectURL`/`revokeObjectURL` management.
- [ ] 5. Edit `src/lib/index.ts` — add `export { default as KleriDragNDrop } from './input/KleriDragNDrop.svelte'`.
- [ ] 6. Verify: build succeeds, Tauri import path still works, web import works, preview renders on both platforms.

## Verification

1. `bun run build` — ensure no type errors, Tauri subpath export still resolves.
2. In Tauri dev: drop an image file → preview appears, callbacks fire with path string. Click → native file dialog opens, single file only.
3. In browser dev: drop an image file → preview appears, callbacks fire with `File` object. Click → browser file picker opens, single file only. Hover text changes. Blob URL cleanup on successive drops and on component destroy (check browser memory tab).
4. `bun run check` — Svelte check passes with no warnings.
5. `bun run test:unit` — existing tests still pass.
