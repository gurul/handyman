> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Parallelize work with subagents

> Let one manager agent split a task and delegate the pieces to specialist subagents.

export const MultiAgent = () => {
  const chipIcons = {
    env: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
    model: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>,
    skills: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 19.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" /></svg>
  };
  const Chips = () => <div className="flex gap-3">
      {["env", "model", "skills"].map(k => <span key={k} className="flex items-center gap-1 text-[10.5px] text-zinc-400 dark:text-zinc-500">
          {chipIcons[k]}
          {k}
        </span>)}
    </div>;
  const botIcon = <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
  return <div className="not-prose my-6 overflow-x-auto">
      <div className="relative mx-auto" style={{
    width: 720,
    height: 336
  }}>
        <svg className="absolute inset-0 text-zinc-300 dark:text-zinc-600" width="720" height="336" viewBox="0 0 720 336" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M360 44 V96" />
          <path d="M356 49 L360 44 L364 49" />
          <path d="M356 91 L360 96 L364 91" />
          <path d="M360 176 V212" />
          <path d="M110 212 H610" />
          <path d="M110 212 V248" /><path d="M106 243 L110 248 L114 243" />
          <path d="M360 212 V248" /><path d="M356 243 L360 248 L364 243" />
          <path d="M610 212 V248" /><path d="M606 243 L610 248 L614 243" />
        </svg>

        <div className="absolute flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-[13.5px] font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" style={{
    left: 290,
    top: 0,
    width: 140,
    height: 44
  }}>
          <span className="text-zinc-500 dark:text-zinc-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </span>
          <span>User</span>
        </div>

        <div className="absolute rounded-xl border border-transparent bg-zinc-900 p-4 dark:bg-zinc-100" style={{
    left: 260,
    top: 96,
    width: 200
  }}>
          <div className="mb-2.5 flex items-center gap-2 text-[13.5px] font-semibold text-white dark:text-zinc-900">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
            <span>Agent</span>
          </div>
          <Chips />
        </div>

        {[10, 260, 510].map(left => <div key={left} className="absolute rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950" style={{
    left,
    top: 248,
    width: 200
  }}>
            <div className="mb-2.5 flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
              <span className="text-zinc-500 dark:text-zinc-400">{botIcon}</span>
              <span>Subagent</span>
            </div>
            <Chips />
          </div>)}
      </div>
    </div>;
};

<Info>
  Multi-agent is in **preview**. The API and behavior may change before general availability. Feedback is welcome at [support@hcompany.ai](mailto:support@hcompany.ai).
</Info>

<MultiAgent />

Any agent becomes a manager by listing other agents in its [`subagents`](/computer-use-agents/agents/overview#configure-an-agent). At runtime the manager breaks the task into pieces, hands each piece to a subagent, and writes the final answer once it has gathered enough. You launch a manager exactly like any other agent: one [session](/computer-use-agents/sessions/overview), one answer. The fan-out happens behind it.

Each subagent is a full [agent](/computer-use-agents/agents/overview) with its own environment, model, skills, and instructions, and runs as its own [session](/computer-use-agents/sessions/overview), isolated from its siblings. The manager runs them in parallel, so breadth that would be sequential for one agent happens at once.

Multi-agent is especially efficient for parallelizable tasks: researching a question across many sources at once, pairing a fast [text-mode](/computer-use-agents/browser/configuration#modes) searcher with a visual subagent for pages that need real clicks, or having one subagent verify what another found.

## Build a manager

A manager is just an [agent](/computer-use-agents/agents/overview) whose [`subagents`](/computer-use-agents/agents/overview#configure-an-agent) list names other agents. Create the specialists first, then reference them by name from the manager so each stays reusable and independently inspectable (inline objects also work, for one-offs). Here a research manager delegates to a fast text-mode searcher and a visual verifier.

<Steps titleSize="h3">
  <Step id="create-subagents" title="Create the subagents">
    Create a fast [text-mode](/computer-use-agents/browser/configuration#modes) searcher for broad lookups and a visual verifier for pages that need real clicks. Write each `description` as a capability statement ("Use for…"), since the manager routes on it to pick who handles what, the same way an agent [routes on a skill](/computer-use-agents/skills/overview#how-an-agent-uses-a-skill).

    <CodeGroup>
      ```bash cURL theme={null}
      # Fast text-mode searcher
      curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "fast-searcher",
          "description": "Searches the web quickly in text mode. Use for broad lookups and gathering candidate sources.",
          "model": "holo3-1-35b-a3b",
          "environments": [
            {"id": "search-browser", "kind": "web", "mode": {"type": "text"}, "start_url": "https://www.bing.com"}
          ]
        }'

      # Visual verifier
      curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "visual-verifier",
          "description": "Visually inspects a specific page to confirm a fact or read content behind interactions.",
          "environments": ["h/browser"]
        }'
      ```

      ```python Python theme={null}
      from hai_agents import Client

      client = Client()

      client.agents.create_agent(
          name="fast-searcher",
          description=(
              "Searches the web quickly in text mode. Use for broad lookups "
              "and gathering candidate sources."
          ),
          model="holo3-1-35b-a3b",
          environments=[
              {
                  "id": "search-browser",
                  "kind": "web",
                  "mode": {"type": "text"},
                  "start_url": "https://www.bing.com",
              }
          ],
      )

      client.agents.create_agent(
          name="visual-verifier",
          description=(
              "Visually inspects a specific page to confirm a fact or read "
              "content behind interactions."
          ),
          environments=["h/browser"],
      )
      ```

      ```typescript TypeScript theme={null}
      import { HaiAgentsClient } from "hai-agents";

      const client = new HaiAgentsClient();

      await client.agents.createAgent({
        name: "fast-searcher",
        description:
          "Searches the web quickly in text mode. Use for broad lookups and gathering candidate sources.",
        model: "holo3-1-35b-a3b",
        environments: [
          { id: "search-browser", kind: "web", mode: { type: "text" }, startUrl: "https://www.bing.com" },
        ],
      });

      await client.agents.createAgent({
        name: "visual-verifier",
        description:
          "Visually inspects a specific page to confirm a fact or read content behind interactions.",
        environments: ["h/browser"],
      });
      ```
    </CodeGroup>
  </Step>

  <Step id="create-the-manager" title="Create the manager">
    Now create the manager and link the subagents by name. A manager that only delegates can omit `environments`; give it one only if it should also act on a surface itself, as this one does.

    <CodeGroup>
      ```bash cURL theme={null}
      curl -X POST https://agp.eu.hcompany.ai/api/v2/agents \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "research-orchestrator",
          "description": "Researches a question across sources and synthesizes a sourced answer.",
          "environments": ["h/browser"],
          "instructions": "Split the question into independent sub-questions, delegate each, then reconcile the findings into one sourced answer.",
          "subagents": ["fast-searcher", "visual-verifier"]
        }'
      ```

      ```python Python theme={null}
      client.agents.create_agent(
          name="research-orchestrator",
          description="Researches a question across sources and synthesizes a sourced answer.",
          environments=["h/browser"],
          instructions=(
              "Split the question into independent sub-questions, delegate each, "
              "then reconcile the findings into one sourced answer."
          ),
          subagents=["fast-searcher", "visual-verifier"],
      )
      ```

      ```typescript TypeScript theme={null}
      await client.agents.createAgent({
        name: "research-orchestrator",
        description: "Researches a question across sources and synthesizes a sourced answer.",
        environments: ["h/browser"],
        instructions:
          "Split the question into independent sub-questions, delegate each, " +
          "then reconcile the findings into one sourced answer.",
        subagents: ["fast-searcher", "visual-verifier"],
      });
      ```
    </CodeGroup>
  </Step>

  <Step id="run-a-session" title="Run a session">
    Launch a session against the manager exactly like a single agent; the fan-out to subagents happens behind it. Over raw HTTP, create the session and long-poll [`changes`](/computer-use-agents/sessions/changes) until it reaches a terminal state.

    <CodeGroup>
      ```bash CLI theme={null}
      hai run --agent research-orchestrator \
        "Compare the starting price of the latest flagship phone from Apple, Google, and Samsung. Return one line per phone with the price, currency, and the source URL you read it from."
      ```

      ```bash cURL theme={null}
      # Create the session and capture its id
      SESSION_ID=$(curl -sX POST https://agp.eu.hcompany.ai/api/v2/sessions \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "agent": "research-orchestrator",
          "messages": [
            {"type": "user_message", "message": "Compare the starting price of the latest flagship phone from Apple, Google, and Samsung. Return one line per phone with the price, currency, and the source URL you read it from."}
          ]
        }' | jq -r .id)

      # Long-poll until the session reaches a terminal state, then print the answer.
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
          completed|failed|timed_out|interrupted)
            echo "$CHANGES" | jq -r .answer
            break
            ;;
        esac
      done
      ```

      ```python Python theme={null}
      result = client.run_session(
          agent="research-orchestrator",
          messages="Compare the starting price of the latest flagship phone from Apple, Google, and Samsung. Return one line per phone with the price, currency, and the source URL you read it from.",
      )

      print(result.status)  # "completed"
      print(result.answer)
      ```

      ```typescript TypeScript theme={null}
      const result = await client.runSession({
        agent: "research-orchestrator",
        messages:
          "Compare the starting price of the latest flagship phone from Apple, Google, and " +
          "Samsung. Return one line per phone with the price, currency, and the source URL you read it from.",
      });

      console.log(result.status); // "completed"
      console.log(result.answer);
      ```
    </CodeGroup>
  </Step>
</Steps>

## How a run unfolds

The manager spawns subagents as parallel child sessions, waits for their answers, and may spawn follow-ups to fill gaps or verify findings before synthesizing the single final answer your session receives.

## What a subagent sees

A subagent works in isolation and is instructed to finish its task on its own:

* It has no access to the end user. It cannot ask questions or send messages to you; only the manager surfaces anything. Give it a self-contained task.
* The manager receives only the subagent's final answer, not its scrollback or intermediate observations. A good subagent answer carries its own data, source URLs, and caveats.
* It can delegate further. A subagent that lists its own `subagents` becomes a manager for them, nested up to 16 levels deep; a deeper chain or a cycle is rejected with `422`. Keep trees shallow well before that limit, since deep nesting multiplies sessions and cost.

## Observe and control the tree

Each subagent is a real session, so the whole tree is inspectable and steerable:

* The manager's [status](/computer-use-agents/sessions/status) lists its children in `subagent_session_ids`. [Retrieve](/computer-use-agents/sessions/retrieve) or watch any of them like a normal session.
* Filter children by their parent with `GET /sessions?parent_session_id=...`, or tag a whole run with [`group_id`](/computer-use-agents/sessions/create) and list it with `GET /sessions?group_id=...`.
* [Force an answer](/computer-use-agents/sessions/force-answer) on the manager and the signal cascades: in-flight subagents get a short grace window (about 30s) to wrap up, partial results fold into the manager's answer, and anything still unfinished is cancelled. [Cancelling](/computer-use-agents/sessions/cancel) the manager stops its subagents too, without the grace window.
