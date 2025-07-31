<script>
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
</script>

<div class="documents-layout">
	<!-- documents Navigation Tabs -->
	<div class="documents-nav">
		<div class="nav-tabs">
			<a
				href="/documents/add"
				class="nav-tab {currentPath.includes('/documents/add') ? 'active' : ''}"
			>
				➕ Tambah Dokumen
			</a>
			<a
				href="/documents/list"
				class="nav-tab {currentPath.includes('/documents/list') ? 'active' : ''}"
			>
				📑 Daftar Dokumen 
			</a>
		</div>
	</div>

	<!-- Page Content -->
	<div class="documents-content">
		<slot />
	</div>
</div>

<style>
	.documents-layout {
		min-height: 100vh;
		background: #f8fafc;
	}

	.documents-nav {
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

	.documents-content {
		/* Content will be rendered here */
	}

	/* Responsive */
	@media (max-width: 768px) {
		.documents-nav {
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
