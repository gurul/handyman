import './setup.ts';
import { afterEach, describe, expect, it } from 'bun:test';
import { findByDescription } from '../session.ts';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('findByDescription — token-scored element resolution', () => {
	it('disambiguates one of many similar buttons by the product noun', () => {
		// Six "Add … to cart" buttons; the model describes the Almond Milk one.
		document.body.innerHTML = `
			<button aria-label="Add Organic Bananas to cart">Add to cart</button>
			<button aria-label="Add Sourdough Loaf to cart">Add to cart</button>
			<button aria-label="Add Almond Milk to cart">Add to cart</button>
			<button aria-label="Add Free-range Eggs to cart">Add to cart</button>`;
		const el = findByDescription(
			"The 'Add to cart' button under the Almond Milk product",
		);
		expect(el?.getAttribute('aria-label')).toBe('Add Almond Milk to cart');
	});

	it('prefers a verbatim quoted label', () => {
		document.body.innerHTML = `
			<a href="/x">New Customer</a>
			<a href="/y">New Invoice</a>`;
		const el = findByDescription("the 'New Invoice' link in the header");
		expect(el?.textContent).toBe('New Invoice');
	});

	it('returns null when nothing shares meaningful tokens', () => {
		document.body.innerHTML = `<button aria-label="Log out">Log out</button>`;
		expect(findByDescription('the shopping basket icon')).toBeNull();
	});

	it('restricts to editable elements when asked', () => {
		document.body.innerHTML = `
			<button aria-label="Customer name help">Customer</button>
			<input aria-label="Customer name" />`;
		const el = findByDescription('the Customer name field', true);
		expect(el?.tagName).toBe('INPUT');
	});
});
