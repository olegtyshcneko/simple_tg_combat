import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const started = Date.now();
	const response = await resolve(event);

	// Lightweight request log for debugging API traffic (especially Telegram callbacks)
	if (event.url.pathname.startsWith('/api/telegram')) {
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
