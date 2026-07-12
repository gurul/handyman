// SVG arrow pointer. Two-wrapper trick from the reference: the OUTER wrapper
// travels (a requestAnimationFrame tween arcs its transform from the current
// spot to the target), the INNER wrapper idle-bobs on a keyframe animation, so
// travel and bob never fight over `transform`. dockTo still uses a one-shot CSS
// transition for the shrink-to-FAB landing.

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

// Travel tuning. Duration scales with distance so long trips take a beat
// longer (no teleport feel) and short hops stay snappy — clamped both ends.
const TRAVEL_SPEED = 1.6; // px per ms of glide
const TRAVEL_MIN_MS = 350;
const TRAVEL_MAX_MS = 900;
// How far the path bows out perpendicular to the straight line, so the cursor
// arcs like a hand-guided move instead of sliding on a rail. Fraction of the
// trip distance, capped so big trips don't swing wildly.
const ARC_BOW = 0.2;
const ARC_BOW_CAP = 60;

// easeInOutCubic — accelerate away, settle into the target.
function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function prefersReducedMotion(): boolean {
	try {
		return (
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	} catch {
		return false;
	}
}

const CAN_RAF =
	typeof requestAnimationFrame === 'function' &&
	typeof cancelAnimationFrame === 'function';

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
	/* Fallback only. Travel is driven per-frame by rAF (which sets an inline
	   transition without a transform component so it can't double-animate);
	   dockTo sets its own transform transition inline for the landing. */
	transition: opacity 300ms ease;
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

	// Logical state the tween interpolates: pointer CENTER (cx, cy) and arrow
	// rotation. `placed` gates the first appearance — a fresh (hidden/docked)
	// pointer snaps to its first target instead of gliding in from a stale spot.
	let curX = HALF;
	let curY = HALF;
	let curRot = 0;
	let placed = false;
	let rafId: number | null = null;

	function cancelTween(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	// Low-level: paint the OUTER wrapper transform. The inner bob wrapper owns
	// the idle bob / press dip on its own transform, so glide never fights bob.
	function place(cx: number, cy: number, rot: number, scale = 1): void {
		wrap.style.transform = `translate(${cx - HALF}px, ${cy - HALF}px) rotate(${rot}deg)${scale !== 1 ? ` scale(${scale})` : ''}`;
	}

	// Jump straight to a target with no transform transition (first placement
	// or reduced-motion). Records state so a later glide starts from here.
	function snap(x: number, y: number, rot: number): void {
		cancelTween();
		curX = x;
		curY = y;
		curRot = rot;
		placed = true;
		wrap.style.transition = 'opacity 300ms ease';
		place(x, y, rot);
	}

	// Glide the OUTER wrapper from its current position to (x, y, rot) along a
	// gently bowed quadratic Bézier, driven frame-by-frame so it reads as the
	// cursor travelling across the page. Ends EXACTLY on target (the ring/card
	// share this geometry, so drift would misalign them).
	function travel(x: number, y: number, rot: number): void {
		cancelTween();
		const dx = x - curX;
		const dy = y - curY;
		const dist = Math.hypot(dx, dy);

		// First show, reduced motion, no rAF, or a negligible move → snap.
		if (!placed || dist < 1 || prefersReducedMotion() || !CAN_RAF) {
			snap(x, y, rot);
			return;
		}

		const fromX = curX;
		const fromY = curY;
		const fromRot = curRot;
		// Shortest angular path so the arrow never spins the long way round.
		const dRot = ((rot - fromRot + 540) % 360) - 180;

		// Control point: midpoint pushed perpendicular to the travel line.
		const midX = (fromX + x) / 2;
		const midY = (fromY + y) / 2;
		const bow = Math.min(dist * ARC_BOW, ARC_BOW_CAP);
		const nX = -dy / dist; // unit normal to the straight line
		const nY = dx / dist;
		const ctrlX = midX + nX * bow;
		const ctrlY = midY + nY * bow;

		const duration = Math.min(
			TRAVEL_MAX_MS,
			Math.max(TRAVEL_MIN_MS, dist / TRAVEL_SPEED),
		);
		// rAF paints every frame — the CSS transform transition must be off or
		// it would double-animate and overshoot. Opacity keeps its ease.
		wrap.style.transition = 'opacity 300ms ease';
		const start = performance.now();

		const step = (now: number): void => {
			const t = Math.min(1, (now - start) / duration);
			const e = easeInOutCubic(t);
			const u = 1 - e;
			// Quadratic Bézier B(e) = u²·from + 2·u·e·ctrl + e²·to.
			const px = u * u * fromX + 2 * u * e * ctrlX + e * e * x;
			const py = u * u * fromY + 2 * u * e * ctrlY + e * e * y;
			const pr = fromRot + dRot * e;
			// Track live position so an interrupting travel() starts from here.
			curX = px;
			curY = py;
			curRot = pr;
			place(px, py, pr);
			if (t < 1) {
				rafId = requestAnimationFrame(step);
			} else {
				rafId = null;
				curX = x;
				curY = y;
				curRot = rot;
				place(x, y, rot); // land exactly on target
			}
		};
		rafId = requestAnimationFrame(step);
	}

	return {
		show(): void {
			// Intentionally does NOT reset `placed`: between steps the pointer
			// stays visible and should GLIDE to the next target. Only hide()/
			// dockTo (true disappearance) reset it so a fresh entrance snaps.
			wrap.style.display = '';
			wrap.style.opacity = '1';
			bob.className = 'handyman-pointer__bob';
		},
		hide(): void {
			cancelTween();
			wrap.style.display = 'none';
			placed = false;
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
			travel(x, y, SIDE_ROT[side]);
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
			// Stop any in-flight glide so the dock owns the transform, then land
			// via a CSS transition (reduced motion → instant).
			cancelTween();
			bob.className = ''; // Bob pauses so the dock isn't mid-hop.
			const dockMs = prefersReducedMotion() ? 0 : DOCK_MS;
			wrap.style.transition = `transform ${dockMs}ms ease, opacity 300ms ease`;
			curX = x;
			curY = y;
			curRot = 0;
			place(x, y, 0, 0.5);
			return new Promise((resolve) => {
				setTimeout(() => {
					wrap.style.display = 'none';
					placed = false; // next entrance snaps in fresh
					resolve();
				}, dockMs);
			});
		},
		destroy(): void {
			cancelTween();
			wrap.remove();
		},
	};
}
