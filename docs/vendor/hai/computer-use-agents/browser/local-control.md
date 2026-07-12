> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Run the agent in your own browser

> Let an agent drive Chrome on your own machine.

With local browser control, the agent drives Chrome on **your own machine** instead of a browser H hosts in the cloud, keeping the same [`agent`](/computer-use-agents/agents/overview) and [`session`](/computer-use-agents/sessions/overview) lifecycle you already use. Run a session that uses a local browser from the [`hai-agents`](/computer-use-agents/sdks) Python SDK (the only SDK with local control today) and it launches Chrome and connects it to H for you.

Use it when the work has to happen where you are: a site you are signed in to on your machine, or anything behind your local network that a cloud browser cannot reach.

<Warning>
  The agent acts in a real Chrome on your machine: it can browse, run page scripts, and read that browser's cookies and storage. Stop a run at any time by [cancelling the session](/computer-use-agents/sessions/overview#lifecycle): `hai sessions cancel <session-id>`.
</Warning>

## How it works

A local browser is a normal [browser environment](/computer-use-agents/browser/configuration) with its `host` set to `user_device`. When a session starts with one, the SDK opens a connection inside your Python process. The connection receives the agent's actions and carries them out in the Chrome it controls, and it is what ties this particular session to this particular machine. Everything else is unchanged: [observe and steer](/computer-use-agents/observe-and-steer) the run and read its answer just as you would a remote one.

A Python process drives one local browser at a time. Starting a new session that uses the local browser while an earlier one is still running hands the browser to the new session and cancels the earlier one.

Because it drives your machine, a local browser skips the cloud-provisioning fields: [vaults](/computer-use-agents/vaults/overview) and [browser profiles](/computer-use-agents/browser/profiles) apply to cloud-hosted browsers only. Your local Chrome's own logins and cookies fill that role.

<Steps titleSize="h3">
  <Step id="install" title="Install the browser driver">
    The browser driver is an optional extra, provided by the [`hai-drivers`](https://pypi.org/project/hai-drivers/) package:

    ```bash Install theme={null}
    pip install "hai-agents[browser]"
    ```
  </Step>

  <Step id="create-a-local-browser-agent" title="Create a local browser agent">
    A local browser agent is a normal [agent](/computer-use-agents/agents/overview) whose browser environment sets `host` to `user_device`; everything else about the spec is unchanged. [Create it](/computer-use-agents/agents/create) in your catalog:

    ```python Python theme={null}
    from hai_agents import Client

    client = Client()

    agent = client.agents.create_agent(
        name="local-web",
        description="Drives a browser on my own machine.",
        environments=[
            {
                "id": "my-laptop",
                "kind": "web",
                "host": "user_device",
            }
        ],
    )
    ```
  </Step>

  <Step id="run-a-session" title="Run a session">
    In Python, run a session with the agent object from the previous step. There is nothing else to set up; the SDK starts Chrome if needed and drives it there. From the CLI, serve the browser with `hai local browser` and point the agent at the `session_id` it prints.

    <CodeGroup>
      ```python Python theme={null}
      result = client.run_session(
          agent=agent,
          messages="Open news.ycombinator.com and summarize the top story",
      )
      print(result.status, result.answer)
      ```

      ```bash CLI theme={null}
      pip install "hai-agents[cli,browser]"

      # Serve the browser and leave it running; it prints the session_id it serves.
      hai local browser

      # From another terminal, route the agent's browser environment here.
      hai run "Open news.ycombinator.com and summarize the top story" \
        --agent local-web \
        -o 'agent.environments[kind=web].session_id=<printed id>'
      ```
    </CodeGroup>

    The session behaves like any other: [observe and steer](/computer-use-agents/observe-and-steer) it, read [changes](/computer-use-agents/sessions/changes), or watch it in [Agent View](/computer-use-agents/observe-and-steer#watch-a-run). The Python connection closes when your process exits; Chrome stays open.

    Auto-connect covers agents defined inline in `run_session`, `start_session`, or `create_session`. A [registered](/computer-use-agents/agents/overview) agent referenced by name, or a session started from the web app or another machine, expects its `user_device` environment to carry the `session_id` of a machine served with `hai local browser`, as in the CLI tab. Set `HAI_AUTO_BRIDGE=0` to opt out of auto-connect entirely.
  </Step>
</Steps>

## The Chrome it drives

The SDK attaches to a Chrome instance with remote debugging open on port `9222`. If none is running, it launches one with its own profile in `~/.hai/chrome-profile`. That profile persists across runs: sign in to a site once and the agent finds you signed in next time. Your everyday Chrome profile is never touched; Chrome does not allow remote debugging on it.

To drive a different Chrome, start it yourself before the session and the SDK attaches to it instead:

<CodeGroup>
  ```bash macOS theme={null}
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-for-agents"
  ```

  ```bash Linux theme={null}
  google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-for-agents"
  ```
</CodeGroup>

Chrome only opens the debugging port on a profile passed with `--user-data-dir`, so pick a dedicated directory and keep it for the logins you want the agent to have.

## Next steps

<CardGroup cols={2}>
  <Card title="Browser configuration" icon="window" href="/computer-use-agents/browser/configuration">
    Modes, start URL, profiles, and the rest of the browser environment.
  </Card>

  <Card title="Local desktop" icon="display" href="/computer-use-agents/desktop/local-control">
    Drive the whole desktop on your machine, not just the browser.
  </Card>

  <Card title="Observe & steer" icon="eye" href="/computer-use-agents/observe-and-steer">
    Watch a local run, redirect it mid-task, and read the answer.
  </Card>

  <Card title="Sessions" icon="clock" href="/computer-use-agents/sessions/overview">
    The session lifecycle, including how to cancel a run.
  </Card>
</CardGroup>
