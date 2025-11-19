# Simple Telegram bot + SvelteKit web app

One Telegram webhook that echoes messages, plus a `/profile` command that opens a SvelteKit page using the Telegram Login widget and WebApp data to show the verified user profile. Ready to deploy on Railway.

## Stack
- SvelteKit (Adapter Node) + Vite + TypeScript
- Telegram webhook endpoint at `/api/telegram/webhook`
- Telegram login verification endpoint at `/api/telegram/verify-login`
- Minimal scripts to set commands and webhook

## Prerequisites
- Node.js 20+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Railway account (for deployment)

## Environment variables
Copy `.env.example` to `.env` and fill in:

```
TELEGRAM_BOT_TOKEN=12345:abc
WEBHOOK_SECRET_TOKEN=choose-a-random-string
APP_BASE_URL=https://your-domain.example.com
PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername   # without the leading @
PORT=4173                                       # Railway sets this automatically in production
```

- `APP_BASE_URL` is used in webhook replies to link to `/profile`.
- `WEBHOOK_SECRET_TOKEN` is optional but recommended; it must match the secret you pass to Telegram when setting the webhook.

## Local development
```sh
npm install
npm run dev
# or open browser automatically
npm run dev -- --open
```

- Webhook endpoint: `http://localhost:5173/api/telegram/webhook`
- Profile page: `http://localhost:5173/profile`

## Bot setup (webhook + commands)
After your app is reachable at `APP_BASE_URL` (locally via a tunnel or after deploying), run:

```sh
# Set bot commands (/start, /profile)
npm run telegram:commands:set

# Register webhook (requires APP_BASE_URL and optional WEBHOOK_SECRET_TOKEN)
npm run telegram:webhook:set
```

Both scripts call Telegram’s HTTP API; they rely on the env vars above. The webhook handler:
- Responds to any text with an echo
- `/start` or `/hello` sends a short intro
- `/profile` replies with inline buttons pointing to the `/profile` page (both `web_app` and normal URL buttons are sent)

## Railway deployment
1) Create a new Railway service from this repo or push via `railway up`.
2) In **Variables**, set:
   - `TELEGRAM_BOT_TOKEN`
   - `WEBHOOK_SECRET_TOKEN`
   - `APP_BASE_URL` (use the Railway domain, e.g. `https://your-app.up.railway.app`)
   - `PUBLIC_TELEGRAM_BOT_USERNAME`
3) In **Deployments**:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
4) Deploy.
5) After the deployment URL is live, run the setup scripts again so Telegram points to the live webhook:
   ```sh
   railway run npm run telegram:commands:set
   railway run npm run telegram:webhook:set
   ```

## What the `/profile` page does
- If opened via the Telegram `web_app` button, it verifies the provided `initData` signature on the server.
- If opened in a browser, it renders the Telegram Login widget. On successful login, it verifies the signature via `/api/telegram/verify-login` before showing the profile.
- If verification fails, the page surfaces the error instead of rendering user details.

## Production run (local)
```sh
npm run build
npm run start
```

## Notes
- Keep your bot token secret; never commit `.env`.
- If you rotate your Railway domain, update `APP_BASE_URL` and re-run the webhook script.
- The webhook route always returns 200 to prevent Telegram from retrying repeatedly; errors are logged to the console.
