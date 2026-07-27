// Central env access. Handlers read from here, never from process.env directly.

export interface Config {
	port: number;
	haiApiKey: string | undefined;
	gradiumApiKey: string | undefined;
}

export const DEFAULT_PORT = 3000;

/**
 * Parse PORT, failing loudly on a value that is set but unusable.
 *
 * `Number(raw) || DEFAULT_PORT` silently swallowed typos: `PORT=300O` (letter O)
 * or `PORT=:3000` bound 3000 instead, so the operator got a running server on the
 * wrong port and no hint why nothing could reach it. Unset stays the default —
 * that is a choice, not a typo — but a set-and-invalid value is an error.
 */
export function parsePort(raw: string | undefined): number {
	if (raw === undefined || raw.trim() === '') return DEFAULT_PORT;
	const port = Number(raw);
	if (!Number.isInteger(port) || port < 0 || port > 65535) {
		throw new Error(
			`invalid PORT ${JSON.stringify(raw)}: expected an integer in [0, 65535]`,
		);
	}
	return port;
}

export const config: Config = {
	port: parsePort(process.env.PORT),
	haiApiKey: process.env.HAI_API_KEY || undefined,
	gradiumApiKey: process.env.GRADIUM_API_KEY || undefined,
};
