import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateTelegramLogin } from '$lib/server/telegram';

type AuthDataPayload = {
	id: number;
	hash: string;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: string | number;
};

type VerifyPayload =
	| { initData: string; authData?: never }
	| { authData: AuthDataPayload; initData?: never };

export const POST: RequestHandler = async ({ request }) => {
	let body: VerifyPayload;
	try {
		body = (await request.json()) as VerifyPayload;
	} catch (error) {
		return json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
	}

	let params: URLSearchParams | null = null;

	if ('initData' in body && typeof body.initData === 'string') {
		params = new URLSearchParams(body.initData);
	} else if ('authData' in body && body.authData) {
		params = new URLSearchParams(
			Object.entries(body.authData).map(([key, value]) => [key, String(value ?? '')])
		);
	}

	if (!params) {
		return json(
			{ ok: false, error: 'Provide initData or authData to verify Telegram login' },
			{ status: 400 }
		);
	}

	const validation = validateTelegramLogin(params);
	if (!validation.ok || !validation.user) {
		console.warn('Telegram login verification failed', {
			reason: validation.reason ?? 'validation_error'
		});
		return json(
			{ ok: false, error: validation.reason ?? 'Failed to validate Telegram login' },
			{ status: 400 }
		);
	}

	console.info('Telegram login verified', { user_id: validation.user.id, username: validation.user.username });
	return json({ ok: true, user: validation.user });
};
