<script>
	import { page } from '$app/stores';

	const menuItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: '🏠' },
		{ label: 'Karyawan', href: '/employees', icon: '👥' },
		{ label: 'Kehadiran', href: '/attendance', icon: '⏰' },
		{ label: 'Cuti', href: '/leave', icon: '📅' },
		{ label: 'Bonus', href: '/bonuses', icon: '💰' },
		{ label: 'Rekrutmen', href: '/recruitment', icon: '👔' },
		{ label: 'Dokumen', href: '/documents', icon: '📄' },
		{ label: 'Pengaturan', href: '/settings', icon: '⚙️' }
	];

	$: currentPath = $page.url.pathname;
</script>

<aside class="sidebar">
	<!-- Header -->
	<div class="sidebar-header">
		<div class="logo">
			<div class="logo-icon">🏢</div>
			<div class="logo-text">
				<h2>HRD System</h2>
				<p>Management Panel</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="sidebar-nav">
		<ul>
			{#each menuItems as item}
				<li>
					<a href={item.href} class="nav-link {currentPath === item.href ? 'active' : ''}">
						<span class="nav-icon">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
						{#if currentPath === item.href}
							<span class="active-indicator"></span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Footer -->
	<div class="sidebar-footer">
		<div class="user-info">
			<div class="user-avatar">👤</div>
			<div class="user-details">
				<p class="user-name">Admin User</p>
				<p class="user-email">admin@hrd.com</p>
			</div>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
		width: 280px;
		min-height: 100vh;
		color: white;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		padding: 24px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-icon {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.logo-text h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: white;
	}

	.logo-text p {
		margin: 0;
		font-size: 12px;
		color: #94a3b8;
	}

	.sidebar-nav {
		flex: 1;
		padding: 16px 12px;
	}

	.sidebar-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 12px;
		text-decoration: none;
		color: #cbd5e1;
		transition: all 0.2s ease;
		position: relative;
	}

	.nav-link:hover {
		background: rgba(71, 85, 105, 0.5);
		color: white;
		transform: translateX(4px);
	}

	.nav-link.active {
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
		color: #60a5fa;
		border-left: 4px solid #3b82f6;
	}

	.nav-icon {
		font-size: 18px;
		width: 24px;
		text-align: center;
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.5px;
	}

	.active-indicator {
		width: 8px;
		height: 8px;
		background: #3b82f6;
		border-radius: 50%;
		margin-left: auto;
	}

	.sidebar-footer {
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(15, 23, 42, 0.8);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		background: #475569;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
	}

	.user-details {
		flex: 1;
	}

	.user-name {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		color: #e2e8f0;
	}

	.user-email {
		margin: 0;
		font-size: 11px;
		color: #64748b;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			width: 240px;
		}

		.logo-text h2 {
			font-size: 18px;
		}
	}
</style>
