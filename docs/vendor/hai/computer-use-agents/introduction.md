> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Computer-Use Agents

> Launch your first computer-use agent.

export const Architecture = () => {
  const partIcons = {
    model: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>,
    instructions: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    skills: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8 19 13" /><path d="M15 9h.01" /><path d="M17.8 6.2 19 5" /><path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" /></svg>,
    subagents: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
  };
  const Part = ({k, label}) => <div className="flex items-center gap-2 text-[12px] text-zinc-400 dark:text-zinc-500">
      {partIcons[k]}
      <span>{label}</span>
    </div>;
  const ArrowRight = () => <svg className="h-4 w-7 text-zinc-400 dark:text-zinc-500" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8h23" /><path d="M19 3l6 5-6 5" /></svg>;
  const ArrowLeft = () => <svg className="h-4 w-7 text-zinc-400 dark:text-zinc-500" viewBox="0 0 28 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M27 8H4" /><path d="M9 3 3 8l6 5" /></svg>;
  return <div className="not-prose my-6 overflow-x-auto">
      <div className="flex min-w-[660px] items-center">
        <div className="w-[150px] shrink-0 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg>
            </span>
            <span>Your code</span>
          </div>
          <div className="mt-1 text-[11.5px] leading-4 text-zinc-400 dark:text-zinc-500">SDK or raw API</div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-3.5 px-3">
          <div className="flex flex-col items-center gap-1">
            <span className="whitespace-nowrap font-mono text-[10.5px] text-zinc-400 dark:text-zinc-500">POST /sessions</span>
            <ArrowRight />
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowLeft />
            <span className="whitespace-nowrap text-[10.5px] text-zinc-400 dark:text-zinc-500">events + answer</span>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">Session</div>
          <div className="flex items-stretch gap-0">
            <div className="flex-1 rounded-xl border border-transparent bg-zinc-900 p-4 dark:bg-zinc-100">
              <div className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-white dark:text-zinc-900">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                <span>Agent</span>
              </div>
              <div className="flex flex-col gap-2">
                <Part k="model" label="model" />
                <Part k="instructions" label="instructions" />
                <Part k="skills" label="skills" />
                <Part k="subagents" label="subagents" />
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-3">
              <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500">acts on</span>
              <ArrowRight />
            </div>

            <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
                <span className="text-zinc-500 dark:text-zinc-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                </span>
                <span>Environment</span>
              </div>
              <div className="mb-3 text-[11.5px] leading-4 text-zinc-400 dark:text-zinc-500">Browser today</div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {["click", "type", "navigate", "fill_secret_at"].map(a => <span key={a} className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10.5px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{a}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

A **computer-use agent** sees the screen and decides what to click, type, and scroll. Use it when the work lives behind a user interface with no API to call.

Computer-Use Agents give you programmatic control over agents built on H's [Holo family of Vision Language Models](https://hcompany.ai/holo3.1). You describe a task in plain language, and H provisions the environment, runs the agent, and returns the result through a [session](/computer-use-agents/sessions/overview) your app can monitor, steer, and stop.

Agents run in a cloud browser today, with more environments on the [roadmap](#whats-next). One call starts a session:

<CodeGroup>
  ```bash CLI theme={null}
  # `hai run` creates the session and blocks until the agent answers
  hai run "On Google Flights, find the cheapest direct flight from Paris (CDG) to Tokyo (NRT) this Saturday. Return the airline and the price." \
    --agent h/web-surfer-flash
  ```

  ```bash cURL theme={null}
  curl -X POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"agent": "h/web-surfer-flash", "messages": [{"type": "user_message", "message": "On Google Flights, find the cheapest direct flight from Paris (CDG) to Tokyo (NRT) this Saturday. Return the airline and the price."}]}'
  ```

  ```python Python theme={null}
  # pip install hai-agents
  from hai_agents import Client

  client = Client()

  result = client.run_session(
      agent="h/web-surfer-flash",
      messages=(
          "On Google Flights, find the cheapest direct flight from Paris (CDG) "
          "to Tokyo (NRT) this Saturday. Return the airline and the price."
      ),
  )
  print(result.answer)
  ```

  ```typescript TypeScript theme={null}
  // npm install hai-agents
  import { HaiAgentsClient } from "hai-agents";

  const client = new HaiAgentsClient();

  const result = await client.runSession({
    agent: "h/web-surfer-flash",
    messages:
      "On Google Flights, find the cheapest direct flight from Paris (CDG) to Tokyo " +
      "(NRT) this Saturday. Return the airline and the price.",
  });
  console.log(result.answer);
  ```
</CodeGroup>

That one call spins up a browser and hands it to the built-in `h/web-surfer-flash` agent. The CLI and SDK forms block until there is an answer; the raw `POST` returns the session immediately, and you follow it through its [lifecycle](/computer-use-agents/sessions/overview#lifecycle). The `h/` prefix marks H's pre-built agents; agents you create have no prefix.

You need an API key first: create one at [platform.hcompany.ai/settings/api-keys](https://platform.hcompany.ai/settings/api-keys?product=computeruseagents\&source=docs) and set it as [`HAI_API_KEY`](/computer-use-agents/quickstart#get-your-api-key) in your environment, or let `hai login` do both.

## How it fits together

<Architecture />

The building blocks, each with a dedicated page:

| Concept                                                   | What it is                                                                                                                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agent](/computer-use-agents/agents/overview)             | A reusable configuration: environments, skills, model, and instructions. Reference a [pre-built agent](/computer-use-agents/agents/overview#pre-built-agents) or create your own. |
| [Environment](/computer-use-agents/environments/overview) | The surface the agent sees and acts on: a cloud browser.                                                                                                                          |
| [Session](/computer-use-agents/sessions/overview)         | A single run of an agent against a task, with a lifecycle you can steer.                                                                                                          |
| [Skill](/computer-use-agents/skills/overview)             | An optional, reusable instruction fragment the agent loads on demand.                                                                                                             |

This API is in beta and still evolving. Send questions or bug reports to [support@hcompany.ai](mailto:support@hcompany.ai).

## Get started

<CardGroup cols={2}>
  <Card title="Quickstart" icon="arrow-right" href="/computer-use-agents/quickstart">
    Create your first agent session in under 5 minutes. Start here.
  </Card>

  <Card title="SDKs" icon="code" href="/computer-use-agents/sdks">
    Install the Python or TypeScript client and skip the polling boilerplate.
  </Card>

  <Card title="Use cases" icon="play" href="/computer-use-agents/sdks#see-it-in-action">
    See it in action: QA a live page from Claude Code, or drive a browser checkout from a plain-language prompt.
  </Card>

  <Card title="Session lifecycle" icon="diagram-project" href="/computer-use-agents/sessions/overview#lifecycle">
    See agent, environment, and session come together at runtime.
  </Card>

  <Card title="Agent View" icon="display" href="/computer-use-agents/observe-and-steer">
    Watch a session live or replay it afterward to debug, monitor, and follow your agents.
  </Card>

  <Card title="Plans and limits" icon="credit-card" href="/computer-use-agents/plans-and-limits">
    Plans, token and concurrency allowances, and how to manage your subscription.
  </Card>
</CardGroup>

## What's next

Two things are coming, with no firm dates while the API is in beta:

* **Remote desktop VMs.** A Mac, Windows, or Linux VM that H provisions in the cloud and the agent drives end to end: file management, native apps, multi-window flows. The same agent and session lifecycle you use for the browser today, on a full desktop. To drive the desktop on your own machine today, see [Local desktop](/computer-use-agents/desktop/local-control).
* **Background local desktop.** [Local desktop](/computer-use-agents/desktop/local-control) drives the screen in front of you today, so the agent shares your mouse and keyboard. Next, it will bind to individual background apps, so a session runs in its own window while you keep using your machine.

Have a request that isn't here? Send it to [support@hcompany.ai](mailto:support@hcompany.ai).
