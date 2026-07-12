> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Create your first agent session in under 5 minutes.

Set up a browser environment, create an agent, run it on a task, and read its answer. All you need is an API key. To skip the setup and just watch a task run, one call to the built-in `h/web-surfer-flash` agent does it (see the [introduction](/computer-use-agents/introduction)).

<Steps titleSize="h3">
  <Step id="install" title="Install the client">
    Install the `hai-agents` client (and CLI). Pick a language below; it applies to every code block on this page.

    <CodeGroup>
      ```bash CLI theme={null}
      pip install "hai-agents[cli]"
      ```

      ```bash cURL theme={null}
      # no install needed, the API is plain HTTP
      ```

      ```bash Python theme={null}
      pip install hai-agents
      ```

      ```bash TypeScript theme={null}
      npm install hai-agents
      ```
    </CodeGroup>
  </Step>

  <Step id="get-your-api-key" title="Get your API key">
    Create a key at [platform.hcompany.ai/settings/api-keys](https://platform.hcompany.ai/settings/api-keys?product=computeruseagents\&source=docs). It's shown only once, so store it securely and keep it server-side. The key is scoped to your **organization**: everything you create with it is private to that org.

    Set it as `HAI_API_KEY` in your environment. Raw HTTP sends it as a bearer token in the `Authorization` header; the CLI and SDKs pick it up automatically.

    <CodeGroup>
      ```bash CLI theme={null}
      hai login            # browser sign-in; creates and stores your key in ~/.config/hai/.env
      ```

      ```bash cURL theme={null}
      export HAI_API_KEY="hk-..."
      ```

      ```python Python theme={null}
      from hai_agents import Client

      client = Client()
      ```

      ```typescript TypeScript theme={null}
      import { HaiAgentsClient } from "hai-agents";

      const client = new HaiAgentsClient();
      ```
    </CodeGroup>
  </Step>

  <Step id="create-an-environment" title="Create an environment">
    An [environment](/computer-use-agents/environments/overview) is what your agent sees and acts on. Register a web browser in [`visual` mode](/computer-use-agents/browser/configuration#modes), where the agent works from screenshots and clicks by coordinates, and give it an `id` the agent will reference.

    <CodeGroup>
      ```bash cURL theme={null}
      curl -X POST https://agp.eu.hcompany.ai/api/v2/environments \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "id": "visual-browser",
          "kind": "web",
          "mode": {"type": "visual", "width": 1200, "height": 1200},
          "start_url": "https://www.google.com/"
        }'
      ```

      ```python Python theme={null}
      client.environments.create_environment(
          id="visual-browser",
          kind="web",
          mode={"type": "visual", "width": 1200, "height": 1200},
          start_url="https://www.google.com/",
      )
      ```

      ```typescript TypeScript theme={null}
      await client.environments.createEnvironment({
        kind: "web",
        id: "visual-browser",
        mode: { type: "visual", width: 1200, height: 1200 },
        startUrl: "https://www.google.com/",
      });
      ```
    </CodeGroup>
  </Step>

  <Step id="create-an-agent" title="Create an agent">
    Create an agent that references the environment by `id`, so you can reuse it across sessions. Agents you create have no prefix; H's pre-built agents and environments use the reserved `h/` namespace (like `h/web-surfer-flash` and `h/browser`). The optional `instructions` shape how the agent behaves on every run:

    <CodeGroup>
      ```bash cURL theme={null}
      curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "web-navigator",
          "description": "Navigates and operates interactive websites to carry out a task end to end.",
          "instructions": "Ground every claim in what you actually see; never invent values you have not observed. Check the page changed as expected after each action, operate the controls a task needs (filters, dropdowns, date pickers), and finish the whole task. If something is blocked or unavailable, say so plainly instead of guessing.",
          "environments": ["visual-browser"]
        }'
      ```

      ```python Python theme={null}
      client.agents.create_agent(
          name="web-navigator",
          description="Navigates and operates interactive websites to carry out a task end to end.",
          instructions=(
              "Ground every claim in what you actually see; never invent values you have not "
              "observed. Check the page changed as expected after each action, operate the "
              "controls a task needs (filters, dropdowns, date pickers), and finish the whole "
              "task. If something is blocked or unavailable, say so plainly instead of guessing."
          ),
          environments=["visual-browser"],
      )
      ```

      ```typescript TypeScript theme={null}
      await client.agents.createAgent({
        name: "web-navigator",
        description: "Navigates and operates interactive websites to carry out a task end to end.",
        instructions:
          "Ground every claim in what you actually see; never invent values you have not " +
          "observed. Check the page changed as expected after each action, operate the " +
          "controls a task needs (filters, dropdowns, date pickers), and finish the whole " +
          "task. If something is blocked or unavailable, say so plainly instead of guessing.",
        environments: ["visual-browser"],
      });
      ```
    </CodeGroup>
  </Step>

  <Step id="run-a-session" title="Run a session">
    Launch a session against `web-navigator` and describe the task in plain language. Google Flights is a good test: its date picker, filters, and result cards only respond to real clicks, so the agent has to drive the page.

    The CLI and SDK calls below create the session and block until the final `answer`. Over raw HTTP there's no single blocking call, so you create the session, long-poll [`changes`](/computer-use-agents/sessions/changes) until it reaches a terminal state, then read the settled answer off the [session snapshot](/computer-use-agents/sessions/retrieve).

    <CodeGroup>
      ```bash CLI theme={null}
      hai run --agent web-navigator \
        "On Google Flights, search a round trip from Paris (CDG) to New York (JFK): set departure to the first Monday of next month and the return one week later using the date picker, filter to nonstop flights, then open the cheapest result. Report the airline, total price, and departure time shown on its details."
      ```

      ```bash cURL theme={null}
      # Create the session and capture its id
      SESSION_ID=$(curl -sX POST https://agp.eu.hcompany.ai/api/v2/sessions \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "agent": "web-navigator",
          "messages": [
            {"type": "user_message", "message": "On Google Flights, search a round trip from Paris (CDG) to New York (JFK): set departure to the first Monday of next month and the return one week later using the date picker, filter to nonstop flights, then open the cheapest result. Report the airline, total price, and departure time shown on its details."}
          ]
        }' | jq -r .id)

      # Long-poll until the session reaches a terminal state.
      # Advance FROM_INDEX each turn so the server waits for *new* changes instead of replaying old ones.
      FROM_INDEX=0
      while true; do
        CHANGES=$(curl -s "https://agp.eu.hcompany.ai/api/v2/sessions/$SESSION_ID/changes?from_index=$FROM_INDEX&wait_for_seconds=25" \
          -H "Authorization: Bearer $HAI_API_KEY")
        [ -z "$CHANGES" ] && continue  # 204 No Content: nothing new yet
        FROM_INDEX=$((FROM_INDEX + $(echo "$CHANGES" | jq '.new_events | length')))
        STATUS=$(echo "$CHANGES" | jq -r .status)
        echo "status: $STATUS"
        case "$STATUS" in
          completed|failed|timed_out|interrupted) break ;;
        esac
      done

      # The answer rides the page carrying the final events, which may trail the
      # status flip; the session snapshot has the settled value.
      curl -s "https://agp.eu.hcompany.ai/api/v2/sessions/$SESSION_ID" \
        -H "Authorization: Bearer $HAI_API_KEY" | jq -r .latest_answer
      ```

      ```python Python theme={null}
      result = client.run_session(
          agent="web-navigator",
          messages="On Google Flights, search a round trip from Paris (CDG) to New York (JFK): set departure to the first Monday of next month and the return one week later using the date picker, filter to nonstop flights, then open the cheapest result. Report the airline, total price, and departure time shown on its details.",
      )

      print(result.status)  # "completed"
      print(result.answer)
      ```

      ```typescript TypeScript theme={null}
      const result = await client.runSession({
        agent: "web-navigator",
        messages:
          "On Google Flights, search a round trip from Paris (CDG) to New York (JFK): set " +
          "departure to the first Monday of next month and the return one week later using " +
          "the date picker, filter to nonstop flights, then open the cheapest result. Report " +
          "the airline, total price, and departure time shown on its details.",
      });

      console.log(result.status); // "completed"
      console.log(result.answer);
      ```
    </CodeGroup>

    Need live progress instead of one blocking call? Poll [`status`](/computer-use-agents/sessions/status) for state and step count, or [long-poll `changes`](/computer-use-agents/sessions/changes) to stream events as they happen.
  </Step>

  <Step id="watch-on-the-platform" title="Watch it on the platform">
    Open the [H Platform](https://platform.hcompany.ai/?product=computeruseagents\&source=docs) to see your sessions: watch a running one step by step, or scrub a finished run to replay the full trajectory. See [Agent View](/computer-use-agents/observe-and-steer) for details.
  </Step>
</Steps>

***

## Next steps

<CardGroup cols={2}>
  <Card title="Agents" icon="robot" href="/computer-use-agents/agents/overview">
    Reusable configurations: built-in agents and how to create your own.
  </Card>

  <Card title="Environments" icon="cube" href="/computer-use-agents/environments/overview">
    The surfaces your agent perceives and acts on. Browser today; more in [What's next](/computer-use-agents/introduction#whats-next).
  </Card>

  <Card title="Skills" icon="screwdriver-wrench" href="/computer-use-agents/skills/overview">
    Reusable instruction fragments you can attach to agents.
  </Card>

  <Card title="Sessions" icon="bolt" href="/computer-use-agents/sessions/overview">
    The session lifecycle and how to interact with a running agent.
  </Card>
</CardGroup>
