import crypto from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';

export type TelegramUser = {
	id: number;
	is_bot?: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	photo_url?: string;
	auth_date?: string;
	hash?: string;
};

export type TelegramChat = {
	id: number;
	type: string;
	title?: string;
	username?: string;
	first_name?: string;
	last_name?: string;
};

export type TelegramMessage = {
	message_id: number;
	message_thread_id?: number;
	from?: TelegramUser;
	date: number;
	text?: string;
	chat: TelegramChat;
};

export type TelegramUpdate = {
	update_id: number;
	message?: TelegramMessage;
};

export type TelegramReplyMarkup =
	| {
			inline_keyboard: Array<Array<{ text: string; url?: string; web_app?: { url: string } }>>;
	  }
	| undefined;

type TelegramApiResponse<T> = {
	ok: boolean;
	result?: T;
	description?: string;
	error_code?: number;
};

const LOGIN_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

function getBotToken(): string {
	const token = privateEnv.TELEGRAM_BOT_TOKEN;
	if (!token) {
		throw new Error('TELEGRAM_BOT_TOKEN is not set');
	}

	return token;
}

export async function sendTelegramRequest<T>(
	method: string,
	body: Record<string, unknown>
): Promise<T> {
	const token = getBotToken();
	const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});

	const data = (await response.json()) as TelegramApiResponse<T>;
	if (!data.ok || data.result === undefined) {
		throw new Error(
			`Telegram API error ${data.error_code ?? ''}: ${data.description ?? 'unknown error'}`
		);
	}

	return data.result;
}

export function sendMessage(
	chatId: number,
	text: string,
	options: {
		reply_markup?: TelegramReplyMarkup;
		disable_web_page_preview?: boolean;
		parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
	} = {}
) {
	return sendTelegramRequest('sendMessage', {
		chat_id: chatId,
		text,
		...options
	});
}

export function validateTelegramLogin(
	params: URLSearchParams,
	{ maxAgeSeconds = LOGIN_MAX_AGE_SECONDS }: { maxAgeSeconds?: number } = {}
): { ok: boolean; user?: TelegramUser; reason?: string } {
	const hash = params.get('hash');
	if (!hash) {
		return { ok: false, reason: 'Missing hash parameter' };
	}

	const botToken = getBotToken();
	const authDate = Number(params.get('auth_date'));
	if (!Number.isFinite(authDate)) {
		return { ok: false, reason: 'Missing auth_date' };
	}

	const nowSeconds = Math.floor(Date.now() / 1000);
	if (nowSeconds - authDate > maxAgeSeconds) {
		return { ok: false, reason: 'Login signature is too old' };
	}

	const dataCheckString = Array.from(params.entries())
		.filter(([key]) => key !== 'hash')
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n');

	const isWebAppData = params.has('query_id'); // query_id is present for WebApp initData
	const secretKey = isWebAppData
		? crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
		: crypto.createHash('sha256').update(botToken).digest();
	const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

	if (computedHash !== hash) {
		return { ok: false, reason: 'Invalid signature' };
	}

	const inlineUser = params.get('user');
	let parsedInlineUser: Partial<TelegramUser> = {};
	if (inlineUser) {
		try {
			parsedInlineUser = JSON.parse(inlineUser) as TelegramUser;
		} catch (error) {
			console.warn('Failed to parse inline Telegram user payload', error);
		}
	}

	const user: TelegramUser = {
		id: Number(params.get('id') ?? parsedInlineUser.id ?? 0),
		first_name: params.get('first_name') ?? parsedInlineUser.first_name ?? '',
		last_name: params.get('last_name') ?? parsedInlineUser.last_name ?? undefined,
		username: params.get('username') ?? parsedInlineUser.username ?? undefined,
		photo_url: params.get('photo_url') ?? parsedInlineUser.photo_url ?? undefined,
		auth_date: params.get('auth_date') ?? parsedInlineUser.auth_date,
		hash
	};

	return { ok: true, user };
}

export function ensureTrailingSlash(url: string) {
	return url.endsWith('/') ? url : `${url}/`;
}
