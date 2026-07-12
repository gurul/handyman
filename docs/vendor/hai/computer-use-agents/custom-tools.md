> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Give an agent custom tools

> Extend the agent's toolbox with functions from your own code: the agent calls them, the SDK executes them, the run continues with the result.

export const CustomToolLoop = () => {
  const Chip = ({children}) => <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>;
  const ArrowRight = () => <svg className="h-4 w-8 text-zinc-400 dark:text-zinc-500" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8h27" /><path d="M23 3l6 5-6 5" /></svg>;
  const ArrowLeft = () => <svg className="h-4 w-8 text-zinc-400 dark:text-zinc-500" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M31 8H4" /><path d="M9 3 3 8l6 5" /></svg>;
  return <div className="not-prose my-6 overflow-x-auto">
      <div className="flex items-stretch justify-center">
        <div className="flex w-[210px] shrink-0 flex-col rounded-xl border border-transparent bg-zinc-900 p-4 dark:bg-zinc-100">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-white dark:text-zinc-900">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
            <span>Agent</span>
          </div>
          <div className="mt-1 text-[11.5px] leading-4 text-zinc-400 dark:text-zinc-500">running in a session</div>
          <div className="mt-3">
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[10.5px] text-zinc-300 dark:bg-zinc-200 dark:text-zinc-600">awaiting_tool_results</span>
          </div>
          <div className="mt-auto pt-4 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">resumes once every pending call has a result</div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-4 px-3">
          <div className="flex flex-col items-center gap-1">
            <span className="whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">calls a tool</span>
            <Chip>pending_tool_calls</Chip>
            <ArrowRight />
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowLeft />
            <Chip>POST /tool_results</Chip>
            <span className="whitespace-nowrap text-[11px] text-zinc-400 dark:text-zinc-500">echoes tool_req</span>
          </div>
        </div>

        <div className="flex w-[210px] shrink-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg>
            </span>
            <span>Your code</span>
            <span className="text-[11.5px] font-normal text-zinc-400 dark:text-zinc-500">the SDK loop</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["get_order_status()", "issue_refund()"].map(t => <span key={t} className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{t}</span>)}
          </div>
          <div className="mt-auto pt-3 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">match <span className="font-mono text-zinc-500 dark:text-zinc-400">tool_name</span> → run the function locally</div>
        </div>
      </div>
    </div>;
};

<CustomToolLoop />

Every agent works out of a toolbox. Its [environment](/computer-use-agents/environments/overview) supplies the core of it (a browser environment brings navigation, clicking, typing) and the agent layers its own built-in tools on top. Custom tools are the part you add: functions from your own code that complement that toolbox with anything it can't reach on its own, like querying your database, calling an internal API, or looking up a customer record.

Pass a function to the SDK and the agent uses it like any other tool: when it decides to call one mid-run, the SDK executes your function locally and the run continues with the result. The full loop is handled for you.

## With the SDKs

Pass your functions via `tools`; the schema is derived from the signature and docstring in Python, or declared with `tool()` in TypeScript.

<CodeGroup>
  ```python Python theme={null}
  from hai_agents import Client

  def get_order_status(order_id: str) -> str:
      """Look up the status of an order in our system."""
      return db.orders.get(order_id).status

  client = Client()
  result = client.run_session(
      agent="h/web-surfer-flash",
      messages="Check order 4242 and email the customer if it shipped.",
      tools=[get_order_status],
  )
  print(result.answer)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient, tool } from "hai-agents";

  const getOrderStatus = tool({
    name: "get_order_status",
    description: "Look up the status of an order in our system.",
    inputSchema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
    fn: async ({ order_id }) => db.orders.get(order_id).status,
  });

  const client = new HaiAgentsClient();
  const result = await client.runSession({
    agent: "h/web-surfer-flash",
    messages: "Check order 4242 and email the customer if it shipped.",
    tools: [getOrderStatus],
  });
  console.log(result.answer);
  ```
</CodeGroup>

Functions may be sync or async, and exceptions are reported to the agent as tool errors instead of crashing the run.

Tools execute in the process that polls the session, so they only run while your program is waiting on `run_session` / `runSession` (or a handle's `wait_for_completion` / `waitForCompletion` with the same `tools`). Execution is at-least-once: if posting a result fails and the wait is retried, the tool may run again, so prefer idempotent tool functions for side-effecting operations.

## Over the raw API

Without an SDK to run the loop, you declare the tools, watch for the agent to call one, and post the result yourself.

<Steps titleSize="h3">
  <Step id="declare-tools" title="Declare the tools at session create">
    Declare the tools when [creating the session](/computer-use-agents/sessions/create), inline on the agent or via the `agent.tools` override for a registered agent:

    ```json Session create body theme={null}
    {
      "agent": {
        "name": "support-agent",
        "environments": [{ "kind": "web" }],
        "tools": [
          {
            "name": "get_order_status",
            "description": "Look up the status of an order in our system.",
            "input_schema": {
              "type": "object",
              "properties": { "order_id": { "type": "string" } },
              "required": ["order_id"]
            }
          }
        ]
      },
      "messages": "Check order 4242 and email the customer if it shipped."
    }
    ```
  </Step>

  <Step id="detect-call" title="Detect the pending call">
    Long-poll [`changes`](/computer-use-agents/sessions/changes) for an `ActiveStateChangeEvent` whose `data.state` is `"awaiting_tool_results"`. Its `data.pending_tool_calls` lists each pending call as a `{ tool_name, args, id }` object:

    ```json Pending tool call event theme={null}
    {
      "type": "ActiveStateChangeEvent",
      "data": {
        "state": "awaiting_tool_results",
        "pending_tool_calls": [
          { "tool_name": "get_order_status", "args": { "order_id": "4242" }, "id": "call_1" }
        ]
      },
      "timestamp": "2026-06-01T15:14:05Z"
    }
    ```
  </Step>

  <Step id="post-result" title="Post the result">
    Execute the call and [post the result](/computer-use-agents/sessions/tool-results), echoing the pending call back as `tool_req`:

    ```bash theme={null}
    curl -X POST "https://agp.eu.hcompany.ai/api/v2/sessions/$SESSION_ID/tool_results" \
      -H "Authorization: Bearer $HAI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"kind": "tool_result", "tool_req": {"tool_name": "get_order_status", "args": {"order_id": "4242"}, "id": "call_1"}, "result": "shipped"}'
    ```

    Send several at once with `{"type": "batch", "results": [...]}`. Report a failure as an `error_event` instead of a `tool_result`; it carries `error`, `origin` (both required), and the echoed `tool_req`:

    ```json Tool error report theme={null}
    { "kind": "error_event", "error": "Order not found", "origin": "custom_tools", "tool_req": { "tool_name": "get_order_status", "args": { "order_id": "4242" }, "id": "call_1" } }
    ```

    The agent resumes once every pending call has a result; calls still unresolved when the run ends (for example on `max_time_s`) fail with a model-visible error. Posting to a finished session returns `409`.
  </Step>
</Steps>
