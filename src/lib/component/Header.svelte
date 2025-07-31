<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import NotificationBell from './NotificationBell.svelte';
	import {
		isAuthenticated as authStore,
		setUserStores,
		clearUserStores
	} from '$lib/services/firebaseConfig.js';

	let showLogoutModal = false;
	let showProfileDropdown = false;
	let isLoggingOut = false;

	// Props from layout
	export let user = null;
	export let isAuthenticated = false;

	// Legacy prop for backward compatibility
	export let employee = null;

	// Reactive variables for user info
	let currentUserName = '';
	let currentUserEmail = '';
	let currentUserRole = '';
	let currentUserDepartment = '';
	let authenticated = false;

	// Use props data with fallbacks
	$: authenticated = isAuthenticated;
	$: currentUserName = user?.displayName || user?.nama || employee?.nama_karyawan || 'User';
	$: currentUserEmail = user?.email || employee?.email || '';
	$: currentUserRole = user?.role || employee?.role || 'user';
	$: currentUserDepartment = user?.department || user?.divisi || employee?.divisi || 'General';

	// 🔧 SYNC: Update Svelte stores when props change
	$: {
		if (browser && user && isAuthenticated) {
			// Update stores with current user data using the helper function
			setUserStores({
				authenticated: isAuthenticated,
				role: currentUserRole,
				email: currentUserEmail,
				name: currentUserName,
				department: currentUserDepartment
			});

			console.log('🔄 Header: Updated Svelte stores:', {
				authenticated: isAuthenticated,
				role: currentUserRole,
				email: currentUserEmail,
				name: currentUserName,
				department: currentUserDepartment
			});
		}
	}

	// Function to get user role display name
	function getRoleDisplayName(role) {
		switch (role) {
			case 'admin':
				return 'Administrator';
			case 'manager':
				return 'Manager';
			case 'direktur':
				return 'Direktur Utama';
			case 'user':
				return 'Staff';
			default:
				return 'User';
		}
	}

	// Function to get role badge color
	function getRoleBadgeColor(role) {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'manager':
				return 'bg-blue-100 text-blue-800';
			case 'direktur':
				return 'bg-purple-100 text-purple-800';
			case 'user':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Function to get user avatar initials
	function getUserInitials(name) {
		if (!name) return '👤';
		const names = name.split(' ');
		if (names.length >= 2) {
			return (names[0][0] + names[names.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	// Function to get last login time (simplified)
	function getLastLoginTime() {
		if (browser && localStorage.getItem('login_time')) {
			const loginTimeStr = localStorage.getItem('login_time');
			if (loginTimeStr) {
				const loginTime = new Date(loginTimeStr);
				return loginTime.toLocaleString('id-ID', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
			}
		}
		return 'Baru saja';
	}

	// Set login time when component mounts (if authenticated)
	onMount(() => {
		if (browser && authenticated && !localStorage.getItem('login_time')) {
			localStorage.setItem('login_time', new Date().toISOString());
		}
	});

	// Debug: Log user data to console for troubleshooting
	$: if (browser && user) {
		console.log('Header: User data received:', {
			user,
			currentUserName,
			currentUserEmail,
			currentUserRole,
			currentUserDepartment,
			authenticated
		});
	}

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

	// Handle escape key to close modal
	function handleKeydown(event) {
		if (event.key === 'Escape' && showLogoutModal) {
			closeLogoutModal();
		}
	}

	async function handleLogout() {
		if (isLoggingOut) return; // Prevent multiple logout attempts

		isLoggingOut = true;
		showLogoutModal = false;

		try {
			console.log('Starting logout process...');

			// 🔧 Clear Svelte stores first using helper function
			clearUserStores();
			console.log('🔄 Svelte stores cleared');

			// 1. Clear localStorage
			if (browser && typeof localStorage !== 'undefined') {
				localStorage.removeItem('directus_token');
				localStorage.removeItem('user_session');
				localStorage.removeItem('employee_data');
				localStorage.removeItem('auth_token');
				localStorage.removeItem('login_time');
				// Clear any other auth-related items
				localStorage.clear();
				console.log('localStorage cleared');
			}

			// 2. Clear sessionStorage
			if (browser && typeof sessionStorage !== 'undefined') {
				sessionStorage.clear();
				console.log('sessionStorage cleared');
			}

			// 3. Call server logout endpoint to clear session cookies
			try {
				const response = await fetch('/api/logout', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include' // Important for cookies
				});

				if (response.ok) {
					console.log('Server logout successful');
				} else {
					console.warn('Server logout failed, but continuing...');
				}
			} catch (e) {
				console.warn('Server logout error:', e);
			}

			// 4. Clear cookies (client-side fallback)
			if (browser && typeof document !== 'undefined') {
				document.cookie.split(';').forEach(function (c) {
					document.cookie = c
						.replace(/^ +/, '')
						.replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
				});
				console.log('Client-side cookies cleared');
			}

			// 5. Try to call Firebase logout (if exists)
			try {
				const authModule = await import('$lib/services/firebaseConfig');
				if (authModule.logout) {
					await authModule.logout();
					console.log('Firebase logout successful');
				}
			} catch (e) {
				console.warn('Firebase logout error (this is okay if not using Firebase):', e);
			}

			// 6. Clear browser history to prevent back navigation
			if (browser) {
				// Replace current history entry
				window.history.replaceState(null, '', '/login');

				// Clear forward/back history
				window.history.pushState(null, '', '/login');

				// Prevent back button
				window.addEventListener('popstate', function (event) {
					window.history.pushState(null, '', '/login');
				});
			}

			console.log('Logout process completed, redirecting to login...');

			// 7. Redirect to login page
			if (browser) {
				// Force hard redirect to ensure complete session cleanup
				window.location.href = '/login';
				window.location.replace('/login');
			} else {
				goto('/login', { replaceState: true });
			}
		} catch (error) {
			console.error('Logout error:', error);
			// Force redirect even if there's an error
			if (browser) {
				window.location.href = '/login';
			}
		} finally {
			isLoggingOut = false;
		}
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

	// Global keyboard event listener
	onMount(() => {
		const handleEscape = (event) => {
			if (event.key === 'Escape' && showLogoutModal) {
				closeLogoutModal();
			}
		};

		if (browser) {
			document.addEventListener('keydown', handleEscape);
		}

		return () => {
			if (browser) {
				document.removeEventListener('keydown', handleEscape);
			}
		};
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', handleKeydown);
		}
	});
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
						<h1 class="text-xl font-bold text-gray-800">Dashboard HRD</h1>
						<p class="text-sm font-medium text-gray-600">
							{#if currentUserDepartment}
								Selamat datang di pusat kendali SDM, {getRoleDisplayName(currentUserRole)} - Kelola talenta, pantau kehadiran, dan wujudkan tim hebat hari ini!
							{/if}
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
				<NotificationBell />

				<!-- User Profile Dropdown -->
				<div class="relative">
					<button
						on:click={toggleProfileDropdown}
						class="flex items-center space-x-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
					>
						<!-- Avatar with Initials -->
						<div
							class="bg-opacity-20 flex h-10 w-10 items-center justify-center rounded-lg bg-white backdrop-blur-sm"
						>
							<span class="text-sm font-bold text-white">
								{getUserInitials(currentUserName)}
							</span>
						</div>
						<!-- User Info -->
						<div class="hidden text-left md:block">
							<div class="text-sm font-bold text-white">
								{currentUserName}
							</div>
							<div class="text-xs font-medium text-blue-100">
								{getRoleDisplayName(currentUserRole)} • {currentUserDepartment}
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
							class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
						>
							<!-- User Info Header -->
							<div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
								<div class="flex items-center space-x-4">
									<!-- Avatar -->
									<div
										class="bg-opacity-20 flex h-12 w-12 items-center justify-center rounded-full bg-white backdrop-blur-sm"
									>
										<span class="text-lg font-bold text-white">
											{getUserInitials(currentUserName)}
										</span>
									</div>
									<!-- User Details -->
									<div class="flex-1 text-white">
										<div class="text-sm font-medium">{getGreeting()}</div>
										<div class="text-lg font-bold">{currentUserName}</div>
										<div class="text-sm text-blue-100">{currentUserEmail}</div>
									</div>
								</div>

								<!-- Role Badge -->
								<div class="mt-3 flex items-center justify-between">
									<span
										class="inline-flex items-center rounded-full {getRoleBadgeColor(
											currentUserRole
										)} px-3 py-1 text-xs font-medium"
									>
										{getRoleDisplayName(currentUserRole)}
									</span>
									<span class="text-xs text-blue-100">
										{currentUserDepartment}
									</span>
								</div>
							</div>

							<!-- Menu Items -->
							<div class="py-2">
								<!-- User Info Section -->
								<div class="border-b border-gray-100 px-4 py-3">
									<div class="mb-2 text-xs text-gray-500">Informasi Akun</div>
									<div class="space-y-1">
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Status:</span>
											<span class="font-medium text-green-600">
												{#if authenticated}
													● Online
												{:else}
													● Offline
												{/if}
											</span>
										</div>
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Login sebagai:</span>
											<span class="font-medium text-gray-800"
												>{getRoleDisplayName(currentUserRole)}</span
											>
										</div>
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Waktu login:</span>
											<span class="font-medium text-gray-800">{getLastLoginTime()}</span>
										</div>
									</div>
								</div>

								<!-- Logout Button -->
								<div class="px-2 py-2">
									<button
										on:click={openLogoutModal}
										class="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-red-50"
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
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</header>

<!-- Logout Modal dengan desain yang lebih modern -->
{#if showLogoutModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
		on:click={closeLogoutModal}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="logout-modal-title"
		aria-describedby="logout-modal-description"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="mx-4 w-full max-w-md transform rounded-2xl bg-white p-8 shadow-2xl transition-all"
			on:click|stopPropagation
			role="document"
		>
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
				<h3 id="logout-modal-title" class="mb-2 text-xl font-bold text-gray-800">
					Konfirmasi Logout
				</h3>
				<p id="logout-modal-description" class="text-gray-600">
					Apakah Anda yakin ingin keluar dari sistem?
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex space-x-3">
				<button
					on:click={closeLogoutModal}
					disabled={isLoggingOut}
					class="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					Batal
				</button>
				<button
					on:click={handleLogout}
					disabled={isLoggingOut}
					class="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoggingOut}
						<div class="flex items-center justify-center">
							<svg
								class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
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
							Logging out...
						</div>
					{:else}
						Ya, Logout
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
