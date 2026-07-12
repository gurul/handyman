> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

Get from zero to your first Holo request in three steps. If you want the model lineup, capabilities, and pricing first, see [Models](/models); for what Holo is and the ways to use it, see the [overview](/about-the-models-api).

## Get started

<Steps titleSize="h3">
  <Step title="Get an API key">
    Generate a key on [Portal-H](https://portal.hcompany.ai/?product=modelsapi\&source=docs) and export it. The free tier gives rate-limited access to `holo3-1-35b-a3b` and does not ask for a credit card.

    ```bash theme={null}
    export HAI_API_KEY="your-api-key-here"
    ```
  </Step>

  <Step title="Install the OpenAI client">
    The Models API is OpenAI-compatible, so the official client works as-is, only the `base_url` changes.

    <CodeGroup>
      ```bash Python theme={null}
      pip install openai
      ```

      ```bash TypeScript theme={null}
      npm install openai
      ```
    </CodeGroup>
  </Step>

  <Step title="Make your first request">
    Point the client at H by overriding `base_url`, then send a request. Holo is multimodal: you can send text, images, or both. Here is a minimal text request to confirm your key and client are working.

    <CodeGroup>
      ```python Python theme={null}
      import os
      from openai import OpenAI

      client = OpenAI(
          base_url="https://api.hcompany.ai/v1/",
          api_key=os.environ.get("HAI_API_KEY"),
      )

      response = client.chat.completions.create(
          model="holo3-1-35b-a3b",
          messages=[{"role": "user", "content": "In one sentence, what is a computer-use agent?"}],
      )

      print(response.choices[0].message.content)
      ```

      ```typescript TypeScript theme={null}
      import OpenAI from "openai";

      const client = new OpenAI({
        baseURL: "https://api.hcompany.ai/v1/",
        apiKey: process.env.HAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "holo3-1-35b-a3b",
        messages: [{ role: "user", content: "In one sentence, what is a computer-use agent?" }],
      });

      console.log(response.choices[0].message.content);
      ```

      ```bash cURL theme={null}
      curl https://api.hcompany.ai/v1/chat/completions \
        -H "Authorization: Bearer $HAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "model": "holo3-1-35b-a3b",
          "messages": [{"role": "user", "content": "In one sentence, what is a computer-use agent?"}]
        }'
      ```
    </CodeGroup>

    The same API and code paths work for all models; swap `model` for `holo3-122b-a10b` when you need maximum performance ([model comparison](/models)).

    That is the whole setup. To use Holo on real screens, send a screenshot and continue with the agent loop or element localization below.
  </Step>
</Steps>

## Next steps

<CardGroup cols={3}>
  <Card title="Agent loop" icon="arrows-rotate" href="/agent-loop">
    How to use Holo in your computer-use harness.
  </Card>

  <Card title="Element localization" icon="crosshairs" href="/element-localization">
    Get click coordinates from a screenshot.
  </Card>

  <Card title="Models" icon="microchip" href="/models">
    IDs, limits, pricing, and lifecycle.
  </Card>
</CardGroup>
