// SVG arrow pointer. Two-wrapper trick from the reference: the outer
// wrapper glides via a transform transition, the inner wrapper idle-bobs
// on a keyframe animation, so glide and bob never fight over `transform`.

import type { CutBox, Side } from './overlay.ts';

export interface PointerHandle {
	show(): void;
	hide(): void;
	/** Glide beside the cutout, rotated so the arrow points at the target. */
	pointTo(cut: CutBox, side: Side): void;
	/** Brief press animation (scale dip) before the agent acts. */
	press(): Promise<void>;
	/** Shrink-and-land into the FAB (reference finale), then hide. */
	dockTo(x: number, y: number): Promise<void>;
	destroy(): void;
}

export const POINTER_SIZE = 40;
const HALF = POINTER_SIZE / 2;
// Distance from cutout edge to pointer center.
const EDGE_GAP = 12 + HALF;
const DOCK_MS = 650;
const PRESS_MS = 300;

// Plain cursor-arrow polygon, tip at top center pointing straight up.
// High-contrast fill + outline stroke so it reads on any background.
export const POINTER_SVG = `<svg class="handyman-pointer__svg" width="${POINTER_SIZE}" height="${POINTER_SIZE}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M20 3 L29 29 L21.5 25.5 L24 36 L18.5 37.5 L16 27 L10 32 Z" fill="var(--handyman-ink, #16161a)" stroke="var(--handyman-paper, #fff)" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

// The arrow art points up; rotate the whole wrapper so it points at the
// target from whichever side it sits on.
const SIDE_ROT: Record<Side, number> = {
	bottom: 0, // below the target, pointing up
	top: 180, // above, pointing down
	left: 90, // left of target, pointing right
	right: -90, // right of target, pointing left
};

const POINTER_CSS = `
:host {
	position: fixed;
	top: 0;
	left: 0;
	width: ${POINTER_SIZE}px;
	height: ${POINTER_SIZE}px;
	transition: transform 500ms ease, opacity 300ms ease;
	will-change: transform;
	pointer-events: none;
}
.handyman-pointer__bob {
	animation: handyman-bob 2.4s ease-in-out infinite;
}
.handyman-pointer__bob--press {
	animation: handyman-press ${PRESS_MS}ms ease;
}
@keyframes handyman-bob {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-5px); }
}
@keyframes handyman-press {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(0.8); }
}
@media (prefers-reduced-motion: reduce) {
	:host { transition-duration: 0ms !important; }
	.handyman-pointer__bob, .handyman-pointer__bob--press { animation: none !important; }
}
`;

export function createPointer(opts: { zIndex: number }): PointerHandle {
	const wrap = document.createElement('div');
	wrap.className = 'handyman-pointer';
	wrap.setAttribute('data-handyman', 'pointer');
	wrap.setAttribute('aria-hidden', 'true');
	wrap.style.zIndex = String(opts.zIndex);
	// Shadow-isolate so host CSS can't restyle the arrow; the host div keeps
	// [data-handyman] + the glide transform (styled via :host in POINTER_CSS).
	const shadow = wrap.attachShadow({ mode: 'open' });

	const style = document.createElement('style');
	style.textContent = POINTER_CSS;
	shadow.appendChild(style);

	const bob = document.createElement('div');
	bob.className = 'handyman-pointer__bob';
	bob.innerHTML = POINTER_SVG;
	shadow.appendChild(bob);

	document.body.appendChild(wrap);
	wrap.style.display = 'none';

	function place(cx: number, cy: number, rot: number, scale = 1): void {
		wrap.style.transform = `translate(${cx - HALF}px, ${cy - HALF}px) rotate(${rot}deg)${scale !== 1 ? ` scale(${scale})` : ''}`;
	}

	return {
		show(): void {
			wrap.style.display = '';
			wrap.style.opacity = '1';
			bob.className = 'handyman-pointer__bob';
		},
		hide(): void {
			wrap.style.display = 'none';
		},
		pointTo(cut: CutBox, side: Side): void {
			const cx = cut.left + cut.width / 2;
			const cy = cut.top + cut.height / 2;
			let x = cx;
			let y = cy;
			switch (side) {
				case 'right':
					x = cut.left + cut.width + EDGE_GAP;
					break;
				case 'left':
					x = cut.left - EDGE_GAP;
					break;
				case 'bottom':
					y = cut.top + cut.height + EDGE_GAP;
					break;
				case 'top':
					y = cut.top - EDGE_GAP;
					break;
			}
			place(x, y, SIDE_ROT[side]);
		},
		press(): Promise<void> {
			bob.className = 'handyman-pointer__bob--press';
			return new Promise((resolve) => {
				setTimeout(() => {
					bob.className = 'handyman-pointer__bob';
					resolve();
				}, PRESS_MS);
			});
		},
		dockTo(x: number, y: number): Promise<void> {
			// Bob pauses for the landing so the dock isn't mid-hop.
			bob.className = '';
			place(x, y, 0, 0.5);
			wrap.style.transition = `transform ${DOCK_MS}ms ease, opacity 300ms ease`;
			return new Promise((resolve) => {
				setTimeout(() => {
					wrap.style.display = 'none';
					wrap.style.transition = 'transform 500ms ease, opacity 300ms ease';
					resolve();
				}, DOCK_MS);
			});
		},
		destroy(): void {
			wrap.remove();
		},
	};
}
