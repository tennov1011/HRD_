<script>
	import { onMount } from 'svelte';
	import {
		getOvertimeRequests,
		approveOvertimeRequest,
		rejectOvertimeRequest,
		testOvertimeConnection,
		getOvertimeStatistics
	} from '$lib/services/overtimeService.js';

	/** @type {any[]} */
	let overtimeRequests = [];
	let loading = true;
	let searchTerm = '';
	let statusFilter = 'all';
	let currentPage = 1;
	let itemsPerPage = 10;
	/** @type {any} */
	let connectionStatus = null;
	let isConnected = false;
	/** @type {any} */
	let statistics = null;

	$: filteredRequests = filterRequests(overtimeRequests, searchTerm, statusFilter);
	$: paginatedRequests = paginateData(filteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

	onMount(() => {
		loadOvertimeRequests();
		checkConnection();
		loadStatistics();
	});

	async function checkConnection() {
		connectionStatus = await testOvertimeConnection();
		isConnected = connectionStatus.success;
	}

	async function loadOvertimeRequests() {
		try {
			loading = true;
			const result = await getOvertimeRequests();

			if (result.success) {
				overtimeRequests = result.data;
				console.log('✅ Overtime requests loaded from Directus');
			} else {
				console.warn('⚠️ Using fallback data for overtime requests');
				overtimeRequests = result.data; // Fallback data
			}
		} catch (error) {
			console.error('Error loading overtime requests:', error);
			overtimeRequests = [];
		} finally {
			loading = false;
		}
	}

	async function loadStatistics() {
		try {
			const result = await getOvertimeStatistics();
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
					(req.description || req.deskripsi || '').toLowerCase().includes(searchLower) ||
					(req.employee_email || req.email || '').toLowerCase().includes(searchLower)
			);
		}

		if (status !== 'all') {
			filtered = filtered.filter((req) => req.status === status);
		}

		return filtered;
	}

	/**
	 * Paginate data
	 * @param {any[]} data
	 * @param {number} page
	 * @param {number} perPage
	 */
	function paginateData(data, page, perPage) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return data.slice(start, end);
	}

	/**
	 * Get status CSS class
	 * @param {string} status
	 */
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

	/**
	 * Get status display text
	 * @param {string} status
	 */
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

	/**
	 * Format date string
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	/**
	 * Approve overtime request
	 * @param {any} request
	 */
	async function approveRequest(request) {
		try {
			const result = await approveOvertimeRequest(request);

			if (result.success) {
				console.log('✅ Overtime request approved');
				await loadOvertimeRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to approve overtime request:', result.error);
				// Fallback untuk update local state
				const index = overtimeRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					overtimeRequests[index] = {
						...overtimeRequests[index],
						status: 'approved',
						approved_by: 'HR Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					overtimeRequests = [...overtimeRequests];
				}
			}
		} catch (error) {
			console.error('Error approving request:', error);
		}
	}

	/**
	 * Reject overtime request
	 * @param {any} request
	 */
	async function rejectRequest(request) {
		try {
			const result = await rejectOvertimeRequest(request);

			if (result.success) {
				console.log('✅ Overtime request rejected');
				await loadOvertimeRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to reject overtime request:', result.error);
				// Fallback untuk update local state
				const index = overtimeRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					overtimeRequests[index] = {
						...overtimeRequests[index],
						status: 'rejected',
						approved_by: 'HR Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					overtimeRequests = [...overtimeRequests];
				}
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
		}
	}
</script>

<svelte:head>
	<title>Pengajuan Lembur - HRD System</title>
</svelte:head>

<div class="overtime-requests-page">
	<!-- Header Actions -->
	<div class="page-actions">
		<div class="search-filters">
			<div class="filter-group">
				<input
					type="text"
					placeholder="Cari nama karyawan, ID, atau alasan..."
					bind:value={searchTerm}
					class="search-input"
				/>
			</div>

			<div class="filter-group">
				<select bind:value={statusFilter} class="status-filter">
					<option value="all">Semua Status</option>
					<option value="pending">Menunggu</option>
					<option value="approved">Disetujui</option>
					<option value="rejected">Ditolak</option>
				</select>
			</div>
		</div>

		<div class="action-buttons">
			<button class="btn btn-primary"> ➕ Tambah Lembur </button>
		</div>
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
			<div class="stat-icon">⏰</div>
			<div class="stat-content">
				<div class="stat-value">
					{statistics?.pending || overtimeRequests.filter((r) => r.status === 'pending').length}
				</div>
				<div class="stat-label">Menunggu Persetujuan</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">✅</div>
			<div class="stat-content">
				<div class="stat-value">
					{statistics?.approved || overtimeRequests.filter((r) => r.status === 'approved').length}
				</div>
				<div class="stat-label">Disetujui</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">❌</div>
			<div class="stat-content">
				<div class="stat-value">
					{statistics?.rejected || overtimeRequests.filter((r) => r.status === 'rejected').length}
				</div>
				<div class="stat-label">Ditolak</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">⏱️</div>
			<div class="stat-content">
				<div class="stat-value">
					{statistics?.totalApprovedHours || 0}
				</div>
				<div class="stat-label">Total Jam Disetujui</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data pengajuan...</p>
			</div>
		{:else if overtimeRequests.length === 0}
			<div class="empty-state">
				<div class="empty-icon">⏰</div>
				<h3>Belum Ada Pengajuan Lembur</h3>
				<p>Belum ada pengajuan lembur yang masuk.</p>
			</div>
		{:else}
			<!-- Requests Table -->
			<div class="table-container">
				<table class="requests-table">
					<thead>
						<tr>
							<th>Karyawan</th>
							<th>Tanggal Lembur</th>
							<th>Tanggal Pengajuan</th>
							<th>Durasi</th>
							<th>Deskripsi</th>
							<th>Status</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedRequests as request}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-avatar">
											{(request.employee_name || request.nama || 'U').charAt(0).toUpperCase()}
										</div>
										<div class="employee-details">
											<div class="employee-name">{request.employee_name || request.nama}</div>
											<div class="employee-id">{request.user_id}</div>
											<div class="employee-email">{request.employee_email || request.email}</div>
										</div>
									</div>
								</td>
								<td>
									<span class="overtime-date"
										>{formatDate(request.overtime_date || request.tanggal)}</span
									>
								</td>
								<td>
									<div class="submitted-date">
										<span class="submitted-label">Diajukan:</span>
										<span class="submitted-value"
											>{formatDate(request.submitted_date || request.tanggal_pengajuan)}</span
										>
									</div>
								</td>
								<td>
									<div class="duration">
										<span class="duration-value"
											>{request.total_duration ||
												`${request.durasi_jam || 0} jam ${request.durasi_menit || 0} menit`}</span
										>
									</div>
								</td>
								<td>
									<div class="reason" title={request.description || request.deskripsi}>
										{request.description || request.deskripsi}
									</div>
								</td>
								<td>
									<span class="status-badge {getStatusClass(request.status)}">
										{getStatusText(request.status)}
									</span>
								</td>
								<td>
									<div class="action-buttons">
										{#if request.status === 'pending'}
											<button
												class="btn-action btn-approve"
												title="Setujui"
												on:click={() => approveRequest(request)}
											>
												✅
											</button>
											<button
												class="btn-action btn-reject"
												title="Tolak"
												on:click={() => rejectRequest(request)}
											>
												❌
											</button>
										{/if}
										<!-- <button class="btn-action btn-detail" title="Detail"> 👁️ </button> -->
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
					<button
						class="btn-page"
						disabled={currentPage === 1}
						on:click={() => (currentPage = currentPage - 1)}
					>
						← Sebelumnya
					</button>

					<div class="page-numbers">
						{#each Array(totalPages) as _, i}
							<button
								class="btn-page {currentPage === i + 1 ? 'active' : ''}"
								on:click={() => (currentPage = i + 1)}
							>
								{i + 1}
							</button>
						{/each}
					</div>

					<button
						class="btn-page"
						disabled={currentPage === totalPages}
						on:click={() => (currentPage = currentPage + 1)}
					>
						Selanjutnya →
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.overtime-requests-page {
		padding: 24px;
	}

	.page-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.search-filters {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.search-input,
	.status-filter {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 200px;
	}

	.search-input:focus,
	.status-filter:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.btn {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
	}

	.btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
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
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
	}

	.stat-label {
		font-size: 14px;
		color: #64748b;
		margin-top: 4px;
	}

	.content-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.loading-state,
	.empty-state {
		padding: 60px 20px;
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #f3f4f6;
		border-top: 3px solid #3b82f6;
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

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.table-container {
		overflow-x: auto;
	}

	.requests-table {
		width: 100%;
		border-collapse: collapse;
	}

	.requests-table th,
	.requests-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
	}

	.requests-table th {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		font-size: 14px;
	}

	.requests-table td {
		font-size: 14px;
		color: #64748b;
	}

	.requests-table tr:hover {
		background: #f8fafc;
	}

	.employee-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.employee-avatar {
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 14px;
	}

	.employee-name {
		font-weight: 500;
		color: #1e293b;
	}

	.employee-id {
		font-size: 12px;
		color: #9ca3af;
	}

	.employee-email {
		font-size: 12px;
		color: #64748b;
		margin-top: 2px;
	}

	.overtime-date {
		font-weight: 500;
		color: #1e293b;
	}

	.submitted-date {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.submitted-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
	}

	.submitted-value {
		font-size: 13px;
		color: #1e293b;
	}

	.time-range {
		display: flex;
		align-items: center;
		gap: 4px;
		font-family: monospace;
		font-size: 12px;
	}

	.time-separator {
		color: #9ca3af;
	}

	.duration {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.duration-value {
		font-weight: 600;
		font-size: 16px;
		color: #1e293b;
	}

	.duration-unit {
		font-size: 12px;
		color: #64748b;
	}

	.reason {
		max-width: 200px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-approved {
		background: #dcfce7;
		color: #166534;
	}

	.status-rejected {
		background: #fee2e2;
		color: #991b1b;
	}

	.action-buttons {
		display: flex;
		gap: 6px;
		justify-content: center;
	}

	.btn-action {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: #f1f5f9;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-action:hover {
		background: #e2e8f0;
		transform: scale(1.1);
	}

	.btn-approve {
		background: #dcfce7 !important;
	}

	.btn-approve:hover {
		background: #bbf7d0 !important;
	}

	.btn-reject {
		background: #fee2e2 !important;
	}

	.btn-reject:hover {
		background: #fecaca !important;
	}

	.pagination {
		padding: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		border-top: 1px solid #f1f5f9;
	}

	.btn-page {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.btn-page:hover:not(:disabled) {
		background: #f8fafc;
	}

	.btn-page.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.btn-page:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-numbers {
		display: flex;
		gap: 4px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.overtime-requests-page {
			padding: 16px;
		}

		.page-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.search-filters {
			flex-direction: column;
		}

		.search-input,
		.status-filter {
			min-width: auto;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.table-container {
			font-size: 12px;
		}

		.requests-table th,
		.requests-table td {
			padding: 8px 6px;
		}

		.employee-info {
			flex-direction: column;
			gap: 4px;
		}
	}
</style>
