// Element snapping — the accuracy trick. The model returns normalized
// (x, y) in [0,1000] on the screenshot; coordinates only need to land
// *inside* the target element, which absorbs screenshot-fidelity error.

export interface SnapResult {
	el: Element | null;
	rect: DOMRect;
}

const MAX_HOPS = 5;
const FALLBACK_SIZE = 48;

const INTERACTIVE_ROLES = new Set(['button', 'link', 'tab', 'menuitem']);
const INTERACTIVE_TAGS = new Set([
	'BUTTON',
	'INPUT',
	'SELECT',
	'TEXTAREA',
	'SUMMARY',
	'LABEL',
]);

export function isInteractive(el: Element): boolean {
	const tag = el.tagName;
	if (tag === 'A') return el.hasAttribute('href');
	if (INTERACTIVE_TAGS.has(tag)) return true;
	const role = el.getAttribute('role');
	if (role !== null && INTERACTIVE_ROLES.has(role)) return true;
	if (el.hasAttribute('onclick')) return true;
	try {
		if (getComputedStyle(el).cursor === 'pointer') return true;
	} catch {
		// detached element or non-rendering environment
	}
	return false;
}

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
	if (typeof DOMRect === 'function') return new DOMRect(left, top, width, height);
	return {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON: () => ({}),
	} as DOMRect;
}

/**
 * Scale [0,1000] coords to viewport px, hit-test, climb to the nearest
 * interactive ancestor (max 5 hops). Nothing interactive → 48x48 rect
 * centered on the point so the tour can still spotlight the area.
 */
export function snapToElement(
	nx: number,
	ny: number,
	viewport: { width: number; height: number },
): SnapResult {
	const px = (nx / 1000) * viewport.width;
	const py = (ny / 1000) * viewport.height;

	let hit: Element | null = document.elementFromPoint(px, py);
	// Never snap to handyman's own overlay/pointer/FAB.
	if (hit !== null && hit.closest('[data-handyman]') !== null) hit = null;

	let cur: Element | null = hit;
	for (let hops = 0; cur !== null && hops <= MAX_HOPS; hops++) {
		if (isInteractive(cur)) {
			return { el: cur, rect: cur.getBoundingClientRect() };
		}
		cur = cur.parentElement;
	}

	return {
		el: hit,
		rect: makeRect(
			px - FALLBACK_SIZE / 2,
			py - FALLBACK_SIZE / 2,
			FALLBACK_SIZE,
			FALLBACK_SIZE,
		),
	};
}
