/**
 * Ephemeral Gradium token flow.
 * Tokens are SINGLE-USE: fetch a fresh one for every WebSocket connect.
 */

const TOKEN_TIMEOUT_MS = 15_000;

interface VoiceTokenResponse {
  token: string;
  expires_at: string;
}

/** Fetch a fresh single-use token from the widget proxy: GET {endpoint}/voice-token */
export async function fetchVoiceToken(endpoint: string): Promise<string> {
  const url = `${endpoint.replace(/\/+$/, "")}/voice-token`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`voice-token request failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as VoiceTokenResponse;
  if (!body.token) {
    throw new Error("voice-token response missing token");
  }
  return body.token;
}

/** Build the authenticated Gradium speech WebSocket URL. */
export function gradiumWsUrl(path: "tts" | "asr", token: string): string {
  const url = new URL(`wss://api.gradium.ai/api/speech/${path}`);
  url.searchParams.set("token", token);
  return url.toString();
}

/** Open a WebSocket; resolves on open, rejects on error/close before open. */
export function openSocket(url: string): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(url);
    const fail = (reason: string) => reject(new Error(`websocket failed to open: ${reason}`));
    ws.onopen = () => {
      ws.onerror = null;
      ws.onclose = null;
      resolve(ws);
    };
    ws.onerror = () => fail("error event");
    ws.onclose = (ev) => fail(`closed (code ${ev.code})`);
  });
}
