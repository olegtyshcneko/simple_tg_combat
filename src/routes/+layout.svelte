<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(html),
	:global(body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		background-color: #050607; /* Match the darkest background color */
	}
</style>
