/**
 * Ephemeral Gradium token flow.
 * Tokens are SINGLE-USE: fetch a fresh one for every WebSocket connect.
 */

const TOKEN_TIMEOUT_MS = 15_000;

interface VoiceTokenResponse {
  token: string;
  expires_at: string;
}

/**
 * Proxy transport, same shape as HandymanConfig.transport. When supplied, the
 * token request routes through the extension's content-script relay instead of
 * a direct page fetch, so it bypasses the host page's CSP `connect-src`.
 * `path` is proxy-relative and leads with a slash; resolves with parsed JSON.
 */
export type VoiceTransport = (
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
) => Promise<unknown>;

/**
 * Fetch a fresh single-use token from the widget proxy: GET {endpoint}/voice-token.
 * Uses `transport` (the extension bridge) when provided so the request survives a
 * strict-CSP host page; otherwise falls back to a direct page fetch.
 */
export async function fetchVoiceToken(
  endpoint: string,
  transport?: VoiceTransport,
): Promise<string> {
  let body: VoiceTokenResponse;
  if (transport) {
    body = (await transport("/voice-token", { method: "GET" })) as VoiceTokenResponse;
  } else {
    const url = `${endpoint.replace(/\/+$/, "")}/voice-token`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`voice-token request failed: ${res.status} ${res.statusText}`);
    }
    body = (await res.json()) as VoiceTokenResponse;
  }
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
