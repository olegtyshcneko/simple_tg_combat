<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap");

	:global(:root) {
		--font-body: "Space Grotesk", "Manrope", "Segoe UI", sans-serif;
		--color-bg-dark: #050607;
		--color-bg-panel: rgba(14, 22, 30, 0.75);
		--color-bg-card: rgba(12, 16, 20, 0.88);
		--color-text-primary: #e8f1f5;
		--color-text-secondary: #a8b9c9;
		--color-text-muted: #7f93a8;
		--color-accent: #7dd0ff;
		--color-border: rgba(255, 255, 255, 0.08);
	}

	:global(html),
	:global(body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		background-color: var(--color-bg-dark);
		font-family: var(--font-body);
		color: var(--color-text-primary);
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
