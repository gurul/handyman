> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# API reference

> Endpoint, authentication, conventions, and the Holo-specific request surface.

The Models API is OpenAI-compatible: point the official OpenAI client (or any compatible library) at H Company's endpoint. You opt into Holo-specific behavior (structured outputs, reasoning, and the coordinate convention) through a few extra request fields and conventions documented here.

## Endpoints

<CardGroup cols={2}>
  <Card title="POST /chat/completions" icon="message" href="/models-api/chat-completions">
    The inference endpoint: parameters, response fields, streaming.
  </Card>

  <Card title="GET /models" icon="list" href="/models-api/list-models">
    Discover served models, limits, pricing, and deprecation dates at runtime.
  </Card>
</CardGroup>

## Endpoint and auth

|          |                                                                                      |
| :------- | :----------------------------------------------------------------------------------- |
| Base URL | `https://api.hcompany.ai/v1/`                                                        |
| Auth     | `Authorization: Bearer $HAI_API_KEY` (handled by the OpenAI client)                  |
| Keys     | Create one on [Portal-H](https://portal.hcompany.ai/?product=modelsapi\&source=docs) |

<CodeGroup>
  ```python Python theme={null}
  import os
  from openai import OpenAI

  client = OpenAI(
      base_url="https://api.hcompany.ai/v1/",
      api_key=os.environ["HAI_API_KEY"],
  )
  ```

  ```typescript TypeScript theme={null}
  import OpenAI from "openai";

  const client = new OpenAI({
    baseURL: "https://api.hcompany.ai/v1/",
    apiKey: process.env.HAI_API_KEY,
  });
  ```
</CodeGroup>

Model IDs, per-model limits, pricing, and tiers live on the [Models](/models) page.

## The two response channels

Holo returns two streams on every call:

<ResponseField name="choices[].message.content" type="string">
  The action: the structured JSON object (structured-output mode) or the assistant text.
</ResponseField>

<ResponseField name="choices[].message.reasoning" type="string">
  The thinking trace, when thinking is enabled. Read it for visibility; do not feed it back into the conversation.
</ResponseField>

<Note>
  The thinking trace is dropped between turns by the chat template Holo inherits. Anything the model must remember has to flow through `content`. See the [Agent loop](/agent-loop#reasoning) for how to carry state forward.
</Note>

## Conventions

<AccordionGroup>
  <Accordion title="Coordinates in [0, 1000]" defaultOpen>
    Holo returns click positions as integers normalized to the image you sent. Scale back to pixels with the image's own dimensions. Origin is top-left. Send and scale against the same image bytes: any resize, crop, or DPI mismatch will misplace the point.
  </Accordion>

  <Accordion title="Image budget">
    Keep at most the last 3 screenshots in context for best accuracy, even though a request accepts up to 5 images. See [the trim helper](/agent-loop#image-budget) in the agent loop.
  </Accordion>

  <Accordion title="Output formats">
    Structured outputs work on both models; native function calling (`tools` / `tool_calls`) is `holo3-1-35b-a3b` only. Pick one and stay in it: [Agent loop](/agent-loop#output-format-and-tool-calls).
  </Accordion>

  <Accordion title="Holo-specific fields and the OpenAI SDKs">
    `structured_outputs` and `chat_template_kwargs` are top-level body fields on the wire. The OpenAI SDKs do not know them, so pass them via `extra_body` (Python) or an untyped spread (TypeScript); the SDK merges them into the request body.
  </Accordion>
</AccordionGroup>

## Next steps

<CardGroup cols={3}>
  <Card title="Chat completions" icon="message" href="/models-api/chat-completions">
    Full parameter and response reference.
  </Card>

  <Card title="Models" icon="microchip" href="/models">
    IDs, limits, pricing, lifecycle.
  </Card>

  <Card title="Agent loop" icon="arrows-rotate" href="/agent-loop">
    How to use Holo in your computer-use harness.
  </Card>
</CardGroup>
