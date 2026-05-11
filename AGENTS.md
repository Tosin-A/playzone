# PlayZone Agent Rules

These rules govern any AI or human-assisted development work in this repository.
If a request conflicts with these rules, ask for clarification before coding.

## 1) Stack and compatibility

- Framework: Next.js `16.2.6` (App Router), React `19.2.4`, TypeScript strict mode.
- Styling: Tailwind CSS v4 (`@import "tailwindcss"` + theme tokens in `app/globals.css`).
- Animation: Framer Motion.
- CV: `@mediapipe/tasks-vision` via singleton loaders in `lib/cv/`.
- Do not rely on outdated Next.js assumptions; verify behavior against current project code and official docs.

## 2) Core product constraints (must never be broken)

- Privacy guarantee: camera processing is local/in-browser.
- Camera is a core dependency for gameplay; permission handling is a first-class UX path.
- Latency matters: avoid unnecessary frame processing and repeated model initialization.
- Visual identity is deliberate and should remain coherent with `.impeccable.md`.

## 3) File ownership and architecture

- `lib/games.ts`:
  - source of truth for game metadata, card content, and availability flags.
- `app/play/[slug]/page.tsx`:
  - route gate + game component dispatch logic.
- `games/<slug>/`:
  - game-specific logic and overlays.
- `components/shell/`:
  - reusable game runtime UI and controls.
- `lib/CameraProvider.tsx`:
  - global camera stream + privacy mode; prefer this path over ad-hoc camera state.

## 4) Implementation standards

- Keep logic isolated in pure helpers where practical (`games/*/logic.ts`).
- Keep view concerns in React components (`overlay`, shell components).
- Add explicit TypeScript interfaces for gameplay state and results.
- Handle failure states explicitly:
  - model load failure
  - no landmarks detected
  - permission denied
  - unavailable browser APIs (e.g., Web Share)
- Use cleanup for effects, animation frames, and stream-bound side effects.

## 5) Adding a new game (required checklist)

1. Add metadata entry in `lib/games.ts` with a unique `slug`.
2. Create `games/<slug>/` with:
   - `index.tsx` (entry component)
   - `logic.ts` (scoring/state engine)
   - optional `overlay.tsx` (HUD visuals)
3. Wire route handling in `app/play/[slug]/page.tsx`.
4. Reuse shell components unless there is a clear reason to introduce a new primitive.
5. Provide a complete camera permission, loading, run, and result cycle.

## 6) Editing rules

- Never edit generated output (`.next/`, build artifacts, logs) as source-of-truth changes.
- Keep changes focused; do not perform broad refactors unless requested.
- Do not silently change product copy/tone without preserving the arcade personality.
- Preserve accessibility basics:
  - button labels
  - semantic interactive elements
  - sufficient text contrast for overlays and controls

## 7) Quality gates before finishing work

Run and pass:

1. `npm run lint`
2. `npm run build`

Then manually verify at least:

- landing page renders and game cards are intact
- `/play/rizz` runs end-to-end
- denied camera permission path is understandable
- share/download actions fail gracefully when unsupported

## 8) Safe defaults for agents

- If unsure, prefer incremental changes over large rewrites.
- If requirements are ambiguous, ask clarifying questions before modifying architecture.
- If introducing new dependencies, justify why existing stack cannot solve the problem.
- Keep security and privacy language accurate; do not overclaim behavior not implemented in code.
