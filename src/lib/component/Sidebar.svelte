<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	/**
	 * @typedef {Object} MenuItem
	 * @property {string} label
	 * @property {string} [href]
	 * @property {string} icon
	 * @property {boolean} [hasDropdown]
	 * @property {SubMenuItem[]} [subMenus]
	 */

	/**
	 * @typedef {Object} SubMenuItem
	 * @property {string} label
	 * @property {string} href
	 * @property {string} icon
	 */

	/** @type {MenuItem[]} */
	const menuItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: '🏠' },
		{ label: 'Karyawan', href: '/employees', icon: '👥' },
		{
			label: 'Kehadiran',
			icon: '⏰',
			hasDropdown: true,
			subMenus: [
				{ label: 'Presensi Harian', href: '/attendance/daily', icon: '📅' },
				{ label: 'Presensi Bulanan', href: '/attendance/monthly', icon: '📊' }
			]
		},
		{
			label: 'Pengajuan Karyawan',
			icon: '📋',
			hasDropdown: true,
			subMenus: [
				{ label: 'Pengajuan Izin/Cuti', href: '/request/leave', icon: '🏖️' },
				{ label: 'Pengajuan Lembur', href: '/request/overtime', icon: '⏰' },
				{ label: 'Pengajuan Kasbon', href: '/request/advance', icon: '💵' }
			]
		},
		{ label: 'Cuti', href: '/leave', icon: '📅' },
		{ label: 'Bonus', href: '/bonuses', icon: '💰' },
		{ label: 'Rekrutmen', href: '/recruitment', icon: '👔' },
		{ label: 'Dokumen', href: '/documents', icon: '📄' },
		{ label: 'Pengaturan', href: '/settings', icon: '⚙️' }
	];

	$: currentPath = $page.url.pathname;

	// State for dropdown
	/** @type {Record<number, boolean>} */
	let expandedMenus = {};

	// Auto-expand dropdown if current path matches submenu
	$: {
		menuItems.forEach((item, index) => {
			if (item.hasDropdown && isSubmenuActive(item.subMenus)) {
				expandedMenus[index] = true;
			}
		});
	}

	/**
	 * Toggle dropdown state
	 * @param {number} index
	 */
	function toggleDropdown(index) {
		expandedMenus[index] = !expandedMenus[index];
	}

	/**
	 * Check if any submenu is active
	 * @param {SubMenuItem[]} [subMenus]
	 * @returns {boolean}
	 */
	function isSubmenuActive(subMenus) {
		return (
			subMenus?.some((sub) => currentPath === sub.href || currentPath.startsWith(sub.href)) || false
		);
	}
</script>

<aside class="sidebar">
	<!-- Header -->
	<div class="sidebar-header">
		<div class="logo">
			<div class="logo-icon">🏢</div>
			<div class="logo-text">
				<h2>HRD System</h2>
				<p>PT. ELTAMA PRIMA INDO</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="sidebar-nav">
		<ul>
			{#each menuItems as item, index}
				<li>
					{#if item.hasDropdown}
						<!-- Dropdown Menu Item -->
						<div class="nav-dropdown">
							<button
								class="nav-link dropdown-toggle {isSubmenuActive(item.subMenus) ? 'active' : ''}"
								on:click={() => toggleDropdown(index)}
							>
								<span class="nav-icon">{item.icon}</span>
								<span class="nav-label">{item.label}</span>
								<span class="dropdown-arrow {expandedMenus[index] ? 'expanded' : ''}"> ▼ </span>
							</button>

							{#if expandedMenus[index]}
								<div
									class="submenu-container"
									transition:slide={{ duration: 300, easing: cubicOut }}
								>
									<ul class="submenu">
										{#each item.subMenus || [] as subItem}
											<li>
												<a
													href={subItem.href}
													class="nav-link submenu-link {currentPath === subItem.href
														? 'active'
														: ''}"
												>
													<span class="nav-icon">{subItem.icon}</span>
													<span class="nav-label">{subItem.label}</span>
													{#if currentPath === subItem.href}
														<span class="active-indicator"></span>
													{/if}
												</a>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Regular Menu Item -->
						<a href={item.href} class="nav-link {currentPath === item.href ? 'active' : ''}">
							<span class="nav-icon">{item.icon}</span>
							<span class="nav-label">{item.label}</span>
							{#if currentPath === item.href}
								<span class="active-indicator"></span>
							{/if}
						</a>
					{/if}
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

	/* Dropdown Menu Styles */
	.nav-dropdown {
		width: 100%;
	}

	.dropdown-toggle {
		background: none;
		border: none;
		width: 100%;
		cursor: pointer;
	}

	.dropdown-toggle:hover {
		background: rgba(71, 85, 105, 0.5);
		color: white;
		transform: translateX(4px);
	}

	.dropdown-toggle.active {
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
		color: #60a5fa;
		border-left: 4px solid #3b82f6;
	}

	.dropdown-arrow {
		margin-left: auto;
		font-size: 12px;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		opacity: 0.7;
	}

	.dropdown-arrow.expanded {
		transform: rotate(180deg);
		opacity: 1;
	}

	.submenu-container {
		overflow: hidden;
	}

	.submenu {
		list-style: none;
		margin: 0;
		padding: 0;
		padding-left: 24px;
		padding-right: 8px;
		padding-top: 8px;
		padding-bottom: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgba(15, 23, 42, 0.4);
		border-radius: 8px;
		margin-top: 6px;
		margin-left: 12px;
		margin-right: 4px;
		border-left: 2px solid rgba(59, 130, 246, 0.3);
		position: relative;
		overflow: hidden;
	}

	.submenu::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
		pointer-events: none;
	}

	.submenu li {
		position: relative;
		z-index: 1;
	}

	.submenu-link {
		padding: 10px 16px;
		font-size: 13px;
		border-radius: 6px;
		color: #cbd5e1;
		border: 1px solid transparent;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.submenu-link::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transition: left 0.3s ease;
	}

	.submenu-link:hover::before {
		left: 100%;
	}

	.submenu-link:hover {
		background: rgba(71, 85, 105, 0.6);
		color: white;
		transform: translateX(6px);
		border-color: rgba(59, 130, 246, 0.3);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.submenu-link.active {
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
		color: #60a5fa;
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 2px 12px rgba(59, 130, 246, 0.3);
		font-weight: 600;
	}

	.submenu-link .nav-icon {
		font-size: 16px;
		width: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
		transition: opacity 0.2s ease;
	}

	.submenu-link:hover .nav-icon,
	.submenu-link.active .nav-icon {
		opacity: 1;
	}

	.submenu-link .nav-label {
		font-size: 13px;
		font-weight: 500;
		letter-spacing: 0.3px;
	}

	.submenu-link .active-indicator {
		width: 6px;
		height: 6px;
		background: #60a5fa;
		border-radius: 50%;
		margin-left: auto;
		box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
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
