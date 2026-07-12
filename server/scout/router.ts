/**
 * Site-scout HTTP surface.
 *
 * POST /            { url, goal? }            -> run the multi-agent scout, block, return { status, answer }
 * POST /?async=1    { url, goal? }            -> create the session, return { session_id, agent_view_url } immediately
 * GET  /:sessionId                            -> poll status / answer for an async run
 *
 * Degrades gracefully without HAI_API_KEY: every route returns 503 with a
 * clear message, and no SDK call (or agent provisioning) ever happens.
 *
 * Per the vendored hai-agents skill (docs/vendor/hai-skill/SKILL.md):
 * - the task travels in `messages` (the manager's instructions are persona only);
 * - the Agent View link is built deterministically from the session id and
 *   surfaced immediately, so callers can watch the run live;
 * - structured output uses the SDK's `answerSchema` (Zod v4), which it converts
 *   to the wire `answer_format` and parses back into a typed answer.
 */

import { Hono } from "hono";
import {
  AnswerValidationError,
  HaiAgentsError,
  HaiAgentsTimeoutError,
} from "hai-agents";
import { z } from "zod";
import {
  MANAGER_AGENT,
  agentViewUrl,
  ensureScoutAgents,
  getClient,
  hasApiKey,
} from "./setup.js";

const ScoutRequest = z.object({
  url: z.url(),
  goal: z.string().min(1).optional(),
});

/** Structured site guide: per user goal, the ordered element-by-element click path. */
const SiteGuide = z.object({
  goals: z.array(
    z.object({
      goal: z.string(),
      steps: z.array(
        z.object({
          element: z.string(),
          action: z.string(),
          page: z.string(),
        }),
      ),
    }),
  ),
});
export type SiteGuideAnswer = z.infer<typeof SiteGuide>;

/** Whole-run budget. Multi-agent site mapping fans out several browser sessions. */
const RUN_MAX_TIME_S = 900;
/** Client-side poll budget for the blocking path; slightly above the server cap. */
const RUN_TIMEOUT_MS = (RUN_MAX_TIME_S + 60) * 1000;

const NO_KEY_MESSAGE =
  "Site scout is not configured: set the HAI_API_KEY environment variable (create a key on the H Company portal) and restart the server.";

function taskMessage(url: string, goal?: string): string {
  return `Map ${url}${goal ? ` focusing on how a user would: ${goal}` : ""}. Return the site guide as structured markdown.`;
}

/**
 * Map upstream failures onto our edge without leaking the key or crashing.
 * The SDK already retried transient errors (408/429/5xx) with backoff;
 * whatever reaches here is final for this request.
 */
function upstreamError(err: unknown): { status: 502 | 503 | 504; body: { error: string; detail?: string } } {
  if (err instanceof HaiAgentsTimeoutError) {
    return { status: 504, body: { error: "Scout run timed out waiting for the agent platform." } };
  }
  if (err instanceof HaiAgentsError) {
    const detail = err.message;
    switch (err.statusCode) {
      case 401:
      case 403:
        return { status: 503, body: { error: "Agent platform rejected the configured HAI_API_KEY.", detail } };
      case 402:
      case 429:
        return { status: 503, body: { error: "Agent platform quota exhausted; retry later.", detail } };
      default:
        return { status: 502, body: { error: "Agent platform request failed.", detail } };
    }
  }
  return { status: 502, body: { error: "Unexpected error talking to the agent platform." } };
}

export const scoutRouter = new Hono();

scoutRouter.post("/", async (c) => {
  if (!hasApiKey()) {
    return c.json({ error: NO_KEY_MESSAGE }, 503);
  }

  const parsed = ScoutRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Body must be { url: string (absolute URL), goal?: string }." }, 400);
  }
  const { url, goal } = parsed.data;
  const client = getClient();

  try {
    await ensureScoutAgents();
  } catch (err) {
    const { status, body } = upstreamError(err);
    return c.json({ error: `Agent provisioning failed: ${body.error}`, detail: body.detail }, status);
  }

  // Async mode: create the session and hand back id + live Agent View link immediately.
  if (c.req.query("async") === "1") {
    try {
      const handle = await client.startSession({
        agent: MANAGER_AGENT,
        messages: taskMessage(url, goal),
        maxTimeS: RUN_MAX_TIME_S,
        answerSchema: SiteGuide,
      });
      return c.json(
        { session_id: handle.id, agent_view_url: agentViewUrl(handle.id) },
        202,
      );
    } catch (err) {
      const { status, body } = upstreamError(err);
      return c.json(body, status);
    }
  }

  // Blocking mode: run to completion and return the (typed) site guide.
  try {
    const result = await client.runSession({
      agent: MANAGER_AGENT,
      messages: taskMessage(url, goal),
      maxTimeS: RUN_MAX_TIME_S,
      timeoutMs: RUN_TIMEOUT_MS,
      answerSchema: SiteGuide,
    });
    return c.json({
      status: result.status,
      answer: result.answer ?? null,
      session_id: result.id,
      agent_view_url: agentViewUrl(result.id),
      error: result.error ?? null,
    });
  } catch (err) {
    // Completed run whose answer missed the schema: surface the raw answer
    // rather than failing the request — the guide text is still useful.
    if (err instanceof AnswerValidationError) {
      return c.json({ status: "completed", answer: err.raw, schema_valid: false });
    }
    const { status, body } = upstreamError(err);
    return c.json(body, status);
  }
});

scoutRouter.get("/:sessionId", async (c) => {
  if (!hasApiKey()) {
    return c.json({ error: NO_KEY_MESSAGE }, 503);
  }
  const sessionId = c.req.param("sessionId");

  try {
    const session = await getClient().sessions.getSession({ id: sessionId });
    const status = session.status.status;
    // latestAnswer is the raw wire value; when the run completed, hand back
    // the schema-parsed guide if it conforms, otherwise the raw answer.
    let answer: unknown = session.latestAnswer ?? null;
    if (status === "completed" && answer !== null) {
      const guided = SiteGuide.safeParse(answer);
      if (guided.success) answer = guided.data;
    }
    return c.json({
      session_id: sessionId,
      status,
      answer,
      error: session.status.error ?? null,
      agent_view_url: session.agentViewUrl ?? agentViewUrl(sessionId),
    });
  } catch (err) {
    if (err instanceof HaiAgentsError && err.statusCode === 404) {
      return c.json({ error: `Session ${sessionId} not found.` }, 404);
    }
    const { status, body } = upstreamError(err);
    return c.json(body, status);
  }
});
