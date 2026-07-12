// Service worker (MV3).
//
// - onInstalled: seed sensible defaults (widget enabled everywhere by default).
// - onMessage 'set-site-enabled': toggle the per-origin enable flag and reload
//   the tab so the content script mounts / unmounts.
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

export {};
