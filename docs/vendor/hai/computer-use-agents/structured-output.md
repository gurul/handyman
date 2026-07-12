> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Get typed answers

> Get the agent's final answer as typed, schema-validated data instead of free-form text.

export const StructuredOutput = () => {
  const Chip = ({children}) => <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>;
  const ArrowRight = ({label, mono}) => <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-3">
      {label ? <span className={`whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400 ${mono ? "font-mono" : ""}`}>{label}</span> : null}
      <svg className="h-4 w-8 text-zinc-400 dark:text-zinc-500" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8h27" /><path d="M23 3l6 5-6 5" /></svg>
    </div>;
  return <div className="not-prose my-6 overflow-x-auto">
      <div className="flex items-stretch justify-center">
        <div className="flex w-[240px] shrink-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12.5 8 15l2 2.5" /><path d="m14 12.5 2 2.5-2 2.5" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /></svg>
            </span>
            <span>Your schema</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip>Pydantic</Chip>
            <Chip>Zod</Chip>
            <Chip>JSON Schema</Chip>
          </div>
          <div className="mt-auto pt-3 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">the shape the answer must take</div>
        </div>

        <ArrowRight label="answer_format" mono />

        <div className="flex w-[240px] shrink-0 flex-col rounded-xl border border-transparent bg-zinc-900 p-4 dark:bg-zinc-100">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-white dark:text-zinc-900">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
            <span>Agent</span>
          </div>
          <div className="mt-1 text-[11.5px] leading-4 text-zinc-400 dark:text-zinc-500">works, then answers in that shape</div>
          <div className="mt-auto pt-3 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">non-conforming answers are rejected and retried</div>
        </div>

        <ArrowRight label="validated answer" />

        <div className="flex w-[240px] shrink-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 dark:text-zinc-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg>
            </span>
            <span>Your code</span>
          </div>
          <div className="mt-3">
            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">result.answer</span>
          </div>
          <div className="mt-auto pt-3 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">a typed instance, not a string to parse</div>
        </div>
      </div>
    </div>;
};

<StructuredOutput />

By default the agent's answer is free-form text. Set an [`answer_format`](/computer-use-agents/agents/overview) (a JSON Schema) on the agent and it returns data that conforms to it: the `answer` you read from [`changes`](/computer-use-agents/sessions/changes) is then a JSON object instead of a string. Define it inline on a custom agent, or ask a catalog agent for it on a single run with [`overrides`](/computer-use-agents/sessions/overview#overrides).

The SDKs go further: pass a [Pydantic](https://docs.pydantic.dev) model (Python) or [Zod v4](https://zod.dev) schema (TypeScript) as `answer_schema` / `answerSchema` and the SDK derives the JSON Schema for you, then parses the final answer back into a validated, typed instance. A `completed` session whose answer is missing or doesn't match the schema raises `AnswerValidationError` with the raw payload attached; the raw wire value always stays on the result's `final_changes` / `finalChanges`, next to the parsed answer.

The schema and an `agent.answer_format` override are two ways to set the same field, so passing both is rejected. Runs that end without reaching `completed`, such as an `idle` session that hasn't answered yet or a failed one, skip validation: the answer passes through as-is, and is `None` / `undefined` when absent.

<CodeGroup>
  ```bash CLI theme={null}
  # `hai run` prints the structured answer once it lands
  hai run "Top 3 stories on Hacker News right now?" \
    --agent h/web-surfer-flash \
    --override 'agent.answer_format={"type":"object","properties":{"stories":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"url":{"type":"string"}},"required":["title","url"]}}},"required":["stories"]}'
  ```

  ```bash cURL theme={null}
  # Launch with a schema...
  SESSION=$(curl -sX POST https://agp.eu.hcompany.ai/api/v2/sessions \
    -H "Authorization: Bearer $HAI_API_KEY" -H "Content-Type: application/json" \
    -d '{
      "agent": "h/web-surfer-flash",
      "messages": [{"type": "user_message", "message": "Top 3 stories on Hacker News right now?"}],
      "overrides": {
        "agent.answer_format": {
          "type": "object",
          "properties": {
            "stories": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {"title": {"type": "string"}, "url": {"type": "string"}},
                "required": ["title", "url"]
              }
            }
          },
          "required": ["stories"]
        }
      }
    }' | jq -r .id)

  # ...then read the structured answer once it lands.
  curl -s "https://agp.eu.hcompany.ai/api/v2/sessions/$SESSION/changes" \
    -H "Authorization: Bearer $HAI_API_KEY" | jq .answer
  ```

  ```python Python theme={null}
  from pydantic import BaseModel
  from hai_agents import Client

  class Story(BaseModel):
      title: str
      url: str

  class Stories(BaseModel):
      stories: list[Story]

  client = Client()
  result = client.run_session(
      agent="h/web-surfer-flash",
      messages="Top 3 stories on Hacker News right now?",
      answer_schema=Stories,
  )

  for story in result.answer.stories:  # result.answer is a Stories instance
      print(story.title, story.url)
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";
  import { z } from "zod";

  const Stories = z.object({
    stories: z.array(z.object({ title: z.string(), url: z.string() })),
  });

  const client = new HaiAgentsClient();
  const result = await client.runSession({
    agent: "h/web-surfer-flash",
    messages: "Top 3 stories on Hacker News right now?",
    answerSchema: Stories,
  });

  for (const story of result.answer?.stories ?? []) {
    console.log(story.title, story.url); // typed via z.infer
  }
  ```
</CodeGroup>

## Chaining agents

With a typed answer, an agent behaves like any other function: call it, get data back, build on it. Here one agent gathers sources and others read them in parallel:

<CodeGroup>
  ```python Python theme={null}
  import asyncio
  from pydantic import BaseModel
  from hai_agents import AsyncClient

  class Source(BaseModel):
      title: str
      url: str
      excerpt: str

  class Sources(BaseModel):
      sources: list[Source]

  class Brief(BaseModel):
      url: str
      summary: str
      key_facts: list[str]

  async def main() -> None:
      client = AsyncClient()

      scout = await client.run_session(
          agent="h/web-surfer-flash",
          messages="Find the 5 highest-value sources on EU AI Act enforcement",
          answer_schema=Sources,
      )

      readers = await asyncio.gather(*(
          client.run_session(
              agent="h/web-surfer-flash",
              messages=f"Read this source and extract the key facts: {source.url}",
              overrides={"agent.environments[kind=web].start_url": source.url},
              answer_schema=Brief,
          )
          for source in scout.answer.sources
      ))

      for reader in readers:
          print(reader.answer.url, reader.answer.key_facts)

  asyncio.run(main())
  ```

  ```typescript TypeScript theme={null}
  import { HaiAgentsClient } from "hai-agents";
  import { z } from "zod";

  const Sources = z.object({
    sources: z.array(z.object({ title: z.string(), url: z.string(), excerpt: z.string() })),
  });

  const Brief = z.object({
    url: z.string(),
    summary: z.string(),
    keyFacts: z.array(z.string()),
  });

  const client = new HaiAgentsClient();

  const scout = await client.runSession({
    agent: "h/web-surfer-flash",
    messages: "Find the 5 highest-value sources on EU AI Act enforcement",
    answerSchema: Sources,
  });

  const readers = await Promise.all(
    (scout.answer?.sources ?? []).map((source) =>
      client.runSession({
        agent: "h/web-surfer-flash",
        messages: `Read this source and extract the key facts: ${source.url}`,
        overrides: { "agent.environments[kind=web].start_url": source.url },
        answerSchema: Brief,
      }),
    ),
  );

  for (const reader of readers) {
    console.log(reader.answer?.url, reader.answer?.keyFacts);
  }
  ```
</CodeGroup>

Parallel sessions count against your [concurrency quota](/computer-use-agents/sessions/quota).
