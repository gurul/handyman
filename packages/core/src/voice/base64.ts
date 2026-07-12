/**
 * Base64 <-> PCM16 helpers.
 * Uses native Uint8Array.fromBase64 / toBase64 (ES2024 proposal, shipped in
 * modern browsers) when available; falls back to atob/btoa without
 * per-byte atob calls.
 */

type Uint8Ctor = typeof Uint8Array & {
  fromBase64?(b64: string): Uint8Array;
};

type Uint8WithB64 = Uint8Array & {
  toBase64?(): string;
};

export function base64ToBytes(b64: string): Uint8Array {
  const ctor = Uint8Array as Uint8Ctor;
  if (typeof ctor.fromBase64 === "function") {
    return ctor.fromBase64(b64);
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const withB64 = bytes as Uint8WithB64;
  if (typeof withB64.toBase64 === "function") {
    return withB64.toBase64();
  }
  let bin = "";
  const CHUNK = 0x8000; // keep String.fromCharCode arg count under engine limits
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** Decode base64-encoded little-endian PCM16 into an Int16Array. */
export function base64ToInt16(b64: string): Int16Array {
  const bytes = base64ToBytes(b64);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = new Int16Array(bytes.byteLength >> 1);
  for (let i = 0; i < out.length; i++) {
    out[i] = view.getInt16(i * 2, true);
  }
  return out;
}

/** Encode an Int16Array as base64 little-endian PCM16. */
export function int16ToBase64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(i * 2, samples[i] ?? 0, true);
  }
  return bytesToBase64(bytes);
}
