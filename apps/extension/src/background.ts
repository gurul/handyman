// Service worker (MV3).
//
// - onInstalled: seed sensible defaults (widget enabled everywhere by default).
// - onMessage 'set-site-enabled': toggle the per-origin enable flag and reload
//   the tab so the content script mounts / unmounts.
// - onMessage 'handyman-fetch': the network bridge. The service worker is the
//   ONLY context immune to the host page's CSP `connect-src`, mixed-content
//   (https page → http://localhost proxy), AND Private-Network-Access gating.
//   The main-world transport posts a req to the content script, which forwards
//   it here; this worker does the privileged fetch and returns the JSON.
//
// NOTE: MV3 does not fire chrome.action.onClicked when a default_popup is set —
// the popup opens instead. The per-site toggle therefore lives in the popup and
// is executed here (storage write + tab reload) via this message.

const DEFAULT_ENDPOINT = 'http://localhost:3000/api';

interface SetSiteMsg {
	type: 'set-site-enabled';
	origin: string;
	enabled: boolean;
	tabId: number;
}

function isSetSiteMsg(m: unknown): m is SetSiteMsg {
	return (
		typeof m === 'object' &&
		m !== null &&
		(m as { type?: unknown }).type === 'set-site-enabled'
	);
}

interface FetchMsg {
	type: 'handyman-fetch';
	endpoint: string;
	path: string;
	init: { method?: 'GET' | 'POST'; body?: unknown };
}

function isFetchMsg(m: unknown): m is FetchMsg {
	return (
		typeof m === 'object' &&
		m !== null &&
		(m as { type?: unknown }).type === 'handyman-fetch'
	);
}

chrome.runtime.onInstalled.addListener(() => {
	void (async () => {
		const cur = await chrome.storage.sync.get(['endpoint', 'tts', 'stt']);
		const patch: Record<string, unknown> = {};
		if (cur.endpoint === undefined) patch.endpoint = DEFAULT_ENDPOINT;
		if (cur.tts === undefined) patch.tts = true;
		if (cur.stt === undefined) patch.stt = true;
		if (Object.keys(patch).length > 0) await chrome.storage.sync.set(patch);
	})();
});

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
	if (!isSetSiteMsg(msg)) return undefined;
	void (async () => {
		const { sites = {} } = (await chrome.storage.sync.get('sites')) as {
			sites?: Record<string, boolean>;
		};
		await chrome.storage.sync.set({ sites: { ...sites, [msg.origin]: msg.enabled } });
		try {
			await chrome.tabs.reload(msg.tabId);
		} catch {
			/* tab may have closed — ignore */
		}
		sendResponse({ ok: true });
	})();
	return true; // async sendResponse
});

// Network bridge: the privileged fetch. Extension-context fetch is immune to
// the page CSP, mixed-content, and PNA/localhost blocking — this is the whole
// point of moving the fetch out of the content script.
chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
	if (!isFetchMsg(msg)) return undefined;
	const method = msg.init?.method ?? 'POST';
	console.debug('[handyman-ext] bg: fetch start', method, msg.endpoint + msg.path);
	void (async () => {
		try {
			const res = await fetch(msg.endpoint + msg.path, {
				method,
				headers:
					method === 'POST' ? { 'content-type': 'application/json' } : undefined,
				body:
					method === 'POST' && msg.init?.body !== undefined
						? JSON.stringify(msg.init.body)
						: undefined,
			});
			console.debug('[handyman-ext] bg: fetch status', res.status, msg.path);
			if (!res.ok) {
				sendResponse({ ok: false, status: res.status, error: `HTTP ${res.status}` });
				return;
			}
			const body: unknown = await res.json();
			sendResponse({ ok: true, status: res.status, body });
		} catch (e) {
			const error = e instanceof Error ? e.message : String(e);
			console.debug('[handyman-ext] bg: fetch error', error, msg.path);
			sendResponse({ ok: false, error });
		}
	})();
	return true; // keep the channel open for the async sendResponse
});

export {};
