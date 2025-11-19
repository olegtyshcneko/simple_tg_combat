import process from 'node:process';

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.APP_BASE_URL;
const secret = process.env.WEBHOOK_SECRET_TOKEN;

if (!token) {
	console.error('TELEGRAM_BOT_TOKEN is required');
	process.exit(1);
}

if (!baseUrl) {
	console.error('APP_BASE_URL is required to set the webhook URL');
	process.exit(1);
}

const webhookUrl = new URL('/api/telegram/webhook', baseUrl.replace(/\/+$/, '')).toString();

async function main() {
	const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			url: webhookUrl,
			secret_token: secret
		})
	});

	const data = await response.json();
	if (!data.ok) {
		console.error('Failed to set webhook:', data);
		process.exit(1);
	}

	console.log('Webhook configured:', data);
	console.log('Webhook URL:', webhookUrl);
}

main().catch((error) => {
	console.error('Unexpected error while setting webhook', error);
	process.exit(1);
});
