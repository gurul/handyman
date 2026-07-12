// Viewport screenshot → PNG data URI.
//
// Library choice (grounded via `npm view`, 2026-07-11):
//   @zumer/snapdom 2.15.0  — last publish 2026-07-03, actively maintained
//   modern-screenshot 4.7.0 — last publish 2026-04-16
//   html-to-image 1.11.13  — last publish 2025-04-19
//   html2canvas 1.4.1      — effectively unmaintained (last release 2022)
// snapdom is the best-maintained full-fidelity DOM rasterizer and supports
// declarative exclusion (`exclude` + excludeMode:"hide" keeps layout), which
// we use to keep handyman's own overlay/pointer/FAB out of the observation.

import { snapdom } from '@zumer/snapdom';

export interface ViewportCapture {
	/** PNG data URI. */
	screenshot: string;
	viewport: { width: number; height: number };
}

export async function captureViewport(): Promise<ViewportCapture> {
	const width = window.innerWidth;
	const height = window.innerHeight;

	const result = await snapdom(document.body, {
		fast: true,
		scale: 1,
		dpr: 1, // keep the raster 1:1 with CSS px so [0,1000] coords map cleanly
		exclude: ['[data-handyman]'],
		excludeMode: 'hide',
		compress: true,
	});
	const full = await result.toCanvas();

	// snapdom rasterizes the whole body; crop the current viewport region.
	const bodyW = Math.max(1, document.body.scrollWidth || width);
	const bodyH = Math.max(1, document.body.scrollHeight || height);
	const scaleX = full.width / bodyW;
	const scaleY = full.height / bodyH;

	const out = document.createElement('canvas');
	out.width = width;
	out.height = height;
	const ctx = out.getContext('2d');
	if (ctx === null) throw new Error('handyman: 2d canvas unavailable');
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(
		full,
		window.scrollX * scaleX,
		window.scrollY * scaleY,
		width * scaleX,
		height * scaleY,
		0,
		0,
		width,
		height,
	);

	return { screenshot: out.toDataURL('image/png'), viewport: { width, height } };
}
