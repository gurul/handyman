# handyman — Wave 2: works on every website

Wave 1 shipped the widget embedded via `<script>` on a page you control (the
demo). Wave 2 makes handyman ride onto **any** website — including ones you
don't own — so the H Company agent can guide/drive a user through the real,
messy web (Browser Use track).

## The three gaps between "prebuilt embed" and "any site"

1. **Delivery** — the widget must get onto a page without the site owner adding
   a `<script>` tag. → Chrome extension (every site, persistent) + bookmarklet
   (zero-install fallback).
2. **Isolation** — host-page CSS must not deform the card/pointer, and our CSS
   must not leak into the host. → Shadow DOM.
3. **CSP / CORS** — a strict host page (`connect-src`) blocks the widget's
   `fetch` to the proxy. → the extension relays network through its content
   script (isolated world is not bound by page CSP); the proxy stays CORS-open.

## Pieces

### A. Widget isolation + transport (packages/core)

- **Shadow DOM**: each root (overlay, pointer, FAB) mounts its markup + `<style>`
  inside a `shadowRoot` on a `data-handyman` host element. Host CSS can't reach
  in; our styles can't leak out. The click-through spotlight still works: host
  element is `pointer-events:none`, the 4 scrim panels re-enable it, the gap
  passes clicks to the page beneath.
- **`config.transport`** (frozen in `types.ts`): when present, all proxy calls
  route through it instead of `fetch`. Default transport = `fetch(endpoint+path)`.
  This is the seam the extension uses to bypass page CSP.
- `snapdom` capture still excludes `[data-handyman]` hosts, so the shadow trees
  never appear in the screenshot sent to Holo.

### B. Chrome extension (apps/extension) — MV3

- **Content script** (isolated world) injects the built widget IIFE into the
  page's MAIN world via a `web_accessible_resources` script tag (needs real DOM
  for snapdom), then hands it a config whose `transport` posts each request to
  the content script over `window.postMessage`. The content script does the
  actual `fetch` to the proxy — **not subject to the page's `connect-src` CSP** —
  and posts the JSON back. This is the extension's core advantage over the
  bookmarklet.
- **Popup**: on/off per site, proxy endpoint field (default the deployed proxy,
  falls back to `http://localhost:3000`), TTS/STT toggles. Persisted in
  `chrome.storage.sync`.
- **Toolbar action** toggles the widget on the active tab.
- Runs on `<all_urls>`; the widget's own FAB is the in-page entry point.

### C. Bookmarklet (apps/bookmarklet)

- A generator page (served by the proxy) that emits a `javascript:` bookmarklet
  loading `\${PROXY}/handyman.js` and calling `Handyman.init({ endpoint })` with
  the absolute proxy URL. Zero install; works on lenient sites; **blocked by
  strict `script-src`/`connect-src` CSP** (GitHub, Twitter) — that's what the
  extension is for. The page documents the tradeoff.

### D. Proxy (server) — already wave-1

- CORS is already permissive (`*`), so cross-origin calls from any site work.
- Serves `/handyman.js` (the IIFE) with CORS for the bookmarklet.
- Add: `/embed/bookmarklet` generator page route (thin), `/embed/extension.zip`
  optional.
- **Production note**: for real third-party use the proxy must be HTTPS (an
  HTTPS page can't `fetch` an HTTP origin — except `http://localhost`, which
  Chrome treats as a secure context, so the local demo works from HTTPS sites).

## Validation (Claude-in-Chrome)

Load the unpacked extension, visit a real third-party site (e.g. a public docs
site or a simple SaaS), open the handyman FAB, ask a question, and confirm the
agent grounds on that site's live DOM and guides through it. Confirm the
content-script transport carries the `/step` call (network tab shows the fetch
originating from the extension, not blocked by the page CSP).

## Non-goals for wave 2

- Voice on strict-CSP sites (Gradium WebSocket is `connect-src`-bound in the page
  context; token fetch routes through transport, but the WS itself is best-effort).
- Publishing to the Chrome Web Store (ship unpacked / CRX for the hackathon).
- Firefox/Safari ports.
