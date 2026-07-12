> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Build with coding assistants

> Install the hai-agents skill so Claude Code, Cursor, and other assistants know the H APIs and help you build use cases.

<Frame caption="The /hai-agents skill writes and runs a TypeScript availability check from one prompt">
  <video controls playsInline className="w-full aspect-video rounded-xl" src="https://mintcdn.com/hcompany/NKXrpCWEaWVdSeM0/videos/product-availability.mp4?fit=max&auto=format&n=NKXrpCWEaWVdSeM0&q=85&s=bc45e6aa6ccdace16861b5199d021584" data-path="videos/product-availability.mp4" />
</Frame>

The `hai-agents` skill teaches your coding assistant H's APIs, so instead of guessing at endpoints it scaffolds working sessions, agents, and environments from a plain-language prompt.

The same `SKILL.md` works in Claude Code, Cursor, and Hermes; only the install step differs. It ships from the [`hcompai/computer-use-agents-demos`](https://github.com/hcompai/computer-use-agents-demos) repo, which also publishes it as a Claude Code plugin (marketplace `hai-skills`).

<Card title="hcompai/computer-use-agents-demos/skills/hai-agents" icon="github" horizontal href="https://github.com/hcompai/computer-use-agents-demos/tree/main/skills/hai-agents">
  The skill's source on GitHub: `SKILL.md` plus the reference docs Claude loads. Start here.
</Card>

## What your assistant learns

Once active, `hai-agents` gives your assistant grounded knowledge of:

| Area               | Coverage                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Portal**         | Auth, organizations, invitations, billing, and API-key management, including an automated login script that writes your key into `.env`. |
| **Agent platform** | Sessions, agents, skills, environments, vaults, and `/changes` long-polling, the building blocks in this guide.                          |
| **SDKs**           | The `hai-agents` Python and TypeScript clients: `run_session` / `runSession`, session handles, events, and error classes.                |
| **Agent View**     | The run-replay workflow for reviewing and sharing what an agent did.                                                                     |

The skill triggers automatically when your conversation matches its description: asking about H sessions or `hk-...` keys pulls it in without you naming it.

## Install

<Tabs>
  <Tab title="Claude Code">
    Register the marketplace, then install the skill in any Claude Code session:

    ```bash theme={null}
    /plugin marketplace add hcompai/computer-use-agents-demos
    /plugin install hai-agents@hai-skills
    ```

    `/plugin` is a built-in Claude Code command that opens an interactive menu. Type it directly in your prompt. The marketplace must be added first, otherwise `hai-skills` is unknown.
  </Tab>

  <Tab title="Cursor">
    Cursor (2.4+) reads skills from `.cursor/skills/` in your project. Copy the skill folder in, then reload the window:

    ```bash theme={null}
    git clone https://github.com/hcompai/computer-use-agents-demos
    mkdir -p .cursor/skills
    cp -r computer-use-agents-demos/skills/hai-agents .cursor/skills/hai-agents
    ```

    Then **Cmd/Ctrl+Shift+P → "Developer: Reload Window"**. The skill activates automatically when a request matches its description.
  </Tab>

  <Tab title="Hermes">
    Hermes reads agentskills.io skills from `~/.hermes/skills/`. Copy the skill folder in, then restart Hermes:

    ```bash theme={null}
    git clone https://github.com/hcompai/computer-use-agents-demos
    mkdir -p ~/.hermes/skills
    cp -r computer-use-agents-demos/skills/hai-agents ~/.hermes/skills/hai-agents
    ```

    Hermes re-scans `~/.hermes/skills/` on startup. The skill activates automatically when a request matches its description.
  </Tab>
</Tabs>

## Build a use case

With the skill installed, describe the workflow you want in plain language and let your assistant scaffold it against the live APIs. In Claude Code you can invoke the plugin's slash command directly (in Cursor or Hermes, a plain prompt triggers the skill the same way):

> *❯ /hai-agents:hai-agents "Add one iPhone 17 Pro to my Amazon.com cart"*

Because the skill knows the session lifecycle, region defaults, and SDK surface, the code it produces uses the right endpoints and helpers instead of hand-rolled HTTP.

It scaffolds TypeScript or Python. The video at the top of this page shows it building a TypeScript availability check from a single prompt:

> *❯ /hai-agents:hai-agents "Generate TypeScript code that navigates to jacquemus.com, finds the France × Nike football jersey, and checks its availability in sizes S and XXL."*

Generated code: [`examples/product_availability/src/index.ts`](https://github.com/hcompai/computer-use-agents-demos/blob/main/examples/product_availability/src/index.ts)

## Next steps

<CardGroup cols={2}>
  <Card title="Quickstart" icon="arrow-right" href="/computer-use-agents/quickstart">
    Run your first session end to end in under 5 minutes.
  </Card>

  <Card title="SDKs" icon="code" href="/computer-use-agents/sdks">
    The typed Python and TypeScript clients and CLI the skill builds on.
  </Card>

  <Card title="Skills" icon="screwdriver-wrench" href="/computer-use-agents/skills/overview">
    Reusable instruction fragments you attach to a running agent.
  </Card>

  <Card title="Demos repo" icon="github" href="https://github.com/hcompai/computer-use-agents-demos">
    More recipes: QA via CLI, schema-driven extraction, counterfeit detection.
  </Card>
</CardGroup>
