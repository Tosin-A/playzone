# PlayZone

PlayZone is a webcam-first mini-game platform built with Next.js, React, TypeScript, and MediaPipe.

The app presents a catalog of 10 computer-vision game concepts, with camera processing done fully in the browser. Right now, `Rizz Rater` is the live playable game, and other entries are listed as upcoming.

## What This Project Does

- Shows a landing page with an arcade-style game grid (`/`)
- Requests webcam access once via a shared camera provider
- Runs face/pose inference in-browser using MediaPipe Tasks Vision
- Lets players play webcam games and get a score
- Supports privacy viewing modes (`Normal`, `Blur`, `Silhouette`, `Wireframe`)
- Generates shareable score cards and uses native browser share/download

## Current Product Status

- **Playable now:** `Rizz Rater` at `/play/rizz`
- **In progress:** additional game logic exists (for example `six-seven`), but it is not wired to public routing yet
- **Planned catalog:** 10 total game cards are already defined in `lib/games.ts`

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)

## Project Structure

```text
app/
  layout.tsx              # global layout, metadata, font setup, CameraProvider
  page.tsx                # landing page + game grid
  play/[slug]/page.tsx    # dynamic game route selection

components/
  landing/                # game cards + grid
  shell/                  # shared gameplay UI (viewport, shell, share, HUD, privacy controls)

games/
  rizz/                   # active game (face blendshape scoring)
  six-seven/              # implemented game module, not yet routed
  shadow-boxing/          # gameplay logic prototype

lib/
  CameraProvider.tsx      # camera stream + privacy mode state
  games.ts                # game catalog metadata and availability flags
  cv/                     # singleton MediaPipe model loaders
  recording/shareCard.ts  # social result image generation
```

## How It Works (High Level)

1. `CameraProvider` requests and stores a webcam stream once.
2. A game page gets the shared stream via `useCamera()`.
3. `CameraViewport` renders the camera feed (and optional privacy filter).
4. Game modules run frame-by-frame inference with MediaPipe.
5. Gameplay logic converts landmarks/blendshapes into scores.
6. End-of-game flow renders a share screen and optionally exports a card image.

## Local Development

### Prerequisites

- Node.js 20+ (recommended)
- npm
- Webcam-enabled browser (Chrome recommended for best media support)

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other Scripts

```bash
npm run lint
npm run build
npm run start
```

## Privacy Notes

- Camera processing is performed client-side in the browser.
- The app does not upload raw camera frames in normal gameplay flow.
- Users can switch to privacy display modes while still playing.

## Extending PlayZone

To add a new game:

1. Add/update metadata in `lib/games.ts`
2. Implement `games/<slug>/index.tsx` and related logic
3. Wire the game in `app/play/[slug]/page.tsx`
4. Set `available: true` when the game is ready for public play

## License

No license file is currently defined in this repository.
