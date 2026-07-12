> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create an agent

> Create a reusable agent in your own catalog.

Creates a new custom agent in your catalog. Once created, reference it by `name` (e.g. `"agent": "my-research-bot"`) when [creating a session](/computer-use-agents/sessions/create), and its environments, skills, and subagents are pulled from the stored configuration.

**Returns** `201` with the created [Agent](/computer-use-agents/agents/overview) object.

***

## Request body

The body is the [Agent](/computer-use-agents/agents/overview) object. See that page for the full meaning of each field; the constraints that matter when creating one are below.

<ParamField body="name" type="string" required>
  Catalog identifier, kebab-case with an optional single `org/` namespace prefix. The `h/` prefix is reserved for H's catalog (rejected with `403`) and marks the agent as reserved; any other name creates a custom agent, private to your organization. 1 to 127 characters, immutable after creation.
</ParamField>

<ParamField body="description" type="string" required>
  What the agent does. Read by parent agents to decide what to delegate.
</ParamField>

<ParamField body="environments" type="array">
  At most one per kind. Each item is a string catalog id or an inline [Browser environment](/computer-use-agents/browser/configuration) spec. Required unless the agent only delegates to `subagents` (a pure [manager](/computer-use-agents/multi-agent) needs none).
</ParamField>

<ParamField body="model" type="string">
  Holo model that runs the agent. Defaults to `holo3-122b-a10b`; pass any Holo model id (for example `holo3-1-35b-a3b`) listed in the [Models API](/models). Omit to take the default.
</ParamField>

<ParamField body="instructions" type="string">
  Steering text appended to the system prompt.
</ParamField>

<ParamField body="skills" type="array">
  Skills available to the agent, as catalog id strings or inline [Skill](/computer-use-agents/skills/overview) specs.
</ParamField>

<ParamField body="subagents" type="array">
  Agents this one can delegate to, as catalog id strings or inline agent specs.
</ParamField>

<ParamField body="answer_format" type="object">
  A [JSON Schema](https://json-schema.org/) the agent's final answer must conform to. When set, the agent returns [structured output](/computer-use-agents/structured-output) matching the schema instead of free-form text. Omit it for free-form text; callers can also set or override it per run with session [`overrides`](/computer-use-agents/sessions/create).
</ParamField>

<ParamField body="tools" type="array">
  [Custom tools](/computer-use-agents/custom-tools) the agent can call from your own code.
</ParamField>

***

## Examples

<CodeGroup>
  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "my-web-agent",
      "description": "Custom web researcher",
      "environments": [
        {
          "id": "browser",
          "kind": "web",
          "mode": {"type": "visual", "width": 1280, "height": 720},
          "start_url": "https://news.ycombinator.com"
        }
      ]
    }'
  ```

  ```python Python theme={null}
  from hai_agents import Client

  client = Client()

  agent = client.agents.create_agent(
      name="my-web-agent",
      description="Custom web researcher",
      environments=[
          {
              "id": "browser",
              "kind": "web",
              "mode": {"type": "visual", "width": 1280, "height": 720},
              "start_url": "https://news.ycombinator.com",
          }
      ],
  )
  print(agent.name)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const agent = await client.agents.createAgent({
    name: "my-web-agent",
    description: "Custom web researcher",
    environments: [
      {
        id: "browser",
        kind: "web",
        mode: { type: "visual", width: 1280, height: 720 },
        startUrl: "https://news.ycombinator.com",
      },
    ],
  });
  console.log(agent.name);
  ```
</CodeGroup>

```json Response theme={null}
{
  "name": "my-web-agent",
  "description": "Custom web researcher",
  "environments": [
    {
      "id": "browser",
      "kind": "web",
      "mode": {"type": "visual", "width": 1280, "height": 720},
      "start_url": "https://news.ycombinator.com"
    }
  ],
  "model": null,
  "instructions": null,
  "skills": null,
  "subagents": null,
  "answer_format": null
}
```

***

## Errors

| Status | Cause                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `403`  | Attempted to use the reserved `h/` namespace.                                                                                                            |
| `409`  | An agent with this `name` already exists in your catalog.                                                                                                |
| `422`  | Body fails validation; common cases: `environments` empty on an agent that has no `subagents`, a duplicate environment kind, or an invalid `name` shape. |
