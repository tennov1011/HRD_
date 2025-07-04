<script>
	import { onMount } from 'svelte';

	// KPI Data
	let kpiData = {
		totalEmployees: 120,
		departments: 8,
		todayLeaves: 3,
		todayLate: 5,
		birthdays: 2,
		activeLeavess: 4
	};

	// Chart Data
	let monthlyAttendanceData = [
		{ month: 'Jan', present: 95, absent: 5 },
		{ month: 'Feb', present: 98, absent: 2 },
		{ month: 'Mar', present: 92, absent: 8 },
		{ month: 'Apr', present: 96, absent: 4 },
		{ month: 'May', present: 94, absent: 6 },
		{ month: 'Jun', present: 97, absent: 3 }
	];

	// Recent Applications Data
	let recentApplications = [
		{
			id: 1,
			type: 'Cuti',
			employee: 'Ahmad Santoso',
			date: '2025-07-03',
			duration: '3 hari',
			status: 'pending',
			icon: '📅'
		},
		{
			id: 2,
			type: 'Izin',
			employee: 'Siti Nurhaliza',
			date: '2025-07-02',
			duration: '2 jam',
			status: 'approved',
			icon: '🕐'
		},
		{
			id: 3,
			type: 'Lembur',
			employee: 'Budi Pratama',
			date: '2025-07-01',
			duration: '4 jam',
			status: 'pending',
			icon: '⏰'
		},
		{
			id: 4,
			type: 'Cuti',
			employee: 'Maya Dewi',
			date: '2025-06-30',
			duration: '5 hari',
			status: 'rejected',
			icon: '📅'
		}
	];

	// Department Leave Statistics
	let departmentStats = [
		{ name: 'IT', leaves: 8, color: '#3b82f6' },
		{ name: 'HR', leaves: 5, color: '#10b981' },
		{ name: 'Finance', leaves: 3, color: '#f59e0b' },
		{ name: 'Marketing', leaves: 6, color: '#ef4444' },
		{ name: 'Operations', leaves: 4, color: '#8b5cf6' }
	];

	function getStatusClass(status) {
		switch (status) {
			case 'approved':
				return 'status-approved';
			case 'pending':
				return 'status-pending';
			case 'rejected':
				return 'status-rejected';
			default:
				return '';
		}
	}

	function getStatusText(status) {
		switch (status) {
			case 'approved':
				return 'Disetujui';
			case 'pending':
				return 'Pending';
			case 'rejected':
				return 'Ditolak';
			default:
				return status;
		}
	}

	onMount(() => {
		// Simulate data loading
		console.log('Dashboard loaded');
	});
</script>

<div class="dashboard">
	<!-- KPI Cards Section -->
	<div class="kpi-section">
		<h2 class="section-title">📊 Ringkasan Hari Ini</h2>
		<div class="kpi-grid">
			<div class="kpi-card">
				<div class="kpi-icon">👥</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.totalEmployees}</div>
					<div class="kpi-label">Total Karyawan</div>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">🏢</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.departments}</div>
					<div class="kpi-label">Departemen</div>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">📅</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.todayLeaves}</div>
					<div class="kpi-label">Izin Hari Ini</div>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">⏰</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.todayLate}</div>
					<div class="kpi-label">Terlambat Hari Ini</div>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">🎉</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.birthdays}</div>
					<div class="kpi-label">Ulang Tahun</div>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">🔒</div>
				<div class="kpi-content">
					<div class="kpi-value">{kpiData.activeLeavess}</div>
					<div class="kpi-label">Cuti Berlangsung</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Charts Section -->
	<div class="charts-section">
		<div class="charts-grid">
			<!-- Monthly Attendance Chart -->
			<div class="chart-card">
				<h3 class="chart-title">📈 Grafik Kehadiran Bulanan</h3>
				<div class="chart-container">
					<div class="bar-chart">
						{#each monthlyAttendanceData as data, index}
							<div class="bar-group">
								<div class="bar-present" style="height: {data.present}%">
									<span class="bar-value">{data.present}%</span>
								</div>
								<div class="bar-label">{data.month}</div>
							</div>
						{/each}
					</div>
					<div class="chart-legend">
						<div class="legend-item">
							<div class="legend-color present"></div>
							<span>Hadir</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Department Statistics -->
			<div class="chart-card">
				<h3 class="chart-title">🥧 Statistik Cuti per Departemen</h3>
				<div class="chart-container">
					<div class="pie-chart-container">
						<div class="pie-chart-visual">
							<div class="pie-center">
								<div class="pie-total">
									{departmentStats.reduce((sum, dept) => sum + dept.leaves, 0)}
								</div>
								<div class="pie-label">Total Cuti</div>
							</div>
						</div>
						<div class="pie-legend">
							{#each departmentStats as dept}
								<div class="legend-item">
									<div class="legend-color" style="background-color: {dept.color}"></div>
									<span>{dept.name}: {dept.leaves}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Applications Section -->
	<div class="applications-section">
		<div class="section-header">
			<h2 class="section-title">📋 Pengajuan Terbaru</h2>
			<!-- <button class="btn-view-all">Lihat Semua</button> -->
		</div>

		<div class="applications-table">
			<div class="table-header">
				<div class="th">Jenis</div>
				<div class="th">Karyawan</div>
				<div class="th">Tanggal</div>
				<div class="th">Durasi</div>
				<div class="th">Status</div>
				<div class="th">Aksi</div>
			</div>

			{#each recentApplications as app}
				<div class="table-row">
					<div class="td">
						<span class="app-type">
							<span class="app-icon">{app.icon}</span>
							{app.type}
						</span>
					</div>
					<div class="td">{app.employee}</div>
					<div class="td">{new Date(app.date).toLocaleDateString('id-ID')}</div>
					<div class="td">{app.duration}</div>
					<div class="td">
						<span class="status-badge {getStatusClass(app.status)}">
							{getStatusText(app.status)}
						</span>
					</div>
					<div class="td">
						<button class="btn-detail">Detail</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.dashboard {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.dashboard-header {
		margin-bottom: 32px;
		background: white;
		padding: 24px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.dashboard-header h1 {
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 700;
		color: #1e293b;
	}

	.dashboard-header p {
		margin: 0 0 16px 0;
		color: #64748b;
		font-size: 16px;
	}

	.current-date {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		display: inline-block;
	}

	.section-title {
		font-size: 20px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 20px 0;
	}

	/* KPI Cards */
	.kpi-section {
		margin-bottom: 32px;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.kpi-card {
		background: white;
		padding: 20px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 16px;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.kpi-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.kpi-icon {
		font-size: 32px;
		width: 56px;
		height: 56px;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.kpi-value {
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 4px;
	}

	.kpi-label {
		font-size: 14px;
		color: #64748b;
		font-weight: 500;
	}

	/* Charts */
	.charts-section {
		margin-bottom: 32px;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 24px;
	}

	.chart-card {
		background: white;
		padding: 24px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-title {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 20px 0;
	}

	.bar-chart {
		display: flex;
		align-items: end;
		gap: 16px;
		height: 200px;
		padding: 20px 0;
	}

	.bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.bar-present {
		background: linear-gradient(180deg, #3b82f6, #1d4ed8);
		width: 40px;
		border-radius: 4px 4px 0 0;
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 8px;
		min-height: 20px;
	}

	.bar-value {
		color: white;
		font-size: 12px;
		font-weight: 600;
	}

	.bar-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
	}

	.chart-legend {
		display: flex;
		gap: 16px;
		margin-top: 16px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #64748b;
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 4px;
	}

	.legend-color.present {
		background: #3b82f6;
	}

	.pie-chart-container {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.pie-chart-visual {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: conic-gradient(
			#3b82f6 0deg 120deg,
			#10b981 120deg 180deg,
			#f59e0b 180deg 220deg,
			#ef4444 220deg 280deg,
			#8b5cf6 280deg 360deg
		);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.pie-center {
		width: 80px;
		height: 80px;
		background: white;
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.pie-total {
		font-size: 20px;
		font-weight: 700;
		color: #1e293b;
	}

	.pie-label {
		font-size: 10px;
		color: #64748b;
	}

	.pie-legend {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Applications Table */
	.applications-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.section-header {
		display: flex;
		justify-content: between;
		align-items: center;
		padding: 24px;
		border-bottom: 1px solid #e2e8f0;
	}

	.btn-view-all {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s ease;
	}

	.btn-view-all:hover {
		opacity: 0.9;
	}

	.applications-table {
		display: flex;
		flex-direction: column;
	}

	.table-header {
		display: grid;
		grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr 1fr;
		gap: 16px;
		padding: 16px 24px;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.th {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.table-row {
		display: grid;
		grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr 1fr;
		gap: 16px;
		padding: 16px 24px;
		border-bottom: 1px solid #f1f5f9;
		transition: background 0.2s ease;
	}

	.table-row:hover {
		background: #f8fafc;
	}

	.td {
		font-size: 14px;
		color: #64748b;
		display: flex;
		align-items: center;
	}

	.app-type {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		color: #374151;
	}

	.app-icon {
		font-size: 16px;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-approved {
		background: #dcfce7;
		color: #166534;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-rejected {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-detail {
		background: #f1f5f9;
		color: #3b82f6;
		border: 1px solid #e2e8f0;
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-detail:hover {
		background: #3b82f6;
		color: white;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.dashboard {
			padding: 16px;
		}

		.kpi-grid {
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.table-header,
		.table-row {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.th,
		.td {
			padding: 4px 0;
		}
	}
</style>
