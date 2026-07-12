/**
 * Site-scout agent provisioning on H Company's Agent Platform (agp).
 *
 * Idempotent create-or-update by name: POST /api/v2/agents, and on 409
 * (agent already exists — see docs/vendor/hai/computer-use-agents/errors.md)
 * fall back to PUT /api/v2/agents/{name}. Nothing here runs at import time;
 * callers invoke `ensureScoutAgents()` explicitly and only when HAI_API_KEY
 * is present (see hasApiKey / router.ts).
 *
 * Patterns follow the vendored hai-agents skill (docs/vendor/hai-skill/SKILL.md):
 * - auth via the HAI_API_KEY environment variable, consumed by the SDK client
 *   (`new HaiAgentsClient()` attaches it as a Bearer token);
 * - EU region is the client default; HAI_REGION=us opts into the US host;
 * - the task always travels in session `messages`, never in agent
 *   `instructions` — instructions below are persona/guardrails only;
 * - SDK method shapes were introspected from the installed hai-agents@1.0.6
 *   package, not guessed.
 */

import {
  HaiAgentsClient,
  HaiAgentsEnvironment,
  HaiAgentsError,
  type HaiAgents,
} from "hai-agents";

/** Catalog names. Session creation references the manager by this name. */
export const MANAGER_AGENT = "handyman-scout";
export const PAGE_SCOUT_AGENT = "handyman-page-scout";
export const FLOW_VERIFIER_AGENT = "handyman-flow-verifier";

export function hasApiKey(): boolean {
  const key = process.env.HAI_API_KEY;
  return typeof key === "string" && key.length > 0;
}

function region(): "eu" | "us" {
  return process.env.HAI_REGION === "us" ? "us" : "eu";
}

/**
 * Deterministic Agent View (live view / replay) link, built from the session
 * id per the hai-agents skill. The host must match the region the API call
 * went to; the SDK (and this module) default to EU.
 */
export function agentViewUrl(sessionId: string): string {
  const host =
    region() === "us"
      ? "https://platform.hcompany.ai"
      : "https://platform.eu.hcompany.ai";
  return `${host}/agent-view/${sessionId}`;
}

let client: HaiAgentsClient | undefined;

/**
 * Shared SDK client. The constructor reads HAI_API_KEY from the environment
 * and defaults to the EU host (docs/vendor/hai/computer-use-agents/sdks.md).
 * Built-in retry: transient errors (408, 429, 5xx) are retried twice with
 * backoff by the SDK itself.
 */
export function getClient(): HaiAgentsClient {
  if (!client) {
    client =
      region() === "us"
        ? new HaiAgentsClient({ environment: HaiAgentsEnvironment.Us })
        : new HaiAgentsClient();
  }
  return client;
}

/**
 * Subagent: maps one nav section. Visual-mode web browser; no startUrl in the
 * stored spec — the target site is parameterized at session time (the manager
 * hands each scout its section URL inside the delegated task message).
 */
const pageScout: HaiAgents.Agent = {
  name: PAGE_SCOUT_AGENT,
  description:
    "Explores one section of a website and inventories what a user can do there. Use for mapping a single nav section.",
  model: "holo3-1-35b-a3b",
  environments: [
    {
      id: "page-scout-browser",
      kind: "web",
      mode: { type: "visual" },
    },
  ],
};

/** Subagent: walks one user flow and records the exact click path. */
const flowVerifier: HaiAgents.Agent = {
  name: FLOW_VERIFIER_AGENT,
  description:
    "Walks a specific user flow on a website and records the exact click path as numbered steps. Use to verify how to accomplish one task.",
  environments: [
    {
      id: "flow-verifier-browser",
      kind: "web",
    },
  ],
};

/**
 * Manager: pure orchestrator (no environments of its own — it only delegates,
 * which the agents API allows for managers). References subagents by catalog
 * name so each stays reusable and independently inspectable.
 */
const manager: HaiAgents.Agent = {
  name: MANAGER_AGENT,
  description:
    "Maps a website into a site guide by fanning out page scouts and a flow verifier.",
  instructions:
    "You map websites for an in-page tutorial assistant. Split the site's nav sections among page scouts in parallel, then have the flow verifier walk the most important flows. Merge everything into a site guide: for each user goal, the ordered element-by-element click path.",
  environments: [],
  subagents: [PAGE_SCOUT_AGENT, FLOW_VERIFIER_AGENT],
};

async function createOrUpdate(
  c: HaiAgentsClient,
  agent: HaiAgents.Agent,
): Promise<void> {
  try {
    await c.agents.createAgent(agent);
  } catch (err) {
    // 409 Conflict = agent name already exists -> update in place.
    // Every other error (401 bad key, 422 validation, 5xx after the SDK's
    // own retries) is a real failure; do not swallow it.
    if (err instanceof HaiAgentsError && err.statusCode === 409) {
      await c.agents.updateAgent({ agentName: agent.name, body: agent });
      return;
    }
    throw err;
  }
}

let provisioned: Promise<void> | undefined;

/**
 * Idempotent provisioning of the scout agent tree. Subagents first, then the
 * manager (it references them by name). Memoized per process; a failed
 * attempt clears the memo so the next request retries.
 */
export async function ensureScoutAgents(): Promise<void> {
  if (!provisioned) {
    provisioned = (async () => {
      const c = getClient();
      // Subagents are independent of each other -> provision in parallel.
      await Promise.all([
        createOrUpdate(c, pageScout),
        createOrUpdate(c, flowVerifier),
      ]);
      await createOrUpdate(c, manager);
    })().catch((err: unknown) => {
      provisioned = undefined;
      throw err;
    });
  }
  return provisioned;
}
