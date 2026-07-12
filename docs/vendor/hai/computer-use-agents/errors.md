> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Handle API errors

> How Computer-Use Agents report errors, and what to do about them.

The API uses standard HTTP status codes and a consistent error envelope. When something goes wrong, the response body always has the same shape, so your error-handling code works for every endpoint.

This page covers HTTP-level errors: the request itself was rejected or hit a server fault. A session that was accepted but ended `failed` or `timed_out` reports why through its `error_code`; see [Read how the run ended](/computer-use-agents/observe-and-steer#read-how-the-run-ended).

## Error object

Every error response carries the same envelope: a `message` that summarizes what went wrong, and a `detail` array with one entry per problem:

```json Error envelope theme={null}
{
  "message": "Session not found.",
  "detail": [
    { "type": "not_found", "message": "Session not found." }
  ]
}
```

For validation errors (422), each `detail` entry keeps the failing field's path and reason, and `message` flattens them into a single line:

```json Validation error (422) theme={null}
{
  "message": "agent: Field required",
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "agent"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

Read `message` when you just need something to log or display; reach into `detail` when you need per-field specifics. Requests rejected before they reach the API (for example a missing or invalid key, `401`) may carry only a `message`.

***

## HTTP status codes

### Success codes

| Code             | Meaning                                     | Used by                                    |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| `200 OK`         | Request succeeded.                          | GET endpoints, updates.                    |
| `201 Created`    | Resource created.                           | POST /sessions, POST /agents.              |
| `202 Accepted`   | Action accepted, processing asynchronously. | POST /messages, POST /pause, POST /resume. |
| `204 No Content` | Action succeeded, no response body.         | DELETE /sessions, DELETE /agents.          |

### Client error codes

| Code                       | Meaning                                                                                                                                    | Common cause                                                                                                                  | What to do                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`          | Malformed request or invalid parameters.                                                                                                   | Sending an event to a session that can't accept it.                                                                           | Check the request body against the endpoint docs.                                                                                                                                                     |
| `401 Unauthorized`         | Missing or invalid API key.                                                                                                                | No `Authorization` header, or expired key.                                                                                    | Verify your API key is correct and properly formatted.                                                                                                                                                |
| `402 Payment Required`     | Monthly token budget exhausted.                                                                                                            | Creating (or restarting) a session after your organization consumed its plan's tokens.                                        | The `detail` entry carries `limit`, `used`, and `window_end`; wait for the window to reset or upgrade your plan. See [Plans and limits](/computer-use-agents/plans-and-limits#token-usage).           |
| `403 Forbidden`            | Valid credentials, insufficient permissions.                                                                                               | Trying to modify a reserved `h/` agent.                                                                                       | Check that your role allows this operation.                                                                                                                                                           |
| `404 Not Found`            | Resource doesn't exist or isn't visible to you.                                                                                            | Wrong session ID, or querying another team's resource.                                                                        | Verify the ID and that you have access.                                                                                                                                                               |
| `409 Conflict`             | Resource already exists, or an identical idempotent request is still in flight.                                                            | Creating an agent with a duplicate name, or retrying a request with the same `Idempotency-Key` before the first one finished. | Use a unique identifier, fetch the existing resource, or wait for the in-flight request to complete.                                                                                                  |
| `422 Unprocessable Entity` | Request body fails validation.                                                                                                             | Missing required fields, wrong types.                                                                                         | Check the `detail` array for specific field errors.                                                                                                                                                   |
| `429 Too Many Requests`    | Concurrency limit exceeded with [queueing](/computer-use-agents/observe-and-steer#queued-sessions) declined, or the session queue is full. | Too many sessions running simultaneously.                                                                                     | Leave `queue` at its default to queue instead, wait for running sessions to complete, or request a quota increase. See [Plans and limits](/computer-use-agents/plans-and-limits#concurrent-sessions). |

### Server error codes

| Code                      | Meaning                           | What to do                                |
| ------------------------- | --------------------------------- | ----------------------------------------- |
| `502 Bad Gateway`         | Upstream service error.           | Retry after a brief pause.                |
| `503 Service Unavailable` | Temporary capacity issue.         | Check the `Retry-After` header and retry. |
| `504 Gateway Timeout`     | Request took too long to process. | Retry the request.                        |

***

## Handling errors with the SDK

The SDKs raise a typed error on any non-2xx response (carrying the `status_code` / `statusCode` and parsed `body`) and return the parsed model on success, so you never narrow a `data | error` union by hand:

<CodeGroup>
  ```python Python theme={null}
  from hai_agents import Client
  from hai_agents.core import ApiError

  client = Client()

  try:
      session = client.sessions.create_session(
          agent="h/web-surfer-flash",
          messages=[{"type": "user_message", "message": "Top 3 stories on Hacker News?"}],
      )
  except ApiError as err:
      print(err.status_code, err.body)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient, HaiAgentsError } from "hai-agents";

  const client = new HaiAgentsClient();

  try {
    const session = await client.sessions.createSession({
      body: {
        agent: "h/web-surfer-flash",
        messages: [{ type: "user_message", message: "Top 3 stories on Hacker News?" }],
      },
    });
  } catch (err) {
    if (err instanceof HaiAgentsError) {
      console.error(err.statusCode, err.body);
    }
  }
  ```
</CodeGroup>

The SDKs also retry transient errors (`408`, `429`, and all `5xx`) with backoff automatically, twice by default. Tune it with `max_retries` (Python) / `maxRetries` (TypeScript) on the client, or per call via request options. Calling the API directly? Retry those same codes with backoff, honoring `Retry-After` when present. Over-quota session creates don't need retry logic at all: they [queue](/computer-use-agents/observe-and-steer#queued-sessions) by default and start on their own as slots free up.

Do not retry `400`, `401`, `402`, `403`, `404`, or `422` errors: they signal a problem with the request itself, and the same request will fail the same way. Fix the request instead.
