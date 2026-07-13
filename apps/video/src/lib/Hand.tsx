// The handyman buddy hand — exact geometry from packages/core/src/hand.ts
// (POSES.open / POSES.pointer, viewBox and mirror included), so the video
// draws the SAME hand the widget renders. Two poses cover the video's needs:
// `open` (five straight strokes) and `pointer` (thumb+index strokes, three
// curled-fingertip dots).
//
// Parents animate placement (translate/rotate/scale); this component only
// owns per-finger reveal (stroke draw-on for lines, scale-pop for dots) via
// `reveal` in [0,1], staggered thumb → pinky.

import React from 'react';
import { interpolate } from 'remotion';
import { FINGER_TINTS, FINGER_ORDER, PAPER, INK, type FingerName } from './tokens';

export const HAND_VIEWBOX = '-297 -264 595 625';
/** Aspect ratio height/width of the viewBox (625/595). */
export const HAND_ASPECT = 625 / 595;

const OPEN_LINES: Record<FingerName, { x1: number; y1: number; x2: number; y2: number }> = {
	thumb: { x1: -62.614, y1: 302.668, x2: -238.854, y2: 152.503 },
	index: { x1: -58.299, y1: 53.64, x2: -169.76, y2: -149.304 },
	middle: { x1: 19.092, y1: 15.25, x2: -49.209, y2: -205.985 },
	ring: { x1: 100.978, y1: 38.951, x2: 76.116, y2: -191.248 },
	pinky: { x1: 173.022, y1: 106.083, x2: 209.528, y2: -122.559 },
};

const POINTER_LINES: Partial<Record<FingerName, { x1: number; y1: number; x2: number; y2: number }>> = {
	thumb: { x1: -102.522, y1: 214.24, x2: -152.091, y2: -3.407 },
	index: { x1: -132.216, y1: -3.311, x2: -242.031, y2: -197.651 },
};

const POINTER_DOTS: Partial<Record<FingerName, { cx: number; cy: number; r: number }>> = {
	middle: { cx: -57.603, cy: 22.953, r: 72 },
	ring: { cx: 4.455, cy: 40.398, r: 72 },
	pinky: { cx: 62.533, cy: 69.58, r: 72 },
};

const STROKE_OPEN = 115.769;
const STROKE_POINTER = 111.61;

export type HandPalette = 'tints' | 'paper' | 'ink';

function fingerColor(finger: FingerName, palette: HandPalette): string {
	if (palette === 'paper') return PAPER;
	if (palette === 'ink') return INK;
	return FINGER_TINTS[finger];
}

/** Per-finger reveal window: thumb starts first, pinky last, each finger
 *  takes 45% of the total reveal. */
function fingerReveal(reveal: number, index: number): number {
	const start = (index / FINGER_ORDER.length) * 0.55;
	return interpolate(reveal, [start, start + 0.45], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
}

export const Hand: React.FC<{
	pose?: 'open' | 'pointer';
	width: number;
	palette?: HandPalette;
	/** 0..1 staggered draw-on; default 1 (fully drawn). */
	reveal?: number;
	/** Skip the engine's X-mirror so the pointer aims left instead of right. */
	flip?: boolean;
	style?: React.CSSProperties;
}> = ({ pose = 'open', width, palette = 'tints', reveal = 1, flip = false, style }) => {
	const strokeWidth = pose === 'pointer' ? STROKE_POINTER : STROKE_OPEN;
	const lines = pose === 'pointer' ? POINTER_LINES : OPEN_LINES;
	const dots = pose === 'pointer' ? POINTER_DOTS : {};
	return (
		<svg
			viewBox={HAND_VIEWBOX}
			width={width}
			height={width * HAND_ASPECT}
			fill="none"
			style={style}
		>
			<g transform={flip ? undefined : 'scale(-1 1)'}>
				{FINGER_ORDER.map((finger, i) => {
					const r = fingerReveal(reveal, i);
					if (r <= 0) return null;
					const line = lines[finger];
					if (line) {
						const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
						return (
							<line
								key={finger}
								x1={line.x1}
								y1={line.y1}
								x2={line.x2}
								y2={line.y2}
								stroke={fingerColor(finger, palette)}
								strokeWidth={strokeWidth}
								strokeLinecap="butt"
								strokeDasharray={len}
								strokeDashoffset={len * (1 - r)}
							/>
						);
					}
					const dot = dots[finger];
					if (dot) {
						return (
							<circle
								key={finger}
								cx={dot.cx}
								cy={dot.cy}
								r={dot.r * r}
								fill={fingerColor(finger, palette)}
							/>
						);
					}
					return null;
				})}
			</g>
		</svg>
	);
};
