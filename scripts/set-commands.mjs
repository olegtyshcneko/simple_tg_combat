import process from 'node:process';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
	console.error('TELEGRAM_BOT_TOKEN is required');
	process.exit(1);
}

async function main() {
	const response = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			commands: [
				{ command: 'start', description: 'Start the bot and see instructions' },
				{ command: 'profile', description: 'Open the web app login page' }
			]
		})
	});

	const data = await response.json();
	if (!data.ok) {
		console.error('Failed to set commands:', data);
		process.exit(1);
	}

	console.log('Commands set:', data);
}

main().catch((error) => {
	console.error('Unexpected error while setting commands', error);
	process.exit(1);
});
