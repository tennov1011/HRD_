<script>
	import { onMount } from 'svelte';
	import { userRole, userDepartment, userName } from '$lib/services/firebaseConfig';

	let showLogoutModal = false;

	function openLogoutModal() {
		showLogoutModal = true;
	}
	function closeLogoutModal() {
		showLogoutModal = false;
	}

	async function handleLogout() {
		showLogoutModal = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('directus_token');
		}
		try {
			const authModule = await import('$lib/services/firebaseConfig');
			if (authModule.logout) {
				await authModule.logout();
			}
		} catch (e) {
			console.warn('Logout error:', e);
		}
		window.location.href = '/login';
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
	/>
</svelte:head>

<header
	class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 flex items-center justify-between"
>
	<!-- Judul -->
	<div class="text-xl font-bold">
		Dashboard Admin <br />
		<span class="text-sm font-light font-mono" style="font-family: Monaco, monospace;">
			"Guiding Every Request, Fulfilling Every Need"
		</span>
	</div>

	<!-- Navigasi -->
	<nav class="flex items-center space-x-4">
		<!-- User Info -->
		<div class="flex items-center bg-blue-600 rounded-lg px-4 py-2.5">
			<div class="flex items-center space-x-3">
				<!-- Avatar -->
				<div
					class="w-7 h-7 bg-white text-blue-700 rounded-full flex items-center justify-center text-sm font-bold"
				>
					👤
				</div>
				<!-- User Details -->
				<div class="text-center leading-tight">
					<div class="text-sm font-medium">{$userName}</div>
					<div class="text-xs opacity-70">{$userDepartment}</div>
				</div>
				<!-- Logout Icon -->
				<div class="relative">
					<button class="flex flex-col items-center" on:click={openLogoutModal}>
						<!-- Ikon Logout -->
						<svg
							class="w-4 h-4 text-white opacity-70 hover:opacity-100 transition-opacity duration-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>

						<!-- Teks Logout di bawah ikon -->
						<span
							class="text-xs mt-1 text-white opacity-60 hover:opacity-100 transition-opacity duration-300"
						>
							Logout
						</span>
					</button>
				</div>
			</div>
		</div>
	</nav>
</header>

<!-- Tambahkan modal konfirmasi sebelum logout -->
{#if showLogoutModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-xs w-full text-center">
			<div class="mb-4 text-lg font-semibold text-gray-800">Konfirmasi Logout</div>
			<div class="mb-6 text-gray-600">Apakah Anda yakin ingin logout?</div>
			<div class="flex justify-center gap-4">
				<button
					on:click={handleLogout}
					class="px-5 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition"
					>OK</button
				>
				<button
					on:click={closeLogoutModal}
					class="px-5 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition"
					>Cancel</button
				>
			</div>
		</div>
	</div>
{/if}
