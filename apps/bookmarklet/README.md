# handyman bookmarklet

Zero-install delivery for the handyman guided-tour widget. A `javascript:`
bookmarklet loads the built widget from the proxy and rides onto **any** page —
no site owner, no extension, no build step.

## What it is

- `index.html` — self-contained generator/landing page (open it directly, or the
  proxy serves it at `/embed/bookmarklet`). Configure the proxy URL + TTS/STT and
  it generates the bookmarklet live.
- `src/loader.js` — the readable source of the payload. `index.html` inlines a
  verbatim copy, bakes in your settings, minifies it, and builds the `javascript:`
  URL. Edit both together.

## How to use

1. Open `index.html` (or `/embed/bookmarklet` on the proxy).
2. Set the **Proxy URL** (default `http://localhost:3000`) and TTS/STT toggles.
3. **Drag** the "Handyman" button to your bookmarks bar (or Copy the URL).
4. Open any website and **click** the bookmark. The launcher FAB appears — click
   it and ask "how do I…?". A second click just re-toggles the FAB (no re-inject).

## CSP limitation

Works on lenient sites. Strict-CSP hosts (GitHub, X/Twitter, …) block injected
`script-src`/`connect-src`, so the bookmarklet can't load there — use the Chrome
extension, which relays through its content script and isn't bound by page CSP.

## Voice / production

Voice needs the proxy reachable. In production the proxy must be **HTTPS** (an
HTTPS page can't call an HTTP origin) — except `http://localhost`, which Chrome
treats as a secure context, so the local demo works from HTTPS pages.
