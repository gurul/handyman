# Handyman

Ask any website "how do I …?" and an animated hand shows you, step by step, or does it for you.

Software changes constantly, and the help never keeps up. Docs, screenshots, and scripted product tours are written once, about a version that no longer exists. They can't see the page you're on, so they leave you hunting for a button that isn't there anymore.

Handyman is a guided-tour widget with **zero authored steps**. It looks at the same screen you do: it screenshots the live page, asks a computer-use model to plan and ground the next action, then spotlights the real DOM element and narrates it aloud. The guidance is generated from the interface as it renders right now, so it can't go stale, and it works on sites nobody wrote a tour for, including ones you don't own.

<!-- TODO: demo GIF / video -->

## What it does

1. **Takes a question in plain language** — typed, or spoken aloud (`Alt+H`).
2. **Looks at the page** — screenshots the current viewport, exactly as the user sees it.
3. **Plans one step** — a computer-use model returns a single structured action: `point`, `act_click`, `act_write`, or `answer`.
4. **Grounds it in the real DOM** — normalized `[0,1000]` coordinates snap to an actual element, cross-checked against the model's own description of it, so a few pixels of drift can't highlight the neighbouring link.
5. **Shows the user** — an animated hand glides to the element, points, and a voice narrates the instruction. The page underneath stays fully live.
6. **Waits for the human** — the user's own real click on the real element is what advances the tour. Or "Do it for me" hands the wheel over and the widget performs the step itself.
7. **Re-plans and repeats** — the page settles, a new screenshot goes out, and the loop runs again until the answer arrives. Flows that navigate across pages keep their place.

## Why it's different

Product tours today are **authored**. A human writes each step, pins it to a CSS selector, and the tour breaks the moment the UI moves. They exist only on sites that paid to build them, and they describe the app as it was, not as it is.

Handyman has no authored steps at all. Every step is re-derived from a fresh screenshot of the page as it *currently* renders, so the tour follows redirects, modals, A/B variants, and layouts it has never seen. Nothing is planned in advance, so nothing goes stale.

The user stays in control. Guide mode is the default — the widget points, the human clicks, and the human's own click is what moves the tour forward. Autopilot is strictly opt-in: the model cannot promote itself into acting, and it will never overwrite text the user typed themselves.

## Sponsor technology

**H Company** — [`holo3-1-35b-a3b`](https://hub.hcompany.ai) does the perception and grounding: one screenshot in, one structured tool call out, per turn. The [Agents Platform](https://hub.hcompany.ai/computer-use-agents/multi-agent) powers the site scout, where a manager agent fans out parallel subagents, each driving its own cloud browser.

**Gradium** — [voice](https://docs.gradium.ai) in both directions: TTS narrates each step aloud, STT lets the user ask by speaking. Both run over WebSocket, authenticated with ephemeral single-use tokens minted server-side, so the API key never leaves the server.

## Architecture

```
widget (packages/core, TypeScript)             server (Bun + Hono)
  screenshot viewport ──► POST /api/step ──►  api.hcompany.ai  holo3-1-35b-a3b
  ◄── one step: point | act_click | act_write | answer     (structured outputs)
  snap [0,1000] coords → DOM element → spotlight + hand glide
  guide mode: the user clicks    ·    "do it for me": widget dispatches events
  page settles → new screenshot → next step → … → answer
  voice: Gradium TTS/STT over WebSocket (ephemeral tokens via /api/voice-token)
```

The server is a thin key-holding proxy — no database; sessions live in memory. The widget ships as a single IIFE mounted in Shadow DOM, so host-page CSS can't deform it and its own styles never leak out. Its only runtime dependency is [snapdom](https://github.com/zumerlab/snapdom), used to rasterize the page in the embed path (the extension screenshots in its service worker instead).

**The buddy hand.** An animated five-stroke hand rests in the bottom-right launcher until summoned. Out of its house it spring-follows the user's mouse open-palmed, then leads during a tour: an index-finger point at each target, a momentary grab when it presses, a wave as it docks home. All motion collapses to instant snaps under `prefers-reduced-motion`.

**The spotlight is click-through.** A highlight ring, with no dimming and no scrim, so the page stays genuinely interactive underneath — which is what makes "your own click advances the tour" possible in the first place.

## Running on sites you don't own

Real websites break a naive in-page widget in three independent ways — two from Content-Security-Policy, one from the DOM itself. The Chrome extension routes around each, because the service worker is the only context a page's CSP cannot reach:

| Problem | Symptom | How Handyman gets through |
|---|---|---|
| CSP `img-src` | Screenshot fails, so the tour dies before the model is ever called | `chrome.tabs.captureVisibleTab` + `OffscreenCanvas` in the service worker — the page never loads or decodes an image |
| CSP `connect-src` | Proxy calls and the voice WebSocket are killed | Both relayed through the background worker, which owns the real socket |
| Event retargeting | The page sees the widget's keystrokes as its own and swallows them; clicking the tour card dismisses the page's open menus | Widget-originated keys and clicks are contained at the shadow boundary, so the page's shortcut handlers and outside-click dismissers never see them |

## Site scout (multi-agent computer use)

`server/scout/` maps a website into a machine-readable guide: a manager agent splits the site among parallel **page-scout** and **flow-verifier** subagents, each driving its own cloud browser, then merges their findings.

```
POST /api/scout { url, goal? }   → { status, answer, session_id, agent_view_url }
POST /api/scout?async=1          → returns immediately; watch the run live at agent_view_url
GET  /api/scout/:sessionId       → { status, answer, error }
```

The answer is a schema-validated `{ goals: [{ goal, steps: [{ element, action, page }] }] }` — **a ready-made tour plan**. Each goal carries an ordered, element-by-element click path that can be turned straight into tour stops, instead of planning from a cold crawl. The scout runs today as a standalone endpoint; feeding its guides back into the widget's live loop is the next step.

Validated live (2026-07-11, against `news.ycombinator.com`): the manager fanned out to 3 page scouts and 2 flow verifiers in parallel cloud browsers and returned a guide covering the "submit a post" and "use search" flows in ~5m25s. Fan-out multiplies cost — every subagent is its own billed session — so prefer scoped `goal` runs over whole-site maps, and cache the guide.

## Quick start

Requires [Bun](https://bun.sh) ≥ 1.3, Chrome, and an H Company API key ([portal.hcompany.ai](https://portal.hcompany.ai)). A [Gradium](https://gradium.ai) key is optional and enables voice.

```bash
git clone https://github.com/gurul/tutorialHCompany.git
cd tutorialHCompany
bun install

cp server/.env.example server/.env    # add HAI_API_KEY (required), GRADIUM_API_KEY (voice)

bun run demo                          # builds widget + extension, serves the proxy on :3000
```

Load the extension:

1. Open `chrome://extensions` and enable **Developer mode**.
2. **Load unpacked** → select `apps/extension/dist`.
3. Open any website, click the launcher (bottom-right) or press `Alt+H` to ask by voice.

The extension popup toggles Handyman per site and sets the proxy endpoint, TTS, and STT.

### Embedding instead (a site you own)

```html
<script src="/handyman.js"></script>
<script>
  Handyman.init({ endpoint: "/api" });
</script>
```

The embed has no extension context, so it screenshots in-page and opens the voice socket directly — which a strict-CSP page will block. For third-party sites, use the extension.

## Configuration

**Environment** (`server/.env`):

| Variable | Required | Purpose |
|---|---|---|
| `HAI_API_KEY` | Yes | H Company Models API. `/api/step` returns 503 without it |
| `GRADIUM_API_KEY` | No | Voice. `/api/voice-token` returns 503 without it; the tour still runs, silently |
| `PORT` | No | Server port (default `3000`) |

**Widget** (`Handyman.init(config)`):

| Option | Default | Purpose |
|---|---|---|
| `endpoint` | *(required)* | Proxy base, e.g. `http://localhost:3000/api` |
| `tts` | `true` | Voice narration of each step |
| `stt` | `true` | Ask by voice |
| `hotkey` | `"Alt+KeyH"` | Toggles listening. Matched on physical key, so it's keyboard-layout independent |
| `zIndex` | `2147483000` | Base z-index for the widget's layers |

`transport`, `socketFactory`, and `captureScreenshot` are escape hatches the extension supplies to bypass page CSP; the embed leaves them unset.

## Commands

| Command | Description |
|---|---|
| `bun run demo` | Build widget + extension, then serve the proxy on `:3000` |
| `bun run server` | Serve the proxy only |
| `bun run build` | Build the widget IIFE → `packages/core/dist` |
| `bun run build:ext` | Build the extension → `apps/extension/dist` |
| `bun test` | Widget test suite |
| `bun run typecheck` | `tsc` over widget + server |

## Project layout

| Path | What |
|---|---|
| `packages/core` | The widget: agent-loop session, overlay engine, hand pointer (`hand.ts` poses + `pointer.ts` spring), element snapping, voice clients |
| `server` | Key-holding proxy: `/api/step` (Holo3), `/api/voice-token` (Gradium), widget hosting |
| `server/scout` | Multi-agent site scout (hai-agents SDK) |
| `apps/extension` | Chrome extension: runs the widget anywhere, bridges capture/network/voice past page CSP |
| `docs/PLAN-adaptive-tours.md` | Architecture plan of record |

## Built with

H Company Holo3 (`holo3-1-35b-a3b`) · H Agents Platform (hai-agents SDK) · Gradium TTS/STT · Bun · Hono · TypeScript · Chrome MV3

Hand pose engine adapted from era-maker's EraHand cursor. Built for the Computer Use Hackathon — Track 2 (Browser Use) + Voice challenge.

## License

MIT — see [LICENSE](LICENSE).
