// Structured JSON-line logging. Never log secret values.

type Level = 'info' | 'warn' | 'error';
type LogFields = Record<string, unknown>;

function emit(level: Level, msg: string, fields?: LogFields): void {
	console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields }));
}

export const log = {
	info: (msg: string, fields?: LogFields): void => emit('info', msg, fields),
	warn: (msg: string, fields?: LogFields): void => emit('warn', msg, fields),
	error: (msg: string, fields?: LogFields): void => emit('error', msg, fields),
};
