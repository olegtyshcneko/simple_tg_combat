import { env as publicEnv } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';
import { validateTelegramLogin } from '$lib/server/telegram';

export const load: PageServerLoad = async ({ url }) => {
	let validationError: string | null = null;
	let user = null;

	if (url.searchParams.has('hash')) {
		try {
			const validation = validateTelegramLogin(url.searchParams);
			if (validation.ok && validation.user) {
				user = validation.user;
			} else {
				validationError = validation.reason ?? 'Invalid login payload';
			}
		} catch (error) {
			validationError =
				error instanceof Error ? error.message : 'Unexpected error while validating login data';
		}
	}

	return {
		botUsername: publicEnv.PUBLIC_TELEGRAM_BOT_USERNAME,
		user,
		validationError
	};
};
