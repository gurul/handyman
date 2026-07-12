> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Plans and limits

> Plans, token and concurrency allowances, and how to manage your subscription.

Your organization runs on a **plan** that sets two allowances: how many **tokens** you can use per billing period, and how many **sessions** you can run at the same time. Usage is tracked per organization, both allowances are readable from the API at any time, and there are no request-rate limits.

## Plans

|                           | **Free**                             | **Developer**                                |
| ------------------------- | ------------------------------------ | -------------------------------------------- |
| Price                     | \$0                                  | \$29 / month                                 |
| Tokens per billing period | 15,000,000                           | 65,000,000                                   |
| Concurrent sessions       | 3                                    | 10                                           |
| Resets                    | Monthly, on your signup day-of-month | Monthly, on your subscription's billing date |

Token and concurrency allowances are subject to change, so read the live values from the API (below) rather than hard-coding the numbers in your integration.

## Token usage

Tokens are consumed by the model as your agents run, and they accrue against your plan's per-period allowance. When the allowance runs out, creating a session (or messaging a finished one, which restarts it) fails with `402 Payment Required`. The error's `detail` carries your `limit`, `used`, and the `window_end` when the budget resets; see [Errors](/computer-use-agents/errors).

Check your current token usage with `GET /api/v2/quota/tokens`:

<CodeGroup>
  ```bash cURL theme={null}
  curl https://agp.eu.hcompany.ai/api/v2/quota/tokens \
    -H "Authorization: Bearer $HAI_API_KEY"
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  tokens = client.quota.get_token_quota()
  print(tokens.remaining)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const tokens = await client.quota.getTokenQuota();
  console.log(tokens.remaining);
  ```
</CodeGroup>

```json Response theme={null}
{
  "limit": 15000000,
  "used": 4200000,
  "remaining": 10800000,
  "window_start": "2026-06-01T00:00:00Z",
  "window_end": "2026-07-01T00:00:00Z"
}
```

| Field          | Type            | Description                                                                            |
| -------------- | --------------- | -------------------------------------------------------------------------------------- |
| `limit`        | integer \| null | Tokens allowed this period. `null` means unlimited.                                    |
| `used`         | integer \| null | Tokens used so far this period. `null` if the usage figure is momentarily unavailable. |
| `remaining`    | integer \| null | Tokens left (`max(limit - used, 0)`).                                                  |
| `window_start` | string          | Start of the current billing period (UTC).                                             |
| `window_end`   | string \| null  | End of the current billing period (UTC).                                               |

## Concurrent sessions

Separately from tokens, your plan caps how many sessions can run at once. A session holds a slot while it is in a non-terminal state (`pending`, `running`, `awaiting_tool_results`, `paused`, or `idle`) and frees it as soon as it reaches a terminal state, including when you [cancel](/computer-use-agents/sessions/cancel) it. [`queued`](/computer-use-agents/observe-and-steer#queued-sessions) sessions hold no slot and never count against your quota.

`GET /api/v2/sessions/quota` returns your current concurrency usage:

<CodeGroup>
  ```bash cURL theme={null}
  curl https://agp.eu.hcompany.ai/api/v2/sessions/quota \
    -H "Authorization: Bearer $HAI_API_KEY"
  ```

  ```python Python theme={null}
  quota = client.sessions.get_session_quota()
  print(quota.available)
  ```

  ```typescript TypeScript theme={null}
  const quota = await client.sessions.getSessionQuota();
  console.log(quota.available);
  ```
</CodeGroup>

```json Response theme={null}
{
  "scope": "user",
  "limit": 10,
  "active": 3,
  "available": 7
}
```

See [Get quota](/computer-use-agents/sessions/quota) for the field-by-field reference.

Creating a session while at your limit doesn't fail: the create is accepted with status [`queued`](/computer-use-agents/observe-and-steer#queued-sessions) and the session starts automatically when a slot frees up. If you prefer an immediate error, set [`queue: false`](/computer-use-agents/sessions/create) on the create body to get a `429 Too Many Requests` instead; the SDKs retry `429` with backoff automatically, see [Errors](/computer-use-agents/errors#handling-errors-with-the-sdk).

## Managing your subscription

Start a Developer subscription from the billing page in the [platform dashboard](https://platform.hcompany.ai/settings/billing?product=computeruseagents\&plan=developer\&source=docs); checkout is card-only. Manage your card and download invoices through the Stripe billing portal, linked from the same page. Cancelling stops the renewal: your Developer allowances stay active until the end of the current billing period, after which the organization reverts to the Free plan.

## Need higher limits?

For higher token or concurrency allowances, or an Enterprise plan, contact us at [support@hcompany.ai](mailto:support@hcompany.ai).
