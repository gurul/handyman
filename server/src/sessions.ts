// In-memory per-session conversation store with a ~30min TTL sweep.

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
	/** Replay position when serving from fixtures. */
	fixtureCursor: number;
	lastAccess: number;
}

const TTL_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const sessions = new Map<string, Session>();

/** Get the session for `id`, creating (or resetting, when `fresh`) as needed. */
export function getSession(id: string, question: string, fresh: boolean): Session {
	let session = sessions.get(id);
	if (!session || fresh) {
		session = {
			id,
			question,
			messages: [],
			lastToolName: null,
			fixtureCursor: 0,
			lastAccess: Date.now(),
		};
		sessions.set(id, session);
	}
	session.lastAccess = Date.now();
	return session;
}

const sweeper = setInterval(() => {
	const now = Date.now();
	for (const [id, session] of sessions) {
		if (now - session.lastAccess > TTL_MS) sessions.delete(id);
	}
}, SWEEP_INTERVAL_MS);
sweeper.unref?.();
