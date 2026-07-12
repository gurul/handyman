# Adaptive Tour Engine — couple H grounding + computer-use agent (plan only)

> Status: **PLAN — do not implement yet.** This is the next wave: fuse the two
> capabilities handyman already has into one adaptive, parallel tour generator.

## The idea (from the ask)

Today handyman has two separate engines:

1. **In-page grounding (Holo VLM).** One screenshot of the page the user is on →
   the model plans/points the next step. Fast (~1s), but it only sees the
   *current* view; it can't know what's behind a click or on another page.
2. **The multi-agent scout (Agents Platform).** A manager fans out cloud-browser
   subagents that actually navigate a site and record flows. Deep and thorough,
   but slow (minutes) and runs in H's cloud, not the user's live page.

The ask: **couple them.** Start cheap with the VLM on the current screenshot; if
the goal goes *deeper* than the visible page, escalate to the computer-use /
browser-use agent to click through the flow, grounding (screenshot + model) at
every stage. Run the pieces as a **multi-parallel processor** and merge into one
tour. So a tour is assembled by the fast eye when it can be, and by the agent
that actually walks the path when it must be.

## Two tiers, one tour

```
User asks "how do I X?" on page P
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1 — Grounding pass (Holo VLM, in-page, ~1s)             │
│  screenshot(P) → model: can the whole flow be done from what  │
│  is visible now?                                              │
│    • YES, self-contained  → emit the steps, play immediately  │
│    • NO, flow leaves P     → mark the escalation point(s):     │
│        "after clicking Settings the next steps are unknown"    │
└───────────────┬─────────────────────────────────────────────┘
                │ escalate only the unknown branches
                ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2 — Agent exploration (computer-use agent, parallel)    │
│  A manager agent walks each unknown branch, and AT EACH STAGE │
│  screenshots + grounds (Holo) to record the exact next step.  │
│  Branches explored in parallel (H multi-agent fan-out).       │
│  Returns ordered, element-by-element sub-paths.               │
└───────────────┬─────────────────────────────────────────────┘
                │ merge sub-paths into the Tier-1 skeleton
                ▼
        Unified tour plan  →  cached  →  the in-page widget plays it
```

The coupling: **Tier 2 is just Tier 1 run repeatedly by an agent that can move.**
The same Holo grounding call is the atom at every stage; the agent supplies
motion (clicks/navigation) between grounding calls. One primitive, two drivers
(the human's current view, or the agent walking ahead).

## Where the agent runs — two modes

The Agents Platform supports both a cloud browser (today's scout) and driving a
**local** browser (`computer-use-agents/browser/local-control`,
`.../desktop/local-control`). That gives two deployment modes:

- **Scout-ahead (cloud browser).** The agent explores a generic/anonymous copy of
  the site in H's cloud, ahead of time or on first ask, and caches the flow.
  Good for public flows, pre-warming, and flows that don't need the user's login.
  This is the existing `server/scout` module — extend it, don't rebuild it.
- **Shadow-the-user (local browser / same session).** The agent drives the user's
  own browser (their login, their data) to discover the *real* path, while the
  widget visualizes each move. Needed for authed, per-account flows ("where's MY
  billing"). Higher trust bar — must be gated (the constitution's action rules:
  the agent clicking through a real account is a side-effectful action to confirm).

Pick per flow: default to scout-ahead for discovery; use shadow-the-user only for
authed/account-specific goals, behind explicit consent.

## The multi-parallel processor

This is where the H multi-agent pattern earns its keep. The manager doesn't
explore serially — it fans out:

- **By branch.** Each unknown branch from Tier 1 (e.g. "Settings → ?", "Billing →
  ?") is a parallel subagent.
- **By modality.** Pair a fast **text-mode** subagent (cheap DOM/nav lookups) with
  a **visual** subagent (real clicks + grounding) — the hub's recommended pairing.
- **By verification.** A verifier subagent re-walks a discovered path to confirm
  the steps still land, before the tour is trusted (adversarial check).

Concurrency and cost come straight from the multi-agent doc: subagents are billed
sessions, so cap breadth, cache aggressively, and re-scout only on UI change.

## Data contract (extends today's Step)

The in-page widget already plays a `Step[]` (point / act_click / act_write /
answer, each with an element description + coords). The adaptive engine produces
the same shape, plus:

- `page`: the URL/route the step happens on (multi-page tours already survive
  navigation via sessionStorage — this labels which page each step belongs to).
- `source`: `"grounding"` | `"agent"` — provenance, for debugging + trust.
- `confidence` / `verified`: whether a verifier subagent confirmed the step.

So the widget needs **no new playback code** — it already snaps descriptions to
elements and survives navigation. The new work is entirely in *generation*.

## Build phases (when we do implement)

1. **Escalation signal (Tier 1).** Extend the `/api/step` system prompt so the
   model can emit "flow leaves this page here" instead of only in-page steps.
   Cheap, unlocks the whole thing.
2. **Scout → grounded sub-path.** Extend `server/scout` so a subagent, at each
   stage, calls the same Holo grounding used in-page and records `Step`-shaped
   sub-paths (not just prose). Reuse `server/src/step.ts`.
3. **Merge + cache.** A synthesizer stitches Tier-1 skeleton + Tier-2 sub-paths
   into one `Step[]`, cached per (origin, goal). The widget plays it instantly.
4. **Parallel manager.** Fan out branches + modality pairing + a verifier, per the
   multi-agent doc. This is the "multi-parallel processor."
5. **Local-control mode (gated).** Add shadow-the-user via H local browser control
   for authed flows, behind explicit per-run consent.
6. **Feedback loop.** When a live in-page tour finds a cached step stale
   (target missing), auto-queue a re-scout of that branch — the library heals.

## Open questions to resolve before implementing

- **Escalation accuracy.** Can Holo reliably say "the flow continues off this
  page" vs hallucinating in-page steps? Needs a prompt eval before phase 1.
- **Generic vs authed divergence.** A scouted anonymous flow may differ from the
  user's authed UI. How much does shadow-the-user need to override the cache?
- **Latency budget.** Tier 2 is minutes; the user is waiting. Do we (a) play the
  Tier-1 partial tour immediately and stream Tier-2 steps in as they resolve, or
  (b) block on a full plan? Streaming is better UX but more moving parts.
- **Trust/consent UX** for an agent driving the user's real, logged-in browser.
- **Cost ceiling.** Per-goal subagent budget; when to refuse deep exploration.

## What this reuses (not a rewrite)

- `packages/core` widget playback — unchanged (plays the same `Step[]`).
- `server/src/step.ts` Holo grounding — becomes the shared atom for both tiers.
- `server/scout` multi-agent scaffold — extended to emit grounded sub-paths.
- The hai-agents SDK + multi-agent pattern — already validated live.

The only genuinely new code is the **escalation signal**, the **synthesizer**, and
the **streaming/merge** glue. Everything else already exists and is validated.
