<script>
	import { onMount } from 'svelte';
	import {
		getAdvanceRequests,
		approveAdvanceRequest,
		rejectAdvanceRequest,
		testAdvanceConnection,
		getAdvanceStatistics
	} from '$lib/services/advanceService.js';

	/** @type {any[]} */
	let advanceRequests = [];
	let loading = true;
	let searchTerm = '';
	let statusFilter = 'all'; // all, pending, approved, rejected
	let currentPage = 1;
	let itemsPerPage = 10;
	/** @type {any} */
	let connectionStatus = null;
	let isConnected = false;
	/** @type {any} */
	let statistics = null;

	$: filteredRequests = filterRequests(advanceRequests, searchTerm, statusFilter);
	$: paginatedRequests = paginateData(filteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

	onMount(() => {
		loadAdvanceRequests();
		checkConnection();
		loadStatistics();
	});

	async function checkConnection() {
		connectionStatus = await testAdvanceConnection();
		isConnected = connectionStatus.success;
	}

	async function loadAdvanceRequests() {
		try {
			loading = true;
			const result = await getAdvanceRequests();

			if (result.success) {
				advanceRequests = result.data;
				console.log('✅ Advance requests loaded from Directus');
			} else {
				console.warn('⚠️ Using fallback data for advance requests');
				advanceRequests = result.data; // Fallback data
			}
		} catch (error) {
			console.error('Error loading advance requests:', error);
			advanceRequests = [];
		} finally {
			loading = false;
		}
	}

	async function loadStatistics() {
		try {
			const result = await getAdvanceStatistics();
			if (result.success) {
				// Type assertion untuk menghindari TypeScript error
				/** @type {any} */
				const statisticsResult = result;
				if (statisticsResult.statistics) {
					statistics = statisticsResult.statistics;
				}
			}
		} catch (error) {
			console.error('Error loading statistics:', error);
		}
	}

	/**
	 * Filter requests based on search term and status
	 * @param {any[]} requests
	 * @param {string} search
	 * @param {string} status
	 */
	function filterRequests(requests, search, status) {
		let filtered = requests;

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(req) =>
					(req.employee_name || req.nama || '').toLowerCase().includes(searchLower) ||
					(req.user_id || '').toLowerCase().includes(searchLower) ||
					(req.description || req.keterangan || '').toLowerCase().includes(searchLower) ||
					(req.employee_email || req.email || '').toLowerCase().includes(searchLower)
			);
		}

		if (status !== 'all') {
			filtered = filtered.filter((req) => req.status === status);
		}

		return filtered;
	}

	/**
	 * @param {any[]} data
	 * @param {number} page
	 * @param {number} perPage
	 */
	function paginateData(data, page, perPage) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return data.slice(start, end);
	}

	/** @param {string} status */
	function getStatusClass(status) {
		switch (status) {
			case 'pending':
				return 'status-pending';
			case 'approved':
				return 'status-approved';
			case 'rejected':
				return 'status-rejected';
			default:
				return 'status-pending';
		}
	}

	/** @param {string} status */
	function getStatusText(status) {
		switch (status) {
			case 'pending':
				return 'Menunggu';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			default:
				return 'Menunggu';
		}
	}

	/** @param {string} dateString */
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	/** @param {number} amount */
	function formatCurrency(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	/**
	 * Approve advance request
	 * @param {any} request
	 */
	async function approveRequest(request) {
		try {
			const result = await approveAdvanceRequest(request);

			if (result.success) {
				console.log('✅ Advance request approved');
				await loadAdvanceRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to approve advance request:', result.error);
				// Fallback untuk update local state
				const index = advanceRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					advanceRequests[index] = {
						...advanceRequests[index],
						status: 'approved',
						approved_by: 'Finance Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					advanceRequests = [...advanceRequests];
				}
			}
		} catch (error) {
			console.error('Error approving request:', error);
		}
	}

	/**
	 * Reject advance request
	 * @param {any} request
	 */
	async function rejectRequest(request) {
		try {
			const result = await rejectAdvanceRequest(request);

			if (result.success) {
				console.log('✅ Advance request rejected');
				await loadAdvanceRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to reject advance request:', result.error);
				// Fallback untuk update local state
				const index = advanceRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					advanceRequests[index] = {
						...advanceRequests[index],
						status: 'rejected',
						approved_by: 'Finance Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					advanceRequests = [...advanceRequests];
				}
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
		}
	}

	/** @param {number} page */
	function changePage(page) {
		currentPage = page;
	}

	function previousPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}
</script>

<svelte:head>
	<title>Pengajuan Kasbon - HRD System</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<h1>Pengajuan Kasbon</h1>
		<p>Kelola pengajuan kasbon karyawan</p>
	</div>

	<!-- Connection Status -->
	{#if connectionStatus}
		<div class="connection-status {isConnected ? 'connected' : 'disconnected'}">
			<div class="status-icon">
				{isConnected ? '🟢' : '🔴'}
			</div>
			<div class="status-text">
				{isConnected ? 'Terhubung ke Directus' : 'Menggunakan Data Fallback'}
			</div>
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon pending">💵</div>
			<div class="stat-content">
				<h3>
					{statistics?.pending || filteredRequests.filter((req) => req.status === 'pending').length}
				</h3>
				<p>Menunggu Persetujuan</p>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon approved">✅</div>
			<div class="stat-content">
				<h3>
					{statistics?.approved ||
						filteredRequests.filter((req) => req.status === 'approved').length}
				</h3>
				<p>Disetujui</p>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon rejected">❌</div>
			<div class="stat-content">
				<h3>
					{statistics?.rejected ||
						filteredRequests.filter((req) => req.status === 'rejected').length}
				</h3>
				<p>Ditolak</p>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon total">📊</div>
			<div class="stat-content">
				<h3>
					{statistics?.formattedTotalAmount ||
						formatCurrency(
							filteredRequests
								.filter((req) => req.status === 'approved')
								.reduce((sum, req) => sum + (req.amount || req.nominal || 0), 0)
						)}
				</h3>
				<p>Total Kasbon Disetujui</p>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="filters-section">
		<div class="search-box">
			<input
				type="text"
				placeholder="Cari berdasarkan nama, ID, alasan..."
				bind:value={searchTerm}
			/>
		</div>
		<div class="filter-group">
			<select bind:value={statusFilter}>
				<option value="all">Semua Status</option>
				<option value="pending">Menunggu</option>
				<option value="approved">Disetujui</option>
				<option value="rejected">Ditolak</option>
			</select>
		</div>
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data pengajuan kasbon...</p>
			</div>
		{:else if paginatedRequests.length === 0}
			<div class="empty-state">
				<div class="empty-icon">💵</div>
				<h3>Tidak ada pengajuan kasbon</h3>
				<p>Belum ada pengajuan kasbon yang ditemukan</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>Karyawan</th>
							<th>Jumlah</th>
							<th>Keterangan</th>
							<th>Tanggal Pengajuan</th>
							<th>Tenor</th>
							<th>Status</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedRequests as request}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-name">{request.employee_name || request.nama}</div>
										<div class="employee-id">{request.user_id}</div>
										<div class="employee-email">{request.employee_email || request.email}</div>
									</div>
								</td>
								<td>
									<div class="amount-info">
										<div class="amount">
											{request.formatted_amount ||
												formatCurrency(request.amount || request.nominal)}
										</div>
										<div class="monthly-payment">
											Cicilan: {request.formatted_monthly_payment ||
												formatCurrency(request.monthly_payment || 0)}
										</div>
									</div>
								</td>
								<td>
									<div class="reason">{request.description || request.keterangan}</div>
								</td>
								<td>
									<div class="date-info">
										<div class="date">{formatDate(request.advance_date || request.tanggal)}</div>
										<div class="submitted">
											Diajukan: {formatDate(request.submitted_date || request.tanggal_pengajuan)}
										</div>
									</div>
								</td>
								<td>
									<div class="tenor-info">
										<div class="tenor">{request.tenor_months || request.tenor} bulan</div>
									</div>
								</td>
								<td>
									<span class="status-badge {getStatusClass(request.status)}">
										{getStatusText(request.status)}
									</span>
									{#if request.approved_by}
										<div class="approved-info">
											<small>oleh {request.approved_by}</small>
											<small>{formatDate(request.approved_date)}</small>
										</div>
									{/if}
								</td>
								<td>
									<div class="action-buttons">
										{#if request.status === 'pending'}
											<button class="btn btn-approve" on:click={() => approveRequest(request)}>
												✓ Setujui
											</button>
											<button class="btn btn-reject" on:click={() => rejectRequest(request)}>
												✗ Tolak
											</button>
										{:else}
											<button class="btn btn-detail"> 👁️ Detail </button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination">
					<button class="btn btn-outline" disabled={currentPage === 1} on:click={previousPage}>
						‹ Sebelumnya
					</button>

					{#each Array(totalPages) as _, i}
						<button
							class="btn btn-page {currentPage === i + 1 ? 'active' : ''}"
							on:click={() => changePage(i + 1)}
						>
							{i + 1}
						</button>
					{/each}

					<button class="btn btn-outline" disabled={currentPage === totalPages} on:click={nextPage}>
						Selanjutnya ›
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page-container {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 8px 0;
	}

	.page-header p {
		color: #64748b;
		margin: 0;
		font-size: 16px;
	}

	/* Connection Status */
	.connection-status {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 24px;
		font-size: 14px;
		font-weight: 500;
	}

	.connection-status.connected {
		background-color: #dcfce7;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}

	.connection-status.disconnected {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.status-icon {
		font-size: 12px;
	}

	.status-text {
		font-size: 13px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin-bottom: 32px;
	}

	.stat-card {
		background: white;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 16px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		flex-shrink: 0;
	}

	.stat-icon.pending {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
	}
	.stat-icon.approved {
		background: linear-gradient(135deg, #10b981, #059669);
	}
	.stat-icon.rejected {
		background: linear-gradient(135deg, #ef4444, #dc2626);
	}
	.stat-icon.total {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
	}

	.stat-content h3 {
		font-size: 28px;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 4px 0;
	}

	.stat-content p {
		color: #64748b;
		margin: 0;
		font-size: 14px;
		font-weight: 500;
	}

	.filters-section {
		background: white;
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 300px;
	}

	.search-box input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		font-size: 14px;
		transition: border-color 0.2s ease;
	}

	.search-box input:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.filter-group select {
		padding: 12px 16px;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		background: white;
		font-size: 14px;
		cursor: pointer;
		min-width: 150px;
	}

	.content-section {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.loading-state {
		padding: 80px 24px;
		text-align: center;
		color: #64748b;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		padding: 80px 24px;
		text-align: center;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.empty-state h3 {
		color: #1e293b;
		margin: 0 0 8px 0;
		font-size: 20px;
	}

	.empty-state p {
		color: #64748b;
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th {
		background: #f8fafc;
		padding: 16px;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		font-size: 14px;
	}

	.data-table td {
		padding: 16px;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: top;
	}

	.data-table tr:hover {
		background: #f8fafc;
	}

	.employee-info .employee-name {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 4px;
	}

	.employee-info .employee-id {
		color: #64748b;
		font-size: 13px;
	}

	.employee-email {
		font-size: 12px;
		color: #64748b;
		margin-top: 2px;
	}

	.amount-info .amount {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 4px;
	}

	.monthly-payment {
		font-size: 12px;
		color: #64748b;
		margin-top: 4px;
	}

	.reason {
		color: #374151;
		font-size: 14px;
		max-width: 200px;
		word-wrap: break-word;
	}

	.date-info .date {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 4px;
	}

	.date-info .submitted {
		color: #64748b;
		font-size: 13px;
	}

	.monthly-payment {
		font-size: 12px;
		color: #64748b;
		margin-top: 4px;
	}

	.tenor-info {
		text-align: center;
	}

	.tenor {
		font-weight: 600;
		color: #1e293b;
	}

	.status-badge {
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-pending {
		background: #fef3c7;
		color: #d97706;
	}
	.status-approved {
		background: #d1fae5;
		color: #059669;
	}
	.status-rejected {
		background: #fee2e2;
		color: #dc2626;
	}

	.approved-info {
		margin-top: 8px;
		font-size: 12px;
		color: #64748b;
	}

	.approved-info small {
		display: block;
		line-height: 1.4;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn {
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.btn-approve {
		background: #10b981;
		color: white;
	}

	.btn-approve:hover {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-reject {
		background: #ef4444;
		color: white;
	}

	.btn-reject:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	.btn-detail {
		background: #3b82f6;
		color: white;
	}

	.btn-detail:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.pagination {
		padding: 24px;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		border-top: 1px solid #f1f5f9;
	}

	.btn-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-outline:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-outline:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-page {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-page:hover {
		background: #f9fafb;
	}

	.btn-page.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-container {
			padding: 16px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.filters-section {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: auto;
		}

		.data-table {
			font-size: 14px;
		}

		.data-table th,
		.data-table td {
			padding: 12px 8px;
		}

		.action-buttons {
			flex-direction: column;
		}

		.pagination {
			flex-wrap: wrap;
		}
	}
</style>
