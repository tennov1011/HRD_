<!-- src/routes/login/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import Footer from '$lib/component/Footer.svelte';

	export let form;

	let loading = false;
</script>

<svelte:head>
	<title>Login - Feedback Form</title>
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
	style="background: linear-gradient(135deg, #4CAF50 0%, #81C784 50%, #A5D6A7 100%);"
>
	<div class="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 flex justify-center">
		<h1 class="typewriter text-6xl font-extrabold text-white drop-shadow-lg">Eltama Prima Indo</h1>
	</div>
	<div class="max-w-md w-full space-y-8 mt-16">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto h-16 w-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-lg border border-white border-opacity-30">
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
			<p class="mt-2 text-sm text-white text-opacity-90">HRD Management System</p>
		</div>

		<!-- Login Form -->
		<div class="bg-white bg-opacity-95 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl border border-white border-opacity-30">
			<form 
				method="POST" 
				class="space-y-6" 
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<!-- Error Message -->
				{#if form?.error}
					<div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
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
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
							class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
							placeholder="nama@eltama.com"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
							class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
							placeholder="Masukkan password"
						/>
					</div>
				</div>

				<!-- Login Button -->
				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
					>
						{#if loading}
							<svg
								class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
							<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
					<h4 class="text-sm font-semibold text-green-800 mb-2">Demo Credentials:</h4>
					<div class="text-xs text-green-700 space-y-1">
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
