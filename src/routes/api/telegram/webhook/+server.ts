import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMessage, type TelegramMessage, type TelegramUpdate } from '$lib/server/telegram';

export const POST: RequestHandler = async ({ request }) => {
	if (env.WEBHOOK_SECRET_TOKEN) {
		const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token');
		if (incomingSecret !== env.WEBHOOK_SECRET_TOKEN) {
			return json({ ok: false, error: 'unauthorized' }, { status: 401 });
		}
	}

	let update: TelegramUpdate | null = null;
	try {
		update = (await request.json()) as TelegramUpdate;
	} catch (error) {
		console.error('Failed to parse Telegram update', error);
		return json({ ok: false, error: 'invalid payload' }, { status: 400 });
	}

	if (update?.message) {
		try {
			await handleMessage(update.message);
		} catch (error) {
			console.error('Error handling Telegram message', error);
		}
	}

	// Always return 200 to avoid webhook retries flooding the server.
	return json({ ok: true });
};

const PROFILE_PATH = '/profile';

function profileUrl() {
	if (!env.APP_BASE_URL) return null;
	return `${env.APP_BASE_URL.replace(/\/+$/, '')}${PROFILE_PATH}`;
}

async function handleMessage(message: TelegramMessage) {
	const chatId = message.chat.id;
	const text = (message.text ?? '').trim();

	if (!text) return;

	if (text.startsWith('/start') || text.startsWith('/hello')) {
		await sendMessage(
			chatId,
			'👋 Hey there! Send me any text and I will echo it back. Use /profile to open the web login.'
		);
		return;
	}

	if (text.startsWith('/profile')) {
		const url = profileUrl();
		const button =
			url !== null
				? {
						reply_markup: {
							inline_keyboard: [
								[
									{ text: 'Open profile', web_app: { url } },
									{ text: 'Open in browser', url }
								]
							]
						}
				  }
				: undefined;

		const hint = url
			? 'Tap the button to open the login page.'
			: 'Set APP_BASE_URL in your env to send the login link.';

		await sendMessage(chatId, `Profile web app\n${hint}`, {
			disable_web_page_preview: true,
			...(button ?? {})
		});
		return;
	}

	await sendMessage(chatId, `🔊 Echo: ${text}`);
}
