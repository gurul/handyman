> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Models

> The Holo models served by the Models API: capabilities, pricing, and lifecycle.

The Models API serves two Holo models. This page is the single source of truth for what is available; you can also query it programmatically with [`GET /v1/models`](/models-api/list-models).

| Model ID          | Architecture           | Context | Max output | Input / output per 1M tokens | Native function calling | License       |
| :---------------- | :--------------------- | :------ | :--------- | :--------------------------- | :---------------------- | :------------ |
| `holo3-1-35b-a3b` | MoE, 35B / 3B active   | 65,536  | 4,096      | $0.25 / $1.80                | Yes                     | Apache 2.0    |
| `holo3-122b-a10b` | MoE, 122B / 10B active | 65,536  | 32,768     | $0.40 / $3.00                | No                      | Research only |

Both models accept text + images (JPEG, PNG, WebP; up to 5 images per request) and support the reasoning channel and [structured outputs](/agent-loop#output-format-and-tool-calls).

<CardGroup cols={2}>
  <Card title="Holo3.1 35B (holo3-1-35b-a3b)" icon="bolt" href="https://huggingface.co/Hcompany/Holo-3.1-35B-A3B">
    Fast, low-latency computer use across web, desktop, and mobile. Free tier (rate-limited, 10 RPM). Open weights on Hugging Face.
  </Card>

  <Card title="Holo3 122B (holo3-122b-a10b)" icon="gauge-high" href="https://hcompany.ai/holo3">
    Maximum performance for complex tasks. Paid tier only. API-only: weights are not published; see the blog post for benchmarks.
  </Card>
</CardGroup>

## Choosing a model

* Start with `holo3-1-35b-a3b`: it is on the free tier, supports both output formats (structured outputs and native `tool_calls`), and its latency suits interactive agent loops.
* Switch to `holo3-122b-a10b` when task complexity dominates: long multi-step navigation, dense reasoning, or when the 35B's 4,096-token output cap is too tight (for example long [document transcriptions](/document-ocr)). It supports structured outputs but not native function calling.

## Open weights and local inference

`holo3-1-35b-a3b` corresponds to the open-weight Holo3.1-35B-A3B release. The [Holo3.1 collection on Hugging Face](https://huggingface.co/collections/Hcompany/holo31) also carries the other family sizes (0.8B, 4B, 9B) and quantized FP8, GGUF, and NVFP4 builds; those are for self-hosting and are not served by this API. See [run a local model server](/holo-desktop-cli/how-to/run-a-local-model-server) for a vLLM setup.

## Model lifecycle

Model IDs are stable identifiers. When a model is scheduled for removal, its [`deprecation_date`](/models-api/list-models) field is set in `GET /v1/models` and a notice appears here; after removal, requests to the old ID fail with a `model_not_found` error. Pin a model ID in production and check `deprecation_date` when you upgrade.

## Rate limits and billing

<AccordionGroup>
  <Accordion title="Free tier">
    Rate-limited access to `holo3-1-35b-a3b` (10 requests per minute) without a credit card. Create a key on [Portal-H](https://portal.hcompany.ai/?product=modelsapi\&source=docs).
  </Accordion>

  <Accordion title="Paid tier">
    Higher rate limits plus access to `holo3-122b-a10b`. Add credits on [Portal-H](https://portal.hcompany.ai/credits?product=modelsapi\&source=docs). Billing is per model, per million input and output tokens; the API uses zero data retention by default. Current rates and FAQ: [Models API pricing](https://hcompany.ai/holo-models-api).
  </Accordion>
</AccordionGroup>
