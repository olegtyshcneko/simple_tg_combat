<svelte:head>
	<title>Simple TG Combat | Telegram bot + Web App</title>
</svelte:head>

<main class="hero">
	<section class="panel">
		<p class="eyebrow">Telegram bot scaffold</p>
		<h1>Echo webhook + profile web app</h1>
		<p class="lead">
			Use the bot to echo your messages and open the /profile web page for Telegram authentication.
			Deploy-ready for Railway.
		</p>
		<div class="actions">
			<a class="button primary" href="/profile">Open profile page</a>
			<a class="button ghost" href="https://core.telegram.org/bots/webapps" target="_blank"
				>Docs: Telegram Web Apps</a
			>
		</div>
		<p class="note">
			Configure environment variables and run the setup scripts in the README to register your webhook
			and commands with Telegram.
		</p>
	</section>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');

	:global(body) {
		margin: 0;
		font-family: 'Space Grotesk', 'Manrope', 'Segoe UI', sans-serif;
		background: radial-gradient(circle at 20% 20%, #0b1f2f, #05080d 40%), #05080d;
		color: #e8f1f5;
	}

	.hero {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2.5rem 1.5rem;
	}

	.panel {
		max-width: 820px;
		background: rgba(14, 22, 30, 0.75);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 2.25rem;
		box-shadow: 0 28px 60px rgba(0, 0, 0, 0.45);
	}

	h1 {
		margin: 0.2rem 0 0.8rem;
		font-size: clamp(2rem, 3vw + 1rem, 2.8rem);
		line-height: 1.1;
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.75rem;
		color: #7dd0ff;
	}

	.lead {
		color: #a8b9c9;
		font-size: 1.05rem;
		margin: 0 0 1.5rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.2rem;
		border-radius: 12px;
		text-decoration: none;
		font-weight: 600;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.button.primary {
		background: linear-gradient(135deg, #21c8f6, #6f86d6);
		color: #04111a;
		box-shadow: 0 10px 30px rgba(33, 200, 246, 0.3);
	}

	.button.ghost {
		color: #dbe9f5;
	}

	.note {
		color: #7f93a8;
		margin: 0.5rem 0 0;
	}

	@media (max-width: 640px) {
		.panel {
			padding: 1.6rem;
		}

		.actions {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
