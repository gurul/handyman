// Central env access. Handlers read from here, never from process.env directly.

export interface Config {
	port: number;
	haiApiKey: string | undefined;
	gradiumApiKey: string | undefined;
}

export const config: Config = {
	port: Number(process.env.PORT) || 3000,
	haiApiKey: process.env.HAI_API_KEY || undefined,
	gradiumApiKey: process.env.GRADIUM_API_KEY || undefined,
};
