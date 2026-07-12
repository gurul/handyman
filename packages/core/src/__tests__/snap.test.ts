import { stubRect } from './setup.ts';
import { afterEach, describe, expect, it } from 'bun:test';
import { snapToElement } from '../snap.ts';

const VIEWPORT = { width: 1000, height: 800 };

function stubHit(el: Element | null): void {
	document.elementFromPoint = () => el;
}

describe('snapToElement', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('climbs from a nested span to the interactive button ancestor', () => {
		const button = document.createElement('button');
		stubRect(button, 50, 60, 120, 40);
		const span = document.createElement('span');
		span.textContent = 'Save';
		button.appendChild(span);
		document.body.appendChild(button);
		stubHit(span);

		const { el, rect } = snapToElement(500, 500, VIEWPORT);
		expect(el).toBe(button);
		expect(rect.left).toBe(50);
		expect(rect.width).toBe(120);
	});

	it('recognizes role-based interactive ancestors', () => {
		const tab = document.createElement('div');
		tab.setAttribute('role', 'tab');
		stubRect(tab, 10, 10, 80, 30);
		const inner = document.createElement('div');
		tab.appendChild(inner);
		document.body.appendChild(tab);
		stubHit(inner);

		expect(snapToElement(100, 100, VIEWPORT).el).toBe(tab);
	});

	it('anchor needs an href to count as interactive', () => {
		const a = document.createElement('a');
		document.body.appendChild(a);
		stubHit(a);
		expect(snapToElement(100, 100, VIEWPORT).el).toBe(a);
		expect(snapToElement(100, 100, VIEWPORT).rect.width).toBe(48);

		a.setAttribute('href', '/somewhere');
		stubRect(a, 5, 5, 60, 20);
		expect(snapToElement(100, 100, VIEWPORT).rect.width).toBe(60);
	});

	it('returns a 48x48 rect centered on the scaled point when nothing interactive', () => {
		const div = document.createElement('div');
		document.body.appendChild(div);
		stubHit(div);

		// nx 500/1000 * 1000 = 500px, ny 500/1000 * 800 = 400px.
		const { rect } = snapToElement(500, 500, VIEWPORT);
		expect(rect.width).toBe(48);
		expect(rect.height).toBe(48);
		expect(rect.left).toBe(500 - 24);
		expect(rect.top).toBe(400 - 24);
	});

	it('stops climbing after 5 hops', () => {
		const button = document.createElement('button');
		let parent: HTMLElement = button;
		for (let i = 0; i < 6; i++) {
			const d = document.createElement('div');
			parent.appendChild(d);
			parent = d;
		}
		document.body.appendChild(button);
		stubHit(parent); // 6 hops from the button → out of reach

		const { el, rect } = snapToElement(500, 500, VIEWPORT);
		expect(el).toBe(parent);
		expect(rect.width).toBe(48);
	});

	it('never snaps to handyman UI', () => {
		const fab = document.createElement('button');
		fab.setAttribute('data-handyman', 'fab');
		document.body.appendChild(fab);
		stubHit(fab);

		const { el, rect } = snapToElement(990, 990, VIEWPORT);
		expect(el).toBeNull();
		expect(rect.width).toBe(48);
	});
});
