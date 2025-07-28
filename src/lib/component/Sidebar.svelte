<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

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
					{ label: 'Presensi Bulanan', href: '/attendance/monthly', icon: '📊' },
					{ label: 'Daftar Libur', href: '/attendance/holidays', icon: '🏖️' },
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
		{
			label: 'Master Data',
			icon: '📂',
			hasDropdown: true,
			subMenus: [
				{ label: 'Daftar Master Data', href: '/masterdata', icon: '📋' },
				{ label: 'Shift Kerja', href: '/masterdata/shift', icon: '⏰' },
				{ label: 'Divisi', href: '/masterdata/divisi', icon: '🏢' },
				{ label: 'Jabatan', href: '/masterdata/jabatan', icon: '👔' },
				{ label: 'Lokasi Presensi', href: '/masterdata/lokasi-absen', icon: '📍' }
			]
		},
		{ 
			label: 'Rekrutmen',
			hasDropdown: true,
			icon: '📝',
			subMenus: [
				{ label: 'Tambah Lowongan', href: '/recruitment/add', icon: '➕' },
				{ label: 'Daftar Lowongan', href: '/recruitment/list', icon: '📢' },
				{ label: 'Detail Lowongan', href: '/recruitment/applications', icon: '👤' },
				{ label: 'Daftar Pelamar', href: '/recruitment/candidates', icon: '👥' }
			]
		},
		{ 
			label: 'Training',
			hasDropdown: true,
			icon: '📚',
			subMenus: [
				{ label: 'Tambah Training', href: '/training/add', icon: '➕' },
				{ label: 'Daftar Training', href: '/training/list', icon: '📚' },
				{ label: 'Modul Training', href: '/training/module', icon: '📋' },
				{ label: 'Rekapitulasi Evaluasi Training', href: '/training/recap', icon: '📊' }
			]
		},
		{ 
			label: 'Document',
			hasDropdown: true,
			icon: '📄',
			subMenus: [
				{ label: 'Tambah Dokumen', href: '/documents/add', icon: '➕' },
				{ label: 'Daftar Dokumen', href: '/documents/list', icon: '📊' },
			]
		}
	];

	$: currentPath = $page.url.pathname;

	// State for dropdown
	/** @type {Record<number, boolean>} */
	let expandedMenus = {};

	// Initialize dropdown state only on first load
	let initialized = false;
	
	$: {
		// Only auto-expand on initial load, not on every route change
		if (!initialized && currentPath) {
			const newExpandedMenus = {};
			
			menuItems.forEach((item, index) => {
				if (item.hasDropdown && isSubmenuActive(item.subMenus)) {
					newExpandedMenus[index] = true;
				}
			});
			
			expandedMenus = newExpandedMenus;
			initialized = true;
		}
	}

	/**
	 * Toggle dropdown state
	 * @param {number} index
	 */
	function toggleDropdown(index) {
		expandedMenus = {
			...expandedMenus,
			[index]: !expandedMenus[index]
		};
	}

	/**
	 * Close all dropdowns
	 */
	function closeAllDropdowns() {
		expandedMenus = {};
	}

	/**
	 * Close specific dropdown
	 * @param {number} index
	 */
	function closeDropdown(index) {
		const newState = { ...expandedMenus };
		delete newState[index];
		expandedMenus = newState;
	}

	/**
	 * Handle click outside sidebar to close dropdowns
	 * @param {Event} event
	 */
	function handleClickOutside(event) {
		if (event.target && event.target instanceof Element) {
			const sidebar = event.target.closest('.sidebar');
			if (!sidebar) {
				closeAllDropdowns();
			}
		}
	}

	/**
	 * Check if any submenu is active
	 * @param {SubMenuItem[]} [subMenus]
	 * @returns {boolean}
	 */
	function isSubmenuActive(subMenus) {
		if (!subMenus || !Array.isArray(subMenus)) return false;

		return subMenus.some((sub) => {
			if (!sub.href) return false;

			// Exact match
			if (currentPath === sub.href) return true;

			// Check if current path starts with submenu href (for nested routes)
			// but make sure it's not a false positive
			if (sub.href !== '/' && currentPath.startsWith(sub.href)) {
				// Additional check to avoid false positives
				const pathAfterHref = currentPath.substring(sub.href.length);
				return pathAfterHref === '' || pathAfterHref.startsWith('/');
			}

			return false;
		});
	}

	/**
	 * Handle keyboard events
	 * @param {KeyboardEvent} event
	 */
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closeAllDropdowns();
		}
	}

	// Add global event listeners
	onMount(() => {
		// Add click outside listener
		function handleClickOutsideGlobal(event) {
			const sidebar = event.target?.closest('.sidebar');
			if (!sidebar) {
				closeAllDropdowns();
			}
		}

		// Add keyboard listener for ESC key only
		function handleKeydownGlobal(event) {
			if (event.key === 'Escape') {
				closeAllDropdowns();
			}
		}

		document.addEventListener('click', handleClickOutsideGlobal);
		document.addEventListener('keydown', handleKeydownGlobal);

		// Cleanup
		return () => {
			document.removeEventListener('click', handleClickOutsideGlobal);
			document.removeEventListener('keydown', handleKeydownGlobal);
		};
	});
</script>

<aside class="sidebar" role="navigation" tabindex="-1" on:keydown={handleKeydown}>
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
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleDropdown(index);
									}
								}}
								aria-expanded={expandedMenus[index] || false}
								aria-controls="submenu-{index}"
								type="button"
							>
								<span class="nav-icon">{item.icon}</span>
								<span class="nav-label">{item.label}</span>
								<span class="dropdown-arrow {expandedMenus[index] ? 'expanded' : ''}"> ▼ </span>
							</button>

							{#if expandedMenus[index]}
								<div
									class="submenu-container"
									id="submenu-{index}"
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

	.nav-link:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
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
		font-family: inherit;
		text-align: left;
		/* Inherit all nav-link styles */
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

	.dropdown-toggle:hover {
		background: rgba(71, 85, 105, 0.5);
		color: white;
		transform: translateX(4px);
	}

	.dropdown-toggle:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
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
