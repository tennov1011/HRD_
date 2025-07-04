<script>
	import { onMount } from 'svelte';
	import { MonthlyAttendanceService } from '$lib/services/monthlyAttendanceService.js';

	// State management
	let loading = true;
	/** @type {string|null} */
	let error = null;
	/** @type {any} */
	let reportData = null;
	/** @type {any} */
	let period = null;

	// Date selection
	let selectedYear = new Date().getFullYear();
	let selectedMonth = new Date().getMonth() + 1;

	// Filtering and sorting
	let searchTerm = '';
	let sortBy = 'nama'; // nama, attendanceRate, lateDays, absentDays
	let sortDirection = 'asc';

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 10;

	// View mode
	let viewMode = 'table'; // table, cards

	$: filteredEmployees = filterAndSortEmployees(
		reportData?.employees || [],
		searchTerm,
		sortBy,
		sortDirection
	);
	$: paginatedEmployees = paginateData(filteredEmployees, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

	onMount(() => {
		loadMonthlyReport();
	});

	async function loadMonthlyReport() {
		try {
			loading = true;
			error = null;

			const result = await MonthlyAttendanceService.getMonthlyReport(selectedYear, selectedMonth);

			if (result.success) {
				reportData = result.data;
				period = result.period;
			} else {
				// Use fallback data
				reportData = result.data;
				period = result.period;
				error = 'Menggunakan data fallback. ' + (result.error || '');
			}
		} catch (err) {
			error = 'Gagal memuat laporan: ' + /** @type {any} */ (err).message;
			console.error('Error loading monthly report:', err);
		} finally {
			loading = false;
		}
	}

	/**
	 * Filter and sort employees
	 * @param {any[]} employees
	 * @param {string} search
	 * @param {string} sortField
	 * @param {string} direction
	 */
	function filterAndSortEmployees(employees, search, sortField, direction) {
		let filtered = [...employees];

		// Filter by search term
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(emp) =>
					emp.nama.toLowerCase().includes(searchLower) ||
					emp.email.toLowerCase().includes(searchLower) ||
					emp.user_id.toLowerCase().includes(searchLower)
			);
		}

		// Sort
		filtered.sort((a, b) => {
			let valueA, valueB;

			if (sortField === 'nama') {
				valueA = a.nama.toLowerCase();
				valueB = b.nama.toLowerCase();
			} else {
				valueA = a.summary[sortField];
				valueB = b.summary[sortField];
			}

			if (direction === 'asc') {
				return valueA > valueB ? 1 : -1;
			} else {
				return valueA < valueB ? 1 : -1;
			}
		});

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

	function handleMonthChange() {
		currentPage = 1;
		loadMonthlyReport();
	}

	/**
	 * Handle sorting
	 * @param {string} field
	 */
	function handleSort(field) {
		if (sortBy === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	/**
	 * Get attendance rate CSS class
	 * @param {number} rate
	 */
	function getAttendanceRateClass(rate) {
		if (rate >= 95) return 'excellent';
		if (rate >= 85) return 'good';
		if (rate >= 75) return 'fair';
		return 'poor';
	}

	function exportToCSV() {
		if (reportData && period) {
			MonthlyAttendanceService.exportToCSV(reportData, period);
		}
	}

	/**
	 * Format date string
	 * @param {string} dateStr
	 */
	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Laporan Presensi Bulanan - HRD System</title>
</svelte:head>

<div class="monthly-attendance-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<div class="title-section">
				<h1>📊 Laporan Presensi Bulanan</h1>
				<p>Rekapitulasi dan analisis kehadiran karyawan bulanan</p>
			</div>

			<!-- Period Selector -->
			<div class="period-selector">
				<select bind:value={selectedMonth} on:change={handleMonthChange}>
					<option value={1}>Januari</option>
					<option value={2}>Februari</option>
					<option value={3}>Maret</option>
					<option value={4}>April</option>
					<option value={5}>Mei</option>
					<option value={6}>Juni</option>
					<option value={7}>Juli</option>
					<option value={8}>Agustus</option>
					<option value={9}>September</option>
					<option value={10}>Oktober</option>
					<option value={11}>November</option>
					<option value={12}>Desember</option>
				</select>

				<select bind:value={selectedYear} on:change={handleMonthChange}>
					{#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i) as year}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Memuat laporan presensi bulanan...</p>
		</div>
	{:else if error && !reportData}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h3>Gagal Memuat Laporan</h3>
			<p>{error}</p>
			<button class="btn btn-primary" on:click={loadMonthlyReport}> Coba Lagi </button>
		</div>
	{:else if reportData}
		<!-- Connection Status -->
		{#if error}
			<div class="connection-status warning">
				<div class="status-icon">⚠️</div>
				<div class="status-text">
					{error}
				</div>
			</div>
		{:else}
			<div class="connection-status connected">
				<div class="status-icon">🟢</div>
				<div class="status-text">Data terhubung dengan sistem presensi</div>
			</div>
		{/if}

		<!-- Summary Statistics -->
		<div class="summary-section">
			<div class="period-info">
				<h2>Periode: {period?.monthName} {period?.year}</h2>
				<div class="period-details">
					<span>📅 {formatDate(period?.startDate)} - {formatDate(period?.endDate)}</span>
					<span>💼 {period?.workingDays} Hari Kerja</span>
					<span>👥 {reportData.statistics.totalEmployees} Karyawan</span>
				</div>
			</div>

			<div class="stats-grid">
				<div class="stat-card excellent">
					<div class="stat-icon">📈</div>
					<div class="stat-content">
						<div class="stat-value">{reportData.statistics.averageAttendanceRate}%</div>
						<div class="stat-label">Tingkat Kehadiran Rata-rata</div>
					</div>
				</div>

				<div class="stat-card present">
					<div class="stat-icon">✅</div>
					<div class="stat-content">
						<div class="stat-value">{reportData.statistics.totalPresent}</div>
						<div class="stat-label">Total Hari Hadir</div>
					</div>
				</div>

				<div class="stat-card late">
					<div class="stat-icon">⏰</div>
					<div class="stat-content">
						<div class="stat-value">{reportData.statistics.totalLate}</div>
						<div class="stat-label">Total Hari Terlambat</div>
					</div>
				</div>

				<div class="stat-card absent">
					<div class="stat-icon">❌</div>
					<div class="stat-content">
						<div class="stat-value">{reportData.statistics.totalAbsent}</div>
						<div class="stat-label">Total Hari Tidak Hadir</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls-section">
			<div class="search-filter">
				<input
					type="text"
					placeholder="Cari karyawan..."
					bind:value={searchTerm}
					class="search-input"
				/>

				<div class="view-controls">
					<button
						class="view-btn {viewMode === 'table' ? 'active' : ''}"
						on:click={() => (viewMode = 'table')}
						title="Tampilan Tabel"
					>
						📋
					</button>
					<button
						class="view-btn {viewMode === 'cards' ? 'active' : ''}"
						on:click={() => (viewMode = 'cards')}
						title="Tampilan Kartu"
					>
						🗃️
					</button>
				</div>
			</div>

			<div class="action-buttons">
				<button class="btn btn-secondary" on:click={exportToCSV}> 📊 Export CSV </button>
			</div>
		</div>

		<!-- Data Display -->
		{#if viewMode === 'table'}
			<!-- Table View -->
			<div class="table-container">
				<table class="attendance-table">
					<thead>
						<tr>
							<th>
								<button class="sort-btn" on:click={() => handleSort('nama')}>
									Karyawan
									{#if sortBy === 'nama'}
										<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							</th>
							<th>
								<button class="sort-btn" on:click={() => handleSort('presentDays')}>
									Hadir
									{#if sortBy === 'presentDays'}
										<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							</th>
							<th>
								<button class="sort-btn" on:click={() => handleSort('lateDays')}>
									Terlambat
									{#if sortBy === 'lateDays'}
										<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							</th>
							<th>
								<button class="sort-btn" on:click={() => handleSort('absentDays')}>
									Tidak Hadir
									{#if sortBy === 'absentDays'}
										<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							</th>
							<th>Rata-rata Terlambat</th>
							<th>
								<button class="sort-btn" on:click={() => handleSort('attendanceRate')}>
									Tingkat Kehadiran
									{#if sortBy === 'attendanceRate'}
										<span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedEmployees as employee}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-avatar">
											{employee.nama.charAt(0).toUpperCase()}
										</div>
										<div class="employee-details">
											<div class="employee-name">{employee.nama}</div>
											<div class="employee-email">{employee.email}</div>
											<div class="employee-id">ID: {employee.user_id}</div>
										</div>
									</div>
								</td>
								<td>
									<div class="attendance-stat present">
										<span class="stat-number">{employee.summary.presentDays}</span>
										<span class="stat-total">/ {employee.summary.totalDays}</span>
									</div>
								</td>
								<td>
									<div class="attendance-stat late">
										<span class="stat-number">{employee.summary.lateDays}</span>
										{#if employee.summary.lateDays > 0}
											<span class="stat-detail">hari</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="attendance-stat absent">
										<span class="stat-number">{employee.summary.absentDays}</span>
										{#if employee.summary.absentDays > 0}
											<span class="stat-detail">hari</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="late-minutes">
										{#if employee.summary.averageLateMinutes > 0}
											{employee.summary.averageLateMinutes} menit
										{:else}
											-
										{/if}
									</div>
								</td>
								<td>
									<div
										class="attendance-rate {getAttendanceRateClass(
											employee.summary.attendanceRate
										)}"
									>
										{employee.summary.attendanceRate}%
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<!-- Cards View -->
			<div class="cards-container">
				{#each paginatedEmployees as employee}
					<div class="employee-card">
						<div class="card-header">
							<div class="employee-avatar large">
								{employee.nama.charAt(0).toUpperCase()}
							</div>
							<div class="employee-info">
								<h3>{employee.nama}</h3>
								<p>{employee.email}</p>
								<!-- <span class="employee-id">ID: {employee.user_id}</span> -->
							</div>
							<div
								class="attendance-rate-badge {getAttendanceRateClass(
									employee.summary.attendanceRate
								)}"
							>
								{employee.summary.attendanceRate}%
							</div>
						</div>

						<div class="card-stats">
							<div class="stat-item present">
								<div class="stat-icon">✅</div>
								<div class="stat-info">
									<span class="stat-value"
										>{employee.summary.presentDays}/{employee.summary.totalDays}</span
									>
									<span class="stat-label">Hari Hadir</span>
								</div>
							</div>

							<div class="stat-item late">
								<div class="stat-icon">⏰</div>
								<div class="stat-info">
									<span class="stat-value">{employee.summary.lateDays}</span>
									<span class="stat-label">Hari Terlambat</span>
								</div>
							</div>

							<div class="stat-item absent">
								<div class="stat-icon">❌</div>
								<div class="stat-info">
									<span class="stat-value">{employee.summary.absentDays}</span>
									<span class="stat-label">Hari Tidak Hadir</span>
								</div>
							</div>

							{#if employee.summary.averageLateMinutes > 0}
								<div class="stat-item late-avg">
									<div class="stat-icon">🕐</div>
									<div class="stat-info">
										<span class="stat-value">{employee.summary.averageLateMinutes} menit</span>
										<span class="stat-label">Rata-rata Terlambat</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

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
					{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + Math.max(1, currentPage - 2)) as page}
						{#if page <= totalPages}
							<button
								class="btn-page {page === currentPage ? 'active' : ''}"
								on:click={() => (currentPage = page)}
							>
								{page}
							</button>
						{/if}
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

		<!-- Summary Info -->
		<div class="summary-info">
			<p>
				Menampilkan {paginatedEmployees.length} dari {filteredEmployees.length} karyawan
				{#if searchTerm}
					(difilter dari {reportData.employees.length} total)
				{/if}
			</p>
		</div>
	{/if}
</div>

<style>
	.monthly-attendance-page {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	/* Header */
	.page-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 32px;
		border-radius: 16px;
		margin-bottom: 24px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}

	.title-section h1 {
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 700;
	}

	.title-section p {
		margin: 0;
		opacity: 0.9;
		font-size: 16px;
	}

	.period-selector {
		display: flex;
		gap: 12px;
	}

	.period-selector select {
		padding: 12px 16px;
		border: none;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		font-size: 14px;
		font-weight: 500;
		backdrop-filter: blur(10px);
	}

	.period-selector select option {
		color: #1e293b;
		background: white;
	}

	/* Loading & Error States */
	.loading-state,
	.error-state {
		background: white;
		padding: 60px 20px;
		border-radius: 16px;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
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

	.error-icon {
		font-size: 48px;
		margin-bottom: 16px;
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

	.connection-status.warning {
		background-color: #fef3c7;
		color: #d97706;
		border: 1px solid #fed7aa;
	}

	/* Summary Section */
	.summary-section {
		background: white;
		padding: 24px;
		border-radius: 16px;
		margin-bottom: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.period-info {
		margin-bottom: 24px;
		text-align: center;
	}

	.period-info h2 {
		margin: 0 0 12px 0;
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
	}

	.period-details {
		display: flex;
		justify-content: center;
		gap: 24px;
		flex-wrap: wrap;
		color: #64748b;
		font-size: 14px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		border-radius: 12px;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border: 1px solid #e2e8f0;
	}

	.stat-card.excellent {
		background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
		border-color: #86efac;
	}

	.stat-card.present {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-color: #93c5fd;
	}

	.stat-card.late {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-color: #fbbf24;
	}

	.stat-card.absent {
		background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
		border-color: #f87171;
	}

	.stat-icon {
		font-size: 24px;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
		display: block;
	}

	.stat-label {
		font-size: 14px;
		color: #64748b;
		margin-top: 4px;
	}

	/* Controls */
	.controls-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.search-filter {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.search-input {
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		min-width: 250px;
	}

	.view-controls {
		display: flex;
		gap: 4px;
		background: white;
		padding: 4px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.view-btn {
		padding: 8px 12px;
		border: none;
		background: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 16px;
		transition: all 0.2s ease;
	}

	.view-btn.active {
		background: #3b82f6;
		color: white;
	}

	.action-buttons {
		display: flex;
		gap: 12px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	/* Table View */
	.table-container {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.attendance-table {
		width: 100%;
		border-collapse: collapse;
	}

	.attendance-table th {
		background: #f8fafc;
		padding: 16px;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
	}

	.attendance-table td {
		padding: 16px;
		border-bottom: 1px solid #f1f5f9;
	}

	.attendance-table tr:hover {
		background: #f8fafc;
	}

	.sort-btn {
		background: none;
		border: none;
		font-weight: 600;
		color: #374151;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.sort-icon {
		font-size: 12px;
	}

	.employee-info {
		display: flex;
		flex-direction: column;
		/* gap: 12px; */
	}

	.employee-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 16px;
	}

	.employee-avatar.large {
		width: 50px;
		height: 50px;
		font-size: 18px;
	}

	.employee-details {
		flex: 1;
	}

	.employee-name {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 2px;
	}

	.employee-email {
		font-size: 13px;
		color: #64748b;
		margin-bottom: 2px;
	}

	.employee-id {
		font-size: 12px;
		color: #94a3b8;
	}

	.attendance-stat {
		text-align: center;
	}

	.stat-number {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}

	.stat-total {
		font-size: 14px;
		color: #64748b;
	}

	.stat-detail {
		font-size: 12px;
		color: #94a3b8;
		margin-left: 4px;
	}

	.late-minutes {
		text-align: center;
		color: #64748b;
	}

	.attendance-rate {
		text-align: center;
		padding: 6px 12px;
		border-radius: 20px;
		font-weight: 600;
		font-size: 14px;
	}

	.attendance-rate.excellent {
		background: #dcfce7;
		color: #16a34a;
	}

	.attendance-rate.good {
		background: #dbeafe;
		color: #2563eb;
	}

	.attendance-rate.fair {
		background: #fef3c7;
		color: #d97706;
	}

	.attendance-rate.poor {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Cards View */
/* Cards Container */
.cards-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
	padding: 10px;
}

/* Card Styling */
.employee-card {
	background: #ffffff;
	border-radius: 16px;
	padding: 20px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	border: 1px solid #e2e8f0;
}

.employee-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 20px;
	position: relative;
}

.employee-avatar.large {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background-color: #3b82f6;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	font-weight: 600;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.card-header .employee-info {
	flex: 1;
}

.card-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.2;
}

.card-header p {
	margin: 4px 0 0 0;
	font-size: 14px;
	color: #64748b;
}

.employee-id {
	display: inline-block;
	margin-top: 4px;
	font-size: 12px;
	color: #94a3b8;
	background: #f1f5f9;
	padding: 2px 8px;
	border-radius: 6px;
}

/* Badge */
.attendance-rate-badge {
	position: absolute;
	top: 0;
	right: 0;
	padding: 6px 12px;
	border-radius: 20px;
	font-weight: 600;
	font-size: 13px;
	color: #fff;
	background-color: #22c55e;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Stats Section */
.card-stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	transition: background-color 0.2s ease;
}

.stat-item.present {
	background: #ecfdf5;
	border-color: #d1fae5;
}

.stat-item.late {
	background: #fefce8;
	border-color: #fef3c7;
}

.stat-item.absent {
	background: #fef2f2;
	border-color: #fecaca;
}

.stat-item.late-avg {
	background: #f8fafc;
	border-color: #e2e8f0;
}

.stat-icon {
	font-size: 18px;
	width: 28px;
	height: 28px;
	background: #e2e8f0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	color: #334155;
}

.stat-info {
	flex: 1;
}

.stat-item .stat-value {
	font-size: 15px;
	font-weight: 600;
	color: #1e293b;
	display: block;
}

.stat-item .stat-label {
	font-size: 12px;
	color: #64748b;
	margin-top: 2px;
}


	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-bottom: 24px;
	}

	.btn-page {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
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

	/* Summary Info */
	.summary-info {
		text-align: center;
		color: #64748b;
		font-size: 14px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.monthly-attendance-page {
			padding: 16px;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}

		.period-details {
			flex-direction: column;
			gap: 8px;
		}

		.controls-section {
			flex-direction: column;
			align-items: stretch;
		}

		.search-filter {
			flex-direction: column;
		}

		.search-input {
			min-width: auto;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.table-container {
			overflow-x: auto;
		}

		.attendance-table {
			min-width: 600px;
		}

		.cards-container {
			grid-template-columns: 1fr;
		}

		.pagination {
			flex-wrap: wrap;
		}
	}
</style>
