// Popup — settings surface. Reads/writes chrome.storage.sync and delegates the
// per-site enable toggle (+ tab reload) to the background service worker.

const DEFAULT_ENDPOINT = 'http://localhost:3000/api';

interface StoredConfig {
	endpoint?: string;
	tts?: boolean;
	stt?: boolean;
	sites?: Record<string, boolean>;
}

function $<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) throw new Error(`missing #${id}`);
	return el as T;
}

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab;
}

async function main(): Promise<void> {
	const enabledEl = $<HTMLInputElement>('site-enabled');
	const originEl = $<HTMLSpanElement>('origin');
	const endpointEl = $<HTMLInputElement>('endpoint');
	const ttsEl = $<HTMLInputElement>('tts');
	const sttEl = $<HTMLInputElement>('stt');
	const saveEl = $<HTMLButtonElement>('save');
	const statusEl = $<HTMLDivElement>('status');

	const tab = await activeTab();
	let origin: string | null = null;
	if (tab?.url) {
		try {
			origin = new URL(tab.url).origin;
		} catch {
			origin = null;
		}
	}

	const cfg = (await chrome.storage.sync.get([
		'endpoint',
		'tts',
		'stt',
		'sites',
	])) as StoredConfig;

	endpointEl.value = cfg.endpoint || DEFAULT_ENDPOINT;
	ttsEl.checked = cfg.tts !== false;
	sttEl.checked = cfg.stt !== false;

	if (origin) {
		originEl.textContent = origin.replace(/^https?:\/\//, '');
		enabledEl.checked = cfg.sites?.[origin] !== false;
	} else {
		// Non-web tab (chrome://, extension page) — no per-site toggle.
		originEl.textContent = 'this tab (unsupported)';
		enabledEl.checked = false;
		enabledEl.disabled = true;
	}

	saveEl.addEventListener('click', () => {
		void (async () => {
			saveEl.disabled = true;
			statusEl.textContent = 'Saving…';

			await chrome.storage.sync.set({
				endpoint: endpointEl.value.trim() || DEFAULT_ENDPOINT,
				tts: ttsEl.checked,
				stt: sttEl.checked,
			});

			if (origin && tab?.id !== undefined) {
				// Background owns the per-site flag write + tab reload.
				await chrome.runtime.sendMessage({
					type: 'set-site-enabled',
					origin,
					enabled: enabledEl.checked,
					tabId: tab.id,
				});
				statusEl.textContent = 'Saved. Tab reloaded.';
				window.close();
				return;
			}

			statusEl.textContent = 'Saved.';
			saveEl.disabled = false;
		})();
	});
}

void main();

export {};
