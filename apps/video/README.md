# @handyman/video

The handyman launch film — 76 s · 1920×1080 · 30 fps, built in
[Remotion](https://remotion.dev) 4. Eight fully-produced motion-graphics
scenes with one 20 s slate reserved for real demo footage.

```bash
bun install                # from the repo root
cd apps/video
bun run studio             # live preview + scrubbing
bun run render             # → out/handyman-launch.mp4
```

## Dropping in the demo footage

Scene 4 (`src/scenes/DemoSlate.tsx`, global frames 660–1259) renders a
browser-chrome mockup holding a placeholder slate. Everything replaceable
lives in the single `<SlateContents />` component — delete it and put your
recording in its place:

```tsx
import { OffthreadVideo, staticFile } from 'remotion';
// inside the BrowserChrome viewport, replacing <SlateContents />:
<OffthreadVideo src={staticFile('demo.mp4')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

Put the file at `public/demo.mp4` (18–22 s plays fully; longer footage is
cut at the scene boundary). The chrome frame, shadow, and both zoom
transitions survive the swap untouched.

## Music

The piece is scored for one ~104 BPM minimal electronic track (structure in
`DESIGN.md` → storyboard's music direction: sparse/tense to 14 s, full drop
on the wordmark, ducked under the demo, resolve into the end card's
stillness). Drop a licensed track at `public/music.mp3` and uncomment the
`<Audio>` line in `src/HandymanLaunch.tsx`.

## Layout

- `src/HandymanLaunch.tsx` — scene timeline (frame budget per scene).
- `src/scenes/` — one file per scene.
- `src/lib/` — design system: brand tokens, the exact widget hand glyph
  (`Hand.tsx`, geometry lifted from `packages/core/src/hand.ts`), masked
  type reveals, grain/vignette backdrop, browser chrome, and the product UI
  rebuilt as motion primitives (spotlight ring, tour card, FAB, status pill).
- `DESIGN.md` — the binding motion/design contract the scenes follow.
- `REMOTION-NOTES.md` — researched API notes (Remotion 4.0.489).

Stills for review: `bun run still -- --frame=560 out/stills/f560.png`.
