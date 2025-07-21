<script>
	import { onMount } from 'svelte';
	import {
		getOvertimeAttendanceByRequestId,
		getOvertimeAttendanceByEmployeeAndDate,
		compareOvertimeWithAttendance
	} from '$lib/services/attendanceOvertimeService.js';

	/** @type {any} */
	export let overtimeRequest;
	/** @type {boolean} */
	export let expanded = false;

	/** @type {any[]} */
	let attendanceData = [];
	/** @type {boolean} */
	let loading = false;
	/** @type {string|null} */
	let error = null;
	/** @type {any|null} */
	let comparison = null;

	// Photo modal state
	let showPhotoModal = false;
	/** @type {string|null} */
	let currentPhotoUrl = null;
	/** @type {string} */
	let currentPhotoTitle = '';
	/** @type {boolean} */
	let photoLoading = false;

	$: if (overtimeRequest && expanded) {
		loadAttendanceData();
	}

	async function loadAttendanceData() {
		if (!overtimeRequest) return;

		loading = true;
		error = null;

		try {
			// Try to get attendance data by request ID first
			let result = await getOvertimeAttendanceByRequestId(overtimeRequest.id);

			// If no data found, try by employee name and date
			if (!result.success || result.data.length === 0) {
				const employeeName = overtimeRequest.employee_name || overtimeRequest.nama;
				const overtimeDate = overtimeRequest.overtime_date || overtimeRequest.tanggal;

				if (employeeName && overtimeDate) {
					result = await getOvertimeAttendanceByEmployeeAndDate(employeeName, overtimeDate);
				}
			}

			if (result.success) {
				attendanceData = result.data;

				// If we have attendance data, compare it with the overtime request
				if (attendanceData.length > 0) {
					comparison = compareOvertimeWithAttendance(overtimeRequest, attendanceData[0]);
				}
			} else {
				error = result.error || 'Gagal memuat data absensi lembur';
			}
		} catch (err) {
			console.error('Error loading attendance data:', err);
			error = 'Terjadi kesalahan saat memuat data absensi';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID');
	}

	function formatTime(timeString) {
		if (!timeString) return '-';
		return timeString;
	}

	function toggleExpanded() {
		expanded = !expanded;
	}

	function getStatusClass(status) {
		switch (status) {
			case 'lengkap':
				return 'status-complete';
			case 'belum lengkap':
				return 'status-incomplete';
			case 'tidak hadir':
				return 'status-absent';
			default:
				return 'status-unknown';
		}
	}

	function getComparisonClass(status) {
		switch (status) {
			case 'match':
				return 'comparison-match';
			case 'over':
				return 'comparison-over';
			case 'under':
				return 'comparison-under';
			default:
				return 'comparison-unknown';
		}
	}

	/**
	 * Show photo in modal
	 * @param {string} photoId - Photo ID from Directus
	 * @param {string} title - Title for the photo
	 */
	function showPhoto(photoId, title) {
		if (!photoId) {
			console.warn('No photo ID provided');
			return;
		}

		currentPhotoTitle = title;
		photoLoading = true;
		showPhotoModal = true;

		// Construct Directus file URL
		const DIRECTUS_URL =
			import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
		currentPhotoUrl = `${DIRECTUS_URL}/assets/${photoId}`;
	}

	/**
	 * Close photo modal
	 */
	function closePhotoModal() {
		showPhotoModal = false;
		currentPhotoUrl = null;
		currentPhotoTitle = '';
		photoLoading = false;
	}

	/**
	 * Handle photo load event
	 */
	function handlePhotoLoad() {
		photoLoading = false;
	}

	/**
	 * Handle photo error event
	 */
	function handlePhotoError() {
		photoLoading = false;
		console.error('Failed to load photo:', currentPhotoUrl);

		// Hide image and show error message
		setTimeout(() => {
			const photoImage = document.querySelector('.photo-image');
			const photoError = document.querySelector('#photo-error');
			if (photoImage) photoImage.style.display = 'none';
			if (photoError) photoError.style.display = 'flex';
		}, 100);
	}

	/**
	 * Download photo
	 */
	function downloadPhoto() {
		if (!currentPhotoUrl) return;

		try {
			const link = document.createElement('a');
			link.href = currentPhotoUrl;
			link.download = `${currentPhotoTitle.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Error downloading photo:', error);
		}
	}
</script>

<div class="overtime-attendance">
	<div
		class="attendance-header"
		on:click={toggleExpanded}
		on:keydown={(e) => e.key === 'Enter' && toggleExpanded()}
		role="button"
		tabindex="0"
	>
		<div class="header-content">
			<span class="header-icon">📅</span>
			<span class="header-title">Data Absensi Lembur</span>
			{#if attendanceData.length > 0}
				<span class="data-indicator success">✅ Ada Data</span>
			{:else if error}
				<span class="data-indicator error">❌ Error</span>
			{:else}
				<span class="data-indicator empty">⚪ Belum Ada</span>
			{/if}
		</div>
		<span class="expand-icon {expanded ? 'expanded' : ''}">▼</span>
	</div>

	{#if expanded}
		<div class="attendance-content">
			{#if loading}
				<div class="loading-state">
					<div class="spinner"></div>
					<span>Memuat data absensi...</span>
				</div>
			{:else if error}
				<div class="error-state">
					<span class="error-icon">⚠️</span>
					<span class="error-message">{error}</span>
				</div>
			{:else if attendanceData.length === 0}
				<div class="empty-state">
					<span class="empty-icon">📭</span>
					<div class="empty-content">
						<h4>Belum Ada Data Absensi</h4>
						<p>Karyawan belum melakukan absensi lembur untuk pengajuan ini.</p>
					</div>
				</div>
			{:else}
				<!-- Comparison Summary -->
				{#if comparison && comparison.hasData}
					<div class="comparison-summary {getComparisonClass(comparison.comparison.status)}">
						<div class="comparison-header">
							<span class="comparison-icon">{comparison.comparison.statusIcon}</span>
							<span class="comparison-status">{comparison.comparison.statusText}</span>
						</div>
						<div class="comparison-details">
							<div class="comparison-row">
								<span class="label">Durasi Diajukan:</span>
								<span class="value">{comparison.comparison.requested.total}</span>
							</div>
							<div class="comparison-row">
								<span class="label">Durasi Aktual:</span>
								<span class="value">{comparison.comparison.actual.total}</span>
							</div>
							{#if comparison.comparison.difference.text !== 'Tepat'}
								<div class="comparison-row difference">
									<span class="label">Selisih:</span>
									<span class="value">{comparison.comparison.difference.text}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Attendance Details -->
				{#each attendanceData as attendance, index}
					<div class="attendance-record">
						<div class="record-header">
							<h4>📍 Absensi Lembur #{index + 1}</h4>
							<span class="attendance-status {getStatusClass(attendance.attendance_status)}">
								{attendance.attendance_status}
							</span>
						</div>

						<div class="attendance-grid">
							<!-- Employee Info -->
							<div class="info-section">
								<h5>👤 Informasi Karyawan</h5>
								<div class="info-row">
									<span class="label">Nama:</span>
									<span class="value">{attendance.employee_name}</span>
								</div>
								<div class="info-row">
									<span class="label">Tanggal:</span>
									<span class="value">{formatDate(attendance.overtime_date)}</span>
								</div>
							</div>

							<!-- Check In -->
							<div class="info-section">
								<h5>🏢 Data Masuk</h5>
								<div class="info-row">
									<span class="label">Waktu Masuk:</span>
									<span class="value">{formatTime(attendance.check_in_time)}</span>
								</div>
								{#if attendance.check_in_location}
									<div class="info-row">
										<span class="label">Lokasi:</span>
										<span class="value location">{attendance.check_in_location}</span>
									</div>
								{/if}
								{#if attendance.check_in_photo}
									<div class="info-row">
										<span class="label">Foto:</span>
										<button
											class="btn-photo"
											title="Lihat foto masuk"
											on:click={() =>
												showPhoto(
													attendance.check_in_photo,
													`Foto Masuk - ${attendance.employee_name}`
												)}
										>
											📷 Lihat Foto Masuk
										</button>
									</div>
								{/if}
							</div>

							<!-- Check Out -->
							<div class="info-section">
								<h5>🏃‍♂️ Data Keluar</h5>
								<div class="info-row">
									<span class="label">Waktu Keluar:</span>
									<span class="value">{formatTime(attendance.check_out_time)}</span>
								</div>
								{#if attendance.check_out_location}
									<div class="info-row">
										<span class="label">Lokasi:</span>
										<span class="value location">{attendance.check_out_location}</span>
									</div>
								{/if}
								{#if attendance.check_out_photo}
									<div class="info-row">
										<span class="label">Foto:</span>
										<button
											class="btn-photo"
											title="Lihat foto keluar"
											on:click={() =>
												showPhoto(
													attendance.check_out_photo,
													`Foto Keluar - ${attendance.employee_name}`
												)}
										>
											📷 Lihat Foto Keluar
										</button>
									</div>
								{/if}
							</div>

							<!-- Duration -->
							<div class="info-section">
								<h5>⏱️ Durasi Aktual</h5>
								<div class="info-row">
									<span class="label">Total Durasi:</span>
									<span class="value duration">{attendance.actual_duration_total}</span>
								</div>
								<div class="info-row">
									<span class="label">Jam:</span>
									<span class="value">{attendance.actual_duration_hours || 0} jam</span>
								</div>
								<div class="info-row">
									<span class="label">Menit:</span>
									<span class="value">{attendance.actual_duration_minutes || 0} menit</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<!-- Photo Modal -->
{#if showPhotoModal}
	<div
		class="photo-modal-overlay"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={closePhotoModal}
		on:keydown={(e) => e.key === 'Escape' && closePhotoModal()}
	>
		<div class="photo-modal-content" on:click|stopPropagation on:keydown|stopPropagation>
			<div class="photo-modal-header">
				<h3>{currentPhotoTitle}</h3>
				<div class="modal-actions">
					<button class="btn-download-photo" on:click={downloadPhoto} title="Download Foto">
						📥 Download
					</button>
					<button class="btn-close-photo" on:click={closePhotoModal} title="Tutup"> ✖️ </button>
				</div>
			</div>
			<div class="photo-modal-body">
				{#if photoLoading}
					<div class="photo-loading">
						<div class="spinner"></div>
						<span>Memuat foto...</span>
					</div>
				{/if}
				{#if currentPhotoUrl}
					<img
						src={currentPhotoUrl}
						alt={currentPhotoTitle}
						class="photo-image {photoLoading ? 'loading' : ''}"
						on:load={handlePhotoLoad}
						on:error={handlePhotoError}
					/>
				{/if}
				{#if !photoLoading && currentPhotoUrl}
					<div class="photo-error" style="display: none;" id="photo-error">
						<div class="error-content">
							<span class="error-icon">⚠️</span>
							<h4>Gagal Memuat Foto</h4>
							<p>
								Foto tidak dapat ditampilkan. Mungkin file tidak ditemukan atau ada masalah dengan
								koneksi.
							</p>
							<button
								class="btn-retry"
								on:click={() =>
									showPhoto(currentPhotoUrl?.split('/').pop() || '', currentPhotoTitle)}
							>
								🔄 Coba Lagi
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.overtime-attendance {
		border: 1px solid #e9ecef;
		border-radius: 8px;
		margin: 16px 0;
		background: #ffffff;
		overflow: hidden;
	}

	.attendance-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.attendance-header:hover {
		background: #e9ecef;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-icon {
		font-size: 16px;
	}

	.header-title {
		font-weight: 600;
		color: #495057;
	}

	.data-indicator {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 12px;
		font-weight: 500;
	}

	.data-indicator.success {
		background: #d4edda;
		color: #155724;
	}

	.data-indicator.error {
		background: #f8d7da;
		color: #721c24;
	}

	.data-indicator.empty {
		background: #fff3cd;
		color: #856404;
	}

	.expand-icon {
		transition: transform 0.2s;
		font-size: 12px;
		color: #6c757d;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	.attendance-content {
		padding: 16px;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 20px;
		text-align: center;
		color: #6c757d;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #f3f3f3;
		border-top: 2px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.empty-content h4 {
		margin: 0 0 8px 0;
		color: #495057;
	}

	.empty-content p {
		margin: 0;
		font-size: 14px;
	}

	.comparison-summary {
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 16px;
	}

	.comparison-summary.comparison-match {
		background: #d4edda;
		border: 1px solid #c3e6cb;
	}

	.comparison-summary.comparison-over,
	.comparison-summary.comparison-under {
		background: #fff3cd;
		border: 1px solid #ffecb5;
	}

	.comparison-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.comparison-status {
		font-weight: 600;
		font-size: 14px;
	}

	.comparison-details {
		display: grid;
		gap: 4px;
	}

	.comparison-row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
	}

	.comparison-row.difference {
		font-weight: 600;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 4px;
		margin-top: 4px;
	}

	.attendance-record {
		border: 1px solid #e9ecef;
		border-radius: 6px;
		margin-bottom: 16px;
		overflow: hidden;
	}

	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: #f8f9fa;
		border-bottom: 1px solid #e9ecef;
	}

	.record-header h4 {
		margin: 0;
		font-size: 14px;
		color: #495057;
	}

	.attendance-status {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-complete {
		background: #d4edda;
		color: #155724;
	}

	.status-incomplete {
		background: #fff3cd;
		color: #856404;
	}

	.status-absent {
		background: #f8d7da;
		color: #721c24;
	}

	.status-unknown {
		background: #e2e6ea;
		color: #6c757d;
	}

	.attendance-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
		padding: 16px;
	}

	.info-section {
		background: #f8f9fa;
		padding: 12px;
		border-radius: 6px;
	}

	.info-section h5 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #495057;
		border-bottom: 1px solid #dee2e6;
		padding-bottom: 4px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
		font-size: 12px;
	}

	.info-row:last-child {
		margin-bottom: 0;
	}

	.info-row .label {
		font-weight: 500;
		color: #6c757d;
		min-width: 80px;
	}

	.info-row .value {
		flex: 1;
		text-align: right;
		color: #495057;
	}

	.info-row .value.location {
		font-size: 11px;
		max-width: 150px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.info-row .value.duration {
		font-weight: 600;
		color: #007bff;
	}

	.btn-photo {
		background: #007bff;
		color: white;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 10px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-photo:hover {
		background: #0056b3;
	}

	@media (max-width: 768px) {
		.attendance-grid {
			grid-template-columns: 1fr;
		}

		.comparison-row {
			flex-direction: column;
			text-align: left;
		}

		.info-row {
			flex-direction: column;
			text-align: left;
		}

		.info-row .value {
			text-align: left;
		}
	}

	/* Photo Modal Styles */
	.photo-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.photo-modal-content {
		background: white;
		border-radius: 8px;
		max-width: 90vw;
		max-height: 90vh;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px) scale(0.95);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	.photo-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #e9ecef;
		background: #f8f9fa;
	}

	.photo-modal-header h3 {
		margin: 0;
		font-size: 16px;
		color: #495057;
		font-weight: 600;
	}

	.modal-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.btn-download-photo {
		background: #28a745;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.btn-download-photo:hover {
		background: #218838;
	}

	.btn-close-photo {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
		color: #6c757d;
	}

	.btn-close-photo:hover {
		background: #e9ecef;
		color: #495057;
	}

	.photo-modal-body {
		position: relative;
		padding: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		max-height: 70vh;
		overflow: auto;
	}

	.photo-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		color: #6c757d;
	}

	.photo-image {
		max-width: 100%;
		max-height: 100%;
		height: auto;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: opacity 0.3s ease;
	}

	.photo-image.loading {
		opacity: 0;
	}

	.photo-error {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		text-align: center;
	}

	.error-content {
		max-width: 300px;
	}

	.error-content .error-icon {
		font-size: 48px;
		margin-bottom: 16px;
		display: block;
	}

	.error-content h4 {
		margin: 0 0 8px 0;
		color: #dc3545;
	}

	.error-content p {
		margin: 0 0 16px 0;
		color: #6c757d;
		font-size: 14px;
		line-height: 1.4;
	}

	.btn-retry {
		background: #007bff;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		transition: background-color 0.2s;
	}

	.btn-retry:hover {
		background: #0056b3;
	}

	/* Mobile responsiveness for photo modal */
	@media (max-width: 768px) {
		.photo-modal-content {
			max-width: 95vw;
			max-height: 95vh;
		}

		.photo-modal-header {
			padding: 12px 16px;
		}

		.photo-modal-header h3 {
			font-size: 14px;
		}

		.photo-modal-body {
			padding: 16px;
			max-height: 80vh;
		}
	}
</style>
