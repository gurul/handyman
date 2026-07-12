> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a session

> Launch a new agent run.

Creates a new session that runs an agent against the given task. When a slot is available the session starts in `pending` status and transitions to `running` once the agent launches. A create above your [concurrency limit](/computer-use-agents/plans-and-limits#concurrent-sessions) is accepted as `queued` and starts automatically when a slot frees up (set [`queue: false`](#body-queue) to get a `429` instead).

**Returns** the created [Session](/computer-use-agents/sessions/overview) object with status `pending` or `queued`.

***

## Headers

<ParamField header="Idempotency-Key" type="string">
  Optional idempotency key (max 255 characters). Safe retry within 24 hours: reusing the same key with a different body returns `422`.
</ParamField>

***

## Request body

<ParamField body="agent" type="string | object" required>
  Either a catalog identifier (string, e.g. `"h/web-surfer-flash"`) or an inline [Agent](/computer-use-agents/agents/overview) object. An inline agent must include its own `environments` (at most one per kind), unless it is a pure [manager](/computer-use-agents/multi-agent) that only delegates to `subagents`; the session resolves only `agent` and reads everything else (environments, skills, subagents) from there.

  Using a catalog id (environments come from the agent's stored spec):

  ```json theme={null}
  "agent": "h/web-surfer-flash"
  ```

  Inline agent, with environments nested under it:

  ```json theme={null}
  "agent": {
    "name": "weather-agent",
    "description": "Looks up weather by city",
    "environments": [
      {
        "id": "browser",
        "kind": "web",
        "mode": {"type": "visual", "width": 1280, "height": 720},
        "start_url": "https://www.bing.com/"
      }
    ]
  }
  ```

  See [Browser](/computer-use-agents/browser/configuration) for its config and fields.
</ParamField>

<ParamField body="messages" type="string | object | array">
  Initial messages queued before the agent's first step. Usually a single user message describing the task; a plain string is accepted as shorthand for one user message.

  Each message object has:

  * `type` (string, optional): `"user_message"`, the default.
  * `message` (string): The instruction or task description.
  * `images` (array, optional): Base64 data URIs to attach (e.g. `data:image/png;base64,...`).
  * `caller_id` (string, optional): Identifies the message sender. Defaults to `user`; leave it unset for normal user input.

  ```json theme={null}
  "messages": [
    {"type": "user_message", "message": "Book a flight from Paris to Tokyo on June 15"}
  ]
  ```
</ParamField>

<ParamField body="max_steps" type="integer">
  Cap on the number of steps the agent may take, where each step is one decide-and-act cycle. On reaching the cap the agent is asked to produce a final answer from what it has so far (it is **not** hard-killed), so you still get a structured result. Omit it to run uncapped.
</ParamField>

<ParamField body="max_time_s" type="number">
  Cap on wall-clock seconds. On reaching the cap, like `max_steps`, the agent is asked for a final answer rather than terminated abruptly. Omit it to run uncapped.
</ParamField>

<ParamField body="idle_timeout_s" type="integer">
  Switches between one-shot and interactive. Leave it `null` for a one-shot task: the session ends as soon as the agent answers. Set it (in seconds) to keep the session open for follow-up [messages](/computer-use-agents/sessions/send-messages): after each answer the session enters the [`idle`](/computer-use-agents/sessions/overview#lifecycle) status and waits this long for your next message before terminating.
</ParamField>

<ParamField body="queue" type="boolean" default="true">
  When you are at your [concurrency limit](/computer-use-agents/plans-and-limits#concurrent-sessions), accept this session into a queue (status [`queued`](/computer-use-agents/sessions/overview#lifecycle)) instead of rejecting it with `429`. Queued sessions don't count against your quota and start automatically, oldest first, as running sessions finish. Ideal for batch workloads: fire N tasks, then collect results via [webhooks](/computer-use-agents/webhooks/overview). Set `false` to fail fast with `429` when at capacity.
</ParamField>

<ParamField body="group_id" type="string">
  Tag for grouping related sessions. You can later query all sessions with `GET /sessions?group_id=...`.
</ParamField>

<ParamField body="parent_session_id" type="string">
  ID of a parent session, for [multi-agent](/computer-use-agents/multi-agent) orchestration. The parent's status endpoint will include this session in its `subagent_session_ids` list. Child sessions never queue: at capacity the create fails with `429` even when `queue` is `true`, because queueing a child behind its own parent's slot would deadlock the parent.
</ParamField>

<ParamField body="overrides" type="object">
  Per-run tweaks applied after the agent (and its environments, skills, and subagents) are resolved, so you can adjust a catalog agent for a single run without editing its stored spec. Keys are dotted paths into the request; list members are addressed with an explicit `[field=value]` selector. Each value is validated against the field its path targets, so an unknown path or a wrong type is rejected with `422` at creation.

  Common uses: point the browser at a different start URL, or ask a catalog agent for [structured output](/computer-use-agents/structured-output) by overriding its [`answer_format`](/computer-use-agents/agents/overview).

  ```json theme={null}
  "overrides": {
    "agent.environments[kind=web].start_url": "https://www.bing.com/",
    "agent.answer_format": {
      "type": "object",
      "properties": {"price": {"type": "number"}},
      "required": ["price"]
    }
  }
  ```
</ParamField>

***

## Response

<ResponseField name="id" type="string">
  Unique session identifier.
</ResponseField>

<ResponseField name="request" type="object">
  The original session request body.
</ResponseField>

<ResponseField name="status" type="object">
  Session status object with `status: "pending"` for a newly created session, or `"queued"` when the create was accepted above your concurrency limit.
</ResponseField>

<ResponseField name="agent_view_url" type="string">
  Link to the session's [Agent View](/computer-use-agents/observe-and-steer) page for live viewing and replay.
</ResponseField>

<ResponseField name="created_at" type="string">
  ISO 8601 timestamp.
</ResponseField>

***

## Examples

### Basic session

Reference a catalog agent; its stored spec supplies the environments:

<CodeGroup>
  ```bash CLI theme={null}
  # `hai run` creates the session and blocks until the agent answers
  hai run "Find the best-rated sushi restaurants in San Francisco" \
    --agent h/web-surfer-flash
  ```

  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [
        {"type": "user_message", "message": "Find the best-rated sushi restaurants in San Francisco"}
      ]
    }'
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages="Find the best-rated sushi restaurants in San Francisco",
  )
  print(session.id)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const session = await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      messages: "Find the best-rated sushi restaurants in San Francisco",
    },
  });
  console.log(session.id);
  ```
</CodeGroup>

```json Response theme={null}
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "request": {
    "agent": "h/web-surfer-flash",
    "messages": [
      {"type": "user_message", "message": "Find the best-rated sushi restaurants in San Francisco"}
    ]
  },
  "status": {
    "status": "pending",
    "error": null,
    "steps": 0,
    "usage_per_model": [],
    "subagent_session_ids": []
  },
  "agent_view_url": "https://platform.hcompany.ai/agents/sessions/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "latest_answer": null,
  "created_at": "2026-05-07T14:30:00Z",
  "started_at": null,
  "finished_at": null
}
```

### With idempotency key

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: my-unique-key-123" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [
        {"type": "user_message", "message": "Search for direct flights from CDG to NRT on June 15"}
      ]
    }'
  ```

  ```python Python theme={null}
  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages="Search for direct flights from CDG to NRT on June 15",
      idempotency_key="my-unique-key-123",
  )
  ```

  ```typescript TypeScript theme={null}
  const session = await client.sessions.createSession({
    idempotencyKey: "my-unique-key-123",
    body: {
      agent: "h/web-surfer-flash",
      messages: "Search for direct flights from CDG to NRT on June 15",
    },
  });
  ```
</CodeGroup>

### With an inline agent and explicit browser environment

Pass an inline `Agent` instead of a catalog id when you want to override the environments (or any other field) on a per-session basis. Environments must be nested under `agent`.

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "agent": {
        "name": "web-price-finder",
        "description": "Web browsing agent with a custom browser config",
        "environments": [
          {"id": "browser", "kind": "web", "mode": {"type": "visual", "width": 1280, "height": 720}, "start_url": "https://www.bing.com"}
        ]
      },
      "messages": [
        {"type": "user_message", "message": "Find the current price of the Framework 13 laptop and report the lowest you find"}
      ]
    }'
  ```

  ```python Python theme={null}
  session = client.sessions.create_session(
      agent={
          "name": "web-price-finder",
          "description": "Web browsing agent with a custom browser config",
          "environments": [
              {
                  "id": "browser",
                  "kind": "web",
                  "mode": {"type": "visual", "width": 1280, "height": 720},
                  "start_url": "https://www.bing.com",
              }
          ],
      },
      messages="Find the current price of the Framework 13 laptop and report the lowest you find",
  )
  ```

  ```typescript TypeScript theme={null}
  const session = await client.sessions.createSession({
    body: {
      agent: {
        name: "web-price-finder",
        description: "Web browsing agent with a custom browser config",
        environments: [
          {
            id: "browser",
            kind: "web",
            mode: { type: "visual", width: 1280, height: 720 },
            startUrl: "https://www.bing.com",
          },
        ],
      },
      messages: "Find the current price of the Framework 13 laptop and report the lowest you find",
    },
  });
  ```
</CodeGroup>

### With per-run overrides

Reuse a catalog agent but tweak it for this run only: here we send it to a different start URL without editing its stored spec.

<CodeGroup>
  ```bash CLI theme={null}
  hai run "Find the cheapest direct flight CDG to NRT next month" \
    --agent h/web-surfer-flash \
    --override 'agent.environments[kind=web].start_url=https://www.google.com/travel/flights'
  ```

  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [
        {"type": "user_message", "message": "Find the cheapest direct flight CDG to NRT next month"}
      ],
      "overrides": {
        "agent.environments[kind=web].start_url": "https://www.google.com/travel/flights"
      }
    }'
  ```

  ```python Python theme={null}
  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages="Find the cheapest direct flight CDG to NRT next month",
      overrides={
          "agent.environments[kind=web].start_url": "https://www.google.com/travel/flights",
      },
  )
  ```

  ```typescript TypeScript theme={null}
  const session = await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      messages: "Find the cheapest direct flight CDG to NRT next month",
      overrides: {
        "agent.environments[kind=web].start_url": "https://www.google.com/travel/flights",
      },
    },
  });
  ```
</CodeGroup>

### Child session (multi-agent)

See [Multi-agent](/computer-use-agents/multi-agent) for the full picture.

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "parent_session_id": "parent-session-uuid",
      "group_id": "trip-planning-001",
      "messages": [
        {"type": "user_message", "message": "Find hotels near Shinjuku station under $150/night"}
      ]
    }'
  ```

  ```python Python theme={null}
  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      parent_session_id="parent-session-uuid",
      group_id="trip-planning-001",
      messages="Find hotels near Shinjuku station under $150/night",
  )
  ```

  ```typescript TypeScript theme={null}
  const session = await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      parentSessionId: "parent-session-uuid",
      groupId: "trip-planning-001",
      messages: "Find hotels near Shinjuku station under $150/night",
    },
  });
  ```
</CodeGroup>

***

## Errors

| Status | Cause                                                                                                                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | The resolved request is invalid (for example an override producing an impossible configuration).                                                                                                                                                                      |
| `402`  | Your organization's monthly token budget is exhausted. See [Plans and limits](/computer-use-agents/plans-and-limits#token-usage).                                                                                                                                     |
| `404`  | The referenced agent doesn't exist or isn't visible to you.                                                                                                                                                                                                           |
| `409`  | An `Idempotency-Key` from a still in-flight request was reused before it completed. Retry after `Retry-After`.                                                                                                                                                        |
| `422`  | Request body failed validation, or an `Idempotency-Key` was reused with a different body.                                                                                                                                                                             |
| `429`  | Concurrency quota exceeded with [`queue: false`](#body-queue), the queue itself is full, or the create carries a [`parent_session_id`](#body-parent-session-id) while at capacity. See [Plans and limits](/computer-use-agents/plans-and-limits#concurrent-sessions). |
