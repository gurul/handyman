import { describe, expect, it } from 'bun:test';
import { DEFAULT_PORT, parsePort } from '../config.ts';

describe('parsePort', () => {
	it('defaults when PORT is unset or blank', () => {
		expect(parsePort(undefined)).toBe(DEFAULT_PORT);
		expect(parsePort('')).toBe(DEFAULT_PORT);
		expect(parsePort('   ')).toBe(DEFAULT_PORT);
	});

	it('accepts a valid port', () => {
		expect(parsePort('8080')).toBe(8080);
		expect(parsePort('0')).toBe(0);
		expect(parsePort('65535')).toBe(65535);
	});

	// The point of the change: these used to fall through to 3000 silently, so the
	// server came up on a port nobody was pointing at and said nothing about it.
	it('throws on a value that is set but unusable', () => {
		expect(() => parsePort('300O')).toThrow(/invalid PORT/);
		expect(() => parsePort(':3000')).toThrow(/invalid PORT/);
		expect(() => parsePort('3000.5')).toThrow(/invalid PORT/);
		expect(() => parsePort('-1')).toThrow(/invalid PORT/);
		expect(() => parsePort('70000')).toThrow(/invalid PORT/);
	});
});
