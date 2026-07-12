// Fixture record/replay for offline demo resilience.
//
// File shape (server/fixtures/<question-slug>.json):
//   { "question": "...", "steps": [{ "request"?: StepRequest-minus-screenshot, "step": Step }, ...] }

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Step, StepRequest } from '../../packages/core/src/types.ts';
import { StepError } from './errors.ts';
import { log } from './logger.ts';
import type { Session } from './sessions.ts';

const FIXTURES_DIR = resolve(import.meta.dir, '../fixtures');

interface FixtureEntry {
	request?: Omit<StepRequest, 'screenshot'>;
	step: Step;
}

interface FixtureFile {
	question: string;
	steps: FixtureEntry[];
}

function words(question: string): string[] {
	return question
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(Boolean);
}

function slugify(question: string): string {
	return words(question).join('-').slice(0, 64) || 'session';
}

async function loadAll(): Promise<FixtureFile[]> {
	let names: string[];
	try {
		names = await readdir(FIXTURES_DIR);
	} catch {
		return [];
	}
	const files: FixtureFile[] = [];
	for (const name of names.filter((n) => n.endsWith('.json'))) {
		try {
			const raw = JSON.parse(await readFile(join(FIXTURES_DIR, name), 'utf8')) as FixtureFile;
			if (typeof raw.question === 'string' && Array.isArray(raw.steps)) files.push(raw);
		} catch {
			log.warn('skipping unreadable fixture file', { file: name });
		}
	}
	return files;
}

/** Exact normalized match first, then best word overlap; null when nothing overlaps. */
function matchFixture(question: string, fixtures: FixtureFile[]): FixtureFile | null {
	const wanted = words(question);
	const wantedSet = new Set(wanted);
	let best: FixtureFile | null = null;
	let bestScore = 0;
	for (const fixture of fixtures) {
		const fixtureWords = words(fixture.question);
		if (fixtureWords.join(' ') === wanted.join(' ')) return fixture;
		const score = fixtureWords.filter((w) => wantedSet.has(w)).length;
		if (score > bestScore) {
			bestScore = score;
			best = fixture;
		}
	}
	return bestScore > 0 ? best : null;
}

/** Serve the next fixture step for this session (cursor clamps at the last step). */
export async function serveFixtureStep(req: StepRequest, session: Session): Promise<Step> {
	const fixture = matchFixture(req.question, await loadAll());
	if (!fixture || fixture.steps.length === 0) {
		throw new StepError(
			`no fixture matches question "${req.question}" (fixture mode is active; set HAI_API_KEY for live steps)`,
			404,
		);
	}
	const index = Math.min(session.fixtureCursor, fixture.steps.length - 1);
	const entry = fixture.steps[index];
	if (!entry) throw new StepError('fixture file has no step at cursor', 502);
	session.fixtureCursor = index + 1;
	log.info('served fixture step', {
		session_id: req.session_id,
		question: fixture.question,
		index,
		total: fixture.steps.length,
	});
	return entry.step;
}

/** Append a live turn (request minus screenshot) to the question's fixture file. */
export async function recordFixture(req: StepRequest, step: Step): Promise<void> {
	await mkdir(FIXTURES_DIR, { recursive: true });
	const name = `${slugify(req.question)}.json`;
	const file = join(FIXTURES_DIR, name);
	let data: FixtureFile = { question: req.question, steps: [] };
	try {
		const existing = JSON.parse(await readFile(file, 'utf8')) as FixtureFile;
		if (typeof existing.question === 'string' && Array.isArray(existing.steps)) data = existing;
	} catch {
		// new fixture file
	}
	const { screenshot: _screenshot, ...request } = req;
	data.steps.push({ request, step });
	await writeFile(file, `${JSON.stringify(data, null, '\t')}\n`);
	log.info('recorded fixture step', { file: name, steps: data.steps.length });
}
