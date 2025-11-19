import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const shouldLogAll = env.LOG_REQUESTS === 'true';

export const handle: Handle = async ({ event, resolve }) => {
	const started = Date.now();
	const response = await resolve(event);

	const shouldLog =
		shouldLogAll || event.url.pathname.startsWith('/api/telegram') || response.status >= 400;

	if (shouldLog) {
		const duration = Date.now() - started;
		console.info('HTTP', {
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs: duration
		});
	}

	return response;
};
