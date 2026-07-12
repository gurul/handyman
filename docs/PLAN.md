# ShowMe — AI-generated guided tours for any website

Hackathon plan (Computer Use Hackathon, Track 2: Browser Use + Voice side challenge).
Working name `showme` — rename freely.

## One-liner

A drop-in `<script>` widget: the user asks "how do I create an invoice?" (typed or
spoken), and an animated pointer glides around the live page, spotlighting each
element with a narrated explanation — or does the clicks for you. Steps are not
authored by the site developer; they are planned live by H Company's Holo3 model
from screenshots of the user's actual page.

Generalized from era-maker's EXP-27 "Hey Clicky" PlatformTour (spotlight scrim,
gliding pointer, tooltip card, keyboard nav, missing-target resilience) — rebuilt
framework-agnostic with AI-generated steps instead of a hardcoded step list.

## Locked decisions

| Decision | Choice |
|---|---|
| Product | AI-generated tours (authored steps not required) |
| Agency | Guide mode by default + "do it for me" actuation |
| Packaging | Vanilla TS core, zero deps — one `<script>` tag or npm import |
| Mascot | Plain SVG pointer cursor (no Era hand / brand assets) |
| Flows | Multi-page agent loop (re-plan after every page change) |
| Voice | Gradium TTS narration + STT "ask by voice" |
| Keys | Never in the browser — Bun + Hono proxy (mandatory anyway: `api.hcompany.ai` has no CORS; Gradium forbids browser keys) |
| Demo | Bundled fake-SaaS demo app in this repo |

## Architecture

```
apps/demo (fake SaaS, plain multi-page HTML)      packages/core (the widget)
        └── <script src="showme.iife.js">  ──────►  overlay engine + pointer
                                                     agent session loop
                                                     voice (TTS/STT WS clients)
                                                          │ fetch / WS
                                                          ▼
                                            server/ (Bun + Hono, holds keys)
                                              POST /api/step ──► api.hcompany.ai/v1/chat/completions
                                                                 model: holo3-1-35b-a3b, structured outputs
                                              GET /api/voice-token ──► api.gradium.ai (ephemeral token)
```

### packages/core (zero-dep vanilla TS)

- **Overlay engine** (port of PlatformTour mechanics, generalized):
  - Spotlight: fixed div at target rect + `box-shadow: 0 0 0 9999px rgba(...)` cutout,
    400ms tweens between targets.
  - **Click-through cutout** (upgrade over exp27's look-don't-touch): scrim built as
    4 panels around the cutout so the real target stays clickable — the user's actual
    click is what advances a guide step.
  - Tooltip card: step text, progress dots, Back/Next/Skip, "Do it for me" toggle.
  - Keyboard: capture-phase Esc/←/→/Enter (exp27's pattern, wins over host handlers).
  - Resilience: re-measure on resize/scroll; target vanished → re-observe (new
    screenshot), not crash. `prefers-reduced-motion` collapses all animation.
  - Theming: CSS custom props with built-in defaults (`--showme-paper`, `--showme-ink`,
    …); configurable z-index base.
- **Pointer**: simple SVG arrow cursor. Outer wrapper glides via
  `transform: translate(...) rotate(...)` transitions; inner wrapper idle-bobs
  (the two-wrapper trick from exp27 so glide and bob never fight). Rotation per
  side (left/right/top/bottom of target). Rest state: docks into a launcher FAB
  bottom-right ("ask me anything" button) with the exp27 shrink-and-land finale.
- **Element snapping** (the accuracy trick): Holo returns normalized `(x,y)` in
  [0,1000] on the screenshot. Scale to viewport → `document.elementFromPoint` →
  climb to nearest interactive ancestor (`button, a, input, select, [role=button],
  [onclick], cursor:pointer`) → spotlight that element's full rect. Coordinates only
  need to land *inside* the element, which absorbs screenshot-fidelity error.
- **Agent session loop** (H's documented agent-loop shape, human-as-actuator variant):
  1. Capture screenshot of the page (DOM-to-image lib — ground the exact package at
     implementation time) + viewport size.
  2. `POST /api/step` with question + observation; keep ≤3 screenshots in context
     (H's documented eviction pattern), durable memory via `note`.
  3. Model returns one step: `point` | `act_click` | `act_write` | `answer`.
  4. Guide mode: spotlight + narrate + wait for the user's real click (or Next).
     Do-it-for-me: pointer glides to target, press animation, dispatch real events
     (`el.click()`, native value setter + `input`/`change`, optional Enter).
  5. DOM settle detection: MutationObserver debounce + `pushState`/`popstate` hooks
     (SPA-safe) + full navigations survived by re-init from `sessionStorage` session
     state → new screenshot → next step. `answer` ends the tour, pointer docks.
- **Tour cache**: completed step sequences cached per `(origin, pathname, question)`
  in localStorage — instant replay and protection against the 10 req/min free tier.
- **Voice** (both via `GET /api/voice-token` ephemeral tokens — single-use, fetch one
  per WS connect, pre-fetch the next):
  - TTS: hand-rolled WS client (`wss://api.gradium.ai/api/speech/tts`, no npm SDK
    exists) — send `setup` → `text` → `end_of_stream`, decode base64 PCM chunks into
    Web Audio. Each step's explanation speaks while the pointer glides (<300ms TTFB).
  - STT: mic via `getUserMedia` → 24kHz PCM16 base64 chunks →
    `wss://api.gradium.ai/api/speech/asr`; Gradium's semantic VAD (`step` messages)
    auto-detects end of question. Hold the FAB (or hotkey) to ask.

### server/ (Bun + Hono, one file)

- `POST /api/step` — forwards the observation to
  `https://api.hcompany.ai/v1/chat/completions` (OpenAI JS client with custom
  `baseURL`), model `holo3-1-35b-a3b`, `structured_outputs` with the Step schema
  (`note`, `thought`, `tool_call: point|act_click|act_write|answer`), temperature per
  docs. Holds `HAI_API_KEY`.
- `GET /api/voice-token` — exchanges `GRADIUM_API_KEY` for an ephemeral token
  (`GET https://api.gradium.ai/api/api-keys/token`).
- CORS open, serves `apps/demo` + built widget statically. `bun run server` and done.
- **Fixture mode** (`SHOWME_FIXTURES=1`): records real `/api/step` sessions to JSON and
  replays them — the demo survives dead wifi or a rate-limited API on stage.

### apps/demo — "Acme Invoices"

Plain multi-page HTML/CSS (no framework — proves the widget is framework-agnostic):
dashboard → customers → new-invoice form → send. Styled to screenshot cleanly (no
cross-origin images). Widget embedded with one script tag:

```html
<script src="/handyman.js"></script>
<script>Handyman.init({ endpoint: "/api" })</script>
```

## Step schema (proxy ⇄ model, structured outputs)

```json
{
  "note": "string|null",
  "thought": "string",
  "tool_call": {
    "tool_name": "point | act_click | act_write | answer",
    "element": "description of the target UI element",
    "x": 0, "y": 0,
    "instruction": "one spoken/displayed sentence for the user",
    "content": "text to type (act_write) or final answer (answer)",
    "press_enter": false
  }
}
```

`x`/`y` are integers in [0,1000] normalized to the sent screenshot (H's element-
localization contract). The widget scales, snaps to the DOM element, and renders.

## Build phases

1. **Scaffold** — bun workspaces (`packages/core`, `server`, `apps/demo`), tsup build
   (ESM + IIFE), demo app shell, pointer SVG + FAB rest state.
2. **Overlay engine** — spotlight/card/glide/keyboard, ported against the behavior
   spec extracted from era-maker's `PlatformTour.test.tsx` (gating, nav, skip/finish,
   missing-target filtering). Driven by a hardcoded fixture tour first.
3. **First AI step** — proxy `/api/step`, screenshot capture, single `point` end-to-end
   on the demo app. *(First demoable moment.)*
4. **Agent loop** — multi-step, click-to-advance, DOM-settle, cross-page navigation
   survival, tour cache.
5. **Do it for me** — actuation events + pointer press animation.
6. **Voice** — TTS narration per step, then STT ask, token endpoint.
7. **Polish** — theming, README, npm packaging, record fixture tours, 2-min demo script.

Phases 5 and 6 are independent of each other (parallelizable). 1–4 are serial.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Screenshot fidelity (DOM-to-image libs miss some CSS/cross-origin images) | Element snapping absorbs error; demo app styled to render cleanly; snap failure → show point marker at raw coords |
| Free tier 10 req/min | Tour cache, fixture replay, redeem paid credits at event |
| Multi-point array output quality | Not used — per-step single tool call is H's documented shape |
| Gradium tokens are single-use | Token per connect, pre-fetch next |
| Host page steals keyboard/z-index | Capture-phase handlers + configurable z-index base (exp27 patterns) |
| Live demo dies on stage | Fixture mode replays a recorded session offline |

## Judging alignment

- **Track 2 (Browser Use)**: agent navigates the messy real DOM of a live page.
- **H Company requirement**: `holo3-1-35b-a3b` grounding + agent loop is the core engine.
- **Voice challenge**: Gradium STT question + streamed TTS narration.
- **Technicality**: agent-loop-with-human-actuator, element snapping, click-through spotlight.
- **Usefulness**: every SaaS wants zero-authoring onboarding tours.

## Open items

- Product name (placeholder `showme`).
- Hackathon rule says "no prior commits to the repo" — the repo already has a
  bootstrap commit from before the event window; confirm with organizers or re-create
  the repo at kickoff.
