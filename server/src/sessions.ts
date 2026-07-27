// In-memory per-session conversation store with a ~30min TTL sweep, a ceiling on
// live sessions, and a ceiling on how long any one conversation may grow.

export type TextPart = { type: 'text'; text: string };
export type ImagePart = { type: 'image_url'; image_url: { url: string } };
export type MessagePart = TextPart | ImagePart;

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string | MessagePart[];
}

export interface Session {
	id: string;
	question: string;
	messages: ChatMessage[];
	/** tool_name of the last step returned, for <tool_output tool="..."> wrappers. */
	lastToolName: string | null;
	lastAccess: number;
}

const TTL_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Ceiling on live sessions.
 *
 * The TTL sweep only runs every 5 minutes, so between sweeps the map is
 * unbounded: every distinct session_id the widget sends mints an entry, and each
 * entry holds a whole conversation. A burst — or any client looping on /api/step
 * with fresh ids — grows the heap until the next sweep. On overflow the
 * least-recently-accessed session is dropped: a stale tour losing its history is
 * recoverable (the widget just starts a new one), an OOM is not.
 */
export const MAX_SESSIONS = 500;

/**
 * Ceiling on messages retained per session, excluding the system prompt.
 *
 * Every turn appends up to three messages (tool_output, observation, assistant
 * step), so a long tour grows the prefill without bound — and prefill is most of
 * the per-step latency the user feels after a click. Screenshots are already
 * evicted down to the newest one (step.ts, trimToLastNImages), so what
 * accumulates here is text; 200 turns of it is still real cost for no gain,
 * because the durable state the model needs rides in `note` and the recent turns.
 *
 * Trimming drops the OLDEST entries and always keeps the system prompt at index
 * 0 — dropping that would silently strip the tool contract mid-tour.
 */
export const MAX_MESSAGES_PER_SESSION = 60;

const sessions = new Map<string, Session>();

/** Drop least-recently-accessed sessions until the map is back within cap. */
function evictOverflow(): void {
	while (sessions.size > MAX_SESSIONS) {
		let oldestId: string | null = null;
		let oldestAccess = Infinity;
		// Map iteration is insertion-ordered, so equal timestamps (Date.now() is
		// only ms-granular) resolve to the earliest-inserted session.
		for (const [id, session] of sessions) {
			if (session.lastAccess < oldestAccess) {
				oldestAccess = session.lastAccess;
				oldestId = id;
			}
		}
		if (oldestId === null) return;
		sessions.delete(oldestId);
	}
}

/**
 * Trim a session's history in place to MAX_MESSAGES_PER_SESSION, preserving a
 * leading system prompt. Called by the pipeline after it appends a turn.
 */
export function trimHistory(session: Session): void {
	const keepFrom = session.messages[0]?.role === 'system' ? 1 : 0;
	const body = session.messages.length - keepFrom;
	if (body <= MAX_MESSAGES_PER_SESSION) return;
	session.messages.splice(keepFrom, body - MAX_MESSAGES_PER_SESSION);
}

/** Get the session for `id`, creating (or resetting, when `fresh`) as needed. */
export function getSession(id: string, question: string, fresh: boolean): Session {
	let session = sessions.get(id);
	if (!session || fresh) {
		session = {
			id,
			question,
			messages: [],
			lastToolName: null,
			lastAccess: Date.now(),
		};
		sessions.set(id, session);
		evictOverflow();
	}
	session.lastAccess = Date.now();
	return session;
}

/** Live session count — diagnostics and tests. */
export function sessionCount(): number {
	return sessions.size;
}

/** Drop every session. Tests only; the server never resets its own store. */
export function resetSessions(): void {
	sessions.clear();
}

const sweeper = setInterval(() => {
	const now = Date.now();
	for (const [id, session] of sessions) {
		if (now - session.lastAccess > TTL_MS) sessions.delete(id);
	}
}, SWEEP_INTERVAL_MS);
sweeper.unref?.();
