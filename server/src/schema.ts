// The Step JSON schema sent to Holo via structured_outputs, and the zod
// validators used at the HTTP boundary and on model output. Mirrors
// packages/core/src/types.ts — that file is the source of truth.

import { z } from 'zod';
import type { Step } from '../../packages/core/src/types.ts';

/** Hand-written JSON Schema for the Step union (H structured-outputs shape).
 *  Field names/descriptions follow the documented tool conventions. */
export const stepJsonSchema = {
	type: 'object',
	properties: {
		note: {
			type: ['string', 'null'],
			description:
				'Task-relevant information from the previous observation. Empty if nothing new.',
		},
		thought: { type: 'string', description: 'Reasoning about next steps' },
		tool_call: {
			oneOf: [
				{
					type: 'object',
					description:
						'Point at the UI element the user should interact with next; the user performs the click themselves',
					properties: {
						tool_name: { const: 'point' },
						element: {
							type: 'string',
							description: 'Detailed description of the target UI element',
						},
						x: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'X coordinate as integer in [0, 1000]',
						},
						y: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'Y coordinate as integer in [0, 1000]',
						},
						instruction: {
							type: 'string',
							description:
								'One short imperative sentence addressed to the user, spoken aloud',
						},
					},
					required: ['tool_name', 'element', 'x', 'y', 'instruction'],
				},
				{
					type: 'object',
					description:
						"Click the target element on the user's behalf (only when the user asked the agent to act)",
					properties: {
						tool_name: { const: 'act_click' },
						element: {
							type: 'string',
							description: 'Detailed description of the target UI element',
						},
						x: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'X coordinate as integer in [0, 1000]',
						},
						y: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'Y coordinate as integer in [0, 1000]',
						},
						instruction: {
							type: 'string',
							description:
								'One short imperative sentence addressed to the user, spoken aloud',
						},
					},
					required: ['tool_name', 'element', 'x', 'y', 'instruction'],
				},
				{
					type: 'object',
					description:
						"Click the target input and type text into it on the user's behalf (only when the user asked the agent to act)",
					properties: {
						tool_name: { const: 'act_write' },
						element: {
							type: 'string',
							description: 'Detailed description of the target UI element',
						},
						x: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'X coordinate as integer in [0, 1000]',
						},
						y: {
							type: 'integer',
							minimum: 0,
							maximum: 1000,
							description: 'Y coordinate as integer in [0, 1000]',
						},
						instruction: {
							type: 'string',
							description:
								'One short imperative sentence addressed to the user, spoken aloud',
						},
						content: { type: 'string', description: 'Content to write' },
						press_enter: {
							type: 'boolean',
							description: 'Whether to press Enter after typing',
						},
					},
					required: ['tool_name', 'element', 'x', 'y', 'instruction', 'content'],
				},
				{
					type: 'object',
					description:
						"Provide a final answer once the user's question is fully addressed",
					properties: {
						tool_name: { const: 'answer' },
						content: { type: 'string', description: 'The answer content' },
					},
					required: ['tool_name', 'content'],
				},
			],
		},
	},
	required: ['thought', 'tool_call'],
} as const;

// ---- zod validators ----

const coordinate = z.number().int().min(0).max(1000);

const pointCall = z.object({
	tool_name: z.literal('point'),
	element: z.string(),
	x: coordinate,
	y: coordinate,
	instruction: z.string(),
});

const actClickCall = z.object({
	tool_name: z.literal('act_click'),
	element: z.string(),
	x: coordinate,
	y: coordinate,
	instruction: z.string(),
});

const actWriteCall = z.object({
	tool_name: z.literal('act_write'),
	element: z.string(),
	x: coordinate,
	y: coordinate,
	instruction: z.string(),
	content: z.string(),
	press_enter: z.boolean().default(false),
});

const answerCall = z.object({
	tool_name: z.literal('answer'),
	content: z.string(),
});

/** Validates model output parsed from `message.content`. */
export const stepSchema = z.object({
	note: z.string().nullable().default(null),
	thought: z.string(),
	tool_call: z.discriminatedUnion('tool_name', [
		pointCall,
		actClickCall,
		actWriteCall,
		answerCall,
	]),
});

// Compile-time guard: zod output must stay assignable to the shared contract.
type _AssertStepShape = z.output<typeof stepSchema> extends Step ? true : never;
const _assertStepShape: _AssertStepShape = true;
void _assertStepShape;

// --- StepRequest bounds ---
// Every field below was previously unbounded, so any body that parsed as JSON
// was accepted and forwarded straight into the model call. A screenshot is the
// only large field by design; the rest are short. Bounding them here means an
// oversized or malformed body fails fast with a 400 at the boundary instead of
// being held in a session's history and billed as prefill.
//
// MAX_SCREENSHOT_CHARS: both capture paths cap the raster at a 1024px longest
// edge encoded as JPEG (packages/core/src/capture.ts, apps/extension/src/
// background.ts), which lands well under 1 MB of base64 in practice. 8 MB is
// ~10x that headroom — generous enough that no real capture is ever rejected,
// small enough that a runaway body cannot be retained.
export const MAX_SCREENSHOT_CHARS = 8 * 1024 * 1024;
export const MAX_QUESTION_CHARS = 2000;
export const MAX_URL_CHARS = 4096;
export const MAX_SESSION_ID_CHARS = 200;
/** Beyond any real display; guards the coordinate math against absurd input. */
export const MAX_VIEWPORT_PX = 100_000;

const viewportAxis = z.number().positive().max(MAX_VIEWPORT_PX);

/** Validates the widget's StepRequest at the HTTP boundary. */
export const stepRequestSchema = z.object({
	session_id: z.string().min(1).max(MAX_SESSION_ID_CHARS),
	question: z.string().min(1).max(MAX_QUESTION_CHARS),
	screenshot: z.string().max(MAX_SCREENSHOT_CHARS),
	viewport: z.object({ width: viewportAxis, height: viewportAxis }),
	event: z.enum(['start', 'user_acted', 'agent_acted', 'skipped']),
	url: z.string().max(MAX_URL_CHARS),
});
