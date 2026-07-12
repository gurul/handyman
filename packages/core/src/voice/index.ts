/**
 * Gradium voice layer — public contract.
 * The core widget imports this module dynamically; keep these exports stable.
 */

export interface TTSPlayer {
  speak(text: string): Promise<void>;
  stop(): void;
}

export interface STTSession {
  stop(): void;
}

export interface STTCallbacks {
  onPartial?(text: string): void;
  onFinal(text: string): void;
  onError?(e: unknown): void;
}

export { createTTS } from "./tts";
export { startSTT } from "./stt";
