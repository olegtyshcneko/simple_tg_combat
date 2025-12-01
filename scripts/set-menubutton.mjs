import process from 'node:process';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
	console.error('TELEGRAM_BOT_TOKEN is required');
	process.exit(1);
}

const appUrl = process.env.APP_BASE_URL;

if (!appUrl) {
	console.error('APP_BASE_URL is required');
	process.exit(1);
}

const gameUrl = `${appUrl.replace(/\/+$/, '')}/game`;

async function main() {
	// Set default menu button for all users
	const response = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			menu_button: {
				type: 'web_app',
				text: 'Play Game',
				web_app: { url: gameUrl }
			}
		})
	});

	const data = await response.json();
	if (!data.ok) {
		console.error('Failed to set menu button:', data);
		process.exit(1);
	}

	console.log('Menu button set successfully:', data);
	console.log(`Game URL: ${gameUrl}`);
	console.log('\nNote: Menu button opens in smaller window.');
	console.log('For fullscreen on desktop, configure Direct Link Mini App in BotFather:');
	console.log('  1. Send /newapp to @BotFather');
	console.log('  2. Select your bot');
	console.log('  3. Set Web App URL:', gameUrl);
	console.log('  4. Set short name: game');
	console.log('  5. Then users can open via t.me/YOUR_BOT/game (opens fullscreen)');
}

main().catch((error) => {
	console.error('Unexpected error while setting menu button', error);
	process.exit(1);
});
