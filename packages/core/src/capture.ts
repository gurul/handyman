// Viewport screenshot → downscaled JPEG data URI.
//
// Library choice (grounded via `npm view`, 2026-07-11):
//   @zumer/snapdom 2.15.0  — last publish 2026-07-03, actively maintained
//   modern-screenshot 4.7.0 — last publish 2026-04-16
//   html-to-image 1.11.13  — last publish 2025-04-19
//   html2canvas 1.4.1      — effectively unmaintained (last release 2022)
// snapdom is the best-maintained full-fidelity DOM rasterizer and supports
// declarative exclusion (`exclude` + excludeMode:"hide" keeps layout), which
// we use to keep handyman's own overlay/pointer/FAB out of the observation.
//
// Cross-origin image handling (grounded via Context7 /zumerlab/snapdom + the
// installed 2.15.0 source, 2026-07-11): snapdom inlines every <img> by fetching
// its bytes as a dataURL. On a third-party site (github.com, etc.) those fetches
// hit CORS — each one errors (`[snapDOM] Network/CORS issue …`) and blocks the
// capture up to snapdom's ~3s per-resource timeout, so an avatar/logo-heavy page
// makes the FIRST capture slow and noisy. `useProxy` is NOT a general fix: strict
// third-party CSP (connect-src) blocks our localhost proxy and snapdom's fetches
// can't use the extension transport, so proxying just moves the failure.
//
// The H vision model grounds on layout/text/controls, not on avatar pixels, so
// we drop cross-origin <img> from the capture via snapdom's `filter` predicate
// with the default filterMode:"hide". Verified against dist/snapdom.mjs: a node
// the filter rejects in "hide" mode is replaced by `Ee(t)` — an inline-block div
// sized to the element's measured box with visibility:hidden and NO `src`. So the
// image's box geometry is preserved (all grounding needs) while its remote bytes
// are never fetched: no CORS errors, no timeout stall, no network dependency.
// Same-origin <img> are kept and inline normally (same-origin fetch, no CORS).

import { snapdom } from '@zumer/snapdom';

/**
 * True when `raw` resolves to the current document's origin, or is an inline
 * scheme (data:/blob:) that needs no network fetch. Unparseable → treat as
 * same-origin so we never drop a node we can't classify.
 */
function isSameOriginOrInline(raw: string): boolean {
	try {
		const u = new URL(raw, document.baseURI);
		if (u.protocol === 'data:' || u.protocol === 'blob:') return true;
		return u.origin === window.location.origin;
	} catch {
		return true;
	}
}

/**
 * snapdom `filter` predicate: return true to keep a node, false to exclude it.
 * We reject only cross-origin <img> — snapdom then swaps in a same-size hidden
 * placeholder (box preserved) instead of fetching the remote bytes. Everything
 * else, including same-origin images, is kept untouched.
 */
function keepNode(el: Element): boolean {
	if (el.tagName === 'IMG') {
		const img = el as HTMLImageElement;
		// currentSrc/src are already absolute; fall back to the raw attribute.
		const src = img.currentSrc || img.src || img.getAttribute('src') || '';
		if (src.length > 0 && !isSameOriginOrInline(src)) return false;
	}
	return true;
}

export interface ViewportCapture {
	/** JPEG data URI of the current viewport (downscaled; longest side ≤ MAX_IMAGE_EDGE). */
	screenshot: string;
	/**
	 * The TRUE CSS viewport in px — {innerWidth, innerHeight}. This is NOT the
	 * raster/image pixel size and MUST NOT be changed to it (see coord note).
	 */
	viewport: { width: number; height: number };
}

// --- Normalized-coordinate contract (why downscaling is safe) ---
// The model returns element coordinates in [0,1000] normalized to the IMAGE it
// was sent. The widget converts them back with `viewport.width/height` (CSS px),
// NEVER with the image's pixel dimensions (see snap.ts). So the raster resolution
// is a free variable: as long as the image is a faithful, aspect-preserving
// capture of exactly the CSS viewport region, (x/1000)*viewport.width maps a
// normalized coordinate to the same CSS point no matter how many pixels the JPEG
// actually has. Shrinking the raster therefore does not touch the coord math —
// which is exactly why `viewport` MUST stay the true CSS viewport, and why the
// downscale below preserves aspect ratio (a non-uniform squash WOULD break it).
const MAX_IMAGE_EDGE = 1024;

// PNG of a full-viewport screenshot is large to encode and upload, and a big
// image also costs the model more input tokens / latency. JPEG @ 0.72 is roughly
// an order of magnitude smaller for a UI screenshot while keeping text and button
// edges legible enough for grounding; below ~0.6 labels start to smear. JPEG has
// no alpha channel, so the canvas is filled white first (opaque background,
// matching snapdom's own #fff default) — otherwise transparent pixels go black.
const JPEG_QUALITY = 0.72;

export async function captureViewport(): Promise<ViewportCapture> {
	const width = window.innerWidth;
	const height = window.innerHeight;

	// One scalar for both axes so the output preserves the viewport aspect ratio
	// exactly — required by the normalized-coordinate contract above. Never > 1
	// (we downscale only; upscaling wastes bytes for no fidelity gain).
	const longest = Math.max(width, height);
	const outScale = longest > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / longest : 1;

	// snapdom has no region/clip option — the 2.15 typedefs expose only
	// scale/width/height/dpr for sizing, none of which crop — so it still
	// traverses and rasterizes the whole <body>. We can't skip that traversal,
	// but rendering at `outScale` (≤1) produces the raster at the reduced
	// resolution we need anyway: a long page rasterizes proportionally fewer
	// pixels instead of full-res-then-downscale. The viewport crop below then
	// discards everything outside the current fold.
	const result = await snapdom(document.body, {
		fast: true,
		scale: outScale,
		dpr: 1, // keep the raster 1:1 with CSS px (× outScale) so coords map cleanly
		exclude: ['[data-handyman]'],
		excludeMode: 'hide',
		// Drop cross-origin <img> before snapdom fetches their bytes. filterMode
		// "hide" (default) keeps each image's box via a visibility:hidden placeholder
		// so layout/coords are unchanged; no remote fetch → no CORS errors or stall.
		filter: keepNode,
		filterMode: 'hide',
		compress: true,
	});
	const full = await result.toCanvas();

	// snapdom rasterizes the whole body; crop the current viewport region.
	// scaleX/scaleY come from the ACTUAL raster dimensions (robust to any snapdom
	// rounding under `scale`), used only to locate the source rect in the raster.
	const bodyW = Math.max(1, document.body.scrollWidth || width);
	const bodyH = Math.max(1, document.body.scrollHeight || height);
	const scaleX = full.width / bodyW;
	const scaleY = full.height / bodyH;

	// Output canvas uses the single `outScale` on both axes, so its aspect ratio
	// matches the CSS viewport exactly regardless of scaleX/scaleY drift.
	const outW = Math.max(1, Math.round(width * outScale));
	const outH = Math.max(1, Math.round(height * outScale));
	const out = document.createElement('canvas');
	out.width = outW;
	out.height = outH;
	const ctx = out.getContext('2d');
	if (ctx === null) throw new Error('handyman: 2d canvas unavailable');
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, outW, outH);
	ctx.drawImage(
		full,
		window.scrollX * scaleX,
		window.scrollY * scaleY,
		width * scaleX,
		height * scaleY,
		0,
		0,
		outW,
		outH,
	);

	return {
		screenshot: out.toDataURL('image/jpeg', JPEG_QUALITY),
		viewport: { width, height },
	};
}
