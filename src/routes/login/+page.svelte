<!-- src/routes/login/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import Footer from '$lib/component/Footer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	export let form;
	let loading = false;

	// Handle successful login redirect
	$: if (form?.success && form?.redirect) {
		// Redirect to dashboard instead of admin
		const redirectPath = form.redirect === '/admin' ? '/dashboard' : form.redirect;
		goto(redirectPath);
	}

	onMount(() => {
		if (browser) {
			// Clear localStorage
			localStorage.clear();

			// Clear sessionStorage
			sessionStorage.clear();

			// Clear cookies
			document.cookie.split(';').forEach(function (c) {
				document.cookie = c
					.replace(/^ +/, '')
					.replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
			});

			// Prevent back navigation to protected pages
			window.history.replaceState(null, '', '/login');
		}
	});
</script>

<svelte:head>
	<title>Login - Feedback Form</title>
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8"
	style="background: linear-gradient(135deg, #4CAF50 0%, #81C784 50%, #A5D6A7 100%);"
>
	<div class="fixed top-16 left-1/2 z-50 flex -translate-x-1/2 transform justify-center">
		<h1 class="typewriter text-6xl font-extrabold text-white drop-shadow-lg">Eltama Prima Indo</h1>
	</div>
	<div class="mt-16 w-full max-w-md space-y-8">
		<!-- Header -->
		<div class="text-center">
			<div
				class="bg-opacity-20 border-opacity-30 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white bg-white shadow-lg backdrop-blur-sm"
			>
				<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
			</div>
			<h2 class="text-3xl font-bold text-white drop-shadow-md">Login ke Sistem</h2>
			<p class="text-opacity-90 mt-2 text-sm text-white">HRD Management System</p>
		</div>

		<!-- Login Form -->
		<div
			class="bg-opacity-95 border-opacity-30 rounded-2xl border border-white bg-white px-6 py-8 shadow-2xl backdrop-blur-sm"
		>
			<form
				method="POST"
				class="space-y-6"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						loading = false;
						
						if (result.type === 'success') {
							// Force redirect to dashboard instead of admin
							setTimeout(() => {
								goto('/dashboard');
							}, 100);
						} else if (result.type === 'redirect') {
							// Intercept redirect and change to dashboard
							const redirectPath = result.location === '/admin' ? '/dashboard' : result.location;
							goto(redirectPath);
						} else {
							await update();
						}
					};
				}}
			>
				<!-- Error Message -->
				{#if form?.error}
					<div class="rounded-r-lg border-l-4 border-red-400 bg-red-50 p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-red-700">{form.error}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Email Field -->
				<div>
					<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
						Email Address
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								class="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
								/>
							</svg>
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							value={form?.email || ''}
							disabled={loading}
							class="block w-full rounded-lg border border-gray-300 py-3 pr-3 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
							placeholder="nama@eltama.com"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<svg
								class="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							disabled={loading}
							class="block w-full rounded-lg border border-gray-300 py-3 pr-3 pl-10 text-gray-900 placeholder-gray-500 transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
							placeholder="Masukkan password"
						/>
					</div>
				</div>

				<!-- Login Button -->
				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative flex w-full justify-center rounded-lg border border-transparent bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
					>
						{#if loading}
							<svg
								class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Memproses...
						{:else}
							<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
								/>
							</svg>
							Masuk
						{/if}
					</button>
				</div>

				<!-- Demo Credentials -->
				<div class="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
					<h4 class="mb-2 text-sm font-semibold text-green-800">Demo Credentials:</h4>
					<div class="space-y-1 text-xs text-green-700">
						<div><strong>Admin:</strong> admin@eltama.com / admin123</div>
						<div><strong>HRD:</strong> michael@eltama.com / michael123</div>
						<div><strong>Finance:</strong> sarah@eltama.com / sarah123</div>
					</div>
				</div>
			</form>
		</div>

		<!-- Footer -->
		<Footer />
	</div>
</div>

<style>
	.typewriter {
		overflow: hidden;
		border-right: 0.15em solid #fff;
		white-space: nowrap;
		margin: 0 auto;
		letter-spacing: 0.08em;
		animation:
			typing 3s steps(19, end) infinite,
			blink-caret 0.75s step-end infinite;
		max-width: 19ch;
	}

	@keyframes typing {
		from {
			max-width: 0;
		}
		to {
			max-width: 19ch;
		}
	}

	@keyframes blink-caret {
		from,
		to {
			border-color: transparent;
		}
		50% {
			border-color: #fff;
		}
	}
</style>
