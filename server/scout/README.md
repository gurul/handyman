# Site Scout

Maps a website into a machine-readable "site guide" using H Company's Agents Platform with multi-agent fan-out. Mount `scoutRouter` (from `router.ts`) under `/scout` in the server's Hono app.

**Validated live** (2026-07-11, real `HAI_API_KEY`, target `news.ycombinator.com`): the `handyman-scout` manager fanned out to 3 parallel `handyman-page-scout` then 2 `handyman-flow-verifier` cloud-browser sessions (~5m25s) and returned a schema-validated guide covering the "submit a post" and "use search" flows. End-to-end proof of the hai-agents SDK + multi-agent manager→subagents pattern.

## Topology

One manager, two specialist subagents, provisioned idempotently by `setup.ts` (create-or-update by name, never at import time):

- **handyman-scout** (manager, no environment) — splits the site's nav sections among page scouts in parallel, then has the flow verifier walk the most important flows, and merges everything into the guide.
- **handyman-page-scout** — visual-mode web browser (model `holo3-1-35b-a3b`); inventories what a user can do in one nav section. Target URL arrives at session time via the manager's delegated task message.
- **handyman-flow-verifier** — web browser; walks one user flow and records the exact click path as numbered steps.

## API

- `POST /scout { url, goal? }` — blocks, returns `{ status, answer, session_id, agent_view_url }`. The answer is schema-validated `{ goals: [{ goal, steps: [{ element, action, page }] }] }` when the run completes cleanly.
- `POST /scout?async=1` — returns `{ session_id, agent_view_url }` immediately (watch the run live at the link).
- `GET /scout/:sessionId` — polls `{ status, answer, error }`.

Without `HAI_API_KEY` every route returns `503` with setup instructions; nothing calls the platform.

## Pre-seeding tour planning

A scout result is a ready-made tour plan: each `goals[]` entry is a user goal with an ordered, element-by-element click path (`element`, `action`, `page`). The widget/server can match a user's stated goal against `goals[].goal` and turn the corresponding `steps` directly into tour stops — element selectors to highlight, in order — instead of planning from a cold crawl. Cache the guide per site and re-scout only when the UI changes.

## Cost note

Multi-agent fan-out multiplies token use: every subagent runs as its own billed session (one per nav section plus one per verified flow), all counting against the org's concurrency and token quotas. Prefer scoped `goal` runs over whole-site maps, and reuse cached guides.
