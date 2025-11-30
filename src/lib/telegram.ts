let telegramWebAppPromise: Promise<TelegramWebApp | null> | null = null;

export function loadTelegramWebApp(): Promise<TelegramWebApp | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    if (window.Telegram?.WebApp) {
        return Promise.resolve(window.Telegram.WebApp);
    }

    if (!telegramWebAppPromise) {
        telegramWebAppPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-web-app.js';
            script.async = true;
            script.onload = () => resolve(window.Telegram?.WebApp ?? null);
            script.onerror = () => reject(new Error('Failed to load Telegram Web App SDK'));
            document.head.appendChild(script);
        });
    }

    return telegramWebAppPromise;
}
