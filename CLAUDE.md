# PlayZone Foundation Guide

PlayZone is a webcam-first mini-game platform built with Next.js App Router, React 19, TypeScript, Tailwind v4, Framer Motion, and MediaPipe Tasks Vision.

The primary goal is simple: make camera-based games feel instant, private, and shareable.

## Product Non-Negotiables

1. Privacy first: camera/video processing stays in-browser.
2. Fast first impression: landing + game startup must feel immediate.
3. Mobile-first interaction quality with desktop parity.
4. Strong visual identity: dark arcade tone, Teko + Barlow, single accent system.
5. Safe extensibility: new games should plug in without breaking existing game flow.

## Current Architecture

- `app/`:
  - `app/page.tsx`: landing page and game grid.
  - `app/play/[slug]/page.tsx`: dynamic game routing.
  - `app/layout.tsx`: global fonts, metadata, camera provider wiring.
- `lib/`:
  - `lib/games.ts`: canonical game catalog and availability flags.
  - `lib/CameraProvider.tsx`: global camera stream + privacy mode state.
  - `lib/cv/*`: singleton model loaders for MediaPipe face/pose.
  - `lib/recording/shareCard.ts`: generated social share image.
- `components/`:
  - `components/landing/*`: card/grid UI.
  - `components/shell/*`: reusable game shell, viewport, overlays, sharing.
- `games/`:
  - each game owns gameplay logic and visuals (example: `games/rizz/*`).

## Foundation Rules

### Routing and game registration

- `lib/games.ts` is the source of truth for game metadata and discoverability.
- If a game is playable, it must:
  - have `available: true` in `lib/games.ts`
  - have a matching route handling in `app/play/[slug]/page.tsx`
  - have a concrete game entry component under `games/<slug>/`

### Camera and CV lifecycle

- Never call `getUserMedia` directly inside game modules when a provider/context can be used.
- Reuse model singletons from `lib/cv/*`; do not instantiate MediaPipe tasks repeatedly.
- Stop animation loops and release references in cleanup paths.
- Avoid expensive full-frame processing unless required and justified.

### Client/server boundaries

- Default to Server Components in `app/`; opt into `"use client"` only when browser APIs are needed.
- Keep browser-only APIs (camera, canvas, navigator share, localStorage) in client components/utilities.

### Reliability and UX safety

- Every camera-dependent screen must provide:
  - loading state
  - denied-permission state
  - retry or recoverable path where feasible
- Keep UI responsive during model load and scan cycles.
- Prefer deterministic game logic with bounded frame/time windows.

### Performance and maintainability

- Use strict TypeScript types for all game state and model outputs.
- Keep logic functions pure where possible (`games/*/logic.ts` style).
- Reuse shell primitives (`GameShell`, `CameraViewport`, `ShareScreen`, `HUD`) instead of duplicating patterns.
- Do not commit generated artifacts such as `.next/`.

## Definition of Done (Feature/Bug Work)

Before considering work complete:

1. `npm run lint` passes.
2. `npm run build` passes for route/type safety.
3. Camera flow verified manually:
   - permission grant
   - permission deny
   - gameplay start/finish
   - share/download action (if applicable)
4. No regressions to landing page and existing playable games.

## Agent Execution Rules

Detailed implementation and editing rules for AI/code agents are defined in `AGENTS.md` and must be followed for all future changes in this project.
