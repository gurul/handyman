> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Sessions

> A session represents a single execution of an agent.

export const SessionLifecycle = () => {
  const icons = {
    queued: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>,
    pending: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    running: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>,
    paused: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="14" y="3" width="5" height="18" rx="1" /><rect x="5" y="3" width="5" height="18" rx="1" /></svg>,
    idle: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>,
    awaiting_tool_results: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" /></svg>,
    completed: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>,
    failed: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>,
    timed_out: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></svg>,
    interrupted: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.929 4.929 19.07 19.071" /></svg>
  };
  const State = ({name, sub, dark}) => <div className="flex items-start gap-2.5">
      <span className={`mt-px shrink-0 ${dark ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500"}`}>{icons[name]}</span>
      <div className="min-w-0">
        <div className={`text-[13px] font-medium leading-5 ${dark ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-zinc-100"}`}>{name}</div>
        <div className="text-[11.5px] leading-4 text-zinc-400 dark:text-zinc-500">{sub}</div>
      </div>
    </div>;
  const Phase = ({head, dark, className = "", children}) => <div className={`w-full rounded-xl border p-5 md:flex-1 ${dark ? "border-transparent bg-zinc-900 dark:bg-zinc-100" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"} ${className}`}>
      <div className={`mb-4 text-[10.5px] font-medium uppercase tracking-[0.12em] ${dark ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`}>{head}</div>
      {children}
    </div>;
  const Arrow = ({label}) => <div className="flex shrink-0 flex-col items-center justify-center gap-1 py-1 md:px-3 md:py-0">
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{label}</span>
      <svg className="h-4 w-7 rotate-90 text-zinc-400 dark:text-zinc-500 md:rotate-0" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8h23" /><path d="M19 3l6 5-6 5" /></svg>
    </div>;
  return <div className="not-prose my-6 flex flex-col items-stretch md:flex-row md:items-center">
      <Phase head="Starting">
        <div className="space-y-3">
          <State name="queued" sub="waiting for a free slot" />
          <State name="pending" sub="agent is launching" />
        </div>
      </Phase>

      <Arrow label="launch" />

      <Phase head="Active">
        <State name="running" sub="actively working" />
        <div className="my-4 h-px bg-zinc-100 dark:bg-zinc-800" />
        <div className="space-y-3">
          <State name="paused" sub="you paused it" />
          <State name="idle" sub="awaiting your message" />
          <State name="awaiting_tool_results" sub="awaiting your tool output" />
        </div>
      </Phase>

      <Arrow label="ends" />

      <Phase head="Ended" dark>
        <div className="space-y-3">
          <State name="completed" sub="finished the task" dark />
          <State name="failed" sub="stopped by an error" dark />
          <State name="timed_out" sub="hit a time or step limit" dark />
          <State name="interrupted" sub="you cancelled it" dark />
        </div>
      </Phase>
    </div>;
};

<SessionLifecycle />

A session moves through a fixed [lifecycle](#lifecycle). You can steer it while it runs and read the result when it finishes. Every follow-up call (sending a message, pausing, cancelling) is addressed to the session's `id`. The optional [`max_steps` and `max_time_s`](/computer-use-agents/sessions/create) caps bound how long it runs before the agent is asked for a final answer.

<CodeGroup>
  ```bash CLI theme={null}
  hai run "Top 3 stories on Hacker News?" \
    --agent h/web-surfer-flash
  ```

  ```bash cURL theme={null}
  SESSION=$(curl -s -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" -H "Content-Type: application/json" \
    -d '{"agent": "h/web-surfer-flash", "messages": [{"type": "user_message", "message": "Top 3 stories on Hacker News?"}]}' | jq -r .id)
  echo "$SESSION"
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages=[{"type": "user_message", "message": "Top 3 stories on Hacker News?"}],
  )
  print(session.id)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const session = await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      messages: [{ type: "user_message", message: "Top 3 stories on Hacker News?" }],
    },
  });
  console.log(session.id);
  ```
</CodeGroup>

Creating a session returns its `id`, which you poll for progress and the answer as in the [Quickstart](/computer-use-agents/quickstart). For a one-shot run, the helper below blocks until the agent finishes and hands back the result.

<CodeGroup>
  ```python Python theme={null}
  result = client.run_session(
      agent="h/web-surfer-flash",
      messages="Top 3 stories on Hacker News?",
  )
  print(result.status, result.answer)
  ```

  ```typescript TypeScript theme={null}
  const result = await client.runSession({
    agent: "h/web-surfer-flash",
    messages: "Top 3 stories on Hacker News?",
  });
  console.log(result.status, result.answer);
  ```
</CodeGroup>

Pick the call that matches how much control you need:

| You want to…                                        | SDK call                                                                            | You get back                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Run and read the answer in one shot                 | `client.run_session(...)` / `runSession`                                            | Blocks, then returns the final result                                  |
| Watch or steer while it runs                        | `client.start_session(...)` / `startSession`                                        | A handle bound to the `id`; read and steer, then `wait_for_completion` |
| Drive the loop yourself (raw HTTP, other languages) | `POST /sessions`, then long-poll [`changes`](/computer-use-agents/sessions/changes) | The session `id`; you poll                                             |

### Reading the answer

The simplest is the session snapshot. [`GET /sessions/{id}`](/computer-use-agents/sessions/retrieve) returns `latest_answer`, the agent's most recent final answer, or `null` until it first answers. It needs no cursor and never goes stale, so once a run has settled it is the easiest way to read the answer.

While a run is active, [`GET /sessions/{id}/changes`](/computer-use-agents/sessions/changes) carries the same `answer` alongside the live event feed. Because `changes` returns only what is new since your cursor (and `204 No Content` when nothing new has arrived), the answer rides the page that delivers the final events. Keep polling until the session reaches a [terminal state](#lifecycle) and you have drained the remaining events; a `204` means no new events yet, not no answer. The SDK helpers ([`run_session` / `wait_for_session`](/computer-use-agents/sessions/changes#long-polling-pattern)) run this loop and drain to the end for you.

Don't poll [`status`](/computer-use-agents/sessions/status) for the answer: it never carries one.

## Session object

| Field                                       | Description                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                        | The session's UUID, the handle for every follow-up call.                                                                                                                                                                                                           |
| `request`                                   | Echoes what you submitted, with `agent` resolved to its full spec even if you passed a catalog id.                                                                                                                                                                 |
| `status`                                    | Carries the live `status`, step count, per-model token usage (`usage_per_model`), any `error` and its `error_code`, the agent's self-assessed `outcome`, and `subagent_session_ids`. See [Session status](/computer-use-agents/sessions/status) for the breakdown. |
| `agent_view_url`                            | Link to the session's [Agent View](/computer-use-agents/observe-and-steer) page for live viewing and replay.                                                                                                                                                       |
| `latest_answer`                             | The agent's most recent final answer, mirrored from [`changes`](/computer-use-agents/sessions/changes); `null` until it first answers.                                                                                                                             |
| `created_at` / `started_at` / `finished_at` | Track the run's timeline; the latter two are `null` until they happen.                                                                                                                                                                                             |

## Lifecycle

Every session moves through the same state machine, whichever agent runs it:

| Status                  | Meaning                                                                                                                                                              | Terminal |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `queued`                | Session accepted above your [concurrency limit](/computer-use-agents/plans-and-limits#concurrent-sessions); it starts automatically, oldest first, as slots free up. | No       |
| `pending`               | Session created, agent is launching.                                                                                                                                 | No       |
| `running`               | Agent is actively working on the task.                                                                                                                               | No       |
| `paused`                | Manually paused via the API. State is preserved.                                                                                                                     | No       |
| `idle`                  | Interactive agent finished a task and is waiting for your next message.                                                                                              | No       |
| `awaiting_tool_results` | Agent is blocked on [custom tool](/computer-use-agents/custom-tools) calls your code must answer.                                                                    | No       |
| `completed`             | Agent finished the task successfully.                                                                                                                                | Yes      |
| `timed_out`             | Agent exceeded the maximum allowed time.                                                                                                                             | Yes      |
| `interrupted`           | Session was canceled via `DELETE`.                                                                                                                                   | Yes      |
| `failed`                | An unrecoverable error occurred.                                                                                                                                     | Yes      |

## Overrides

Reuse a catalog agent but adjust it for a single run with `overrides`, a map on the [create-session](/computer-use-agents/sessions/create) body. Rather than defining a new agent, you point at fields of the resolved request. Each key is a dotted path, and its value replaces whatever that path resolves to, applied after `agent` is expanded from its catalog id.

* Dots walk into objects. `agent.instructions` sets behavior, `agent.model` swaps the serving model, and `agent.answer_format` pins a [structured answer](#structured-output).
* A `[field=value]` selector picks a list member. `agent.environments[kind=web]` selects the web environment, so `agent.environments[kind=web].start_url` sets just its start page and `agent.environments[kind=web].mode` switches how it reads the page.
* Values are type-checked. Each value must match the type of the field its path targets. An unknown path or a wrong type is rejected with `422` at creation, before the agent runs.

For example, send a catalog web-surfer to a chosen page instead of its default start URL:

<CodeGroup>
  ```bash CLI theme={null}
  hai run "Summarize the top discussion right now" \
    --agent h/web-surfer-flash \
    --override 'agent.environments[kind=web].start_url=https://news.ycombinator.com'
  ```

  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [{"type": "user_message", "message": "Summarize the top discussion right now"}],
      "overrides": {"agent.environments[kind=web].start_url": "https://news.ycombinator.com"}
    }'
  ```

  ```python Python theme={null}
  session = client.sessions.create_session(
      agent="h/web-surfer-flash",
      messages="Summarize the top discussion right now",
      overrides={"agent.environments[kind=web].start_url": "https://news.ycombinator.com"},
  )
  ```

  ```typescript TypeScript theme={null}
  const session = await client.sessions.createSession({
    body: {
      agent: "h/web-surfer-flash",
      messages: "Summarize the top discussion right now",
      overrides: { "agent.environments[kind=web].start_url": "https://news.ycombinator.com" },
    },
  });
  ```
</CodeGroup>

## Structured output

By default the agent's answer is free-form text. Set an `answer_format` (a JSON Schema) on the agent, or pass a Pydantic / Zod schema to the SDKs, and the final answer comes back as typed, validated data instead. See [Structured output](/computer-use-agents/structured-output).

## Listing and filtering

[`GET /api/v2/sessions`](/computer-use-agents/sessions/list) pages through your sessions, newest first, with filters you can combine:

| Filter                               | Type                | Description                                                                        |
| ------------------------------------ | ------------------- | ---------------------------------------------------------------------------------- |
| `status`                             | string (repeatable) | Filter by session status (e.g. `?status=running&status=queued`).                   |
| `agent`                              | string (repeatable) | Filter by agent identifier (e.g. `h/web-surfer-flash`).                            |
| `group_id`                           | string              | Filter by group: useful for multi-session workflows.                               |
| `parent_session_id`                  | string              | Find [child sessions](/computer-use-agents/multi-agent) of a parent.               |
| `schedule_id`                        | string              | Sessions created by a [schedule](/computer-use-agents/schedules/overview)'s fires. |
| `search`                             | string              | Case-insensitive match on the first message or answer.                             |
| `created_before` / `created_after`   | string              | Bound by creation time (ISO 8601).                                                 |
| `finished_before` / `finished_after` | string              | Bound by finish time (ISO 8601).                                                   |
| `owner`                              | string              | Access scope. Default: `me-in-organization`.                                       |

<CodeGroup>
  ```bash cURL theme={null}
  curl "https://agp.eu.hcompany.ai/api/v2/sessions?status=running&agent=web-price-finder" \
    -H "Authorization: Bearer $HAI_API_KEY"
  ```

  ```python Python theme={null}
  page = client.sessions.list_sessions(status=["running"], agent=["web-price-finder"])
  for summary in page.items:
      print(summary.id, summary.status)
  ```

  ```typescript TypeScript theme={null}
  const page = await client.sessions.listSessions({
    status: ["running"],
    agent: ["web-price-finder"],
  });
  for (const summary of page.items) {
    console.log(summary.id, summary.status);
  }
  ```
</CodeGroup>

Like every list endpoint, it returns a page envelope: `items` holds the resources, `page` echoes the page number you asked for, and `total` counts all matches. Responses don't echo `size` back, so track it yourself; there are more pages while `page * size < total`. This endpoint caps `size` at `100` and sorts by `-created_at` (newest first) unless you pass `sort=created_at`. See [List sessions](/computer-use-agents/sessions/list) for the full parameter reference.

## Endpoints

| Method            | Path                                             | Description                                                       |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `POST`            | `/api/v2/sessions`                               | [Create a session](/computer-use-agents/sessions/create)          |
| `GET`             | `/api/v2/sessions`                               | [List sessions](/computer-use-agents/sessions/list)               |
| `GET`             | `/api/v2/sessions/{id}`                          | [Retrieve a session](/computer-use-agents/sessions/retrieve)      |
| `GET`             | `/api/v2/sessions/{id}/status`                   | [Get session status](/computer-use-agents/sessions/status)        |
| `DELETE`          | `/api/v2/sessions/{id}`                          | [Cancel a session](/computer-use-agents/sessions/cancel)          |
| `POST`            | `/api/v2/sessions/{id}/messages`                 | [Send a message](/computer-use-agents/sessions/send-messages)     |
| `POST`            | `/api/v2/sessions/{id}/tool_results`             | [Send tool results](/computer-use-agents/sessions/tool-results)   |
| `POST`            | `/api/v2/sessions/{id}/pause`                    | [Pause a session](/computer-use-agents/sessions/pause)            |
| `POST`            | `/api/v2/sessions/{id}/resume`                   | [Resume a session](/computer-use-agents/sessions/resume)          |
| `POST`            | `/api/v2/sessions/{id}/force_answer`             | [Force final answer](/computer-use-agents/sessions/force-answer)  |
| `GET`             | `/api/v2/sessions/{id}/changes`                  | [Long-poll for changes](/computer-use-agents/sessions/changes)    |
| `GET`             | `/api/v2/sessions/{id}/events`                   | [List events](/computer-use-agents/sessions/events)               |
| `GET`             | `/api/v2/sessions/quota`                         | [Get quota](/computer-use-agents/sessions/quota)                  |
| `POST`            | `/api/v2/sessions/{id}/feedback`                 | [Submit session feedback](/computer-use-agents/sessions/feedback) |
| `POST` / `DELETE` | `/api/v2/sessions/{id}/share`                    | [Share / unshare a session](/computer-use-agents/sessions/share)  |
| `GET`             | `/api/v2/sessions/{id}/resources/{bucket}/{key}` | [Get a session resource](/computer-use-agents/sessions/resources) |
