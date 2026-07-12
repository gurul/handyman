> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Build with the SDKs

> Typed Python and TypeScript clients, plus the CLI.

<Frame caption="A plain-language prompt driving a browser agent from Python (add_to_cart.py)">
  <video controls playsInline className="w-full aspect-video rounded-xl" src="https://mintcdn.com/hcompany/NKXrpCWEaWVdSeM0/videos/add-to-cart.mp4?fit=max&auto=format&n=NKXrpCWEaWVdSeM0&q=85&s=ee4bb16ed0f1b4765589a1c89e5dbad0" data-path="videos/add-to-cart.mp4" />
</Frame>

Call the API directly over HTTP, use a typed client, or connect any [MCP host](/computer-use-agents/mcp). The clients and CLI ship as `hai-agents`.

<CardGroup cols={2}>
  <Card title="Python" icon="python" href="https://pypi.org/project/hai-agents/">
    Sync and async clients, typed with Pydantic v2.
  </Card>

  <Card title="TypeScript" icon="js" href="https://www.npmjs.com/package/hai-agents">
    A fully typed client for sessions, agents, skills, environments, schedules, and webhooks.
  </Card>
</CardGroup>

## Install

<CodeGroup>
  ```bash CLI theme={null}
  pip install "hai-agents[cli]"
  ```

  ```bash Python theme={null}
  pip install hai-agents
  ```

  ```bash TypeScript theme={null}
  npm install hai-agents
  ```
</CodeGroup>

## Authenticate

Set `HAI_API_KEY` in your environment, or pass the key explicitly; either way the client attaches it to every call as a bearer token. If you don't have a key yet, [create one](/computer-use-agents/quickstart#get-your-api-key) first.

<CodeGroup>
  ```bash CLI theme={null}
  hai login   # browser sign-in; stores the key in ~/.config/hai/.env
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()
  # or pass it explicitly: Client(api_key="hk-...")
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();
  // or pass it explicitly: new HaiAgentsClient({ apiKey: "hk-..." })
  ```
</CodeGroup>

The [API reference](/computer-use-agents/sessions/create) playground runs in your browser and shows raw HTTP, handy for exploring the wire format. Use the SDK snippets here and in the [Quickstart](/computer-use-agents/quickstart) for code you'd ship.

## Region

H runs isolated EU and US regions. Requests stay in-region, so an EU key only ever reaches EU infrastructure (data residency). The REST API lives under `/api/v2` and the [MCP server](/computer-use-agents/mcp) under `/mcp` on each region's host:

| Region       | Host                         |
| ------------ | ---------------------------- |
| EU (default) | `https://agp.eu.hcompany.ai` |
| US           | `https://agp.hcompany.ai`    |

The clients default to the EU host. To target another region, pass it explicitly:

<CodeGroup>
  ```python Python theme={null}
  from hai_agents import Client, HaiAgentsEnvironment

  client = Client(environment=HaiAgentsEnvironment.US)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient, HaiAgentsEnvironment } from "hai-agents";

  const client = new HaiAgentsClient({ environment: HaiAgentsEnvironment.Us });
  ```
</CodeGroup>

## Examples

The [`hcompai/computer-use-agents-demos`](https://github.com/hcompai/computer-use-agents-demos) repo collects recipes for the `hai-agents` SDK. Each one runs on its own and is wired up as an MCP server, a CLI tool, or both, so you can call the agents from Claude Code, Cursor, Codex, or Hermes.

| Example                                                                                                                  | What it shows                                                                                                                                                      | Interface                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| [`qa/mcp`](https://github.com/hcompai/computer-use-agents-demos/tree/main/examples/qa/mcp)                               | An autonomous browser agent QAs a remote URL and returns a structured `{verdict, summary, findings}`                                                               | MCP server (`review_web_ui`, `visual_check`)    |
| [`qa/cli`](https://github.com/hcompai/computer-use-agents-demos/tree/main/examples/qa/cli)                               | The same QA agent exposed as a shell command, surfaced to Claude Code via the `hai-qa-via-cli` skill                                                               | CLI (`qa-cli review / visual`)                  |
| [`extract_anything`](https://github.com/hcompai/computer-use-agents-demos/tree/main/examples/extract_anything)           | Wrap an agent call as a typed function: a generic `extract(url, task, schema)` or curated `get_*` tools                                                            | MCP server (`extract`) + CLI (`extract-cli`)    |
| [`counterfeit_detection`](https://github.com/hcompai/computer-use-agents-demos/tree/main/examples/counterfeit_detection) | A custom-tools cookbook in three stages: bare `run_session`, then local screenshot-compare tools, then a `max_steps` / `max_time_s` budget for an exhaustive sweep | CLI (`counterfeit-cli simple / tooled / sweep`) |

### See it in action

QA a live page from Claude Code: *"Use `review_web_ui` to check the top story link works and the page has reasonable accessibility."*

<Frame caption="Autonomous QA of a web page via the review_web_ui MCP tool">
  <video controls playsInline className="w-full aspect-video rounded-xl" src="https://mintcdn.com/hcompany/NKXrpCWEaWVdSeM0/videos/qa-review-web-ui.mp4?fit=max&auto=format&n=NKXrpCWEaWVdSeM0&q=85&s=2f31220a7f6ed272f878341a8c394545" data-path="videos/qa-review-web-ui.mp4" />
</Frame>

The video at the top of this page drives the agent straight from a natural-language prompt in Python: *"Search for 'Random Access Memories' by Daft Punk, add it to the shopping cart."* Runnable code: [`examples/add_to_cart/add_to_cart.py`](https://github.com/hcompai/computer-use-agents-demos/blob/main/examples/add_to_cart/add_to_cart.py)

## Next steps

<CardGroup cols={2}>
  <Card title="MCP server" icon="plug" href="/computer-use-agents/mcp">
    Run and manage agents from Cursor, Claude Code, Codex, Hermes, and more, with no SDK code.
  </Card>

  <Card title="Coding assistants" icon="screwdriver-wrench" href="/computer-use-agents/coding-skills">
    Install the `hai-agents` skill so Claude Code, Cursor, and other assistants know the H APIs and scaffold use cases for you.
  </Card>

  <Card title="Quickstart" icon="arrow-right" href="/computer-use-agents/quickstart">
    Run your first session end to end in under 5 minutes.
  </Card>

  <Card title="Agents" icon="robot" href="/computer-use-agents/agents/overview">
    Reusable configurations: pre-built agents and how to create your own.
  </Card>
</CardGroup>
