<script>
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;

	const requestTabs = [
		{ label: 'Pengajuan Izin/Cuti', href: '/request/leave', icon: '🏖️' },
		{ label: 'Pengajuan Lembur', href: '/request/overtime', icon: '⏰' },
		{ label: 'Pengajuan Kasbon', href: '/request/advance', icon: '💵' }
	];
</script>

<svelte:head>
	<title>Pengajuan Karyawan - HRD System</title>
</svelte:head>

<div class="request-layout">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>📋 Pengajuan Karyawan</h1>
			<p>Kelola berbagai pengajuan dari karyawan</p>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="tab-navigation">
		<div class="tabs-container">
			{#each requestTabs as tab}
				<a href={tab.href} class="tab-item {currentPath === tab.href ? 'active' : ''}">
					<span class="tab-icon">{tab.icon}</span>
					<span class="tab-label">{tab.label}</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- Content -->
	<div class="tab-content">
		<slot />
	</div>
</div>

<style>
	.request-layout {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.page-header {
		background: white;
		padding: 24px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.header-content h1 {
		margin: 0 0 8px 0;
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
	}

	.header-content p {
		margin: 0;
		color: #64748b;
		font-size: 14px;
	}

	.tab-navigation {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
		overflow-x: auto;
	}

	.tabs-container {
		display: flex;
		min-width: fit-content;
	}

	.tab-item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 24px;
		text-decoration: none;
		color: #64748b;
		font-weight: 500;
		font-size: 14px;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab-item:hover {
		background: #f8fafc;
		color: #3b82f6;
	}

	.tab-item.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background: #f0f7ff;
	}

	.tab-icon {
		font-size: 16px;
	}

	.tab-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-height: 500px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.request-layout {
			padding: 16px;
		}

		.tab-item {
			padding: 12px 16px;
			font-size: 12px;
		}

		.tab-label {
			display: none;
		}

		.tab-icon {
			font-size: 18px;
		}
	}
</style>
