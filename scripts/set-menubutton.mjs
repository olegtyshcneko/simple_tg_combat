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

const profileUrl = `${appUrl.replace(/\/+$/, '')}/profile`;

async function main() {
	// Set default menu button for all users
	const response = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			menu_button: {
				type: 'web_app',
				text: 'Profile',
				web_app: { url: profileUrl }
			}
		})
	});

	const data = await response.json();
	if (!data.ok) {
		console.error('Failed to set menu button:', data);
		process.exit(1);
	}

	console.log('Menu button set successfully:', data);
	console.log(`Profile URL: ${profileUrl}`);
}

main().catch((error) => {
	console.error('Unexpected error while setting menu button', error);
	process.exit(1);
});
