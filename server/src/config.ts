// Central env access. Handlers read from here, never from process.env directly.

export interface Config {
	port: number;
	haiApiKey: string | undefined;
	gradiumApiKey: string | undefined;
	/** Serve /api/step from fixture files (explicit flag, or no HAI key). */
	fixturesMode: boolean;
	/** Record live /api/step turns to fixture files. */
	recordMode: boolean;
}

export const config: Config = {
	port: Number(process.env.PORT) || 3000,
	haiApiKey: process.env.HAI_API_KEY || undefined,
	gradiumApiKey: process.env.GRADIUM_API_KEY || undefined,
	fixturesMode: process.env.HANDYMAN_FIXTURES === '1' || !process.env.HAI_API_KEY,
	recordMode: process.env.HANDYMAN_RECORD === '1',
};
