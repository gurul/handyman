// Handyman proxy server: Bun + Hono. Holds the H / Gradium keys; serves the
// built widget; /api/step runs the Holo agent-loop turn.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join, resolve } from 'node:path';
import { config } from './config.ts';
import { StepError } from './errors.ts';
import { log } from './logger.ts';
import { stepRequestSchema } from './schema.ts';
import { handleStep } from './step.ts';

const WIDGET_DIST = resolve(import.meta.dir, '../../packages/core/dist');
// tsup emits <entry>.global.js for format iife; entry may be renamed later.
const WIDGET_CANDIDATES = ['handyman.global.js', 'index.global.js', 'handyman.js'];

const app = new Hono();

// Private Network Access: a public site (https://…) reaching this loopback
// proxy (the <script> embed, which fetches from the page itself) triggers
// Chrome's PNA preflight. cors() answers OPTIONS and returns, so stamp the PNA
// header onto its response afterward — registered before cors() so this wraps
// it. (The extension is exempt: its fetches come from the service worker.)
app.use('*', async (c, next) => {
	const pna = c.req.header('Access-Control-Request-Private-Network') === 'true';
	await next();
	if (pna) c.res.headers.set('Access-Control-Allow-Private-Network', 'true');
});

app.use('*', cors()); // permissive — local proxy for whatever site you're on

app.post('/api/step', async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'invalid JSON body' }, 400);
	}
	const parsed = stepRequestSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: 'invalid StepRequest', issues: parsed.error.issues }, 400);
	}
	const started = Date.now();
	try {
		const res = await handleStep(parsed.data);
		log.info('step served', {
			session_id: parsed.data.session_id,
			event: parsed.data.event,
			tool: res.step.tool_call.tool_name,
			ms: Date.now() - started,
		});
		return c.json(res);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		log.error('step failed', { session_id: parsed.data.session_id, error: message });
		if (err instanceof StepError) return c.json({ error: err.message }, err.status);
		return c.json({ error: `step failed: ${message}` }, 502);
	}
});

app.get('/api/voice-token', async (c) => {
	if (!config.gradiumApiKey) {
		return c.json(
			{ error: 'GRADIUM_API_KEY is not configured on the server; voice is disabled.' },
			503,
		);
	}
	try {
		const res = await fetch('https://api.gradium.ai/api/api-keys/token', {
			headers: { 'x-api-key': config.gradiumApiKey },
		});
		if (!res.ok) {
			log.error('gradium token exchange failed', { status: res.status });
			return c.json({ error: `gradium token exchange failed (${res.status})` }, 502);
		}
		// Single-use ephemeral token: { token, expires_at } — forward as-is.
		return c.json(await res.json());
	} catch (err) {
		log.error('gradium token exchange failed', {
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'gradium token exchange failed' }, 502);
	}
});

// Scout module is built by another agent in server/scout — mount best-effort.
try {
	const scoutModulePath = '../scout/router.ts';
	const { scoutRouter } = await import(scoutModulePath);
	app.route('/api/scout', scoutRouter);
	log.info('scout router mounted at /api/scout');
} catch {
	log.info('scout router not available; skipping /api/scout');
}

// Built widget bundle.
app.get('/handyman.js', async (c) => {
	for (const name of WIDGET_CANDIDATES) {
		const file = Bun.file(join(WIDGET_DIST, name));
		if (await file.exists()) {
			return new Response(file, {
				headers: { 'content-type': 'text/javascript; charset=utf-8' },
			});
		}
	}
	return c.json(
		{ error: 'widget bundle not built — run `bun run build` in packages/core' },
		404,
	);
});

const server = Bun.serve({ port: config.port, fetch: app.fetch });
log.info('handyman server listening', {
	port: server.port,
	model_enabled: Boolean(config.haiApiKey),
	voice_enabled: Boolean(config.gradiumApiKey),
});
