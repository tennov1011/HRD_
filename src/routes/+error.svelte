<script context="module">
	export let status;
	export let message;
</script>

<svelte:head>
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<main class="error-page">
	<h1>Oops!</h1>
	<p class="status">Error {status}</p>
	<p class="message">{message}</p>
	<a href="/">← Kembali ke Beranda</a>
</main>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		text-align: center;
		background-color: #f9f9f9;
		color: #333;
	}

	.status {
		font-size: 2rem;
		font-weight: bold;
		margin: 1rem 0;
	}

	.message {
		font-size: 1rem;
		color: #777;
		margin-bottom: 2rem;
	}

	a {
		text-decoration: none;
		color: #0d6efd;
		font-weight: 500;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
