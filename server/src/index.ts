// Handyman proxy server: Bun + Hono. Holds the H / Gradium keys; serves the
// demo app and the built widget; /api/step runs the Holo agent-loop turn.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join, resolve, sep } from 'node:path';
import { config } from './config.ts';
import { StepError } from './errors.ts';
import { log } from './logger.ts';
import { stepRequestSchema } from './schema.ts';
import { handleStep } from './step.ts';

const DEMO_DIR = resolve(import.meta.dir, '../../apps/demo');
const WIDGET_DIST = resolve(import.meta.dir, '../../packages/core/dist');
// tsup emits <entry>.global.js for format iife; entry may be renamed later.
const WIDGET_CANDIDATES = ['handyman.global.js', 'index.global.js', 'handyman.js'];

const app = new Hono();

app.use('*', cors()); // permissive — demo server

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
			fixture: res.fixture,
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

// Demo app static files.
app.get('*', async (c) => {
	let pathname = decodeURIComponent(new URL(c.req.url).pathname);
	if (pathname.endsWith('/')) pathname += 'index.html';
	const target = resolve(join(DEMO_DIR, pathname));
	if (target !== DEMO_DIR && !target.startsWith(DEMO_DIR + sep)) {
		return c.text('Not found', 404);
	}
	const candidates = target.includes('.') ? [target] : [target, `${target}.html`];
	for (const candidate of candidates) {
		const file = Bun.file(candidate);
		if (await file.exists()) return new Response(file);
	}
	return c.text('Not found', 404);
});

const server = Bun.serve({ port: config.port, fetch: app.fetch });
log.info('handyman server listening', {
	port: server.port,
	fixtures_mode: config.fixturesMode,
	record_mode: config.recordMode,
	voice_enabled: Boolean(config.gradiumApiKey),
});
