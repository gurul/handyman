> ## Documentation Index
> Fetch the complete documentation index at: https://hub.hcompany.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# About the Models API

> OpenAI-compatible access to the Holo Vision-Language Models for computer use.

The H Company Models API gives developers access to the Holo Vision-Language Models: multimodal models trained to operate real user interfaces across web, desktop, and mobile. Through a single OpenAI-compatible API, you send text, images, or both, and receive structured outputs you can act on directly.

Two models are served today: the fast, open-weight `holo3-1-35b-a3b` (free tier) and the maximum-performance `holo3-122b-a10b`. See [Models](/models) for capabilities, limits, and pricing.

## Two ways to use Holo

| Mode                                              | Pattern                                                 | Output                                              | When to use                                                                  |
| :------------------------------------------------ | :------------------------------------------------------ | :-------------------------------------------------- | :--------------------------------------------------------------------------- |
| [**Agent loop**](/agent-loop)                     | Multi-turn: conversation + screenshots → next tool call | `{note, thought, tool_call}` or native `tool_calls` | Holo as the brain of an autonomous browser or desktop agent                  |
| [**Element localization**](/element-localization) | Single-turn: image + target description → coordinates   | `{x, y}` in `[0, 1000]`                             | UI grounding inside any external agent or pipeline (yours or someone else's) |

There is also a third, non-GUI pattern: [Document OCR](/document-ocr), the same endpoint used as a one-shot page transcriber.

## Get started

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/quickstart">
    First request in five minutes.
  </Card>

  <Card title="Models" icon="microchip" href="/models">
    What is served, limits, and pricing.
  </Card>

  <Card title="API reference" icon="code" href="/api-reference">
    Endpoint, conventions, and parameters.
  </Card>

  <Card title="Agent loop" icon="arrows-rotate" href="/agent-loop">
    Use Holo in your computer-use harness.
  </Card>
</CardGroup>

## Model cards and benchmarks

<CardGroup cols={3}>
  <Card title="Hugging Face" icon="book" href="https://huggingface.co/collections/Hcompany/holo31">
    Model cards, weights, and quantized builds.
  </Card>

  <Card title="Holo3.1 release" icon="newspaper" href="https://hcompany.ai/holo3.1">
    Mobile, function calling, and local inference.
  </Card>

  <Card title="Holo3 benchmarks" icon="trophy" href="https://hcompany.ai/holo3">
    78.85% on OSWorld-Verified.
  </Card>
</CardGroup>

<Note>
  Prefer to try the models without writing code? [HoloTab](https://hcompany.ai/meet-holotab) runs Holo directly in your browser without any setup.
</Note>
