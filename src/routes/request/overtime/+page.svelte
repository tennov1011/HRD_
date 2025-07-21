<script>
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import {
		getOvertimeRequests,
		approveOvertimeRequestMultiLevel,
		rejectOvertimeRequestMultiLevel,
		testOvertimeConnection,
		getOvertimeStatistics
	} from '$lib/services/overtimeService.js';
	import {
		getCurrentUserApprovalLevel,
		getStageDisplayName,
		canViewApprovalDetails,
		getAvailableActions,
		APPROVAL_STAGES
	} from '$lib/services/overtimeApprovalService.js';
	import { userEmail } from '$lib/services/firebaseConfig.js';
	import { isDivisionMatch } from '$lib/utils/divisionMapping.js';
	import ApprovalStatus from '$lib/component/ApprovalStatus.svelte';
	import OvertimeAttendance from '$lib/component/OvertimeAttendance.svelte';

	/** @type {any[]} */
	let overtimeRequests = [];
	let loading = true;
	let searchTerm = '';
	let statusFilter = 'all';
	let showOnlyMyApprovals = true; // 🔧 NEW: Toggle untuk melihat hanya yang perlu di-approve
	let currentPage = 1;
	let itemsPerPage = 10;
	/** @type {any} */
	let connectionStatus = null;
	let isConnected = false;
	/** @type {any} */
	let statistics = null;

	// Modal states for approval detail
	let showApprovalDetailModal = false;
	/** @type {any} */
	let selectedRequestForApproval = null;

	// Modal states for rejection
	let showRejectionModal = false;
	/** @type {any} */
	let rejectionRequest = null;
	let rejectionReason = '';

	// Toast notification
	let toastMessage = '';
	let showToast = false;
	let toastType = 'success'; // success, error, info

	// Expandable rows untuk attendance
	/** @type {Set<number>} */
	let expandedRows = new Set();

	$: filteredRequests = filterRequests(overtimeRequests, searchTerm, statusFilter);
	$: userFilteredRequests =
		getCurrentUserApprovalLevel() === APPROVAL_STAGES.MANAGER_DIVISI
			? filterByManagerDivision(filteredRequests)
			: showOnlyMyApprovals
				? filterByUserRole(filteredRequests)
				: filteredRequests;
	$: paginatedRequests = paginateData(userFilteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(userFilteredRequests.length / itemsPerPage);

	onMount(() => {
		loadOvertimeRequests();
		checkConnection();
		loadStatistics();

		// 🔧 DEBUG: Log environment info
		console.log('🌍 OVERTIME DEBUG - Environment Info:', {
			DIRECTUS_URL: import.meta.env.VITE_DIRECTUS_URL,
			hasToken: !!import.meta.env.VITE_DIRECTUS_TOKEN,
			currentUrl: window.location.href
		});
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
				console.log('✅ Overtime requests loaded from Directus:', overtimeRequests);

				// 🔧 DEBUG: Log attachment info
				overtimeRequests.forEach((request) => {
					if (request.lampiran_foto_opsional) {
						console.log(`📎 Request ${request.id} has attachment:`, {
							id: request.id,
							employee: request.employee_name || request.nama,
							attachment: request.lampiran_foto_opsional
						});
					}
				});
			} else {
				console.warn('⚠️ Using fallback data for overtime requests');
				overtimeRequests = result.data; // Fallback data

				// 🔧 DEBUG: Log fallback attachment info
				console.log('📋 Fallback data loaded:', overtimeRequests);
				overtimeRequests.forEach((request) => {
					if (request.lampiran_foto_opsional) {
						console.log(`📎 Fallback Request ${request.id} has attachment:`, {
							id: request.id,
							employee: request.employee_name || request.nama,
							attachment: request.lampiran_foto_opsional
						});
					}
				});
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
					(req.employee_email || req.email || '').toLowerCase().includes(searchLower) ||
					(req.employee_division || req.divisi || '').toLowerCase().includes(searchLower) ||
					(req.jam_masuk || '').includes(searchLower) ||
					(req.jam_keluar || '').includes(searchLower)
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
	 * Get stage CSS class for detailed approval stages
	 * @param {string} stage
	 */
	function getStageClass(stage) {
		switch (stage) {
			case 'pending':
				return 'stage-pending';
			case 'manager_divisi':
				return 'stage-manager-divisi';
			case 'hrd_admin':
				return 'stage-hrd-admin';
			case 'manager_hrd':
				return 'stage-manager-hrd';
			case 'direktur':
				return 'stage-direktur';
			case 'approved':
				return 'stage-approved';
			case 'rejected':
				return 'stage-rejected';
			default:
				return 'stage-pending';
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
	 * Format time string
	 * @param {string} timeString
	 */
	function formatTime(timeString) {
		if (!timeString) return '';
		return timeString.substring(0, 5); // HH:MM format
	}

	/**
	 * Show attachment in new window for preview
	 * @param {string} attachmentUrl
	 * @param {string} employeeName
	 */
	function previewAttachment(attachmentUrl, employeeName) {
		if (!attachmentUrl) {
			showToastMessage('Tidak ada lampiran untuk ditampilkan', 'info');
			return;
		}

		console.log('🔍 DEBUG: Preview attachment:', {
			originalUrl: attachmentUrl,
			employeeName
		});

		// Build proper Directus URL for file assets
		let fullUrl = attachmentUrl;

		// If it's just a file ID (UUID), construct full Directus asset URL
		if (attachmentUrl && !attachmentUrl.startsWith('http')) {
			const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
			fullUrl = `${DIRECTUS_URL}/assets/${attachmentUrl}`;
		}

		console.log('🔗 Opening preview URL:', fullUrl);

		// Test if URL exists before opening
		fetch(fullUrl, { method: 'HEAD' })
			.then((response) => {
				if (response.ok) {
					// Open in new window for preview
					const previewWindow = window.open(
						fullUrl,
						'_blank',
						'width=800,height=600,scrollbars=yes,resizable=yes'
					);
					if (!previewWindow) {
						showToastMessage('Popup diblokir. Silakan izinkan popup untuk preview.', 'error');
					}
				} else {
					throw new Error(`File not found (${response.status})`);
				}
			})
			.catch((error) => {
				console.error('❌ Preview error:', error);
				showToastMessage(`Gagal membuka lampiran: ${error.message}`, 'error');
			});
	}

	/**
	 * Download attachment file
	 * @param {string} attachmentUrl
	 * @param {string} employeeName
	 */
	function downloadAttachment(attachmentUrl, employeeName) {
		if (!attachmentUrl) {
			showToastMessage('Tidak ada lampiran untuk diunduh', 'info');
			return;
		}

		console.log('📥 DEBUG: Download attachment:', {
			originalUrl: attachmentUrl,
			employeeName
		});

		// Build proper Directus URL for file assets
		let fullUrl = attachmentUrl;

		// If it's just a file ID (UUID), construct full Directus asset URL
		if (attachmentUrl && !attachmentUrl.startsWith('http')) {
			const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
			fullUrl = `${DIRECTUS_URL}/assets/${attachmentUrl}`;
		}

		console.log('📥 Downloading from URL:', fullUrl);

		try {
			// Test if URL exists first
			fetch(fullUrl, { method: 'HEAD' })
				.then((response) => {
					if (response.ok) {
						// Create temporary download link
						const link = document.createElement('a');
						link.href = fullUrl;
						link.download = `lembur_${employeeName.replace(/\s+/g, '_')}_${new Date().getTime()}`;
						link.target = '_blank'; // Fallback to open in new tab if download fails
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);

						showToastMessage('Download dimulai', 'success');
					} else {
						throw new Error(`File not found (${response.status})`);
					}
				})
				.catch((error) => {
					console.error('❌ Download error:', error);
					showToastMessage(`Gagal mengunduh lampiran: ${error.message}`, 'error');
				});
		} catch (error) {
			console.error('❌ Download error:', error);
			showToastMessage('Gagal mengunduh lampiran', 'error');
		}
	}

	/**
	 * Approve overtime request menggunakan multi-level approval
	 * @param {any} request
	 */
	async function approveRequest(request) {
		try {
			const result = await approveOvertimeRequestMultiLevel(request);

			if (result.success) {
				console.log('✅ Overtime request approved');
				showToastMessage('Pengajuan lembur berhasil disetujui', 'success');
				await loadOvertimeRequests(); // Reload data
				await loadStatistics(); // Reload statistics
			} else {
				console.error('❌ Failed to approve overtime request:', result.error);
				showToastMessage(result.error || 'Gagal menyetujui pengajuan lembur', 'error');
			}
		} catch (error) {
			console.error('Error approving request:', error);
			showToastMessage('Terjadi kesalahan saat menyetujui pengajuan', 'error');
		}
	}

	/**
	 * Reject overtime request menggunakan multi-level approval
	 * @param {any} request
	 */
	async function rejectRequest(request) {
		// Open rejection modal instead of using prompt
		rejectionRequest = request;
		rejectionReason = '';
		showRejectionModal = true;
	}

	/**
	 * Submit rejection with reason from modal
	 */
	async function submitRejection() {
		if (!rejectionReason.trim()) {
			showToastMessage('Alasan penolakan wajib diisi', 'error');
			return;
		}

		try {
			const result = await rejectOvertimeRequestMultiLevel(rejectionRequest, rejectionReason);

			if (result.success) {
				console.log('✅ Overtime request rejected');
				showToastMessage('Pengajuan lembur berhasil ditolak', 'success');
				await loadOvertimeRequests(); // Reload data
				await loadStatistics(); // Reload statistics
				closeRejectionModal();
			} else {
				console.error('❌ Failed to reject overtime request:', result.error);
				showToastMessage(result.error || 'Gagal menolak pengajuan lembur', 'error');
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
			showToastMessage('Terjadi kesalahan saat menolak pengajuan', 'error');
		}
	}

	/**
	 * Close rejection modal
	 */
	function closeRejectionModal() {
		showRejectionModal = false;
		rejectionRequest = null;
		rejectionReason = '';
	}

	/**
	 * Show approval detail modal
	 * @param {any} request
	 */
	function showApprovalDetail(request) {
		selectedRequestForApproval = request;
		showApprovalDetailModal = true;
	}

	/**
	 * Close approval detail modal
	 */
	function closeApprovalDetailModal() {
		showApprovalDetailModal = false;
		selectedRequestForApproval = null;
	}

	/**
	 * Show toast notification
	 * @param {string} message
	 * @param {string} type
	 */
	function showToastMessage(message, type = 'success') {
		toastMessage = message;
		toastType = type;
		showToast = true;

		// Auto hide toast after 3 seconds
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	/**
	 * Toggle expanded state for attendance row
	 * @param {number} requestId
	 */
	function toggleAttendanceRow(requestId) {
		if (expandedRows.has(requestId)) {
			expandedRows.delete(requestId);
		} else {
			expandedRows.add(requestId);
		}
		expandedRows = new Set(expandedRows); // Trigger reactivity
	}

	/**
	 * Filter requests by manager division - always apply division filtering for manager divisi
	 * @param {any[]} requests
	 */
	function filterByManagerDivision(requests) {
		const userLevel = getCurrentUserApprovalLevel();

		console.log('🔍 DEBUG filterByManagerDivision (Overtime):', {
			userLevel,
			totalRequests: requests.length,
			showOnlyMyApprovals,
			userEmail: get(userEmail)
		});

		if (userLevel !== APPROVAL_STAGES.MANAGER_DIVISI) {
			return requests;
		}

		// For manager divisi, always filter by division first
		const divisionFiltered = requests.filter((req) => checkIfRequestFromCurrentUserDivision(req));

		console.log('🔍 DEBUG: After division filter (Overtime):', {
			originalCount: requests.length,
			divisionFilteredCount: divisionFiltered.length
		});

		if (showOnlyMyApprovals) {
			// Show only requests that need approval (pending stage)
			const approvalFiltered = divisionFiltered.filter(
				(req) => req.approval_stage === APPROVAL_STAGES.PENDING || !req.approval_stage
			);
			console.log('🔍 DEBUG: After approval stage filter (Overtime):', {
				pendingStage: APPROVAL_STAGES.PENDING,
				approvalFilteredCount: approvalFiltered.length
			});
			return approvalFiltered;
		} else {
			// Show all requests from division (any stage)
			return divisionFiltered;
		}
	}

	/**
	 * Filter requests by user role - only show requests at appropriate approval stage
	 * @param {any[]} requests
	 */
	function filterByUserRole(requests) {
		const userLevel = getCurrentUserApprovalLevel();

		console.log('🔍 DEBUG filterByUserRole START (Overtime):', {
			userLevel,
			totalRequests: requests.length,
			showOnlyMyApprovals,
			userEmail: get(userEmail)
		});

		if (!userLevel) {
			// If no approval level detected, show all requests (for regular users)
			console.log('🔍 DEBUG: No user level detected, showing all requests');
			return requests;
		}

		// Filter based on user's approval level
		// CORRECT ORDER: Manager Divisi → Admin HRD → Manager HRD → Direktur
		/** @type {string|null} */
		let targetStage = null;
		let filtered = [];

		switch (userLevel) {
			case APPROVAL_STAGES.MANAGER_DIVISI:
				// Already handled by filterByManagerDivision
				return requests;
			case APPROVAL_STAGES.HRD_ADMIN:
				targetStage = APPROVAL_STAGES.MANAGER_DIVISI;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			case APPROVAL_STAGES.MANAGER_HRD:
				targetStage = APPROVAL_STAGES.HRD_ADMIN;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			case APPROVAL_STAGES.DIREKTUR:
				targetStage = APPROVAL_STAGES.MANAGER_HRD;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			default:
				filtered = requests;
		}

		console.log('🔍 DEBUG filterByUserRole result (Overtime):', {
			userLevel,
			targetStage,
			filteredCount: filtered.length,
			sampleRequests: filtered.slice(0, 3).map((req) => ({
				id: req.id,
				stage: req.approval_stage,
				employee: req.employee_name || req.nama
			}))
		});

		return filtered;
	}

	/**
	 * Check if request is from current user's division (for manager divisi)
	 * @param {any} request
	 */
	function checkIfRequestFromCurrentUserDivision(request) {
		const userLevel = getCurrentUserApprovalLevel();

		// If not a manager divisi, allow all requests
		if (userLevel !== APPROVAL_STAGES.MANAGER_DIVISI) {
			return true;
		}

		// Get current user email from stores
		const currentUserEmail = get(userEmail);

		// Manager divisi mapping
		const managerDivisionMap = {
			'manager.it@eltama.com': 'IT',
			'manager.finance@eltama.com': 'Finance',
			'manager.procurement@eltama.com': 'Procurement',
			'manager.inventory@eltama.com': 'Inventory',
			'manager.produksi@eltama.com': 'Produksi',
			'manager.project@eltama.com': 'Project',
			'manager.marketing@eltama.com': 'Marketing',
			'manager.maintenance@eltama.com': 'Maintenance',
			'general.manager@eltama.com': 'Management',
			'plant.manager@eltama.com': 'Management'
		};

		const managerDivision = currentUserEmail ? managerDivisionMap[currentUserEmail] : null;
		const employeeDivision = request.employee_division || request.divisi;

		// Use division mapping function for accurate comparison
		const isMatch =
			managerDivision && employeeDivision
				? isDivisionMatch(managerDivision, employeeDivision)
				: false;

		console.log('🔍 DEBUG: Division filter check (Overtime):', {
			currentUserEmail,
			managerDivision,
			employeeDivision,
			requestEmployeeEmail: request.employee_email || request.email,
			isMatch
		});

		return isMatch;
	}

	// ...existing code...
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

			<!-- 🔧 NEW: Toggle untuk filter approval -->
			{#if getCurrentUserApprovalLevel()}
				<div class="filter-group">
					<label class="toggle-container">
						<input type="checkbox" bind:checked={showOnlyMyApprovals} class="toggle-checkbox" />
						<span class="toggle-text">Hanya Yang Perlu Approval</span>
					</label>
				</div>
			{/if}
		</div>

		<!-- <div class="action-buttons">
			<button class="btn btn-primary"> ➕ Tambah Lembur </button>
		</div> -->
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
							<th>Tanggal Pengajuan</th>
							<th>Tanggal Lembur</th>
							<th>Jam Kerja</th>
							<th>Lampiran</th>
							<th>Status Approval</th>
							<th>Absensi</th>
							<!-- <th>Aksi</th> -->
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
											<div class="employee-email">
												📧 {request.employee_email || request.email}
											</div>
											{#if request.employee_division || request.divisi}
												<div class="division-badge">
													📍 {request.employee_division || request.divisi}
												</div>
											{/if}
										</div>
									</div>
								</td>
								<td>
									<div class="submitted-date">
										<span class="submitted-value">
											{formatDate(request.submitted_date || request.tanggal_pengajuan)}
										</span>
									</div>
								</td>
								<td>
									<div class="overtime-date">
										<span class="date-value">
											{formatDate(request.overtime_date || request.tanggal)}
										</span>
									</div>
								</td>
								<td>
									<div class="work-time">
										<div class="time-range">
											<span class="time-label">Masuk:</span>
											<span class="time-value">{formatTime(request.jam_masuk)}</span>
										</div>
										<div class="time-range">
											<span class="time-label">Keluar:</span>
											<span class="time-value">{formatTime(request.jam_keluar)}</span>
										</div>
										{#if request.total_duration || request.durasi_jam || request.durasi_menit}
											<div class="duration-info">
												<span class="duration-label">Total:</span>
												<span class="duration-value">
													{request.total_duration ||
														`${request.durasi_jam || 0}j ${request.durasi_menit || 0}m`}
												</span>
											</div>
										{/if}
									</div>
								</td>
								<td>
									<div class="attachment-cell">
										{#if request.lampiran_foto_opsional}
											<div class="attachment-actions">
												<button
													class="btn-attachment btn-preview"
													title="Preview Lampiran"
													on:click={() =>
														previewAttachment(
															request.lampiran_foto_opsional,
															request.employee_name || request.nama
														)}
												>
													👁️ Preview
												</button>
												<button
													class="btn-attachment btn-download"
													title="Download Lampiran"
													on:click={() =>
														downloadAttachment(
															request.lampiran_foto_opsional,
															request.employee_name || request.nama
														)}
												>
													📥 Download
												</button>
											</div>
										{:else}
											<span class="no-attachment">Tidak ada lampiran</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="approval-status">
										{#if canViewApprovalDetails()}
											<div class="approval-status-mini">
												<span
													class="status-badge {getStageClass(
														request.approval_stage || request.status
													)}"
												>
													{getStageDisplayName(request.approval_stage) ||
														getStatusText(request.status)}
												</span>
												<button
													class="btn-approval-detail"
													on:click={() => showApprovalDetail(request)}
												>
													Detail
												</button>
											</div>
										{:else}
											<span
												class="status-badge {getStageClass(
													request.approval_stage || request.overall_status || request.status
												)}"
											>
												{getStageDisplayName(request.approval_stage) ||
													getStatusText(request.overall_status || request.status)}
											</span>
										{/if}
									</div>
								</td>
								<td>
									<button
										class="btn-attendance {expandedRows.has(request.id) ? 'active' : ''}"
										title="Lihat/Sembunyikan Data Absensi"
										on:click={() => toggleAttendanceRow(request.id)}
									>
										📅 {expandedRows.has(request.id) ? 'Tutup' : 'Absensi'}
									</button>
								</td>
								<td>
									<div class="action-buttons">
										{#if getAvailableActions(request).includes('approve')}
											<button
												class="btn-action btn-approve"
												title="Setujui"
												on:click={() => approveRequest(request)}
											>
												✅
											</button>
										{/if}
										{#if getAvailableActions(request).includes('reject')}
											<button
												class="btn-action btn-reject"
												title="Tolak"
												on:click={() => rejectRequest(request)}
											>
												❌
											</button>
										{/if}
									</div>
								</td>
							</tr>

							<!-- Expandable row for overtime attendance -->
							{#if expandedRows.has(request.id)}
								<tr class="attendance-row">
									<td colspan="8">
										<OvertimeAttendance overtimeRequest={request} expanded={true} />
									</td>
								</tr>
							{/if}
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

	<!-- Approval Detail Modal -->
	{#if showApprovalDetailModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click|self={closeApprovalDetailModal}
			on:keydown={(e) => e.key === 'Escape' && closeApprovalDetailModal()}
		>
			<div class="modal-content">
				<div class="modal-header">
					<h3>📋 Detail Approval Pengajuan Lembur</h3>
					<button class="btn-close" on:click={closeApprovalDetailModal}>×</button>
				</div>
				<div class="modal-body">
					{#if selectedRequestForApproval}
						<!-- Render ApprovalStatus component -->
						<ApprovalStatus request={selectedRequestForApproval} type="overtime" />

						<!-- Render OvertimeAttendance component -->
						<OvertimeAttendance overtimeRequest={selectedRequestForApproval} expanded={true} />
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Rejection Modal -->
	{#if showRejectionModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click|self={closeRejectionModal}
			on:keydown={(e) => e.key === 'Escape' && closeRejectionModal()}
		>
			<div class="modal-content rejection-modal">
				<div class="modal-header">
					<h3>❌ Tolak Pengajuan Lembur</h3>
					<button class="btn-close" on:click={closeRejectionModal}>×</button>
				</div>
				<div class="modal-body">
					{#if rejectionRequest}
						<div class="rejection-info">
							<div class="info-row">
								<span class="label">Karyawan:</span>
								<span class="value">{rejectionRequest.employee_name || rejectionRequest.nama}</span>
							</div>
							<div class="info-row">
								<span class="label">Email:</span>
								<span class="value">
									{rejectionRequest.employee_email || rejectionRequest.email}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Divisi:</span>
								<span class="value">
									{rejectionRequest.employee_division ||
										rejectionRequest.divisi ||
										'Tidak tersedia'}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Tanggal Pengajuan:</span>
								<span class="value">
									{formatDate(
										rejectionRequest.submitted_date || rejectionRequest.tanggal_pengajuan
									)}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Tanggal Lembur:</span>
								<span class="value">
									{formatDate(rejectionRequest.overtime_date || rejectionRequest.tanggal)}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Jam Masuk:</span>
								<span class="value">
									{formatTime(rejectionRequest.jam_masuk) || 'Tidak tersedia'}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Jam Keluar:</span>
								<span class="value">
									{formatTime(rejectionRequest.jam_keluar) || 'Tidak tersedia'}
								</span>
							</div>
							<div class="info-row">
								<span class="label">Total Durasi:</span>
								<span class="value">
									{rejectionRequest.total_duration ||
										`${rejectionRequest.durasi_jam || 0} jam ${rejectionRequest.durasi_menit || 0} menit`}
								</span>
							</div>
							{#if rejectionRequest.lampiran_foto_opsional}
								<div class="info-row">
									<span class="label">Lampiran:</span>
									<span class="value">
										<button
											class="btn-attachment btn-preview"
											on:click={() =>
												previewAttachment(
													rejectionRequest.lampiran_foto_opsional,
													rejectionRequest.employee_name || rejectionRequest.nama
												)}
										>
											👁️ Lihat Lampiran
										</button>
									</span>
								</div>
							{/if}
						</div>

						<div class="rejection-form">
							<label class="form-label" for="rejection-reason">
								<span class="required">*</span> Alasan Penolakan:
							</label>
							<textarea
								id="rejection-reason"
								bind:value={rejectionReason}
								placeholder="Masukkan alasan penolakan pengajuan lembur..."
								class="rejection-textarea"
								rows="4"
							></textarea>
							<div class="form-hint">
								Jelaskan dengan jelas alasan mengapa pengajuan lembur ini ditolak.
							</div>
						</div>
					{/if}
				</div>
				<div class="modal-actions">
					<button class="btn btn-secondary" on:click={closeRejectionModal}>Batal</button>
					<button
						class="btn btn-danger"
						on:click={submitRejection}
						disabled={!rejectionReason.trim()}
					>
						Tolak Pengajuan
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast-notification toast-{toastType}" class:show={showToast}>
			<div class="toast-content">
				<div class="toast-icon">
					{#if toastType === 'success'}✅{:else if toastType === 'error'}❌{:else}ℹ️{/if}
				</div>
				<div class="toast-message">{toastMessage}</div>
				<button class="toast-close" on:click={() => (showToast = false)}>×</button>
			</div>
		</div>
	{/if}
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

	.employee-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.employee-email {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: #64748b;
	}

	.division-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 12px;
		background-color: #e0e7ff;
		color: #3730a3;
		font-size: 11px;
		font-weight: 500;
		margin-top: 2px;
		align-self: flex-start;
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

	.work-time {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.time-range {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
	}

	.time-label {
		font-weight: 500;
		color: #64748b;
		min-width: 50px;
	}

	.time-value {
		font-family: monospace;
		font-weight: 600;
		color: #1e293b;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
	}

	.duration-info {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px solid #e2e8f0;
	}

	.duration-label {
		font-weight: 600;
		color: #64748b;
		font-size: 12px;
	}

	.duration-value {
		font-weight: 700;
		color: #1e293b;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 11px;
	}

	/* Attachment Styles */
	.attachment-cell {
		min-width: 120px;
	}

	.attachment-actions {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.btn-attachment {
		padding: 4px 8px;
		border: none;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.btn-preview {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
	}

	.btn-preview:hover {
		background: linear-gradient(135deg, #2563eb, #1e40af);
		transform: translateY(-1px);
	}

	.btn-download {
		background: linear-gradient(135deg, #059669, #047857);
		color: white;
	}

	.btn-download:hover {
		background: linear-gradient(135deg, #10b981, #059669);
		transform: translateY(-1px);
	}

	.no-attachment {
		font-size: 12px;
		color: #9ca3af;
		font-style: italic;
		text-align: center;
		display: block;
		padding: 8px;
		background: #f9fafb;
		border-radius: 6px;
		border: 1px dashed #d1d5db;
	}

	/* Table Responsive Adjustments */
	.requests-table th,
	.requests-table td {
		padding: 12px 8px;
		vertical-align: top;
	}

	.requests-table th:first-child,
	.requests-table td:first-child {
		min-width: 200px;
	}

	.requests-table th:nth-child(2),
	.requests-table td:nth-child(2) {
		min-width: 120px;
	}

	.requests-table th:nth-child(3),
	.requests-table td:nth-child(3) {
		min-width: 120px;
	}

	.requests-table th:nth-child(4),
	.requests-table td:nth-child(4) {
		min-width: 140px;
	}

	.requests-table th:nth-child(5),
	.requests-table td:nth-child(5) {
		min-width: 140px;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 20px;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8fafc;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
		color: #1f2937;
	}

	.modal-body {
		padding: 20px;
		flex: 1;
		overflow-y: auto;
	}

	.btn-close {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 18px;
		color: #6b7280;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.btn-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	/* Rejection Modal Styles */
	.rejection-modal {
		max-width: 600px;
	}

	.rejection-info {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.info-row {
		display: flex;
		align-items: flex-start;
		margin-bottom: 8px;
		gap: 12px;
	}

	.info-row:last-child {
		margin-bottom: 0;
	}

	.info-row .label {
		font-weight: 500;
		color: #374151;
		min-width: 100px;
		flex-shrink: 0;
	}

	.info-row .value {
		color: #1f2937;
		flex: 1;
	}

	.rejection-form {
		margin-bottom: 24px;
	}

	.form-label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 8px;
		font-size: 14px;
	}

	.form-label .required {
		color: #dc2626;
		margin-right: 4px;
	}

	.rejection-textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
		min-height: 100px;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.rejection-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.rejection-textarea::placeholder {
		color: #9ca3af;
	}

	.form-hint {
		margin-top: 8px;
		font-size: 12px;
		color: #6b7280;
		line-height: 1.4;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 10px 20px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.btn-danger {
		background: #dc2626;
		color: white;
		border: 1px solid #dc2626;
		padding: 10px 20px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b91c1c;
		border-color: #b91c1c;
	}

	.btn-danger:disabled {
		background: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Toast Notification Styles */
	.toast-notification {
		position: fixed;
		top: 20px;
		right: 20px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 2000;
		border-left: 4px solid;
		transform: translateX(100%);
		opacity: 0;
		transition: all 0.3s ease;
		max-width: 400px;
		min-width: 300px;
	}

	.toast-notification.show {
		transform: translateX(0);
		opacity: 1;
	}

	.toast-notification.toast-success {
		border-left-color: #10b981;
	}

	.toast-notification.toast-error {
		border-left-color: #ef4444;
	}

	.toast-notification.toast-info {
		border-left-color: #3b82f6;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
	}

	.toast-icon {
		font-size: 18px;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: 14px;
		color: #374151;
		font-weight: 500;
	}

	.toast-close {
		background: transparent;
		border: none;
		cursor: pointer;
		color: #9ca3af;
		font-size: 12px;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	/* 🔧 NEW: Toggle styles */
	.toggle-container {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: white;
		min-width: 200px;
		transition: all 0.2s ease;
	}

	.toggle-container:hover {
		border-color: #3b82f6;
		background: #f9fafb;
	}

	.toggle-checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.toggle-text {
		font-size: 14px;
		font-weight: 500;
		user-select: none;
	}

	/* Approval Status */
	.approval-status-mini {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.btn-approval-detail {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 12px;
		color: #6c757d;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-approval-detail:hover {
		background: #e9ecef;
		color: #495057;
	}

	/* Status Badge Styling */
	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		text-align: center;
		display: inline-block;
		min-width: 80px;
		transition: all 0.2s ease;
	}

	/* Basic Status States */
	.status-pending {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}

	.status-approved {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}

	.status-rejected {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	/* Detailed Approval Stages */
	.stage-pending {
		background: linear-gradient(135deg, #fef3c7, #fde68a);
		color: #92400e;
		border: 1px solid #fcd34d;
		box-shadow: 0 1px 3px rgba(146, 64, 14, 0.1);
	}

	.stage-manager-divisi {
		background: linear-gradient(135deg, #dbeafe, #bfdbfe);
		color: #1e40af;
		border: 1px solid #93c5fd;
		box-shadow: 0 1px 3px rgba(30, 64, 175, 0.1);
	}

	.stage-hrd-admin {
		background: linear-gradient(135deg, #ede9fe, #ddd6fe);
		color: #5b21b6;
		border: 1px solid #c4b5fd;
		box-shadow: 0 1px 3px rgba(91, 33, 182, 0.1);
	}

	.stage-manager-hrd {
		background: linear-gradient(135deg, #fce7f3, #fbcfe8);
		color: #be185d;
		border: 1px solid #f9a8d4;
		box-shadow: 0 1px 3px rgba(190, 24, 93, 0.1);
	}

	.stage-direktur {
		background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
		color: #0c4a6e;
		border: 1px solid #7dd3fc;
		box-shadow: 0 1px 3px rgba(12, 74, 110, 0.1);
	}

	.stage-approved {
		background: linear-gradient(135deg, #dcfce7, #bbf7d0);
		color: #166534;
		border: 1px solid #86efac;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(22, 101, 52, 0.15);
	}

	.stage-rejected {
		background: linear-gradient(135deg, #fee2e2, #fecaca);
		color: #991b1b;
		border: 1px solid #fca5a5;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(153, 27, 27, 0.15);
	}

	/* Hover effects for interactive badges */
	.status-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	/* Attendance Button Styling */
	.btn-attendance {
		background: #e3f2fd;
		color: #1565c0;
		border: 1px solid #bbdefb;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-width: 80px;
		justify-content: center;
	}

	.btn-attendance:hover {
		background: #bbdefb;
		color: #0d47a1;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(21, 101, 192, 0.2);
	}

	.btn-attendance.active {
		background: #1976d2;
		color: white;
		border-color: #1565c0;
	}

	.btn-attendance.active:hover {
		background: #1565c0;
		color: white;
	}

	/* Attendance Row Styling */
	.attendance-row {
		background: #f8f9fa;
		border-top: 2px solid #dee2e6;
	}

	.attendance-row td {
		padding: 0;
		border: none;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.btn-attendance {
			font-size: 10px;
			padding: 4px 8px;
			min-width: 60px;
		}
	}
</style>
