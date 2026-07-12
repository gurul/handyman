// happy-dom global registration. Imported first by every test file so the
// DOM exists before any module touches document/window.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!('document' in globalThis) || (globalThis as { __handymanDom?: boolean }).__handymanDom !== true) {
	try {
		GlobalRegistrator.register({ url: 'http://localhost:3000/app' });
	} catch {
		// already registered by another test file
	}
	(globalThis as { __handymanDom?: boolean }).__handymanDom = true;
}

/** Give a stub element a fixed viewport rect (happy-dom rects are all zeros). */
export function stubRect(
	el: Element,
	left: number,
	top: number,
	width: number,
	height: number,
): void {
	(el as { getBoundingClientRect?: () => DOMRect }).getBoundingClientRect = () =>
		({
			left,
			top,
			width,
			height,
			right: left + width,
			bottom: top + height,
			x: left,
			y: top,
			toJSON: () => ({}),
		}) as DOMRect;
}

export async function waitFor(
	cond: () => boolean,
	timeoutMs = 1000,
): Promise<void> {
	const start = Date.now();
	while (!cond()) {
		if (Date.now() - start > timeoutMs) {
			throw new Error('waitFor: condition not met in time');
		}
		await new Promise((r) => setTimeout(r, 5));
	}
}
