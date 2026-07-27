import { beforeEach, describe, expect, it } from 'bun:test';
import {
	getSession,
	MAX_MESSAGES_PER_SESSION,
	MAX_SESSIONS,
	resetSessions,
	sessionCount,
	trimHistory,
	type Session,
} from '../sessions.ts';

describe('session store', () => {
	beforeEach(() => {
		resetSessions();
	});

	it('reuses an existing session and resets it only when fresh', () => {
		const first = getSession('s1', 'how do I save?', true);
		first.messages.push({ role: 'system', content: 'prompt' });

		expect(getSession('s1', 'how do I save?', false).messages.length).toBe(1);
		expect(getSession('s1', 'how do I save?', true).messages.length).toBe(0);
		expect(sessionCount()).toBe(1);
	});

	it('evicts the least-recently-accessed session past the cap', () => {
		for (let i = 0; i < MAX_SESSIONS; i++) {
			getSession(`s${i}`, 'q', true).messages.push({ role: 'system', content: 'p' });
		}
		expect(sessionCount()).toBe(MAX_SESSIONS);

		// Date.now() is only ms-granular, so make the victim unambiguously oldest
		// rather than relying on the loop above spanning distinct milliseconds.
		getSession('s0', 'q', false).lastAccess = 0;

		getSession('overflow', 'q', true);

		expect(sessionCount()).toBe(MAX_SESSIONS);
		// A session that was never the oldest kept its history.
		expect(getSession('s1', 'q', false).messages.length).toBe(1);
		// s0 is gone: asking for it again mints an empty conversation. Asserted
		// last, because this very call re-adds s0 and evicts the next-oldest.
		expect(getSession('s0', 'q', false).messages.length).toBe(0);
	});

	it('trims history to the cap, keeping the system prompt and newest turns', () => {
		const session: Session = {
			id: 's1',
			question: 'q',
			messages: [{ role: 'system', content: 'prompt' }],
			lastToolName: null,
			lastAccess: Date.now(),
		};
		const turns = MAX_MESSAGES_PER_SESSION + 40;
		for (let i = 0; i < turns; i++) {
			session.messages.push({ role: 'user', content: `turn ${i}` });
		}

		trimHistory(session);

		expect(session.messages.length).toBe(MAX_MESSAGES_PER_SESSION + 1);
		expect(session.messages[0]).toEqual({ role: 'system', content: 'prompt' });
		// The oldest turns are the ones dropped; the newest survives.
		expect(session.messages[1]).toEqual({
			role: 'user',
			content: `turn ${turns - MAX_MESSAGES_PER_SESSION}`,
		});
		expect(session.messages.at(-1)).toEqual({
			role: 'user',
			content: `turn ${turns - 1}`,
		});
	});

	it('leaves a short history untouched', () => {
		const session: Session = {
			id: 's1',
			question: 'q',
			messages: [
				{ role: 'system', content: 'prompt' },
				{ role: 'user', content: 'obs' },
			],
			lastToolName: null,
			lastAccess: Date.now(),
		};

		trimHistory(session);

		expect(session.messages.length).toBe(2);
	});
});
