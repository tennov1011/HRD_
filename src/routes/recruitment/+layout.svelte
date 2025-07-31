<script>
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
</script>

<div class="recruitment-layout">
	<!-- recruitment Navigation Tabs -->
	<div class="recruitment-nav">
		<div class="nav-tabs">
			<a
				href="/recruitment/add"
				class="nav-tab {currentPath.includes('/recruitment/add') ? 'active' : ''}"
			>
				➕ Tambah Lowongan
			</a>
			<a
				href="/recruitment/list"
				class="nav-tab {currentPath.includes('/recruitment/list') ? 'active' : ''}"
			>
				📢 Daftar Lowongan
			</a>
			<a
				href="/recruitment/applications"
				class="nav-tab {currentPath.includes('/recruitment/applications') ? 'active' : ''}"
			>
				🗂️ Detail Lowongan
			</a>
			<a
				href="/recruitment/candidates"
				class="nav-tab {currentPath.includes('/recruitment/candidates"') ? 'active' : ''}"
			>
				👥 Daftar Pelamar
			</a>
		</div>
	</div>

	<!-- Page Content -->
	<div class="recruitment-content">
		<slot />
	</div>
</div>

<style>
	.recruitment-layout {
		min-height: 100vh;
		background: #f8fafc;
	}

	.recruitment-nav {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 0 24px;
	}

	.nav-tabs {
		display: flex;
		gap: 0;
	}

	.nav-tab {
		padding: 16px 24px;
		text-decoration: none;
		color: #64748b;
		font-weight: 500;
		font-size: 14px;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
	}

	.nav-tab:hover {
		color: #3b82f6;
		background: #f8fafc;
	}

	.nav-tab.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
		background: #f8fafc;
	}

	.recruitment-content {
		/* Content will be rendered here */
	}

	/* Responsive */
	@media (max-width: 768px) {
		.recruitment-nav {
			padding: 0 16px;
		}

		.nav-tabs {
			overflow-x: auto;
		}

		.nav-tab {
			padding: 12px 16px;
			white-space: nowrap;
		}
	}
</style>
