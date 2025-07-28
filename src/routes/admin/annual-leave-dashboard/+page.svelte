<script>
	import { onMount } from 'svelte';
	import { 
		getAnnualLeaveDashboardSummary, 
		getFilteredEmployeeLeaveData, 
		getDepartmentList 
	} from '$lib/services/annualLeaveDashboardService.js';

	// Data states
	let dashboardData = null;
	let employeeData = [];
	let departments = [];
	let loading = true;
	let error = null;

	// Filter states
	let selectedYear = new Date().getFullYear();
	let selectedDepartment = 'all';
	let searchTerm = '';
	let sortBy = 'nama_lengkap';
	let sortOrder = 'asc';
	let statusFilter = 'all';

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 20;

	// Modal states
	let showEmployeeDetail = false;
	let selectedEmployee = null;

	// Computed values
	$: filteredEmployees = employeeData;
	$: totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
	$: paginatedEmployees = filteredEmployees.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	
	// Generate year options (current year ± 2)
	$: yearOptions = Array.from({ length: 5 }, (_, i) => {
		const year = new Date().getFullYear() - 2 + i;
		return { value: year, label: year.toString() };
	});

	/**
	 * Load dashboard data
	 */
	async function loadDashboardData() {
		try {
			loading = true;
			error = null;

			const [dashboardResult, departmentResult] = await Promise.all([
				getAnnualLeaveDashboardSummary(selectedYear),
				getDepartmentList()
			]);

			if (dashboardResult.success) {
				dashboardData = dashboardResult.data;
				await loadFilteredData();
			} else {
				error = dashboardResult.error;
			}

			if (departmentResult.success) {
				departments = departmentResult.data;
			}

		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	/**
	 * Load filtered employee data
	 */
	async function loadFilteredData() {
		try {
			const result = await getFilteredEmployeeLeaveData({
				year: selectedYear,
				department: selectedDepartment,
				search: searchTerm,
				sortBy,
				sortOrder,
				status: statusFilter
			});

			if (result.success) {
				employeeData = result.data.employees;
				currentPage = 1; // Reset pagination
			}
		} catch (err) {
			console.error('Error loading filtered data:', err);
		}
	}

	/**
	 * Format date for display
	 */
	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID');
	}

	/**
	 * Format percentage
	 */
	function formatPercentage(value) {
		return Math.round(value) + '%';
	}

	/**
	 * Get progress bar width
	 */
	function getProgressWidth(used, total) {
		return Math.min((used / total) * 100, 100);
	}

	/**
	 * Show employee detail modal
	 */
	function showEmployeeDetailModal(employee) {
		selectedEmployee = employee;
		showEmployeeDetail = true;
	}

	/**
	 * Close employee detail modal
	 */
	function closeEmployeeDetailModal() {
		showEmployeeDetail = false;
		selectedEmployee = null;
	}

	/**
	 * Export data to CSV
	 */
	function exportToCSV() {
		const headers = ['Nama', 'Jabatan', 'Divisi', 'Alokasi', 'Terpakai', 'Sisa', 'Persentase', 'Status'];
		const csvData = employeeData.map(emp => [
			emp.employee.nama_lengkap,
			emp.employee.jabatan || '-',
			emp.employee.divisi || '-',
			emp.allocation,
			emp.usedDays,
			emp.remainingDays,
			emp.usagePercentage + '%',
			emp.statusLabel
		]);

		const csvContent = [headers, ...csvData]
			.map(row => row.map(field => `"${field}"`).join(','))
			.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `annual-leave-dashboard-${selectedYear}.csv`;
		link.click();
	}

	// Reactive statements for filtering
	$: if (selectedYear || selectedDepartment || searchTerm || sortBy || sortOrder || statusFilter) {
		if (dashboardData) {
			loadFilteredData();
		}
	}

	// Load data on mount
	onMount(() => {
		loadDashboardData();
	});
</script>

<svelte:head>
	<title>Dashboard Cuti Tahunan - Admin HRD</title>
</svelte:head>

<div class="dashboard-page">
	<!-- Header -->
	<div class="dashboard-header">
		<div class="header-content">
			<h1>📊 Dashboard Cuti Tahunan</h1>
			<p class="header-subtitle">Monitoring dan analisis penggunaan cuti tahunan karyawan</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-export" on:click={exportToCSV} disabled={loading || !employeeData.length}>
				📥 Export CSV
			</button>
			<button class="btn btn-refresh" on:click={loadDashboardData} disabled={loading}>
				{#if loading}
					⏳ Memuat...
				{:else}
					🔄 Refresh
				{/if}
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Memuat data dashboard...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">❌</div>
			<h3>Gagal Memuat Data</h3>
			<p>{error}</p>
			<button class="btn btn-primary" on:click={loadDashboardData}>Coba Lagi</button>
		</div>
	{:else if dashboardData}
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="summary-card">
				<div class="card-icon">👥</div>
				<div class="card-content">
					<div class="card-value">{dashboardData.summary.totalEmployees}</div>
					<div class="card-label">Total Karyawan</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">📅</div>
				<div class="card-content">
					<div class="card-value">{dashboardData.summary.totalAllocation}</div>
					<div class="card-label">Total Alokasi Cuti</div>
					<div class="card-subtitle">{dashboardData.summary.totalEmployees} × 12 hari</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">✅</div>
				<div class="card-content">
					<div class="card-value">{dashboardData.summary.totalUsed}</div>
					<div class="card-label">Cuti Terpakai</div>
					<div class="card-subtitle">{formatPercentage(dashboardData.summary.usagePercentage)} dari total</div>
				</div>
			</div>
			
			<div class="summary-card">
				<div class="card-icon">🎯</div>
				<div class="card-content">
					<div class="card-value">{dashboardData.summary.averageUsage}</div>
					<div class="card-label">Rata-rata per Karyawan</div>
					<div class="card-subtitle">dari 12 hari alokasi</div>
				</div>
			</div>
		</div>

		<!-- Status Summary -->
		<div class="status-summary">
			<h3>📈 Ringkasan Status Karyawan</h3>
			<div class="status-cards">
				<div class="status-card status-good">
					<div class="status-count">{dashboardData.statusCounts.good}</div>
					<div class="status-label">Cuti Cukup</div>
					<div class="status-desc">Sisa > 3 hari</div>
				</div>
				<div class="status-card status-warning">
					<div class="status-count">{dashboardData.statusCounts.warning}</div>
					<div class="status-label">Perlu Perhatian</div>
					<div class="status-desc">Sisa ≤ 3 hari</div>
				</div>
				<div class="status-card status-critical">
					<div class="status-count">{dashboardData.statusCounts.critical}</div>
					<div class="status-label">Cuti Habis</div>
					<div class="status-desc">Sisa 0 hari</div>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="filters-section">
			<div class="filters-row">
				<div class="filter-group">
					<label for="year-select">📅 Tahun:</label>
					<select id="year-select" bind:value={selectedYear}>
						{#each yearOptions as year}
							<option value={year.value}>{year.label}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="dept-select">🏢 Departemen:</label>
					<select id="dept-select" bind:value={selectedDepartment}>
						<option value="all">Semua Departemen</option>
						{#each departments as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="status-select">🚦 Status:</label>
					<select id="status-select" bind:value={statusFilter}>
						<option value="all">Semua Status</option>
						<option value="good">Cuti Cukup</option>
						<option value="warning">Perlu Perhatian</option>
						<option value="critical">Cuti Habis</option>
					</select>
				</div>

				<div class="filter-group search-group">
					<label for="search-input">🔍 Cari:</label>
					<input
						id="search-input"
						type="text"
						placeholder="Nama, email, jabatan..."
						bind:value={searchTerm}
					/>
				</div>
			</div>

			<div class="filters-row">
				<div class="filter-group">
					<label for="sort-select">📊 Urutkan:</label>
					<select id="sort-select" bind:value={sortBy}>
						<option value="nama_lengkap">Nama</option>
						<option value="jabatan">Jabatan</option>
						<option value="divisi">Divisi</option>
						<option value="usedDays">Cuti Terpakai</option>
						<option value="remainingDays">Sisa Cuti</option>
						<option value="usagePercentage">Persentase Penggunaan</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="order-select">🔄 Urutan:</label>
					<select id="order-select" bind:value={sortOrder}>
						<option value="asc">Naik (A-Z, 0-9)</option>
						<option value="desc">Turun (Z-A, 9-0)</option>
					</select>
				</div>

				<div class="filter-info">
					<span class="result-count">{filteredEmployees.length} hasil ditemukan</span>
				</div>
			</div>
		</div>

		<!-- Employee Table -->
		<div class="table-section">
			<div class="table-container">
				<table class="employee-table">
					<thead>
						<tr>
							<th>Karyawan</th>
							<th>Jabatan & Divisi</th>
							<th>Alokasi</th>
							<th>Terpakai</th>
							<th>Sisa</th>
							<th>Progress</th>
							<th>Status</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedEmployees as employee}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-avatar" style="background-color: {employee.statusColor}20">
											{employee.employee.nama_lengkap.charAt(0).toUpperCase()}
										</div>
										<div class="employee-details">
											<div class="employee-name">{employee.employee.nama_lengkap}</div>
											<div class="employee-email">{employee.employee.email}</div>
										</div>
									</div>
								</td>
								<td>
									<div class="job-info">
										<div class="job-title">{employee.employee.jabatan || '-'}</div>
										<div class="job-division">{employee.employee.divisi || '-'}</div>
									</div>
								</td>
								<td>
									<div class="allocation-info">
										<span class="allocation-value">{employee.allocation}</span>
										<span class="allocation-unit">hari</span>
									</div>
								</td>
								<td>
									<div class="used-info">
										<span class="used-value">{employee.usedDays}</span>
										<span class="used-unit">hari</span>
									</div>
								</td>
								<td>
									<div class="remaining-info" style="color: {employee.statusColor}">
										<span class="remaining-value">{employee.remainingDays}</span>
										<span class="remaining-unit">hari</span>
									</div>
								</td>
								<td>
									<div class="progress-container">
										<div class="progress-bar">
											<div 
												class="progress-fill" 
												style="width: {getProgressWidth(employee.usedDays, employee.allocation)}%; background-color: {employee.statusColor}"
											></div>
										</div>
										<div class="progress-text">
											{formatPercentage(employee.usagePercentage)}
										</div>
									</div>
								</td>
								<td>
									<span 
										class="status-badge status-{employee.status}" 
										style="background-color: {employee.statusColor}20; color: {employee.statusColor}; border-color: {employee.statusColor}"
									>
										{employee.statusLabel}
									</span>
								</td>
								<td>
									<button 
										class="btn btn-detail" 
										on:click={() => showEmployeeDetailModal(employee)}
										title="Lihat Detail"
									>
										👁️
									</button>
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
						on:click={() => currentPage = currentPage - 1}
					>
						← Sebelumnya
					</button>

					<div class="page-numbers">
						{#each Array(totalPages) as _, i}
							{#if i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - currentPage) <= 2}
								<button
									class="btn-page {currentPage === i + 1 ? 'active' : ''}"
									on:click={() => currentPage = i + 1}
								>
									{i + 1}
								</button>
							{:else if Math.abs(i + 1 - currentPage) === 3}
								<span class="page-ellipsis">...</span>
							{/if}
						{/each}
					</div>

					<button
						class="btn-page"
						disabled={currentPage === totalPages}
						on:click={() => currentPage = currentPage + 1}
					>
						Selanjutnya →
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Employee Detail Modal -->
	{#if showEmployeeDetail && selectedEmployee}
		<div 
			class="modal-overlay" 
			on:click={closeEmployeeDetailModal}
			on:keydown={(e) => e.key === 'Escape' && closeEmployeeDetailModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div 
				class="modal-content employee-detail-modal"
				on:click|stopPropagation
				on:keydown|stopPropagation
				role="button"
				tabindex="0"
			>
				<div class="modal-header">
					<h3>👤 Detail Cuti Tahunan - {selectedEmployee.employee.nama_lengkap}</h3>
					<button class="btn-close" on:click={closeEmployeeDetailModal}>✖️</button>
				</div>
				<div class="modal-body">
					<!-- Employee Info -->
					<div class="employee-summary">
						<div class="summary-item">
							<span class="label">📧 Email:</span>
							<span class="value">{selectedEmployee.employee.email}</span>
						</div>
						<div class="summary-item">
							<span class="label">💼 Jabatan:</span>
							<span class="value">{selectedEmployee.employee.jabatan || '-'}</span>
						</div>
						<div class="summary-item">
							<span class="label">🏢 Divisi:</span>
							<span class="value">{selectedEmployee.employee.divisi || '-'}</span>
						</div>
						<div class="summary-item">
							<span class="label">📅 Mulai Kerja:</span>
							<span class="value">{formatDate(selectedEmployee.employee.tanggal_mulai_kerja)}</span>
						</div>
					</div>

					<!-- Leave Summary -->
					<div class="leave-summary-detail">
						<h4>📊 Ringkasan Cuti {selectedYear}</h4>
						<div class="summary-grid">
							<div class="summary-card-small">
								<div class="card-value">{selectedEmployee.allocation}</div>
								<div class="card-label">Alokasi</div>
							</div>
							<div class="summary-card-small">
								<div class="card-value">{selectedEmployee.usedDays}</div>
								<div class="card-label">Terpakai</div>
							</div>
							<div class="summary-card-small">
								<div class="card-value" style="color: {selectedEmployee.statusColor}">{selectedEmployee.remainingDays}</div>
								<div class="card-label">Sisa</div>
							</div>
							<div class="summary-card-small">
								<div class="card-value">{formatPercentage(selectedEmployee.usagePercentage)}</div>
								<div class="card-label">Penggunaan</div>
							</div>
						</div>
					</div>

					<!-- Leave History -->
					{#if selectedEmployee.leaveHistory.length > 0}
						<div class="leave-history">
							<h4>📋 Riwayat Cuti Tahunan {selectedYear}</h4>
							<div class="history-table">
								<table>
									<thead>
										<tr>
											<th>Periode</th>
											<th>Durasi</th>
											<th>Keterangan</th>
											<th>Tanggal Pengajuan</th>
										</tr>
									</thead>
									<tbody>
										{#each selectedEmployee.leaveHistory as leave}
											<tr>
												<td>
													{formatDate(leave.tanggal_mulai)}
													{#if leave.tanggal_mulai !== leave.tanggal_selesai}
														- {formatDate(leave.tanggal_selesai)}
													{/if}
												</td>
												<td>{leave.days} hari</td>
												<td>{leave.keterangan || '-'}</td>
												<td>{formatDate(leave.tanggal_pengajuan)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{:else}
						<div class="no-history">
							<div class="empty-icon">📅</div>
							<p>Belum ada riwayat cuti tahunan di tahun {selectedYear}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard-page {
		padding: 20px;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Header */
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 2px solid #e5e7eb;
	}

	.header-content h1 {
		margin: 0;
		color: #1f2937;
		font-size: 2rem;
		font-weight: 700;
	}

	.header-subtitle {
		margin: 5px 0 0 0;
		color: #6b7280;
		font-size: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 10px;
	}

	/* Summary Cards */
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.summary-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 24px;
		display: flex;
		align-items: center;
		gap: 16px;
		box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2.5rem;
		opacity: 0.8;
	}

	.card-content {
		flex: 1;
	}

	.card-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		line-height: 1;
	}

	.card-label {
		font-size: 0.9rem;
		color: #6b7280;
		margin-top: 4px;
		font-weight: 500;
	}

	.card-subtitle {
		font-size: 0.8rem;
		color: #9ca3af;
		margin-top: 2px;
	}

	/* Status Summary */
	.status-summary {
		margin-bottom: 30px;
	}

	.status-summary h3 {
		margin-bottom: 15px;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.status-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.status-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 20px;
		text-align: center;
		transition: all 0.2s ease;
	}

	.status-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.1);
	}

	.status-card.status-good {
		border-left: 4px solid #10b981;
	}

	.status-card.status-warning {
		border-left: 4px solid #f59e0b;
	}

	.status-card.status-critical {
		border-left: 4px solid #ef4444;
	}

	.status-count {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
	}

	.status-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #374151;
		margin: 5px 0;
	}

	.status-desc {
		font-size: 0.8rem;
		color: #6b7280;
	}

	/* Filters */
	.filters-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		padding: 20px;
		margin-bottom: 20px;
	}

	.filters-row {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		align-items: end;
		margin-bottom: 15px;
	}

	.filters-row:last-child {
		margin-bottom: 0;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 150px;
	}

	.search-group {
		flex: 1;
		min-width: 200px;
	}

	.filter-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #374151;
	}

	.filter-group select,
	.filter-group input {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		background: white;
	}

	.filter-group select:focus,
	.filter-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.filter-info {
		display: flex;
		align-items: center;
		margin-left: auto;
	}

	.result-count {
		font-size: 0.9rem;
		color: #6b7280;
		font-weight: 500;
	}

	/* Table */
	.table-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 10px;
		overflow: hidden;
	}

	.table-container {
		overflow-x: auto;
	}

	.employee-table {
		width: 100%;
		border-collapse: collapse;
	}

	.employee-table th {
		background: #f9fafb;
		padding: 12px 16px;
		text-align: left;
		font-size: 0.85rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		white-space: nowrap;
	}

	.employee-table td {
		padding: 12px 16px;
		border-bottom: 1px solid #f3f4f6;
		vertical-align: middle;
	}

	.employee-table tr:hover {
		background: #f9fafb;
	}

	/* Employee Info */
	.employee-info {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 200px;
	}

	.employee-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: #374151;
		font-size: 1.1rem;
		border: 2px solid #e5e7eb;
	}

	.employee-details {
		flex: 1;
	}

	.employee-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.9rem;
	}

	.employee-email {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 2px;
	}

	/* Job Info */
	.job-info {
		min-width: 150px;
	}

	.job-title {
		font-weight: 500;
		color: #374151;
		font-size: 0.9rem;
	}

	.job-division {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 2px;
	}

	/* Value displays */
	.allocation-info,
	.used-info,
	.remaining-info {
		text-align: center;
		font-weight: 600;
	}

	.allocation-value,
	.used-value,
	.remaining-value {
		display: block;
		font-size: 1.1rem;
	}

	.allocation-unit,
	.used-unit,
	.remaining-unit {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 400;
	}

	/* Progress Bar */
	.progress-container {
		min-width: 120px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #f3f4f6;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 4px;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 4px;
	}

	.progress-text {
		text-align: center;
		font-size: 0.8rem;
		font-weight: 500;
		color: #374151;
	}

	/* Status Badge */
	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid;
		text-align: center;
		white-space: nowrap;
	}

	/* Buttons */
	.btn {
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-export {
		background: #10b981;
		color: white;
	}

	.btn-export:hover:not(:disabled) {
		background: #059669;
	}

	.btn-refresh {
		background: #6b7280;
		color: white;
	}

	.btn-refresh:hover:not(:disabled) {
		background: #4b5563;
	}

	.btn-detail {
		background: #f3f4f6;
		color: #374151;
		padding: 6px 10px;
		font-size: 0.8rem;
	}

	.btn-detail:hover {
		background: #e5e7eb;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-page {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.btn-page:hover:not(:disabled) {
		background: #f9fafb;
	}

	.btn-page:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-page.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.page-numbers {
		display: flex;
		gap: 5px;
	}

	.page-ellipsis {
		padding: 8px 4px;
		color: #6b7280;
	}

	/* Loading & Error States */
	.loading-state,
	.error-state {
		text-align: center;
		padding: 60px 20px;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 20px;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 15px;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h3 {
		margin: 0;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #6b7280;
		padding: 4px;
		border-radius: 4px;
	}

	.btn-close:hover {
		background: #f3f4f6;
	}

	.modal-body {
		padding: 24px;
	}

	/* Employee Detail Modal */
	.employee-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-bottom: 25px;
		padding: 20px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.summary-item .label {
		font-size: 0.8rem;
		color: #6b7280;
		font-weight: 500;
	}

	.summary-item .value {
		font-size: 0.9rem;
		color: #1f2937;
		font-weight: 600;
	}

	.leave-summary-detail {
		margin-bottom: 25px;
	}

	.leave-summary-detail h4 {
		margin-bottom: 15px;
		color: #1f2937;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 15px;
	}

	.summary-card-small {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 15px;
		text-align: center;
	}

	.summary-card-small .card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.summary-card-small .card-label {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 5px;
	}

	/* Leave History */
	.leave-history h4 {
		margin-bottom: 15px;
		color: #1f2937;
	}

	.history-table {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	.history-table table {
		width: 100%;
		border-collapse: collapse;
	}

	.history-table th {
		background: #f9fafb;
		padding: 12px;
		text-align: left;
		font-size: 0.85rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
	}

	.history-table td {
		padding: 12px;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.9rem;
	}

	.history-table tr:last-child td {
		border-bottom: none;
	}

	.no-history {
		text-align: center;
		padding: 40px 20px;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 15px;
		opacity: 0.5;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.dashboard-page {
			padding: 15px;
		}

		.dashboard-header {
			flex-direction: column;
			gap: 15px;
			align-items: stretch;
		}

		.summary-cards {
			grid-template-columns: 1fr;
		}

		.filters-row {
			flex-direction: column;
		}

		.filter-group {
			min-width: unset;
		}

		.employee-table {
			font-size: 0.8rem;
		}

		.employee-info {
			min-width: unset;
		}

		.modal-content {
			margin: 10px;
			max-height: calc(100vh - 40px);
		}
	}
</style>
