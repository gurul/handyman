import { describe, expect, it } from 'bun:test';
import {
	MAX_QUESTION_CHARS,
	MAX_SCREENSHOT_CHARS,
	MAX_SESSION_ID_CHARS,
	MAX_URL_CHARS,
	MAX_VIEWPORT_PX,
	stepRequestSchema,
	stepSchema,
} from '../schema.ts';

function validRequest(over: Record<string, unknown> = {}): unknown {
	return {
		session_id: 'sess-1',
		question: 'how do I save?',
		screenshot: 'data:image/jpeg;base64,AAAA',
		viewport: { width: 1024, height: 768 },
		event: 'start',
		url: 'https://example.test/app',
		...over,
	};
}

describe('stepRequestSchema', () => {
	it('accepts a well-formed request', () => {
		expect(stepRequestSchema.safeParse(validRequest()).success).toBe(true);
	});

	it('rejects the empty strings it always rejected', () => {
		expect(stepRequestSchema.safeParse(validRequest({ session_id: '' })).success).toBe(
			false,
		);
		expect(stepRequestSchema.safeParse(validRequest({ question: '' })).success).toBe(
			false,
		);
		expect(stepRequestSchema.safeParse(validRequest({ event: 'nope' })).success).toBe(
			false,
		);
	});

	// Bounds exist so an oversized body fails at the boundary instead of being
	// retained in a session's history and billed as model prefill.
	it('rejects fields past their size bound', () => {
		const cases: Array<[string, unknown]> = [
			['screenshot', 'a'.repeat(MAX_SCREENSHOT_CHARS + 1)],
			['question', 'a'.repeat(MAX_QUESTION_CHARS + 1)],
			['url', 'a'.repeat(MAX_URL_CHARS + 1)],
			['session_id', 'a'.repeat(MAX_SESSION_ID_CHARS + 1)],
		];
		for (const [field, value] of cases) {
			const result = stepRequestSchema.safeParse(validRequest({ [field]: value }));
			expect(result.success).toBe(false);
		}
	});

	it('accepts fields exactly at their size bound', () => {
		expect(
			stepRequestSchema.safeParse(
				validRequest({ screenshot: 'a'.repeat(MAX_SCREENSHOT_CHARS) }),
			).success,
		).toBe(true);
		expect(
			stepRequestSchema.safeParse(validRequest({ question: 'a'.repeat(MAX_QUESTION_CHARS) }))
				.success,
		).toBe(true);
	});

	it('rejects a non-positive or absurd viewport', () => {
		expect(
			stepRequestSchema.safeParse(validRequest({ viewport: { width: 0, height: 768 } }))
				.success,
		).toBe(false);
		expect(
			stepRequestSchema.safeParse(
				validRequest({ viewport: { width: MAX_VIEWPORT_PX + 1, height: 768 } }),
			).success,
		).toBe(false);
	});
});

describe('stepSchema', () => {
	it('parses a point call and defaults note to null', () => {
		const parsed = stepSchema.parse({
			thought: 'click save',
			tool_call: {
				tool_name: 'point',
				element: 'the Save button',
				x: 500,
				y: 500,
				instruction: 'Click Save.',
			},
		});
		expect(parsed.note).toBeNull();
		expect(parsed.tool_call.tool_name).toBe('point');
	});

	it('rejects coordinates outside the normalized [0, 1000] range', () => {
		const withCoords = (x: number, y: number): unknown => ({
			thought: 't',
			tool_call: {
				tool_name: 'point',
				element: 'e',
				x,
				y,
				instruction: 'i',
			},
		});
		expect(stepSchema.safeParse(withCoords(1001, 500)).success).toBe(false);
		expect(stepSchema.safeParse(withCoords(500, -1)).success).toBe(false);
		expect(stepSchema.safeParse(withCoords(1000, 0)).success).toBe(true);
	});

	it('defaults press_enter to false on act_write', () => {
		const parsed = stepSchema.parse({
			thought: 't',
			tool_call: {
				tool_name: 'act_write',
				element: 'the name field',
				x: 10,
				y: 10,
				instruction: 'Type the name.',
				content: 'Acme Corp',
			},
		});
		expect(parsed.tool_call).toMatchObject({ tool_name: 'act_write', press_enter: false });
	});
});
