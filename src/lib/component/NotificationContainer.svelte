<script>
	import { notifications } from '$lib/stores/notificationStore.js';
	import Notification from './Notification.svelte';

	$: notificationList = $notifications;
</script>

<div class="notification-container" aria-live="polite">
	{#each notificationList as notification (notification.id)}
		<Notification
			type={notification.type}
			title={notification.title}
			message={notification.message}
			duration={0}
			showIcon={notification.showIcon}
			closable={notification.closable}
			show={true}
			on:close={() => notifications.remove(notification.id)}
		/>
	{/each}
</div>

<style>
	.notification-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
	}

	.notification-container :global(.notification) {
		pointer-events: auto;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.notification-container {
			top: 10px;
			right: 10px;
			left: 10px;
		}

		.notification-container :global(.notification) {
			max-width: none;
			min-width: 280px;
		}
	}
</style>
