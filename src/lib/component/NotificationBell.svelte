<!-- src/lib/component/NotificationBell.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	/** @type {Array<{id: string, message: string, redirect_url: string, created_at: string}>} */
	let notifications = [];
	let unreadCount = 0;
	let showDropdown = false;
	let isLoading = false;

	/** @type {NodeJS.Timeout | null} */
	let checkStatusTimeout = null;

	// Fetch notifications from API
	async function fetchNotifications() {
		try {
			const response = await fetch('/api/notifications?unread=true');
			const data = await response.json();
			notifications = data.data || [];
			// Update unread count to match actual notifications
			unreadCount = notifications.length;
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	}

	// Check notification status (unread notifications + new applications)
	async function checkNotificationStatus() {
		try {
			const response = await fetch('/api/notifications?action=status');
			const data = await response.json();
			
			if (data.success) {
				const { hasUnreadNotifications, hasNewApplications, unreadCount: serverUnreadCount } = data;
				
				// Update badge visibility: show if there are unread notifications OR new applications
				const shouldShowBadge = hasUnreadNotifications || hasNewApplications;
				unreadCount = shouldShowBadge ? (serverUnreadCount || 1) : 0;
				
				// If there are new applications, auto-sync to create notifications
				if (hasNewApplications) {
					await syncNotifications();
					// Re-check status after sync
					setTimeout(checkNotificationStatus, 1000);
				}
			}
		} catch (error) {
			console.error('Error checking notification status:', error);
		}
	}

	// Auto-sync notifications for new applications
	async function syncNotifications() {
		try {
			const response = await fetch('/api/notifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action: 'sync' })
			});
			
			if (response.ok) {
				const result = await response.json();
				console.log('📩 Notification sync:', result.stats);
				
				// Check status after sync to update badge
				await checkNotificationStatus();
				
				// If dropdown is open, refresh notifications list too
				if (showDropdown) {
					await fetchNotifications();
				}
			}
		} catch (error) {
			console.error('Error syncing notifications:', error);
		}
	}

	// Handle notification click
	async function handleNotificationClick(notification) {
		isLoading = true;
		
		try {
			// Mark as read
			const response = await fetch('/api/notifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					action: 'mark_read',
					id: notification.id 
				})
			});

			if (response.ok) {
				// Remove from local state
				notifications = notifications.filter(n => n.id !== notification.id);
				unreadCount = Math.max(0, unreadCount - 1);

				// Refresh status from server to ensure consistency
				await checkNotificationStatus();
			} else {
				console.error('Failed to mark notification as read:', response.status);
			}

			// Close dropdown
			showDropdown = false;

			// Navigate to the target page
			goto(notification.redirect_url);
		} catch (error) {
			console.error('Error handling notification click:', error);
		} finally {
			isLoading = false;
		}
	}

	// Format time ago
	function formatTimeAgo(dateString) {
		const now = new Date();
		const date = new Date(dateString);
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Baru saja';
		if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours} jam lalu`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays} hari lalu`;
	}

	// Toggle dropdown
	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			// Always fetch fresh notifications and check status when opening dropdown
			fetchNotifications();
			checkNotificationStatus();
		}
	}

	// Expose function to trigger manual refresh (can be called from parent components)
	export function refreshNotifications() {
		checkNotificationStatus();
		if (showDropdown) {
			fetchNotifications();
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.notification-container')) {
			showDropdown = false;
		}
	}

	// Schedule periodic status check (less frequent than polling)
	function scheduleStatusCheck() {
		if (checkStatusTimeout) {
			clearTimeout(checkStatusTimeout);
		}
		
		// Check status every 5 minutes instead of every 30 seconds
		checkStatusTimeout = setTimeout(async () => {
			await checkNotificationStatus();
			scheduleStatusCheck(); // Reschedule next check
		}, 5 * 60 * 1000); // 5 minutes
	}

	onMount(() => {
		// Only run in browser environment
		if (!browser) return;

		// Initial status check
		checkNotificationStatus();

		// Auto-sync on initial load
		syncNotifications();

		// Start periodic status checks (every 5 minutes)
		scheduleStatusCheck();

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		if (checkStatusTimeout) {
			clearTimeout(checkStatusTimeout);
		}
		// Only remove listener if in browser environment
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="notification-container relative">
	<!-- Notification Bell Button -->
	<button
		on:click={toggleDropdown}
		class="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		aria-label="Notifications"
	>
		<!-- Bell Icon -->
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
			/>
		</svg>

		<!-- Badge for unread indicator -->
		{#if unreadCount > 0}
			<span
				class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"
				aria-label="{unreadCount} notifikasi belum dibaca"
			></span>
		{/if}
	</button>

	<!-- Dropdown -->
	{#if showDropdown}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
		>
			<!-- Header -->
			<div class="border-b border-gray-100 px-4 py-3">
				<h3 class="text-sm font-semibold text-gray-900">Notifikasi</h3>
			</div>

			<!-- Notifications List -->
			<div class="max-h-96 overflow-y-auto">
				{#if isLoading}
					<div class="flex items-center justify-center p-4">
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
						<span class="ml-2 text-sm text-gray-500">Loading...</span>
					</div>
				{:else if notifications.length === 0}
					<div class="p-4 text-center text-sm text-gray-500">
						<div class="mb-2">📭</div>
						<div>Semua notifikasi sudah dibaca</div>
						<div class="text-xs mt-1 text-gray-400">Notifikasi baru akan muncul di sini</div>
					</div>
				{:else}
					{#each notifications as notification}
						<button
							on:click={() => handleNotificationClick(notification)}
							class="w-full border-b border-gray-50 p-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none last:border-b-0"
						>
							<div class="flex items-start space-x-3">
								<!-- Icon -->
								<div class="mt-1 flex-shrink-0">
									<div class="h-2 w-2 rounded-full bg-blue-500"></div>
								</div>
								
								<!-- Content -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 leading-tight">
										{notification.message}
									</p>
									<p class="text-xs text-gray-500 mt-1">
										{formatTimeAgo(notification.created_at)}
									</p>
								</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer (optional) -->
			{#if notifications.length > 0}
				<div class="border-t border-gray-100 px-4 py-2">
					<p class="text-xs text-gray-500 text-center">
						Klik notifikasi untuk melihat detail
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Additional styles for smooth transitions */
	.notification-container {
		user-select: none;
	}
</style>
