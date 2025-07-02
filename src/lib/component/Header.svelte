<script>
	let showLogoutModal = false;
	let showProfileDropdown = false;
	export let employee = null;

	function openLogoutModal() {
		showLogoutModal = true;
		showProfileDropdown = false;
	}

	function closeLogoutModal() {
		showLogoutModal = false;
	}

	function toggleProfileDropdown() {
		showProfileDropdown = !showProfileDropdown;
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

	// Get current time
	let currentTime = new Date();
	setInterval(() => {
		currentTime = new Date();
	}, 1000);

	function formatTime(date) {
		return date.toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function getGreeting() {
		const hour = currentTime.getHours();
		if (hour < 12) return 'Selamat Pagi';
		if (hour < 15) return 'Selamat Siang';
		if (hour < 18) return 'Selamat Sore';
		return 'Selamat Malam';
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
	/>
</svelte:head>

<header class="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-lg">
	<div class="px-6 py-4">
		<div class="flex items-center justify-between">
			<!-- Left Section - Title & Breadcrumb -->
			<div class="flex items-center space-x-4">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
					>
						<span class="text-lg font-bold text-white">HRD</span>
					</div>
					<div>
						<h1 class="text-xl font-bold text-gray-800">Dashboard Admin</h1>
						<p class="text-sm font-medium text-gray-600">
							"Guiding Every Request, Fulfilling Every Need"
						</p>
					</div>
				</div>
			</div>

			<!-- Right Section - Time, Notifications & User Profile -->
			<div class="flex items-center space-x-4">
				<!-- Time Display -->
				<div
					class="hidden items-center space-x-2 rounded-lg bg-slate-50 px-4 py-2.5 shadow-sm md:flex"
				>
					<svg class="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-sm font-semibold text-slate-700">{formatTime(currentTime)}</span>
				</div>

				<!-- Notifications -->
				<button
					class="relative rounded-lg p-2.5 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-800 hover:shadow-sm"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 17h5l-3.5-3.5a4 4 0 011.5-3 6 6 0 00-12 0 4 4 0 011.5 3L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
					<span class="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm"></span>
				</button>

				<!-- User Profile Dropdown -->
				<div class="relative">
					<button
						on:click={toggleProfileDropdown}
						class="flex items-center space-x-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
					>
						<!-- Avatar -->
						<div
							class="bg-opacity-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white backdrop-blur-sm"
						>
							<span class="text-sm font-bold text-white">👤</span>
						</div>
						<!-- User Info -->
						<div class="hidden text-left md:block">
							<div class="text-sm font-bold text-white">
								{employee?.nama_karyawan || 'Admin User'}
							</div>
							<div class="text-xs font-medium text-blue-100">
								{employee?.divisi || 'Administrator'}
							</div>
						</div>
						<!-- Dropdown Arrow -->
						<svg
							class="h-4 w-4 text-white transition-transform {showProfileDropdown
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					<!-- Dropdown Menu -->
					{#if showProfileDropdown}
						<div
							class="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
						>
							<!-- Greeting Section -->
							<div class="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
								<div class="text-white">
									<div class="text-sm font-medium">{getGreeting()}</div>
									<div class="text-lg font-bold">{employee?.nama_karyawan || 'Admin User'}</div>
								</div>
							</div>

							<!-- Menu Items -->
							<div class="py-2">
								<a
									href="/profile"
									class="flex items-center space-x-3 px-4 py-3 transition-colors hover:bg-gray-50"
								>
									<svg
										class="h-4 w-4 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									<span class="text-sm text-gray-700">Profile Saya</span>
								</a>
								<a
									href="/settings"
									class="flex items-center space-x-3 px-4 py-3 transition-colors hover:bg-gray-50"
								>
									<svg
										class="h-4 w-4 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									<span class="text-sm text-gray-700">Pengaturan</span>
								</a>
								<div class="my-1 border-t border-gray-100"></div>
								<button
									on:click={openLogoutModal}
									class="flex w-full items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-red-50"
								>
									<svg
										class="h-4 w-4 text-red-500"
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
									<span class="text-sm font-medium text-red-600">Logout</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</header>

<!-- Logout Modal dengan desain yang lebih modern -->
{#if showLogoutModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
	>
		<div class="mx-4 w-full max-w-md transform rounded-2xl bg-white p-8 shadow-2xl transition-all">
			<!-- Header -->
			<div class="mb-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
				>
					<svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold text-gray-800">Konfirmasi Logout</h3>
				<p class="text-gray-600">Apakah Anda yakin ingin keluar dari sistem?</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex space-x-3">
				<button
					on:click={closeLogoutModal}
					class="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 focus:outline-none"
				>
					Batal
				</button>
				<button
					on:click={handleLogout}
					class="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none"
				>
					Ya, Logout
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Click outside to close dropdown -->
{#if showProfileDropdown}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 z-40" on:click={() => (showProfileDropdown = false)}></div>
{/if}
