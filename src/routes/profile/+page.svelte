<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let user = $state(data.user);
	let validationError = $state(data.validationError);
	let loading = $state(false);
	let imageError = $state(false);

	const botUsername = data.botUsername;

	onMount(async () => {
		if (user) return;
		const tg = await loadTelegramWebApp();
		if (!tg) {
			validationError =
				"Telegram Web App SDK unavailable. Use the login button below or open from Telegram.";
			return;
		}
		tg.requestFullscreen?.();

		const handleAuth = async (payload: TelegramAuthPayload) => {
			loading = true;
			try {
				const verified = await postForUser({ authData: payload });
				user = verified;
				validationError = null;
			} catch (error) {
				validationError =
					error instanceof Error
						? error.message
						: "Failed to reach verification endpoint.";
			} finally {
				loading = false;
			}
		};

		// Expose a global hook for the Telegram login widget
		window.onTelegramAuth = handleAuth;

		if (!tg?.initData) return;

		loading = true;
		try {
			const verified = await postForUser({ initData: tg.initData });
			user = verified;
			validationError = null;
		} catch (error) {
			validationError =
				error instanceof Error
					? error.message
					: "Failed to reach verification endpoint.";
		} finally {
			loading = false;
			tg.ready?.();
		}
	});

	type VerificationRequest =
		| { initData: string; authData?: never }
		| { authData: TelegramAuthPayload; initData?: never };

	async function postForUser(payload: VerificationRequest) {
		const response = await fetch("/api/telegram/verify-login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		});
		const json = await response.json();
		if (!response.ok || !json.ok) {
			throw new Error(json.error ?? "Unable to verify Telegram login.");
		}
		return json.user;
	}

	let telegramWebAppPromise: Promise<TelegramWebApp | null> | null = null;
	function loadTelegramWebApp(): Promise<TelegramWebApp | null> {
		if (window.Telegram?.WebApp) {
			return Promise.resolve(window.Telegram.WebApp);
		}

		if (!telegramWebAppPromise) {
			telegramWebAppPromise = new Promise((resolve, reject) => {
				const script = document.createElement("script");
				script.src = "https://telegram.org/js/telegram-web-app.js";
				script.async = true;
				script.onload = () => resolve(window.Telegram?.WebApp ?? null);
				script.onerror = () =>
					reject(new Error("Failed to load Telegram Web App SDK"));
				document.head.appendChild(script);
			});
		}

		return telegramWebAppPromise;
	}
</script>

<svelte:head>
	<title>Telegram Auth | Simple TG Combat</title>
</svelte:head>

<main class="page">
	<section class="card">
		<h1>Telegram profile viewer</h1>
		{#if user}
			<p class="muted">
				Signature verified. Here is what Telegram shared with us.
			</p>
			<div class="profile">
				{#if user.photo_url && !imageError}
					<img
						src={user.photo_url}
						alt={`Profile photo for ${user.first_name}`}
						loading="lazy"
						referrerpolicy="no-referrer"
						onerror={() => (imageError = true)}
					/>
				{:else}
					<div class="avatar-fallback">
						{user.first_name?.[0] ?? "?"}
					</div>
				{/if}
				<div>
					<p class="name">
						{user.first_name}
						{user.last_name}
					</p>
					{#if user.username}
						<p class="username">@{user.username}</p>
					{/if}
					<p class="muted">User ID: {user.id}</p>
				</div>
			</div>
		{:else}
			<p class="muted">
				Use the Telegram login widget below to prove your identity. We
				verify the signature on the server before showing your profile.
			</p>
			{#if validationError}
				<p class="error">{validationError}</p>
			{/if}
			{#if loading}
				<p class="muted">Verifying Telegram Web App session...</p>
			{/if}
			{#if botUsername}
				<div class="widget">
					<script
						src="https://telegram.org/js/telegram-widget.js?22"
						data-telegram-login={botUsername}
						data-size="large"
						data-request-access="write"
						data-onauth="onTelegramAuth(user)"
						async
					></script>
				</div>
				<p class="muted">
					You may need to log in or switch to the Telegram app to
					complete auth.
				</p>
			{:else}
				<p class="error">
					Set PUBLIC_TELEGRAM_BOT_USERNAME to render the login widget.
				</p>
			{/if}
		{/if}
	</section>
</main>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap");

	.page {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 2rem;
		box-sizing: border-box;
		background: radial-gradient(circle at 10% 20%, #1b2a33, #0c1014 35%),
			#050607;
		color: #e8f1f5;
		font-family: "Space Grotesk", "Manrope", "Segoe UI", sans-serif;
	}

	.card {
		margin: auto;
		background: rgba(12, 16, 20, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 18px;
		padding: 2rem;
		max-width: 720px;
		width: 100%;
		box-shadow: 0 22px 50px rgba(0, 0, 0, 0.4);
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.7rem;
	}

	.muted {
		color: #9fb3c8;
		margin: 0.4rem 0 1.2rem;
	}

	.profile {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
	}

	img {
		width: 96px;
		height: 96px;
		border-radius: 16px;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.08);
	}

	.avatar-fallback {
		width: 96px;
		height: 96px;
		border-radius: 16px;
		background: linear-gradient(145deg, #1d2f3c, #0f1820);
		border: 2px solid rgba(255, 255, 255, 0.08);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
		font-weight: 700;
		color: #cfe6ff;
	}

	.name {
		margin: 0;
		font-weight: 700;
		font-size: 1.3rem;
	}

	.username {
		margin: 0.2rem 0;
		color: #7dd0ff;
	}

	.widget {
		display: inline-flex;
		justify-content: flex-start;
		align-items: center;
		padding: 1rem 0;
	}

	.error {
		color: #ff8f8f;
		margin: 0.5rem 0;
	}

	@media (max-width: 640px) {
		.card {
			padding: 1.4rem;
		}

		.profile {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
