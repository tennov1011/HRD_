<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let type = 'info'; // success, error, warning, info
	export let title = '';
	export let message = '';
	export let duration = 5000; // Auto hide after 5 seconds, 0 = no auto hide
	export let showIcon = true;
	export let closable = true;
	export let show = true;

	const dispatch = createEventDispatcher();
	let timeoutId;

	$: if (show && duration > 0) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			hideNotification();
		}, duration);
	}

	function hideNotification() {
		show = false;
		dispatch('close');
	}

	function getIcon(type) {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			case 'info':
			default:
				return 'ℹ️';
		}
	}

	function getIconClass(type) {
		switch (type) {
			case 'success':
				return 'icon-success';
			case 'error':
				return 'icon-error';
			case 'warning':
				return 'icon-warning';
			case 'info':
			default:
				return 'icon-info';
		}
	}

	onMount(() => {
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

{#if show}
	<div
		class="notification notification-{type}"
		transition:fly={{ x: 300, duration: 300 }}
		role="alert"
		aria-live="polite"
	>
		<div class="notification-content">
			{#if showIcon}
				<div class="notification-icon {getIconClass(type)}">
					{getIcon(type)}
				</div>
			{/if}
			<div class="notification-body">
				{#if title}
					<div class="notification-title">{title}</div>
				{/if}
				{#if message}
					<div class="notification-message">{message}</div>
				{/if}
			</div>
		</div>
		{#if closable}
			<button class="notification-close" on:click={hideNotification} aria-label="Close notification">
				✕
			</button>
		{/if}
		{#if duration > 0}
			<div class="notification-progress">
				<div
					class="notification-progress-bar"
					style="animation-duration: {duration}ms"
				></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.notification {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
		border: 1px solid;
		margin-bottom: 8px;
		min-width: 320px;
		max-width: 500px;
		overflow: hidden;
	}

	.notification-success {
		background: rgba(16, 185, 129, 0.1);
		border-color: #10b981;
		color: #065f46;
	}

	.notification-error {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
		color: #991b1b;
	}

	.notification-warning {
		background: rgba(245, 158, 11, 0.1);
		border-color: #f59e0b;
		color: #92400e;
	}

	.notification-info {
		background: rgba(59, 130, 246, 0.1);
		border-color: #3b82f6;
		color: #1e40af;
	}

	.notification-content {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		flex: 1;
	}

	.notification-icon {
		font-size: 18px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.notification-body {
		flex: 1;
	}

	.notification-title {
		font-weight: 600;
		font-size: 14px;
		margin-bottom: 4px;
		line-height: 1.4;
	}

	.notification-message {
		font-size: 13px;
		line-height: 1.5;
		opacity: 0.9;
	}

	.notification-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		font-size: 12px;
		opacity: 0.7;
		transition: all 0.2s ease;
		flex-shrink: 0;
		margin-top: -2px;
	}

	.notification-close:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.1);
	}

	.notification-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.notification-progress-bar {
		height: 100%;
		width: 100%;
		background: currentColor;
		opacity: 0.6;
		animation: progress-shrink linear forwards;
		transform-origin: left;
	}

	@keyframes progress-shrink {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	/* Icon specific styles */
	.icon-success {
		color: #10b981;
	}

	.icon-error {
		color: #ef4444;
	}

	.icon-warning {
		color: #f59e0b;
	}

	.icon-info {
		color: #3b82f6;
	}
</style>