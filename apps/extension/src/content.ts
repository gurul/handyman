// Content script — runs in the ISOLATED world at document_idle.
//
// Responsibilities:
//   1. Read config from chrome.storage.sync; bail if disabled for this origin.
//   2. Inject the widget IIFE + the main-world init script into the page's
//      MAIN world (both via web_accessible_resources — never inline, which a
//      strict page CSP `script-src` would block).
//   3. Act as the NETWORK BRIDGE RELAY: the main-world transport cannot `fetch`
//      the proxy (blocked by the page `connect-src` CSP, mixed-content on
//      https→http-localhost, and PNA/localhost gating). It posts each request
//      here via window.postMessage; this isolated-world script forwards it to
//      the BACKGROUND service worker (the only context immune to all three),
//      then posts the worker's JSON response back to the main world.

const DEFAULT_ENDPOINT = 'http://localhost:3000/api';

interface StoredConfig {
	endpoint?: string;
	tts?: boolean;
	stt?: boolean;
	/** Voice hotkey combo, e.g. "Alt+KeyH". Absent => widget default. */
	hotkey?: string;
	hotkeyPushToTalk?: boolean;
	/** Per-origin enable flag. Absent => enabled (default on). */
	sites?: Record<string, boolean>;
}

interface ReqMsg {
	__handyman: 'req';
	id: number;
	path: string;
	init: { method?: 'GET' | 'POST'; body?: unknown };
}

function isReqMsg(d: unknown): d is ReqMsg {
	return (
		typeof d === 'object' &&
		d !== null &&
		(d as { __handyman?: unknown }).__handyman === 'req'
	);
}

interface FetchResponse {
	ok: boolean;
	status?: number;
	body?: unknown;
	error?: string;
}

function post(res: Record<string, unknown>): void {
	window.postMessage({ __handyman: 'res', ...res }, '*');
}

// Forward one main-world request to the background service worker, which does
// the privileged fetch, then relay its response back to the main world.
function relay(req: ReqMsg, endpoint: string): void {
	console.debug('[handyman-ext] content: req received', req.id, req.path);
	chrome.runtime.sendMessage(
		{ type: 'handyman-fetch', endpoint, path: req.path, init: req.init },
		(resp: FetchResponse | undefined) => {
			const lastError = chrome.runtime.lastError;
			if (lastError || !resp) {
				const error = lastError?.message ?? 'no response from background';
				console.debug('[handyman-ext] content: bg error', req.id, error);
				post({ id: req.id, ok: false, error });
				return;
			}
			if (resp.ok) {
				console.debug('[handyman-ext] content: res posted (ok)', req.id, resp.status);
				post({ id: req.id, ok: true, body: resp.body });
			} else {
				console.debug('[handyman-ext] content: res posted (err)', req.id, resp.error);
				post({ id: req.id, ok: false, error: resp.error ?? 'fetch failed' });
			}
		},
	);
	console.debug('[handyman-ext] content: forwarded to bg', req.id);
}

function inject(cfg: {
	endpoint: string;
	tts: boolean;
	stt: boolean;
	hotkey?: string;
	hotkeyPushToTalk?: boolean;
}): void {
	const parent = document.head ?? document.documentElement;

	// The widget IIFE (defines window.Handyman). Must run first — async=false
	// preserves insertion order for dynamically added scripts.
	const widget = document.createElement('script');
	widget.src = chrome.runtime.getURL('widget/index.global.js');
	widget.async = false;

	// Main-world init: reads config from its own data-* attribute (no inline
	// script, so a strict page CSP cannot block it) and calls Handyman.init.
	const initScript = document.createElement('script');
	initScript.id = 'handyman-inject-main';
	initScript.src = chrome.runtime.getURL('inject-main.js');
	initScript.async = false;
	initScript.dataset.handymanConfig = JSON.stringify(cfg);

	parent.appendChild(widget);
	parent.appendChild(initScript);
}

async function main(): Promise<void> {
	const cfg = (await chrome.storage.sync.get([
		'endpoint',
		'tts',
		'stt',
		'hotkey',
		'hotkeyPushToTalk',
		'sites',
	])) as StoredConfig;

	const origin = location.origin;
	if (cfg.sites?.[origin] === false) return; // disabled for this site

	const endpoint = cfg.endpoint || DEFAULT_ENDPOINT;
	const tts = cfg.tts !== false; // default true
	const stt = cfg.stt !== false; // default true

	// Bridge listener: relay main-world transport requests to the background
	// worker. No `ev.source !== window` guard — cross-world postMessage can
	// carry a source the isolated world doesn't equate to `window`; the
	// `__handyman:'req'` discriminator + numeric id is the real gate.
	window.addEventListener('message', (ev: MessageEvent) => {
		if (!isReqMsg(ev.data)) return;
		relay(ev.data, endpoint);
	});

	inject({
		endpoint,
		tts,
		stt,
		...(cfg.hotkey !== undefined ? { hotkey: cfg.hotkey } : {}),
		...(cfg.hotkeyPushToTalk !== undefined
			? { hotkeyPushToTalk: cfg.hotkeyPushToTalk }
			: {}),
	});
}

void main();

export {};
