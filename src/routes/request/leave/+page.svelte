<script>
	import { onMount } from 'svelte';
	import {
		getAllLeaveRequests,
		approveLeaveRequest,
		rejectLeaveRequest,
		testConnection
	} from '$lib/services/leaveService.js';

	/** @type {any[]} */
	let leaveRequests = [];
	let loading = true;
	let searchTerm = '';
	let statusFilter = 'all'; // all, pending, approved, rejected
	let typeFilter = 'all'; // all, hours, days
	let currentPage = 1;
	let itemsPerPage = 10;
	/** @type {any} */
	let connectionStatus = null;
	let isConnected = false;

	// Modal states
	let showAttachmentModal = false;
	/** @type {any} */
	let currentAttachment = null;
	/** @type {any} */
	let currentRequest = null;

	$: filteredRequests = filterRequests(leaveRequests, searchTerm, statusFilter, typeFilter);
	$: paginatedRequests = paginateData(filteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

	onMount(async () => {
		await checkConnection();
		await loadLeaveRequests();
	});

	async function checkConnection() {
		connectionStatus = await testConnection();
		isConnected = connectionStatus.success;
	}

	async function loadLeaveRequests() {
		try {
			loading = true;
			const result = await getAllLeaveRequests();

			if (result.success) {
				leaveRequests = result.data;
				console.log('📊 Loaded leave requests:', result.total, 'items');
				console.log(
					'📊 Breakdown - Hours:',
					result.breakdown?.hours,
					'Days:',
					result.breakdown?.days
				);
			} else {
				console.warn('⚠️ Using fallback data:', result.error);
				leaveRequests = result.data; // Fallback data
			}
		} catch (error) {
			console.error('Error loading leave requests:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * @param {any[]} requests
	 * @param {string} search
	 * @param {string} status
	 * @param {string} type
	 */
	function filterRequests(requests, search, status, type) {
		let filtered = requests;

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(req) =>
					req.employee_name?.toLowerCase().includes(searchLower) ||
					req.user_id?.toLowerCase().includes(searchLower) ||
					req.employee_email?.toLowerCase().includes(searchLower) ||
					req.reason?.toLowerCase().includes(searchLower) ||
					req.leave_type?.toLowerCase().includes(searchLower)
			);
		}

		if (status !== 'all') {
			filtered = filtered.filter((req) => req.status === status);
		}

		if (type !== 'all') {
			filtered = filtered.filter((req) => req.type === type);
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
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	/** @param {string} type */
	function getTypeText(type) {
		switch (type) {
			case 'hours':
				return 'Izin Jam';
			case 'days':
				return 'Izin Hari';
			default:
				return type;
		}
	}

	/** @param {string} type */
	function getTypeBadgeClass(type) {
		switch (type) {
			case 'hours':
				return 'type-hours';
			case 'days':
				return 'type-days';
			default:
				return 'type-hours';
		}
	}

	/** @param {any} request */
	async function approveRequest(request) {
		try {
			const result = await approveLeaveRequest(request);
			if (result.success) {
				// Update local state
				const index = leaveRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					leaveRequests[index] = {
						...leaveRequests[index],
						status: 'approved',
						approved_by: 'HR Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					leaveRequests = [...leaveRequests];
				}
				console.log('✅ Request approved successfully');
			} else {
				console.error('❌ Failed to approve request:', result.error);
				alert('Gagal menyetujui pengajuan: ' + result.error);
			}
		} catch (error) {
			console.error('Error approving request:', error);
			alert('Terjadi kesalahan saat menyetujui pengajuan');
		}
	}

	/** @param {any} request */
	async function rejectRequest(request) {
		try {
			const result = await rejectLeaveRequest(request);
			if (result.success) {
				// Update local state
				const index = leaveRequests.findIndex((req) => req.id === request.id);
				if (index !== -1) {
					leaveRequests[index] = {
						...leaveRequests[index],
						status: 'rejected',
						approved_by: 'HR Manager',
						approved_date: new Date().toISOString().split('T')[0]
					};
					leaveRequests = [...leaveRequests];
				}
				console.log('✅ Request rejected successfully');
			} else {
				console.error('❌ Failed to reject request:', result.error);
				alert('Gagal menolak pengajuan: ' + result.error);
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
			alert('Terjadi kesalahan saat menolak pengajuan');
		}
	}

	/**
	 * Check if request has attachment
	 * @param {any} request
	 */
	function hasAttachment(request) {
		return !!(request.attachment || request.lampiran);
	}

	/**
	 * Get attachment URL or filename
	 * @param {any} request
	 */
	function getAttachmentUrl(request) {
		const attachment = request.attachment || request.lampiran;
		if (!attachment) return null;

		// If it's a full URL, return as is
		if (attachment.startsWith('http://') || attachment.startsWith('https://')) {
			return attachment;
		}

		// If it's a Directus file ID or path, construct the URL
		const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
		if (attachment.includes('/')) {
			// It's already a path
			return `${directusUrl}/assets/${attachment}`;
		} else {
			// It's a file ID
			return `${directusUrl}/assets/${attachment}`;
		}
	}

	/** @param {any} request */
	function openAttachmentModal(request) {
		currentRequest = request;
		currentAttachment = getAttachmentUrl(request);
		showAttachmentModal = true;
	}

	function closeAttachmentModal() {
		showAttachmentModal = false;
		currentRequest = null;
		currentAttachment = null;
	}

	/**
	 * Get file extension from attachment
	 * @param {any} request
	 */
	function getFileExtension(request) {
		const attachment = request.attachment || request.lampiran;
		if (!attachment) return '';

		const parts = attachment.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
	}

	/**
	 * Check if attachment is an image
	 * @param {any} request
	 */
	function isImageAttachment(request) {
		const ext = getFileExtension(request);
		return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
	}

	/**
	 * Download attachment
	 */
	function downloadAttachment() {
		if (currentAttachment) {
			const link = document.createElement('a');
			link.href = currentAttachment;
			link.download = currentRequest?.attachment || currentRequest?.lampiran || 'attachment';
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
</script>

<svelte:head>
	<title>Pengajuan Izin/Cuti - HRD System</title>
</svelte:head>

<div class="leave-requests-page">
	<!-- Header Actions -->
	<div class="page-actions">
		<!-- Connection Status -->
		{#if connectionStatus}
			<div class="connection-status {isConnected ? 'connected' : 'disconnected'}">
				{#if isConnected}
					🟢 Terhubung ke Directus
				{:else}
					🔴 Menggunakan data demo (Directus tidak tersedia)
				{/if}
			</div>
		{/if}

		<div class="search-filters">
			<!-- Search -->
			<div class="filter-group">
				<input
					type="text"
					placeholder="Cari nama karyawan, email, atau alasan..."
					bind:value={searchTerm}
					class="search-input"
				/>
			</div>

			<!-- Status Filter -->
			<div class="filter-group">
				<select bind:value={statusFilter} class="status-filter">
					<option value="all">Semua Status</option>
					<option value="pending">Menunggu</option>
					<option value="approved">Disetujui</option>
					<option value="rejected">Ditolak</option>
				</select>
			</div>

			<!-- Type Filter -->
			<div class="filter-group">
				<select bind:value={typeFilter} class="type-filter">
					<option value="all">Semua Tipe</option>
					<option value="hours">Izin Jam</option>
					<option value="days">Izin Hari</option>
				</select>
			</div>
		</div>

		<div class="action-buttons">
			<button class="btn btn-primary"> ➕ Tambah Pengajuan </button>
			<button class="btn btn-secondary" on:click={loadLeaveRequests}> 🔄 Refresh </button>
		</div>
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data pengajuan...</p>
			</div>
		{:else if leaveRequests.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<h3>Belum Ada Pengajuan</h3>
				<p>Belum ada pengajuan izin/cuti yang masuk.</p>
			</div>
		{:else}
			<!-- Requests Table -->
			<div class="table-container">
				<table class="requests-table">
					<thead>
						<tr>
							<th>Karyawan</th>
							<th>Jenis</th>
							<th>Tanggal</th>
							<th>Durasi</th>
							<th>Alasan</th>
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
											{request.employee_name
												? request.employee_name.charAt(0).toUpperCase()
												: request.nama?.charAt(0).toUpperCase() || '?'}
										</div>
										<div class="employee-details">
											<div class="employee-name">{request.employee_name || request.nama}</div>
											<div class="employee-id">{request.user_id}</div>
											<div class="employee-email">{request.employee_email || request.email}</div>
										</div>
									</div>
								</td>
								<td>
									<div class="type-container">
										<span class="leave-type">{request.leave_type}</span>
										<span class="type-badge {getTypeBadgeClass(request.type)}">
											{getTypeText(request.type)}
										</span>
									</div>
								</td>
								<td>
									<div class="date-range">
										<div class="start-date">{formatDate(request.start_date)}</div>
										{#if request.start_date !== request.end_date && request.type === 'days'}
											<div class="date-separator">s.d</div>
											<div class="end-date">{formatDate(request.end_date)}</div>
										{/if}
										{#if request.type === 'hours'}
											<div class="time-range">{request.dari_jam} - {request.sampai_jam}</div>
										{/if}
									</div>
								</td>
								<td>
									<span class="duration">
										{#if request.type === 'hours'}
											{request.duration || `${request.dari_jam} - ${request.sampai_jam}`}
										{:else}
											{request.days} hari
										{/if}
									</span>
								</td>
								<td>
									<div class="reason" title={request.reason}>
										{request.reason}
									</div>
									<!-- {#if request.attachment || request.lampiran}
										<div class="attachment">
											📎 {request.attachment || request.lampiran}
										</div>
									{/if} -->
								</td>
								<td>
									<span class="status-badge {getStatusClass(request.status)}">
										{getStatusText(request.status)}
									</span>
									{#if request.approved_by}
										<div class="approved-by">
											oleh {request.approved_by}
										</div>
									{/if}
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
										{#if hasAttachment(request)}
											<button
												class="btn-action btn-detail"
												title="Lihat Lampiran"
												on:click={() => openAttachmentModal(request)}
											>
												👁️
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

	<!-- Attachment Modal -->
	{#if showAttachmentModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click={closeAttachmentModal}
			on:keydown={(e) => e.key === 'Escape' && closeAttachmentModal()}
		>
			<div
				class="modal-content"
				role="button"
				tabindex="0"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>
						👁️ Lampiran Pengajuan
						{#if currentRequest}
							- {currentRequest.employee_name || currentRequest.nama}
						{/if}
					</h3>
					<button class="btn-close" on:click={closeAttachmentModal}>✖️</button>
				</div>
				<div class="modal-body">
					{#if currentAttachment}
						{#if currentRequest && isImageAttachment(currentRequest)}
							<!-- Image Preview -->
							<div class="attachment-preview image-preview">
								<img
									src={currentAttachment}
									alt="Lampiran - {currentRequest.attachment || currentRequest.lampiran}"
									on:error={() => {
										console.error('Failed to load image');
									}}
								/>
							</div>
						{:else if currentAttachment.toLowerCase().includes('.pdf')}
							<!-- PDF Preview -->
							<div class="attachment-preview pdf-preview">
								<embed src={currentAttachment} type="application/pdf" width="100%" height="500px" />
							</div>
						{:else}
							<!-- File Info for other types -->
							<div class="attachment-preview file-preview">
								<div class="file-icon">📄</div>
								<div class="file-info">
									<p class="file-name">{currentRequest?.attachment || currentRequest?.lampiran}</p>
									<p class="file-type">
										File Type: {getFileExtension(currentRequest || {}).toUpperCase()}
									</p>
								</div>
							</div>
						{/if}

						<!-- Download Actions -->
						<div class="modal-actions">
							<button class="btn btn-download" on:click={downloadAttachment}> ⬇️ Download </button>
							<button
								class="btn btn-open"
								on:click={() => window.open(currentAttachment, '_blank')}
							>
								🔗 Buka di Tab Baru
							</button>
						</div>
					{:else}
						<div class="no-attachment">
							<div class="empty-icon">📎</div>
							<p>Tidak ada lampiran yang tersedia untuk pengajuan ini.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.leave-requests-page {
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
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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

	.leave-type {
		padding: 4px 8px;
		background: #e0f2fe;
		color: #0369a1;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.date-range {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
	}

	.date-separator {
		color: #9ca3af;
	}

	.duration {
		font-weight: 500;
		color: #1e293b;
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
		.leave-requests-page {
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

	/* Connection Status */
	.connection-status {
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.connection-status.connected {
		background: #d1fae5;
		color: #059669;
	}

	.connection-status.disconnected {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Type Filter */
	.type-filter {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 150px;
	}

	.type-filter:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Type Badge */
	.type-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.type-badge {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.type-badge.type-hours {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.type-badge.type-days {
		background: #fef3c7;
		color: #d97706;
	}

	/* Employee Email */
	.employee-email {
		font-size: 11px;
		color: #6b7280;
		font-style: italic;
	}

	/* Time Range for Hours */
	.time-range {
		font-size: 12px;
		color: #6b7280;
		margin-top: 2px;
	}

	/* Attachment */
	.attachment {
		font-size: 11px;
		color: #3b82f6;
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	/* Approved By */
	.approved-by {
		font-size: 11px;
		color: #6b7280;
		margin-top: 4px;
	}

	/* Secondary Button */
	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	/* Modal */
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

	/* Attachment Preview */
	.attachment-preview {
		width: 100%;
		margin-bottom: 20px;
	}

	.image-preview {
		text-align: center;
	}

	.image-preview img {
		max-width: 100%;
		max-height: 500px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.pdf-preview embed {
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.file-preview {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 24px;
		background: #f8fafc;
		border-radius: 8px;
		border: 2px dashed #d1d5db;
	}

	.file-icon {
		font-size: 48px;
	}

	.file-info {
		flex: 1;
	}

	.file-name {
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 8px 0;
	}

	.file-type {
		font-size: 14px;
		color: #6b7280;
		margin: 0;
	}

	/* Modal Actions */
	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		padding-top: 16px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-download,
	.btn-open {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-download {
		background: #3b82f6;
		color: white;
	}

	.btn-download:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn-open {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-open:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	/* No Attachment State */
	.no-attachment {
		text-align: center;
		padding: 40px 20px;
		color: #6b7280;
	}

	.no-attachment .empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	/* Attachment Button */
	.btn-attachment {
		background: #8b5cf6;
		color: white;
	}

	.btn-attachment:hover {
		background: #7c3aed;
	}
</style>
