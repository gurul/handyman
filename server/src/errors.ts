import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Pipeline error carrying the HTTP status the route should return. */
export class StepError extends Error {
	constructor(
		message: string,
		readonly status: ContentfulStatusCode,
	) {
		super(message);
		this.name = 'StepError';
	}
}
