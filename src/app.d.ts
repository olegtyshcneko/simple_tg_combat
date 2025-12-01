// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface TelegramWebApp {
		initData?: string;
		platform?: "ios" | "android" | "desktop" | "web";
		ready?: () => void;
		expand?: () => void;
		requestFullscreen?: () => void;
		disableVerticalSwipes?: () => void;
		safeAreaInset?: { top: number; bottom: number; left: number; right: number };
		contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
	}

	interface TelegramAPI {
		WebApp?: TelegramWebApp;
	}

	interface Window {
		Telegram?: TelegramAPI;
		onTelegramAuth?: (user: TelegramAuthPayload) => void;
	}

	type TelegramAuthPayload = {
		id: number;
		first_name: string;
		last_name?: string;
		username?: string;
		photo_url?: string;
		auth_date: string | number;
		hash: string;
	};
}

export { };
