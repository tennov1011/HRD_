<script>
	import { onMount } from 'svelte';
	import {
		getAdvanceRequests,
		approveAdvanceRequest,
		rejectAdvanceRequest,
		testAdvanceConnection,
		getAdvanceStatistics
	} from '$lib/services/advanceService.js';
	import {
		recordKasbonPayment,
		getKasbonPaymentHistory
	} from '$lib/services/kasbonPaymentServiceNew.js';
	import {
		approveKasbonRequestSingleLevel,
		rejectKasbonRequestSingleLevel
	} from '$lib/services/kasbonService.js';
	import {
		getCurrentUserApprovalLevel,
		canApproveAtStage,
		getAvailableActions,
		getApprovalStatusSummary,
		getStageDisplayName,
		APPROVAL_STAGES
	} from '$lib/services/kasbonApprovalService.js';
	import { notifications, kasbonNotifications } from '$lib/stores/notificationStore.js';
	import NotificationContainer from '$lib/component/NotificationContainer.svelte';

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

	// Payment tracking variables
	let showPaymentModal = false;
	let showDetailModal = false;
	/** @type {any} */
	let selectedRequest = null;
	let paymentAmount = 0;
	let paymentDate = new Date().toISOString().split('T')[0];
	let paymentNotes = '';
	let paymentStatusFilter = 'all'; // all, on-track, overdue, completed
	let paymentHistory = [];

	// Approval tracking variables
	let showRejectionModal = false;
	/** @type {any} */
	let rejectionRequest = null;
	let rejectionReason = '';
	let isApproving = false;
	let isRejecting = false;

	$: filteredRequests = filterRequests(
		advanceRequests,
		searchTerm,
		statusFilter,
		paymentStatusFilter
	);
	$: paginatedRequests = paginateData(filteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

	/**
	 * Calculate payment progress for a request
	 * @param {any} request
	 */
	function getPaymentProgress(request) {
		const reqStatus = request.approval_stage || request.status;
		if (reqStatus !== 'approved') {
			return { percentage: 0, paidAmount: 0, remainingAmount: 0, isOverdue: false };
		}

		// Gunakan data dari Directus jika tersedia, fallback ke perhitungan manual
		const totalAmount = request.amount || request.nominal || 0;
		const totalPaid = request.total_paid || 0; // Dari field Directus
		const paymentStatus = request.payment_status || 'pending'; // Dari field Directus

		const remainingAmount = Math.max(0, totalAmount - totalPaid);
		const percentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

		// Tentukan status overdue berdasarkan tanggal dan tenor
		const monthlyPayment = request.monthly_payment || totalAmount / (request.tenor || 12);
		const approvedDate = new Date(request.approved_date || request.tanggal_pengajuan);
		const currentDate = new Date();

		// Hitung berapa bulan yang sudah berlalu sejak disetujui
		const monthsPassed = Math.floor(
			(currentDate.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
		);
		const expectedPaidAmount = Math.min(monthsPassed * monthlyPayment, totalAmount);

		// Overdue jika pembayaran kurang dari yang diharapkan sesuai jadwal
		const isOverdue = totalPaid < expectedPaidAmount && percentage < 100;

		// Hitung tanggal jatuh tempo berikutnya
		const paymentsCount = Math.floor(totalPaid / monthlyPayment);
		const nextPaymentDate = new Date(
			approvedDate.getTime() + (paymentsCount + 1) * 30 * 24 * 60 * 60 * 1000
		);

		return {
			percentage: Math.min(percentage, 100),
			paidAmount: totalPaid,
			remainingAmount,
			isOverdue,
			expectedPaidAmount,
			monthsPassed,
			nextPaymentDate,
			paymentStatus,
			monthlyPayment,
			totalAmount
		};
	}

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
				// Filter dan validasi data untuk memastikan tidak ada null/undefined
				advanceRequests = (result.data || []).filter((req) => req && req.id);
				console.log('✅ Advance requests loaded from Directus');
			} else {
				console.warn('⚠️ Using fallback data for advance requests');
				// Filter fallback data juga
				advanceRequests = (result.data || []).filter((req) => req && req.id);
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
	 * Filter requests based on search term, status, and payment status
	 * @param {any[]} requests
	 * @param {string} search
	 * @param {string} status
	 * @param {string} paymentStatus
	 */
	function filterRequests(requests, search, status, paymentStatus) {
		let filtered = requests;

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(req) =>
					(req.employee_name || req.nama || '').toLowerCase().includes(searchLower) ||
					(req.user_id || '').toLowerCase().includes(searchLower) ||
					(req.description || req.keterangan || '').toLowerCase().includes(searchLower) ||
					(req.employee_email || req.email || '').toLowerCase().includes(searchLower) ||
					(req.employee_division || req.divisi || '').toLowerCase().includes(searchLower)
			);
		}

		if (status !== 'all') {
			filtered = filtered.filter((req) => {
				const reqStatus = req.approval_stage || req.status;
				return reqStatus === status;
			});
		}

		if (paymentStatus !== 'all') {
			filtered = filtered.filter((req) => {
				const reqStatus = req.approval_stage || req.status;
				if (reqStatus !== 'approved') return false;

				const paymentProgress = getPaymentProgress(req);
				switch (paymentStatus) {
					case 'completed':
						return paymentProgress.percentage >= 100;
					case 'on-track':
						return paymentProgress.percentage < 100 && !paymentProgress.isOverdue;
					case 'overdue':
						return paymentProgress.percentage < 100 && paymentProgress.isOverdue;
					default:
						return true;
				}
			});
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

	/** @param {any} request */
	function getStatusClass(request) {
		const status = request.approval_stage || request.status;
		switch (status) {
			case 'pending':
				return 'status-pending';
			case 'approved':
				return 'status-approved';
			case 'rejected':
				return 'status-rejected';
			case 'manager_hrd':
				return 'status-approved';
			default:
				return 'status-pending';
		}
	}

	/** @param {any} request */
	function getStatusText(request) {
		const status = request.approval_stage || request.status;
		switch (status) {
			case 'pending':
				return 'Menunggu Persetujuan';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			case 'manager_hrd':
				return 'Disetujui Manager HRD';
			default:
				return 'Menunggu Persetujuan';
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
	 * Approve kasbon request (Manager HRD only)
	 * @param {any} request
	 */
	async function approveRequest(request) {
		if (isApproving) return;

		isApproving = true;
		try {
			const result = await approveKasbonRequestSingleLevel(request);

			if (result.success) {
				console.log('✅ Kasbon request approved');
				
				// Show success notification
				kasbonNotifications.approved(request);
				
				await loadAdvanceRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to approve kasbon request:', result.error);
				
				// Show error notification
				notifications.error(
					'Gagal Menyetujui Kasbon',
					result.error || 'Terjadi kesalahan saat menyetujui pengajuan kasbon'
				);
			}
		} catch (error) {
			console.error('Error approving request:', error);
			
			// Show error notification
			notifications.error(
				'Kesalahan Sistem',
				'Terjadi kesalahan saat menyetujui pengajuan. Silakan coba lagi.'
			);
		} finally {
			isApproving = false;
		}
	}

	/**
	 * Reject kasbon request (Manager HRD only)
	 * @param {any} request
	 */
	async function rejectRequest(request) {
		// Open rejection modal instead of using prompt
		rejectionRequest = request;
		rejectionReason = '';
		showRejectionModal = true;
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

	/**
	 * Calculate payment progress for a request
	 * @param {any} request
	 */
	/**
	 * Open payment modal
	 * @param {any} request
	 */
	function openPaymentModal(request) {
		selectedRequest = request;
		paymentAmount = request.monthly_payment || 0;
		paymentDate = new Date().toISOString().split('T')[0];
		paymentNotes = '';
		showPaymentModal = true;
	}

	/**
	 * Close payment modal
	 */
	function closePaymentModal() {
		showPaymentModal = false;
		selectedRequest = null;
		paymentAmount = 0;
		paymentNotes = '';
	}

	/**
	 * Open detail modal with payment history
	 * @param {any} request
	 */
	async function openDetailModal(request) {
		selectedRequest = request;
		showDetailModal = true;

		// Load payment history
		try {
			const result = await getKasbonPaymentHistory(request.id);
			if (result.success) {
				paymentHistory = result.data || [];
			} else {
				// Fallback to mock data if API fails
				paymentHistory = request.payments || [];
			}
		} catch (error) {
			console.error('Error loading payment history:', error);
			paymentHistory = request.payments || [];
		}
	}

	/**
	 * Close detail modal
	 */
	function closeDetailModal() {
		showDetailModal = false;
		selectedRequest = null;
		paymentHistory = [];
	}

	/**
	 * Submit rejection with reason from modal
	 */
	async function submitRejection() {
		if (!rejectionReason.trim()) {
			notifications.warning(
				'Alasan Penolakan Diperlukan',
				'Silakan masukkan alasan penolakan sebelum melanjutkan'
			);
			return;
		}

		if (isRejecting) return;

		isRejecting = true;
		try {
			const result = await rejectKasbonRequestSingleLevel(rejectionRequest, rejectionReason);

			if (result.success) {
				console.log('✅ Kasbon request rejected');
				
				// Show rejection notification
				kasbonNotifications.rejected(rejectionRequest, rejectionReason);
				
				await loadAdvanceRequests(); // Reload data
				await loadStatistics(); // Reload statistics

				// Close modal
				showRejectionModal = false;
				rejectionRequest = null;
				rejectionReason = '';
			} else {
				console.error('❌ Failed to reject kasbon request:', result.error);
				
				// Show error notification
				notifications.error(
					'Gagal Menolak Kasbon',
					result.error || 'Terjadi kesalahan saat menolak pengajuan kasbon'
				);
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
			
			// Show error notification
			notifications.error(
				'Kesalahan Sistem',
				'Terjadi kesalahan saat menolak pengajuan. Silakan coba lagi.'
			);
		} finally {
			isRejecting = false;
		}
	}

	/**
	 * Cancel rejection modal
	 */
	function cancelRejection() {
		showRejectionModal = false;
		rejectionRequest = null;
		rejectionReason = '';
	}

	/**
	 * Test notification system with sample notifications
	 */
	function testNotifications() {
		const sampleKasbon = {
			employee_name: 'John Doe',
			formatted_amount: 'Rp 3.000.000'
		};

		// Test all notification types with delay
		setTimeout(() => {
			kasbonNotifications.submitted(sampleKasbon);
		}, 200);

		setTimeout(() => {
			kasbonNotifications.approved(sampleKasbon);
		}, 1200);

		setTimeout(() => {
			kasbonNotifications.rejected(sampleKasbon, 'Nominal melebihi batas maksimal');
		}, 2400);

		setTimeout(() => {
			kasbonNotifications.paymentRecorded({
				amount: 500000,
				formatted_amount: 'Rp 500.000'
			});
		}, 3600);

		setTimeout(() => {
			notifications.info(
				'Test Notifikasi Selesai',
				'Semua jenis notifikasi telah ditampilkan'
			);
		}, 4800);
	}

	/**
	 * Record payment for advance request
	 */
	async function recordPayment() {
		if (!selectedRequest || paymentAmount <= 0) return;

		try {
			const result = await recordKasbonPayment({
				kasbon_id: selectedRequest.id,
				amount: paymentAmount,
				payment_date: paymentDate,
				notes: paymentNotes,
				payment_method: 'salary_deduction'
			});

			if (result.success) {
				console.log('✅ Payment recorded successfully');

				// Show success notification
				kasbonNotifications.paymentRecorded({
					amount: paymentAmount,
					formatted_amount: `Rp ${paymentAmount.toLocaleString('id-ID')}`
				});

				// Update local data with real response
				if (result.data && result.data.kasbon) {
					// Pastikan advanceRequests dan selectedRequest valid
					if (
						advanceRequests &&
						Array.isArray(advanceRequests) &&
						selectedRequest &&
						selectedRequest.id
					) {
						const index = advanceRequests.findIndex((req) => req && req.id === selectedRequest.id);
						if (index !== -1) {
							advanceRequests[index] = {
								...advanceRequests[index],
								total_paid: result.data.kasbon.total_paid,
								payment_status: result.data.kasbon.payment_status,
								last_payment_date: paymentDate
							};
							advanceRequests = [...advanceRequests];
						}
					}
				}

				await loadAdvanceRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to record payment:', result.error);

				// Show error notification
				notifications.error(
					'Gagal Mencatat Pembayaran',
					result.error || 'Terjadi kesalahan saat mencatat pembayaran kasbon'
				);

				// Fallback untuk update local state jika API gagal
				if (selectedRequest && selectedRequest.id) {
					if (!selectedRequest.payments) {
						selectedRequest.payments = [];
					}

					selectedRequest.payments.push({
						id: Date.now(),
						amount: paymentAmount,
						payment_date: paymentDate,
						notes: paymentNotes,
						payment_method: 'salary_deduction',
						recorded_by: 'HRD',
						recorded_at: new Date().toISOString()
					});

					// Update the requests array safely
					if (advanceRequests && Array.isArray(advanceRequests)) {
						const index = advanceRequests.findIndex((req) => req && req.id === selectedRequest.id);
						if (index !== -1) {
							advanceRequests[index] = { ...selectedRequest };
							advanceRequests = [...advanceRequests];
						}
					}
				}
			}

			closePaymentModal();
		} catch (error) {
			console.error('Error recording payment:', error);
			
			// Show error notification
			notifications.error(
				'Kesalahan Sistem',
				'Terjadi kesalahan saat mencatat pembayaran. Silakan coba lagi.'
			);
		}
	}
</script>

<svelte:head>
	<title>Pengajuan Kasbon - HRD System</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<div class="header-text">
				<h1>Pengajuan Kasbon</h1>
				<p>Kelola pengajuan kasbon karyawan</p>
			</div>
			<div class="header-actions">
				<button 
					class="btn btn-test-notification" 
					on:click={() => testNotifications()}
					title="Test sistem notifikasi"
				>
					🔔 Test Notifikasi
				</button>
			</div>
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
				placeholder="Cari berdasarkan nama, ID, divisi, alasan..."
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
		<div class="filter-group">
			<select bind:value={paymentStatusFilter}>
				<option value="all">Semua Pembayaran</option>
				<option value="on-track">Tepat Waktu</option>
				<option value="overdue">Terlambat</option>
				<option value="completed">Lunas</option>
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
							<th>Progress Cicilan</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedRequests as request}
							{@const paymentProgress = getPaymentProgress(request)}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-name">{request.employee_name || request.nama}</div>
										<!-- <div class="employee-id">{request.user_id}</div> -->
										<div class="employee-division">
											📍 {request.employee_division || request.divisi}
										</div>
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
									<span class="status-badge {getStatusClass(request)}">
										{getStatusText(request)}
									</span>
									{#if request.approved_by}
										<div class="approved-info">
											<small>oleh {request.approved_by}</small>
											<small>{formatDate(request.approved_date)}</small>
										</div>
									{/if}
								</td>
								<td>
									{#if request.status === 'approved'}
										<div class="payment-progress">
											<div class="progress-info">
												<div class="progress-header">
													<div class="progress-text">
														<span class="progress-percentage"
															>{paymentProgress.percentage.toFixed(1)}%</span
														>
														<span
															class="progress-status {paymentProgress.paymentStatus === 'completed'
																? 'completed'
																: paymentProgress.isOverdue
																	? 'overdue'
																	: 'on-track'}"
														>
															{paymentProgress.paymentStatus === 'completed'
																? 'Lunas'
																: paymentProgress.isOverdue
																	? 'Terlambat'
																	: paymentProgress.percentage > 0
																		? 'Berjalan'
																		: 'Belum Bayar'}
														</span>
													</div>
													<div
														class="progress-bar"
														title="Progress Pembayaran: {formatCurrency(
															paymentProgress.totalPaid
														)} dari {formatCurrency(
															request.amount || request.nominal
														)} ({paymentProgress.percentage.toFixed(
															1
														)}%). {paymentProgress.isOverdue
															? 'Status: Terlambat bayar'
															: paymentProgress.percentage >= 100
																? 'Status: Lunas'
																: 'Status: Dalam pembayaran'}"
													>
														<div
															class="progress-fill {paymentProgress.paymentStatus === 'completed'
																? 'completed'
																: paymentProgress.isOverdue
																	? 'overdue'
																	: 'on-track'}"
															style="width: {Math.min(paymentProgress.percentage, 100)}%"
														></div>
													</div>
												</div>
												<div class="progress-details">
													<div class="progress-amounts">
														<div class="amount-item">
															<span class="amount-label">Dibayar</span>
															<span class="amount-value"
																>{formatCurrency(paymentProgress.paidAmount)}</span
															>
														</div>
														<div class="amount-item">
															<span class="amount-label">Sisa</span>
															<span class="amount-value"
																>{formatCurrency(paymentProgress.remainingAmount)}</span
															>
														</div>
													</div>
													{#if paymentProgress.percentage > 0 && paymentProgress.percentage < 100}
														<div class="progress-schedule">
															<small class="schedule-info">
																<div class="schedule-row">
																	<span
																		>Cicilan: {formatCurrency(
																			paymentProgress.monthlyPayment
																		)}/bulan</span
																	>
																	{#if paymentProgress.isOverdue}
																		<span class="overdue-indicator">
																			⚠️ Terlambat {paymentProgress.monthsPassed} bulan
																		</span>
																	{:else}
																		<span class="ontime-indicator"> ✅ Tepat waktu </span>
																	{/if}
																</div>
																{#if paymentProgress.nextPaymentDate}
																	<div class="next-payment">
																		Jatuh tempo: {formatDate(paymentProgress.nextPaymentDate)}
																	</div>
																{/if}
															</small>
														</div>
													{:else if paymentProgress.percentage >= 100}
														<div class="completion-badge">
															<span class="completed-indicator">🎉 Pembayaran Selesai</span>
														</div>
													{/if}
												</div>
											</div>
										</div>
									{:else}
										<div class="payment-progress">
											<span class="no-payment">Belum Disetujui</span>
										</div>
									{/if}
								</td>
								<td>
									<div class="action-buttons">
										{#if request.status === 'pending' || request.approval_stage === 'pending'}
											{@const availableActions = getAvailableActions(request)}
											{#if availableActions.includes('approve')}
												<button
													class="btn btn-approve"
													on:click={() => approveRequest(request)}
													disabled={isApproving}
												>
													{#if isApproving}
														⏳ Menyetujui...
													{:else}
														✓ Setujui
													{/if}
												</button>
											{/if}
											{#if availableActions.includes('reject')}
												<button
													class="btn btn-reject"
													on:click={() => rejectRequest(request)}
													disabled={isRejecting}
												>
													✗ Tolak
												</button>
											{/if}
										{:else if request.status === 'approved' || request.approval_stage === 'approved'}
											{#if paymentProgress.percentage < 100}
												<button class="btn btn-payment" on:click={() => openPaymentModal(request)}>
													💰 Catat Bayar
												</button>
											{/if}
											<button class="btn btn-detail" on:click={() => openDetailModal(request)}>
												👁️ Detail
											</button>
										{:else}
											<button class="btn btn-detail" on:click={() => openDetailModal(request)}>
												👁️ Detail
											</button>
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

<!-- Payment Modal -->
{#if showPaymentModal && selectedRequest}
	{@const progress = getPaymentProgress(selectedRequest)}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="0"
		on:click={(e) => {
			if (e.target === e.currentTarget) closePaymentModal();
		}}
		on:keydown={(e) => e.key === 'Escape' && closePaymentModal()}
	>
		<div class="modal-content" role="document">
			<div class="modal-header">
				<h3>Catat Pembayaran Cicilan</h3>
				<button class="modal-close" on:click={closePaymentModal}>✕</button>
			</div>

			<div class="modal-body">
				<div class="employee-summary">
					<h4>{selectedRequest.employee_name || selectedRequest.nama}</h4>
					<p class="employee-division-info">
						<span class="division-tag"
							>📍 {selectedRequest.employee_division || selectedRequest.divisi}</span
						>
						<span class="employee-id-info">ID: {selectedRequest.user_id}</span>
					</p>
					<p>Total Kasbon: {formatCurrency(selectedRequest.amount || selectedRequest.nominal)}</p>
					<p>Cicilan Bulanan: {formatCurrency(selectedRequest.monthly_payment || 0)}</p>
				</div>

				<div class="payment-summary">
					<div class="current-progress">
						<div class="progress-header-modal">
							<span class="progress-label">Progress Pembayaran</span>
							<span class="progress-percentage-modal">{progress.percentage.toFixed(1)}%</span>
						</div>
						<div
							class="progress-bar-modal"
							title="Progress Detail: {formatCurrency(progress.paidAmount)} dari {formatCurrency(
								selectedRequest.amount || selectedRequest.nominal
							)} ({progress.percentage.toFixed(1)}%). {progress.isOverdue
								? 'Status: Terlambat pembayaran'
								: progress.percentage >= 100
									? 'Status: Pembayaran selesai'
									: 'Status: Pembayaran berjalan lancar'}"
						>
							<div
								class="progress-fill-modal {progress.paymentStatus === 'completed'
									? 'completed'
									: progress.isOverdue
										? 'overdue'
										: 'on-track'}"
								style="width: {Math.min(progress.percentage, 100)}%"
							></div>
						</div>
					</div>
					<div class="summary-grid">
						<div class="summary-item">
							<span class="summary-label">Sudah Dibayar:</span>
							<span class="summary-value">{formatCurrency(progress.paidAmount)}</span>
						</div>
						<div class="summary-item">
							<span class="summary-label">Sisa Tagihan:</span>
							<span class="summary-value">{formatCurrency(progress.remainingAmount)}</span>
						</div>
						<div class="summary-item">
							<span class="summary-label">Status:</span>
							<span
								class="summary-status {progress.paymentStatus === 'completed'
									? 'completed'
									: progress.isOverdue
										? 'overdue'
										: 'on-track'}"
							>
								{progress.paymentStatus === 'completed'
									? 'Lunas'
									: progress.isOverdue
										? 'Terlambat'
										: progress.percentage > 0
											? 'Berjalan'
											: 'Belum Bayar'}
							</span>
						</div>
						<div class="summary-item">
							<span class="summary-label">Cicilan Bulanan:</span>
							<span class="summary-value">{formatCurrency(progress.monthlyPayment)}</span>
						</div>
					</div>
				</div>

				<div class="form-group">
					<label for="paymentAmount">Jumlah Pembayaran</label>
					<input
						id="paymentAmount"
						type="number"
						bind:value={paymentAmount}
						min="0"
						max={progress.remainingAmount}
						step="1000"
						placeholder="Masukkan jumlah pembayaran"
					/>
					<small>Maksimal: {formatCurrency(progress.remainingAmount)}</small>
				</div>

				<div class="form-group">
					<label for="paymentDate">Tanggal Pembayaran</label>
					<input id="paymentDate" type="date" bind:value={paymentDate} />
				</div>

				<div class="form-group">
					<label for="paymentNotes">Catatan (Opsional)</label>
					<textarea
						id="paymentNotes"
						bind:value={paymentNotes}
						placeholder="Tambahkan catatan pembayaran..."
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={closePaymentModal}> Batal </button>
				<button
					class="btn btn-primary"
					on:click={recordPayment}
					disabled={paymentAmount <= 0 || paymentAmount > progress.remainingAmount}
				>
					Catat Pembayaran
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Rejection Modal -->
{#if showRejectionModal && rejectionRequest}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="0"
		on:click={(e) => {
			if (e.target === e.currentTarget) cancelRejection();
		}}
		on:keydown={(e) => e.key === 'Escape' && cancelRejection()}
	>
		<div class="modal-content" role="document">
			<div class="modal-header">
				<h3>Tolak Pengajuan Kasbon</h3>
				<button class="modal-close" on:click={cancelRejection}>✕</button>
			</div>

			<div class="modal-body">
				<div class="employee-summary">
					<h4>{rejectionRequest.employee_name || rejectionRequest.nama}</h4>
					<p class="employee-division-info">
						<span class="division-tag"
							>📍 {rejectionRequest.employee_division || rejectionRequest.divisi}</span
						>
					</p>
				</div>

				<div class="advance-summary">
					<div class="advance-detail">
						<span class="label">Nominal Pengajuan:</span>
						<span class="amount"
							>Rp {Number(rejectionRequest.nominal || 0).toLocaleString('id-ID')}</span
						>
					</div>
					<div class="advance-detail">
						<span class="label">Tanggal Pengajuan:</span>
						<span class="date"
							>{rejectionRequest.tanggal || rejectionRequest.tanggal_pengajuan}</span
						>
					</div>
				</div>

				<div class="form-group">
					<label for="rejectionReason">Alasan Penolakan *</label>
					<textarea
						id="rejectionReason"
						bind:value={rejectionReason}
						placeholder="Masukkan alasan penolakan pengajuan kasbon..."
						rows="4"
						required
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={cancelRejection}>Batal</button>
				<button
					class="btn btn-danger"
					on:click={submitRejection}
					disabled={!rejectionReason.trim() || isRejecting}
				>
					{#if isRejecting}
						⏳ Menolak...
					{:else}
						✗ Tolak Pengajuan
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Detail Modal -->
{#if showDetailModal && selectedRequest}
	{@const progress = getPaymentProgress(selectedRequest)}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="0"
		on:click={(e) => {
			if (e.target === e.currentTarget) closeDetailModal();
		}}
		on:keydown={(e) => e.key === 'Escape' && closeDetailModal()}
	>
		<div class="modal-content modal-content-wide" role="document">
			<div class="modal-header">
				<h3>Detail Kasbon & Riwayat Pembayaran</h3>
				<button class="modal-close" on:click={closeDetailModal}>✕</button>
			</div>

			<div class="modal-body">
				<!-- Employee Information -->
				<div class="detail-section">
					<h4>Informasi Karyawan</h4>
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Nama Karyawan</span>
							<span class="info-value">{selectedRequest.employee_name || selectedRequest.nama}</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">User ID</span>
							<span class="info-value">{selectedRequest.user_id}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Divisi</span>
							<span class="info-value division-badge"
								>📍 {selectedRequest.employee_division || selectedRequest.divisi}</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">Email</span>
							<span class="info-value"
								>{selectedRequest.employee_email || selectedRequest.email}</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">Status</span>
							<span class="status-badge {getStatusClass(selectedRequest)}">
								{getStatusText(selectedRequest)}
							</span>
						</div>
					</div>
				</div>

				<!-- Kasbon Information -->
				<div class="detail-section">
					<h4>Detail Kasbon</h4>
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Total Kasbon</span>
							<span class="info-value amount-highlight"
								>{formatCurrency(selectedRequest.amount || selectedRequest.nominal)}</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">Tenor</span>
							<span class="info-value"
								>{selectedRequest.tenor_months || selectedRequest.tenor} bulan</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">Cicilan per Bulan</span>
							<span class="info-value">{formatCurrency(selectedRequest.monthly_payment || 0)}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Keterangan</span>
							<span class="info-value"
								>{selectedRequest.description || selectedRequest.keterangan}</span
							>
						</div>
						<div class="info-item">
							<span class="info-label">Tanggal Pengajuan</span>
							<span class="info-value"
								>{formatDate(
									selectedRequest.submitted_date || selectedRequest.tanggal_pengajuan
								)}</span
							>
						</div>
						{#if selectedRequest.approved_date}
							<div class="info-item">
								<span class="info-label">Tanggal Disetujui</span>
								<span class="info-value">{formatDate(selectedRequest.approved_date)}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Rejection Information -->
				{#if selectedRequest.status === 'rejected' || selectedRequest.approval_stage === 'rejected'}
					<div class="detail-section rejection-section">
						<h4>Informasi Penolakan</h4>
						<div class="rejection-info">
							<div class="rejection-icon">❌</div>
							<div class="rejection-details">
								{#if selectedRequest.final_rejection_reason}
									<div class="rejection-item">
										<span class="rejection-label">Alasan Penolakan:</span>
										<div class="rejection-reason">{selectedRequest.final_rejection_reason}</div>
									</div>
								{/if}
								{#if selectedRequest.manager_hrd_rejection_reason}
									<div class="rejection-item">
										<span class="rejection-label">Catatan Manager HRD:</span>
										<div class="rejection-reason">
											{selectedRequest.manager_hrd_rejection_reason}
										</div>
									</div>
								{/if}
								{#if selectedRequest.final_rejected_date}
									<div class="rejection-item">
										<span class="rejection-label">Tanggal Penolakan:</span>
										<div class="rejection-date">
											{formatDate(selectedRequest.final_rejected_date)}
										</div>
									</div>
								{/if}
								{#if selectedRequest.final_rejected_by}
									<div class="rejection-item">
										<span class="rejection-label">Ditolak oleh:</span>
										<div class="rejection-by">{selectedRequest.final_rejected_by}</div>
									</div>
								{/if}
								{#if !selectedRequest.final_rejection_reason && !selectedRequest.manager_hrd_rejection_reason}
									<div class="rejection-item">
										<span class="rejection-label">Status:</span>
										<div class="rejection-reason">
											Pengajuan kasbon ditolak oleh sistem approval
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Payment Progress -->
				{#if selectedRequest.status === 'approved'}
					<div class="detail-section">
						<h4>Progress Pembayaran</h4>
						<div class="progress-summary">
							<div class="progress-visual">
								<div class="progress-header-detail">
									<span class="progress-percentage-large">{progress.percentage.toFixed(1)}%</span>
									<span
										class="progress-status-detail {progress.paymentStatus === 'completed'
											? 'completed'
											: progress.isOverdue
												? 'overdue'
												: 'on-track'}"
									>
										{progress.paymentStatus === 'completed'
											? 'Lunas'
											: progress.isOverdue
												? 'Terlambat'
												: progress.percentage > 0
													? 'Berjalan'
													: 'Belum Bayar'}
									</span>
								</div>
								<div class="progress-bar-detail">
									<div
										class="progress-fill-detail {progress.paymentStatus === 'completed'
											? 'completed'
											: progress.isOverdue
												? 'overdue'
												: 'on-track'}"
										style="width: {Math.min(progress.percentage, 100)}%"
									></div>
								</div>
							</div>
							<div class="progress-stats">
								<div class="stat-item">
									<span class="stat-label">Sudah Dibayar</span>
									<span class="stat-value paid">{formatCurrency(progress.paidAmount)}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Sisa Tagihan</span>
									<span class="stat-value remaining"
										>{formatCurrency(progress.remainingAmount)}</span
									>
								</div>
								<div class="stat-item">
									<span class="stat-label">Bulan Berlalu</span>
									<span class="stat-value">{progress.monthsPassed} bulan</span>
								</div>
								{#if progress.nextPaymentDate && progress.percentage < 100}
									<div class="stat-item">
										<span class="stat-label">Jatuh Tempo Berikutnya</span>
										<span class="stat-value">{formatDate(progress.nextPaymentDate)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Payment History -->
					<div class="detail-section">
						<h4>Riwayat Pembayaran</h4>
						{#if paymentHistory.length > 0}
							<div class="payment-history">
								{#each paymentHistory as payment, index}
									<div class="payment-item {index === 0 ? 'latest' : ''}">
										<div class="payment-header">
											<div class="payment-number">
												<span class="payment-badge">#{index + 1}</span>
												{#if index === 0}
													<span class="latest-badge">Terbaru</span>
												{/if}
											</div>
											<div class="payment-amount">
												{formatCurrency(payment.amount)}
											</div>
										</div>
										<div class="payment-details">
											<div class="payment-meta">
												<div class="meta-item">
													<span class="meta-label">📅 Tanggal</span>
													<span class="meta-value">{formatDate(payment.payment_date)}</span>
												</div>
												<div class="meta-item">
													<span class="meta-label">💳 Metode</span>
													<span class="meta-value">
														{payment.payment_method === 'salary_deduction'
															? 'Potong Gaji'
															: payment.payment_method || 'Manual'}
													</span>
												</div>
												{#if payment.recorded_by}
													<div class="meta-item">
														<span class="meta-label">👤 Dicatat oleh</span>
														<span class="meta-value">{payment.recorded_by}</span>
													</div>
												{/if}
											</div>
											{#if payment.notes}
												<div class="payment-notes">
													<span class="notes-label">📝 Catatan:</span>
													<span class="notes-text">{payment.notes}</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="no-history">
								<div class="no-history-icon">💳</div>
								<h5>Belum Ada Pembayaran</h5>
								<p>Riwayat pembayaran akan muncul setelah cicilan pertama dicatat</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				{#if selectedRequest.status === 'approved' && progress.percentage < 100}
					<button
						class="btn btn-payment"
						on:click={() => {
							closeDetailModal();
							openPaymentModal(selectedRequest);
						}}
					>
						💰 Catat Pembayaran
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={closeDetailModal}> Tutup </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.page-header {
		margin-bottom: 32px;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
	}

	.header-text {
		flex: 1;
	}

	.header-actions {
		display: flex;
		gap: 12px;
		align-items: center;
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

	.btn-test-notification {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		border: none;
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
	}

	.btn-test-notification:hover {
		background: linear-gradient(135deg, #1d4ed8, #1e40af);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
	}

	.btn-test-notification:active {
		transform: translateY(0);
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

	.employee-division {
		font-size: 12px;
		color: #059669;
		font-weight: 500;
		margin-top: 2px;
		padding: 2px 8px;
		background: #ecfdf5;
		border-radius: 8px;
		display: inline-block;
		border: 1px solid #d1fae5;
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

	.btn-payment {
		background: #8b5cf6;
		color: white;
	}

	.btn-payment:hover {
		background: #7c3aed;
		transform: translateY(-1px);
	}

	/* Payment Progress Styles */
	.payment-progress {
		min-width: 220px;
		max-width: 280px;
	}

	.progress-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.progress-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.progress-text {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}

	.progress-percentage {
		font-weight: 700;
		color: #1e293b;
		font-size: 16px;
	}

	.progress-status {
		font-size: 10px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		white-space: nowrap;
	}

	.progress-status.on-track {
		background: #dbeafe;
		color: #2563eb;
	}

	.progress-status.overdue {
		background: #fee2e2;
		color: #dc2626;
	}

	.progress-status.completed {
		background: #d1fae5;
		color: #059669;
	}

	.progress-bar {
		width: 100%;
		height: 10px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
		cursor: help;
		transition: all 0.2s ease;
	}

	.progress-bar:hover {
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.1),
			0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.progress-fill {
		height: 100%;
		border-radius: 6px;
		transition: width 0.8s ease-in-out;
		position: relative;
		overflow: hidden;
	}

	/* .progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		animation: shimmer 2.5s infinite;
	} */

	/* @keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	} */

	.progress-fill.on-track {
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
	}

	.progress-fill.overdue {
		background: linear-gradient(90deg, #ef4444, #dc2626);
		box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
		animation: pulse-overdue 1.8s infinite;
	}

	/* @keyframes pulse-overdue {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	} */

	.progress-fill.completed {
		background: linear-gradient(90deg, #10b981, #059669);
		box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3);
	}

	.progress-details {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.progress-amounts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.amount-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.amount-label {
		font-size: 10px;
		color: #64748b;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.amount-value {
		font-size: 12px;
		color: #1e293b;
		font-weight: 600;
	}

	.progress-schedule {
		margin-top: 4px;
		padding-top: 6px;
		border-top: 1px solid #e2e8f0;
	}

	.schedule-info {
		color: #64748b;
		font-size: 10px;
		line-height: 1.4;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.schedule-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	.next-payment {
		margin-top: 2px;
		font-weight: 500;
		color: #374151;
		font-size: 11px;
	}

	.overdue-indicator {
		background: linear-gradient(135deg, #fef3c7, #fbbf24);
		color: #92400e;
		padding: 2px 8px;
		border-radius: 12px;
		font-weight: 500;
		font-size: 9px;
		border: 1px solid #f59e0b;
		white-space: nowrap;
	}

	.ontime-indicator {
		background: linear-gradient(135deg, #a7f3d0);
		color: #065f46;
		padding: 2px 8px;
		border-radius: 12px;
		font-weight: 500;
		font-size: 9px;
		border: 1px solid #059669;
		white-space: nowrap;
	}

	.completion-badge {
		margin-top: 8px;
		text-align: center;
	}

	.completed-indicator {
        background: #a7f3d0;
        color: #064e3b;
        padding: 6px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 10px;
        border: 2px solid #059669;
        display: inline-block;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        text-transform: uppercase;
        letter-spacing: 0.5px;
	}

	.no-payment {
		color: #64748b;
		font-style: italic;
		font-size: 13px;
		text-align: center;
		padding: 16px;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px dashed #d1d5db;
	}

	/* Mobile Responsiveness for Progress Display */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.header-actions {
			align-self: stretch;
		}

		.btn-test-notification {
			width: 100%;
			justify-content: center;
		}

		.progress-amounts {
			grid-template-columns: 1fr;
			gap: 6px;
		}

		.schedule-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.overdue-indicator,
		.ontime-indicator {
			font-size: 8px;
			padding: 1px 6px;
		}

		.completed-indicator {
			font-size: 9px;
			padding: 4px 12px;
		}

		.progress-bar {
			height: 8px;
		}

		.progress-bar-modal {
			height: 10px;
		}

		.progress-percentage-modal {
			font-size: 16px;
		}

		.progress-label {
			font-size: 12px;
		}

		.summary-grid {
			grid-template-columns: 1fr;
			gap: 8px;
		}
	}

	@media (max-width: 480px) {
		.schedule-info {
			font-size: 9px;
		}

		.next-payment {
			font-size: 10px;
		}

		.overdue-indicator,
		.ontime-indicator {
			font-size: 7px;
			padding: 1px 4px;
		}

		.progress-bar {
			height: 6px;
		}

		.progress-details {
			gap: 4px;
		}
	}

	/* Modal Styles */
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
		border-radius: 16px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-content-wide {
		max-width: 800px;
	}

	.modal-header {
		padding: 24px 24px 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 24px;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1e293b;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 20px;
		color: #64748b;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.modal-close:hover {
		background: #f1f5f9;
		color: #1e293b;
	}

	.modal-body {
		padding: 0 24px 24px;
	}

	.employee-summary {
		background: #f8fafc;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.employee-summary h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1e293b;
	}

	.employee-summary p {
		margin: 4px 0;
		font-size: 14px;
		color: #64748b;
	}

	.employee-division-info {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 8px 0 !important;
	}

	.division-tag {
		background: #ecfdf5;
		color: #059669;
		padding: 2px 8px;
		border-radius: 8px;
		font-size: 11px;
		font-weight: 600;
		border: 1px solid #d1fae5;
	}

	.employee-id-info {
		color: #64748b;
		font-size: 12px;
		font-weight: 500;
	}

	.payment-summary {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
		background: #f8fafc;
	}

	.current-progress {
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e2e8f0;
	}

	.progress-header-modal {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.progress-label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.progress-percentage-modal {
		font-size: 18px;
		font-weight: 700;
		color: #1f2937;
	}

	.progress-bar-modal {
		width: 100%;
		height: 12px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
		cursor: help;
		transition: all 0.2s ease;
	}

	.progress-bar-modal:hover {
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.1),
			0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.progress-fill-modal {
		height: 100%;
		border-radius: 6px;
		transition: width 0.8s ease-in-out;
		position: relative;
		overflow: hidden;
	}

	.progress-fill-modal::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		animation: shimmer 2.5s infinite;
	}

	.progress-fill-modal.on-track {
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		box-shadow: 0 1px 3px rgba(59, 130, 246, 0.4);
	}

	.progress-fill-modal.overdue {
		background: linear-gradient(90deg, #ef4444, #dc2626);
		box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
		animation: pulse-overdue 1.8s infinite;
	}

	.progress-fill-modal.completed {
		background: linear-gradient(90deg, #10b981, #059669);
		box-shadow: 0 1px 3px rgba(16, 185, 129, 0.4);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px;
		background: white;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.summary-item:last-child {
		border-bottom: 1px solid #e5e7eb;
	}

	.summary-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.summary-value {
		font-size: 14px;
		color: #1e293b;
		font-weight: 600;
	}

	.summary-status {
		font-size: 12px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		width: fit-content;
	}

	.summary-status.on-track {
		background: #dbeafe;
		color: #2563eb;
	}

	.summary-status.overdue {
		background: #fee2e2;
		color: #dc2626;
	}

	.summary-status.completed {
		background: #d1fae5;
		color: #059669;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group small {
		display: block;
		margin-top: 4px;
		font-size: 12px;
		color: #64748b;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-footer {
		padding: 0 24px 24px;
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
		border: 1px solid #3b82f6;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
		border-color: #2563eb;
	}

	.btn-primary:disabled {
		background: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Detail Modal Styles */
	.detail-section {
		margin-bottom: 32px;
		padding-bottom: 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.detail-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.detail-section h4 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-value {
		font-size: 14px;
		color: #1e293b;
		font-weight: 500;
	}

	.amount-highlight {
		font-size: 16px;
		font-weight: 700;
		color: #059669;
	}

	.division-badge {
		background: #ecfdf5;
		color: #059669;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		border: 1px solid #d1fae5;
		display: inline-block;
	}

	/* Rejection Section Styles */
	.rejection-section {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 32px;
	}

	.rejection-section h4 {
		color: #dc2626;
		margin-bottom: 16px;
	}

	.rejection-info {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.rejection-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.rejection-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.rejection-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.rejection-label {
		font-size: 12px;
		color: #991b1b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.rejection-reason {
		background: white;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #fecaca;
		color: #1f2937;
		font-size: 14px;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.rejection-date,
	.rejection-by {
		color: #dc2626;
		font-weight: 500;
		font-size: 14px;
	}

	.progress-summary {
		display: grid;
		grid-template-columns: 2fr 3fr;
		gap: 24px;
		align-items: start;
	}

	.progress-visual {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.progress-header-detail {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.progress-percentage-large {
		font-size: 32px;
		font-weight: 700;
		color: #1e293b;
	}

	.progress-status-detail {
		font-size: 14px;
		font-weight: 600;
		padding: 6px 16px;
		border-radius: 20px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.progress-status-detail.on-track {
		background: #dbeafe;
		color: #2563eb;
	}

	.progress-status-detail.overdue {
		background: #fee2e2;
		color: #dc2626;
	}

	.progress-status-detail.completed {
		background: #d1fae5;
		color: #059669;
	}

	.progress-bar-detail {
		width: 100%;
		height: 16px;
		background: #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.progress-fill-detail {
		height: 100%;
		border-radius: 8px;
		transition: width 0.8s ease-in-out;
		position: relative;
		overflow: hidden;
	}

	.progress-fill-detail::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		animation: shimmer 2.5s infinite;
	}

	.progress-fill-detail.on-track {
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		box-shadow: 0 1px 3px rgba(59, 130, 246, 0.4);
	}

	.progress-fill-detail.overdue {
		background: linear-gradient(90deg, #ef4444, #dc2626);
		box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
	}

	.progress-fill-detail.completed {
		background: linear-gradient(90deg, #10b981, #059669);
		box-shadow: 0 1px 3px rgba(16, 185, 129, 0.4);
	}

	.progress-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.stat-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 16px;
		color: #1e293b;
		font-weight: 600;
	}

	.stat-value.paid {
		color: #059669;
	}

	.stat-value.remaining {
		color: #dc2626;
	}

	.payment-history {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.payment-item {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s ease;
	}

	.payment-item:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
	}

	.payment-item.latest {
		background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
		border-color: #0ea5e9;
	}

	.payment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.payment-number {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.payment-badge {
		background: #3b82f6;
		color: white;
		padding: 4px 12px;
		border-radius: 16px;
		font-size: 12px;
		font-weight: 600;
	}

	.latest-badge {
		background: #10b981;
		color: white;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.payment-amount {
		font-size: 18px;
		font-weight: 700;
		color: #059669;
	}

	.payment-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.payment-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 12px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-label {
		font-size: 11px;
		color: #64748b;
		font-weight: 500;
	}

	.meta-value {
		font-size: 13px;
		color: #1e293b;
		font-weight: 500;
	}

	.payment-notes {
		background: #f1f5f9;
		padding: 12px;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.notes-label {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
		display: block;
		margin-bottom: 4px;
	}

	.notes-text {
		font-size: 13px;
		color: #374151;
		line-height: 1.4;
	}

	.no-history {
		text-align: center;
		padding: 40px 20px;
		color: #64748b;
	}

	.no-history-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.no-history h5 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 600;
		color: #374151;
	}

	.no-history p {
		margin: 0;
		font-size: 14px;
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

		.payment-progress {
			min-width: auto;
		}

		.progress-text {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.progress-amounts {
			flex-direction: column;
			gap: 2px;
		}

		.modal-overlay {
			padding: 10px;
		}

		.modal-content {
			max-height: 95vh;
		}

		.modal-header {
			padding: 16px 16px 0;
		}

		.modal-body {
			padding: 0 16px 16px;
		}

		.modal-footer {
			padding: 0 16px 16px;
			flex-direction: column;
		}

		.form-group input,
		.form-group textarea {
			padding: 10px 12px;
		}

		/* Detail Modal Responsive */
		.modal-content-wide {
			max-width: 95vw;
		}

		.info-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.progress-summary {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.progress-stats {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.payment-meta {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.payment-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}
	}

	@media (max-width: 480px) {
		.data-table th:nth-child(3),
		.data-table td:nth-child(3),
		.data-table th:nth-child(4),
		.data-table td:nth-child(4) {
			display: none;
		}

		.progress-text {
			font-size: 12px;
		}

		.progress-percentage {
			font-size: 12px;
		}

		.btn {
			padding: 6px 12px;
			font-size: 12px;
		}
	}
</style>

<!-- Notification Container -->
<NotificationContainer />
