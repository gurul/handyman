/**
 * Gradium STT (ASR) over WebSocket (wss://api.gradium.ai/api/speech/asr).
 * Mic -> downsample to 24kHz PCM16 -> base64 chunks (~100ms) -> WS.
 * Server sends "text" transcript fragments and "step" semantic-VAD frames
 * (one entry per 80ms). Sustained inactivity ends the utterance.
 */

import type { STTCallbacks, STTSession } from "./index";
import { int16ToBase64 } from "./base64";
import { fetchVoiceToken, gradiumWsUrl, openSocket, type VoiceTransport } from "./token";

const TARGET_RATE = 24_000;
const CHUNK_SAMPLES = 2_400; // 100ms at 24kHz
const VAD_INACTIVITY_THRESHOLD = 0.9;
const VAD_STEP_MS = 80; // one vad entry per 80ms
const END_OF_UTTERANCE_MS = 600;

type ASRServerMessage =
  | { type: "text"; text: string }
  | { type: "step"; vad?: { inactivity_prob: number }[] }
  | { type: "end_of_stream" }
  | { type: "error"; message?: string };

/** AudioWorklet module source, loaded via Blob URL (no separate file to ship). */
const CAPTURE_WORKLET_SOURCE = `
class HandymanCapture extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length > 0) {
      this.port.postMessage(channel.slice(0));
    }
    return true;
  }
}
registerProcessor("handyman-capture", HandymanCapture);
`;

/** Linear-interpolation downsampler with fractional-position carry across chunks. */
function createDownsampler(fromRate: number, toRate: number): (input: Float32Array) => Float32Array {
  const ratio = fromRate / toRate;
  let frac = 0; // read position within the next chunk, in [0, ratio)
  return (input: Float32Array): Float32Array => {
    const n = input.length;
    if (n === 0) return new Float32Array(0);
    const out = new Float32Array(Math.ceil((n - frac) / ratio) + 1);
    let count = 0;
    let pos = frac;
    while (pos < n) {
      const i = Math.floor(pos);
      const t = pos - i;
      const a = input[i] ?? 0;
      const b = i + 1 < n ? (input[i + 1] ?? a) : a;
      out[count++] = a + (b - a) * t;
      pos += ratio;
    }
    frac = pos - n;
    return out.subarray(0, count);
  };
}

/**
 * Wire mic capture: AudioWorklet (inline module via Blob URL) with a
 * ScriptProcessor fallback. Returns a teardown function.
 */
async function createCapture(
  ctx: AudioContext,
  stream: MediaStream,
  onSamples: (samples: Float32Array) => void,
): Promise<() => void> {
  const source = ctx.createMediaStreamSource(stream);

  if (typeof AudioWorkletNode === "function" && ctx.audioWorklet) {
    const blobUrl = URL.createObjectURL(
      new Blob([CAPTURE_WORKLET_SOURCE], { type: "text/javascript" }),
    );
    try {
      await ctx.audioWorklet.addModule(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
    const node = new AudioWorkletNode(ctx, "handyman-capture", {
      numberOfInputs: 1,
      numberOfOutputs: 0,
    });
    node.port.onmessage = (ev: MessageEvent) => onSamples(ev.data as Float32Array);
    source.connect(node);
    return () => {
      node.port.onmessage = null;
      source.disconnect();
    };
  }

  // Fallback: deprecated but universally supported.
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (ev: AudioProcessingEvent) => {
    onSamples(ev.inputBuffer.getChannelData(0));
  };
  source.connect(processor);
  processor.connect(ctx.destination); // required for onaudioprocess to fire; output is silence
  return () => {
    processor.onaudioprocess = null;
    processor.disconnect();
    source.disconnect();
  };
}

export async function startSTT(
  endpoint: string,
  opts: STTCallbacks,
  transport?: VoiceTransport,
): Promise<STTSession> {
  // Tokens are single-use: fetch a fresh one per connect. Routes through the
  // extension bridge (`transport`) under strict CSP; the WS below still connects
  // directly from the page (best-effort under strict connect-src).
  const token = await fetchVoiceToken(endpoint, transport);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  let ctx: AudioContext | null = null;
  let ws: WebSocket | null = null;
  let stopCapture: (() => void) | null = null;

  let done = false;
  let transcript = "";
  let silenceMs = 0;

  function teardown(): void {
    if (done) return;
    done = true;
    stopCapture?.();
    for (const track of stream.getTracks()) track.stop();
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    if (ctx && ctx.state !== "closed") void ctx.close();
  }

  function finish(): void {
    if (done) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "end_of_stream" }));
    }
    const finalText = transcript.trim();
    teardown();
    opts.onFinal(finalText);
  }

  try {
    ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    ws = await openSocket(gradiumWsUrl("asr", token));
    ws.send(
      JSON.stringify({
        type: "setup",
        model_name: "default",
        input_format: "pcm",
        json_config: { language: "en" },
      }),
    );

    const socket = ws;
    socket.onmessage = (ev: MessageEvent) => {
      if (done || typeof ev.data !== "string") return;
      let msg: ASRServerMessage;
      try {
        msg = JSON.parse(ev.data) as ASRServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "text":
          if (msg.text) {
            transcript += msg.text;
            opts.onPartial?.(transcript);
          }
          break;
        case "step":
          // Semantic VAD: one entry per 80ms of audio.
          for (const entry of msg.vad ?? []) {
            if (entry.inactivity_prob > VAD_INACTIVITY_THRESHOLD) {
              silenceMs += VAD_STEP_MS;
            } else {
              silenceMs = 0;
            }
          }
          if (silenceMs >= END_OF_UTTERANCE_MS && transcript.trim().length > 0) {
            finish();
          }
          break;
        case "error":
          opts.onError?.(new Error(`[voice/stt] server error frame: ${msg.message ?? "unknown"}`));
          teardown();
          break;
        case "end_of_stream":
          // Server-initiated end: emit whatever we have.
          finish();
          break;
      }
    };
    socket.onerror = () => {
      console.warn("[voice/stt] websocket error");
    };
    socket.onclose = () => {
      if (done) return;
      opts.onError?.(new Error("[voice/stt] websocket closed unexpectedly"));
      teardown();
    };

    // Mic capture -> downsample -> PCM16 chunks of ~100ms -> WS.
    const downsample = createDownsampler(ctx.sampleRate, TARGET_RATE);
    const pending = new Int16Array(CHUNK_SAMPLES);
    let pendingLen = 0;
    stopCapture = await createCapture(ctx, stream, (samples) => {
      if (done || socket.readyState !== WebSocket.OPEN) return;
      const resampled = downsample(samples);
      for (let i = 0; i < resampled.length; i++) {
        const v = Math.max(-1, Math.min(1, resampled[i] ?? 0));
        pending[pendingLen++] = (v * 32767) | 0;
        if (pendingLen === CHUNK_SAMPLES) {
          socket.send(JSON.stringify({ type: "audio", audio: int16ToBase64(pending) }));
          pendingLen = 0;
        }
      }
    });
  } catch (err) {
    teardown();
    throw err;
  }

  return {
    stop(): void {
      teardown();
    },
  };
}
