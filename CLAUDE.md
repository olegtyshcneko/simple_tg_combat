# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram bot + SvelteKit web app hybrid. The bot echoes messages and provides a `/profile` command that opens a web page showing verified user profile data. Uses Telegram's HMAC-SHA256 signature validation for authentication.

**Stack:** SvelteKit (Node adapter) + Vite 7 + TypeScript + Svelte 5

## Common Commands

```bash
# Development
npm run dev                     # Start dev server at http://localhost:5173
npm run check                   # Run Svelte type checking
npm run check:watch             # Type checking in watch mode

# Production
npm run build                   # Build for production
npm run start                   # Run production build (node build)

# Telegram setup (requires .env configured)
npm run telegram:commands:set   # Register /start and /profile commands
npm run telegram:webhook:set    # Register webhook URL with Telegram
```

## Architecture

**Routes (src/routes/):**
- `/api/telegram/webhook` - POST endpoint receiving Telegram updates, echoes messages, handles /start, /hello, /profile commands
- `/api/telegram/verify-login` - POST endpoint validating Telegram login widget signatures
- `/profile` - User profile page with dual auth: WebApp SDK `initData` or login widget

**Server-side Telegram logic (src/lib/server/telegram.ts):**
- `sendTelegramMessage()` - Send messages via Telegram Bot API
- `validateTelegramWebAppData()` - Validate WebApp SDK initData signature
- `validateTelegramLoginWidget()` - Validate login widget auth data
- Both use HMAC-SHA256 with bot token derivatives

**Client-side (src/lib/telegram.ts):**
- Lazy loads Telegram WebApp SDK from `telegram-web-app.js`
- Falls back to login widget when SDK unavailable

**Environment variables (.env):**
- `TELEGRAM_BOT_TOKEN` - Required, from @BotFather
- `APP_BASE_URL` - Required, your domain for webhook/profile links
- `PUBLIC_TELEGRAM_BOT_USERNAME` - Required, bot username without @
- `WEBHOOK_SECRET_TOKEN` - Optional, validates webhook requests
- `LOG_REQUESTS` - Optional, enable HTTP request logging

## Key Patterns

- Webhook always returns 200 to prevent Telegram retries; errors logged to console
- Auth data expires after 24 hours
- Uses Svelte 5 runes (`$state`, `$props`, `$effect`)
- TypeScript strict mode enabled
- Global Telegram SDK types in `src/app.d.ts`
