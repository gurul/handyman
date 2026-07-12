# voice/ — Gradium TTS + STT (hand-rolled WS clients; Gradium has no npm SDK)

**Token flow:** Gradium keys never reach the browser. Each WebSocket connect fetches a
fresh **single-use** ephemeral token from the proxy (`GET {endpoint}/voice-token` →
`{ token, expires_at }`), appended as `?token=` on the WS URL (`token.ts`).

**TTS** (`tts.ts`) — `wss://api.gradium.ai/api/speech/tts`
Send `setup` (voice_id, model, pcm) → wait `ready` → send `text` + `end_of_stream`.
Server streams `audio` frames (base64 PCM, 48kHz s16 mono, 3840-sample/80ms chunks)
then `end_of_stream`. Chunks are decoded (Int16 → Float32) and scheduled gaplessly on
AudioBufferSourceNodes with a running start-time cursor. `speak()` resolves when
playback drains; a new `speak()` interrupts the current one. AudioContext is lazy
(first `speak()`, after a user gesture). Error frames / mid-stream close → warn + resolve.

**STT** (`stt.ts`) — `wss://api.gradium.ai/api/speech/asr`
Send `setup` (pcm, language en), then mic audio via AudioWorklet (inline Blob module;
ScriptProcessor fallback) downsampled to 24kHz PCM16, base64 `audio` chunks (~100ms).
Server sends `text` fragments (accumulated → `onPartial`) and `step` semantic-VAD frames
(one entry / 80ms). `inactivity_prob > 0.9` for ≥600ms with transcript present →
send `end_of_stream`, emit `onFinal`, stop mic, close. `base64.ts`: fast PCM16 ↔ base64.
