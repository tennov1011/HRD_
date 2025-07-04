<script>
	import { onMount } from 'svelte';
	import { AttendanceService } from '$lib/services/attendanceService.js';

	let attendanceData = [];
	let loading = true;
	let error = null;
	let searchTerm = '';
	let selectedDate = new Date().toISOString().split('T')[0]; // Today's date
	let statusFilter = 'all'; // all, on-time, late, absent

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 20;
	let totalItems = 0;

	// Edit Modal State
	let showEditModal = false;
	let editingAttendance = null;
	let editForm = {
		nama: '',
		email: '',
		tanggal: '',
		waktu_masuk: '',
		waktu_keluar: '',
		lokasi: '',
		keterangan: '',
		terlambat: false,
		menit_keterlambatan: 0
	};
	let saveLoading = false;

	// Delete Confirmation Modal State
	let showDeleteModal = false;
	let deletingAttendance = null;
	let deleteLoading = false;

	$: filteredData = filterAttendanceData(attendanceData, searchTerm, statusFilter);
	$: paginatedData = paginateData(filteredData, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredData.length / itemsPerPage);

	onMount(() => {
		loadAttendanceData();
	});

	async function loadAttendanceData() {
		try {
			loading = true;
			error = null;

			const params = {
				limit: 100,
				sort: '-tanggal,-waktu_masuk'
			};

			// Add date filter if specific date is selected
			if (selectedDate) {
				params.filter = JSON.stringify({
					tanggal: { _eq: selectedDate }
				});
			}

			const response = await AttendanceService.getDailyAttendance(params);
			attendanceData = response.data || [];
			totalItems = response.meta?.total_count || attendanceData.length;
		} catch (err) {
			error = err.message;
			console.error('Error loading attendance data:', err);
		} finally {
			loading = false;
		}
	}

	function filterAttendanceData(data, search, status) {
		let filtered = data;

		// Filter by search term
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.nama?.toLowerCase().includes(searchLower) ||
					item.email?.toLowerCase().includes(searchLower) ||
					item.lokasi?.toLowerCase().includes(searchLower)
			);
		}

		// Filter by status
		if (status !== 'all') {
			filtered = filtered.filter((item) => {
				switch (status) {
					case 'on-time':
						return !item.terlambat;
					case 'late':
						return item.terlambat;
					case 'absent':
						return !item.waktu_masuk;
					default:
						return true;
				}
			});
		}

		return filtered;
	}

	function paginateData(data, page, perPage) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return data.slice(start, end);
	}

	function formatTime(timeString) {
		if (!timeString) return '-';
		const date = new Date(timeString);
		return date.toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusClass(isLate) {
		return isLate ? 'status-late' : 'status-ontime';
	}

	function getStatusText(isLate) {
		return isLate ? 'Terlambat' : 'Tepat Waktu';
	}

	function formatDuration(minutes) {
		if (!minutes || minutes <= 0) return '-';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;

		if (hours > 0) {
			return `${hours}j ${mins}m`;
		} else {
			return `${mins}m`;
		}
	}

	function exportToCSV() {
		// Implementation for CSV export
		console.log('Export to CSV functionality');
	}

	function refreshData() {
		currentPage = 1;
		loadAttendanceData();
	}

	// Test function untuk debug konversi waktu
	function testTimeConversion() {
		console.log('=== TEST TIME CONVERSION ===');

		const testCases = [
			{ time: '08:00', date: '2025-07-02' },
			{ time: '10:30', date: '2025-07-02' },
			{ time: '14:45', date: '2025-07-02' },
			{ time: '23:59', date: '2025-07-02' }
		];

		testCases.forEach((test) => {
			const formatted = formatDateTimeForAPI(test.date, test.time);
			const backToTime = formatTimeForInput(formatted);
			console.log(`Input: ${test.time} -> API: ${formatted} -> Back: ${backToTime}`);
		});
	}

	// Test function untuk debug koneksi Directus
	async function testDirectusConnection() {
		console.log('=== TEST DIRECTUS CONNECTION ===');

		try {
			// Test GET request first
			console.log('Testing GET request...');
			const getResponse = await AttendanceService.getDailyAttendance({ limit: 1 });
			console.log('GET response:', getResponse);

			// Test connection to base URL
			const baseUrl = import.meta.env.VITE_DIRECTUS_URL;
			const token = import.meta.env.VITE_DIRECTUS_TOKEN;
			console.log('Directus URL:', baseUrl);
			console.log('Token exists:', !!token);

			alert('✅ Koneksi Directus berhasil! Cek console untuk detail.');
		} catch (error) {
			console.error('Directus connection test failed:', error);
			alert('❌ Koneksi Directus gagal: ' + error.message);
		}
	}

	// Watch for date changes
	$: if (selectedDate) {
		refreshData();
	}

	// Edit Functions
	function openEditModal(attendance) {
		if (!attendance) {
			alert('❌ Data presensi tidak valid');
			return;
		}

		console.log('=== DEBUG OPEN EDIT MODAL ===');
		console.log('Original attendance data:', attendance);

		editingAttendance = attendance;
		editForm = {
			nama: attendance.nama || '',
			email: attendance.email || '',
			tanggal: attendance.tanggal || '',
			waktu_masuk: formatTimeForInput(attendance.waktu_masuk),
			waktu_keluar: formatTimeForInput(attendance.waktu_keluar),
			lokasi: attendance.lokasi || '',
			keterangan: attendance.keterangan || '',
			terlambat: attendance.terlambat || false,
			menit_keterlambatan: attendance.menit_keterlambatan || 0
		};

		console.log('Formatted for form input:', {
			original_waktu_masuk: attendance.waktu_masuk,
			formatted_waktu_masuk: editForm.waktu_masuk,
			original_waktu_keluar: attendance.waktu_keluar,
			formatted_waktu_keluar: editForm.waktu_keluar
		});

		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingAttendance = null;
		editForm = {
			nama: '',
			email: '',
			tanggal: '',
			waktu_masuk: '',
			waktu_keluar: '',
			lokasi: '',
			keterangan: '',
			terlambat: false,
			menit_keterlambatan: 0
		};
	}

	// Delete Confirmation Functions
	function openDeleteModal(attendance) {
		if (!attendance) {
			alert('❌ Data presensi tidak valid');
			return;
		}

		deletingAttendance = attendance;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deletingAttendance = null;
		deleteLoading = false;
	}

	function formatTimeForInput(timeString) {
		if (!timeString) return '';

		// Create date object and get local time components
		const date = new Date(timeString);

		// Extract hours, minutes in local timezone (skip seconds for HTML time input)
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');

		return `${hours}:${minutes}`;
	}

	function formatDateTimeForAPI(date, time) {
		if (!date || !time) return null;

		// Parse time (format: HH:MM or HH:MM:SS)
		const timeParts = time.split(':');
		const hours = parseInt(timeParts[0]) || 0;
		const minutes = parseInt(timeParts[1]) || 0;
		const seconds = parseInt(timeParts[2]) || 0; // Default to 0 if not provided

		// Create date object with local timezone
		const dateObj = new Date(date);
		dateObj.setHours(hours, minutes, seconds, 0);

		// Return ISO string (this will include proper timezone offset)
		return dateObj.toISOString();
	}

	async function saveAttendance() {
		if (!editingAttendance) return;

		// Validate required fields
		if (!editForm.nama || !editForm.email || !editForm.tanggal || !editForm.waktu_masuk) {
			alert('Harap isi semua field yang wajib diisi (Nama, Email, Tanggal, Waktu Masuk)');
			return;
		}

		try {
			saveLoading = true;

			const updatedData = {
				nama: editForm.nama.trim(),
				email: editForm.email.trim(),
				tanggal: editForm.tanggal,
				waktu_masuk: formatDateTimeForAPI(editForm.tanggal, editForm.waktu_masuk),
				waktu_keluar: editForm.waktu_keluar
					? formatDateTimeForAPI(editForm.tanggal, editForm.waktu_keluar)
					: null,
				lokasi: editForm.lokasi?.trim() || null,
				keterangan: editForm.keterangan?.trim() || null,
				terlambat: editForm.terlambat,
				menit_keterlambatan: editForm.terlambat ? editForm.menit_keterlambatan || 0 : 0
			};

			// Debug: Log untuk troubleshooting
			console.log('=== DEBUG SAVE ATTENDANCE ===');
			console.log('Input form values:', {
				tanggal: editForm.tanggal,
				waktu_masuk_input: editForm.waktu_masuk,
				waktu_keluar_input: editForm.waktu_keluar
			});
			console.log('Formatted for API:', {
				waktu_masuk_formatted: updatedData.waktu_masuk,
				waktu_keluar_formatted: updatedData.waktu_keluar
			});
			console.log('Full updated data:', updatedData);

			// Update via Directus API
			const response = await AttendanceService.updateAttendance(editingAttendance.id, updatedData);

			if (response) {
				// Update local data
				const index = attendanceData.findIndex((item) => item.id === editingAttendance.id);
				if (index !== -1) {
					attendanceData[index] = { ...attendanceData[index], ...updatedData };
					attendanceData = [...attendanceData]; // Trigger reactivity
				}

				closeEditModal();

				// Show success message
				alert('✅ Data presensi berhasil diperbarui!');
			}
		} catch (err) {
			console.error('Error updating attendance:', err);
			alert('❌ Terjadi kesalahan saat memperbarui data: ' + err.message);
		} finally {
			saveLoading = false;
		}
	}

	function viewDetails(attendance) {
		// Implementation for viewing detailed information
		alert(
			`Detail presensi:\nNama: ${attendance.nama}\nTanggal: ${attendance.tanggal}\nLokasi: ${attendance.lokasi}`
		);
	}

	function viewPhoto(attendance) {
		// Implementation for viewing photo
		if (attendance.foto) {
			// Open photo in new window or modal
			const photoUrl = `${import.meta.env.VITE_DIRECTUS_URL}/assets/${attendance.foto}`;
			window.open(photoUrl, '_blank', 'width=800,height=600');
		}
	}

	async function deleteAttendance(attendance) {
		// Open confirmation modal instead of using browser confirm
		openDeleteModal(attendance);
	}

	async function confirmDeleteAttendance() {
		if (!deletingAttendance) return;

		try {
			deleteLoading = true;

			console.log('=== DEBUG DELETE ATTENDANCE ===');
			console.log('Deleting attendance ID:', deletingAttendance.id);

			// Delete via Directus API
			const response = await AttendanceService.deleteAttendance(deletingAttendance.id);

			console.log('Delete response:', response);

			// Check if delete was successful (response could be empty for successful delete)
			// Remove from local data regardless of response content
			attendanceData = attendanceData.filter((item) => item.id !== deletingAttendance.id);

			// Close modal and show success message
			closeDeleteModal();
			alert('✅ Data presensi berhasil dihapus!');
		} catch (err) {
			console.error('Error deleting attendance:', err);

			// More specific error handling
			let errorMessage = 'Terjadi kesalahan saat menghapus data.';

			if (err.message.includes('Failed to fetch')) {
				errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
			} else if (err.message.includes('HTTP error')) {
				errorMessage = `Server error: ${err.message}`;
			} else if (err.message.includes('JSON')) {
				errorMessage = 'Data berhasil dihapus, namun terjadi kesalahan parsing response.';
				// In this case, still remove from local data since deletion likely succeeded
				attendanceData = attendanceData.filter((item) => item.id !== deletingAttendance.id);
				closeDeleteModal();
			} else {
				errorMessage = err.message;
			}

			alert('❌ ' + errorMessage);
		} finally {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Presensi Harian - HRD System</title>
</svelte:head>

<div class="attendance-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>📅 Presensi Harian</h1>
			<p>Kelola dan monitor kehadiran karyawan harian</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-secondary" on:click={exportToCSV}> 📊 Export CSV </button>
			<button class="btn btn-secondary" on:click={testTimeConversion}> 🔍 Test Time </button>
			<button class="btn btn-secondary" on:click={testDirectusConnection}> 🔗 Test API </button>
			<button class="btn btn-primary" on:click={refreshData}> 🔄 Refresh </button>
		</div>
	</div>

	<!-- Filters -->
	<div class="filters-section">
		<div class="filters-grid">
			<!-- Date Filter -->
			<div class="filter-group">
				<label for="date-filter">Tanggal:</label>
				<input id="date-filter" type="date" bind:value={selectedDate} class="filter-input" />
			</div>

			<!-- Search -->
			<div class="filter-group">
				<label for="search">Cari Karyawan:</label>
				<input
					id="search"
					type="text"
					placeholder="Nama, email, atau lokasi..."
					bind:value={searchTerm}
					class="filter-input"
				/>
			</div>

			<!-- Status Filter -->
			<div class="filter-group">
				<label for="status-filter">Status:</label>
				<select id="status-filter" bind:value={statusFilter} class="filter-select">
					<option value="all">Semua Status</option>
					<option value="on-time">Tepat Waktu</option>
					<option value="late">Terlambat</option>
					<option value="absent">Tidak Hadir</option>
				</select>
			</div>

			<!-- Results Count -->
			<div class="results-info">
				<span class="results-count">
					Menampilkan {paginatedData.length} dari {filteredData.length} data
				</span>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data presensi...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<div class="error-icon">⚠️</div>
				<h3>Terjadi Kesalahan</h3>
				<p>{error}</p>
				<button class="btn btn-primary" on:click={refreshData}> Coba Lagi </button>
			</div>
		{:else if attendanceData.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📅</div>
				<h3>Tidak Ada Data Presensi</h3>
				<p>Belum ada data presensi untuk tanggal yang dipilih.</p>
			</div>
		{:else}
			<!-- Attendance Table -->
			<div class="table-container">
				<table class="attendance-table">
					<thead>
						<tr>
							<th>Nama Karyawan</th>
							<th>Email</th>
							<th>Tanggal</th>
							<th>Waktu Masuk</th>
							<th>Waktu Keluar</th>
							<th>Lokasi</th>
							<th>Status</th>
							<th>Keterlambatan</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedData as attendance}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-avatar">
											{attendance.nama ? attendance.nama.charAt(0).toUpperCase() : '?'}
										</div>
										<div class="employee-details">
											<div class="employee-name">{attendance.nama || 'N/A'}</div>
										</div>
									</div>
								</td>
								<td>{attendance.email}</td>
								<td>{formatDate(attendance.tanggal)}</td>
								<td>
									<span class="time-badge time-in">
										{formatTime(attendance.waktu_masuk)}
									</span>
								</td>
								<td>
									<span class="time-badge time-out">
										{formatTime(attendance.waktu_keluar)}
									</span>
								</td>
								<td>
									<div class="location-info" title={attendance.lokasi}>
										📍 {attendance.lokasi || 'Lokasi tidak tersedia'}
									</div>
								</td>
								<td>
									<span class="status-badge {getStatusClass(attendance.terlambat)}">
										{getStatusText(attendance.terlambat)}
									</span>
								</td>
								<td>
									{#if attendance.terlambat && attendance.menit_keterlambatan}
										<span class="late-duration">
											{formatDuration(attendance.menit_keterlambatan)}
										</span>
									{:else}
										<span class="no-late">-</span>
									{/if}
								</td>
								<td>
									<div class="action-buttons">
										{#if attendance.foto}
											<button
												class="btn-action btn-photo"
												title="Lihat Foto"
												on:click={() => viewPhoto(attendance)}
											>
												📷
											</button>
											<!-- <button
                                        class="btn-action btn-detail"
                                        title="Lihat Detail"
                                        on:click={() => viewDetails(attendance)}
                                    >
                                        👁️
                                    </button> -->
										{/if}
										<button
											class="btn-action btn-edit"
											title="Edit Data Presensi"
											on:click={() => openEditModal(attendance)}
										>
											✏️
										</button>
										<button
											class="btn-action btn-delete"
											title="Hapus Data Presensi"
											on:click={() => deleteAttendance(attendance)}
										>
											🗑️
										</button>
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

	<!-- Edit Modal -->
	{#if showEditModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			on:click={closeEditModal}
			on:keydown={(e) => e.key === 'Escape' && closeEditModal()}
		>
			<div
				class="modal-content"
				role="document"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>✏️ Edit Data Presensi - {editForm.nama}</h3>
					<button class="modal-close" on:click={closeEditModal}>×</button>
				</div>

				<div class="modal-body">
					<form on:submit|preventDefault={saveAttendance}>
						<div class="form-grid">
							<!-- Nama Karyawan -->
							<div class="form-group">
								<label for="edit-nama">Nama Karyawan: <span class="required">*</span></label>
								<input
									id="edit-nama"
									type="text"
									bind:value={editForm.nama}
									class="form-input"
									required
									placeholder="Masukkan nama karyawan"
								/>
							</div>

							<!-- Email -->
							<div class="form-group">
								<label for="edit-email">Email: <span class="required">*</span></label>
								<input
									id="edit-email"
									type="email"
									bind:value={editForm.email}
									class="form-input"
									required
									placeholder="Masukkan email"
								/>
							</div>

							<!-- Tanggal -->
							<div class="form-group">
								<label for="edit-tanggal">Tanggal: <span class="required">*</span></label>
								<input
									id="edit-tanggal"
									type="date"
									bind:value={editForm.tanggal}
									class="form-input"
									required
								/>
							</div>

							<!-- Waktu Masuk -->
							<div class="form-group">
								<label for="edit-waktu-masuk">Waktu Masuk: <span class="required">*</span></label>
								<input
									id="edit-waktu-masuk"
									type="time"
									bind:value={editForm.waktu_masuk}
									class="form-input"
									required
								/>
							</div>

							<!-- Waktu Keluar -->
							<div class="form-group">
								<label for="edit-waktu-keluar">Waktu Keluar:</label>
								<input
									id="edit-waktu-keluar"
									type="time"
									bind:value={editForm.waktu_keluar}
									class="form-input"
									placeholder="Opsional"
								/>
							</div>

							<!-- Status Terlambat -->
							<div class="form-group">
								<label for="edit-terlambat">Status:</label>
								<select id="edit-terlambat" bind:value={editForm.terlambat} class="form-select">
									<option value={false}>Tepat Waktu</option>
									<option value={true}>Terlambat</option>
								</select>
							</div>

							<!-- Menit Keterlambatan -->
							{#if editForm.terlambat}
								<div class="form-group">
									<label for="edit-menit-keterlambatan">Menit Keterlambatan:</label>
									<input
										id="edit-menit-keterlambatan"
										type="number"
										bind:value={editForm.menit_keterlambatan}
										class="form-input"
										min="0"
										placeholder="0"
									/>
								</div>
							{/if}

							<!-- Lokasi -->
							<div class="form-group full-width">
								<label for="edit-lokasi">Lokasi:</label>
								<input
									id="edit-lokasi"
									type="text"
									bind:value={editForm.lokasi}
									class="form-input"
									placeholder="Masukkan lokasi presensi"
								/>
							</div>

							<!-- Keterangan -->
							<div class="form-group full-width">
								<label for="edit-keterangan">Keterangan:</label>
								<textarea
									id="edit-keterangan"
									bind:value={editForm.keterangan}
									class="form-textarea"
									rows="3"
									placeholder="Masukkan keterangan tambahan"
								></textarea>
							</div>
						</div>

						<div class="modal-actions">
							<button
								type="button"
								class="btn btn-secondary"
								on:click={closeEditModal}
								disabled={saveLoading}
							>
								Batal
							</button>
							<button type="submit" class="btn btn-primary" disabled={saveLoading}>
								{#if saveLoading}
									<span class="loading-spinner-small"></span>
									Menyimpan...
								{:else}
									💾 Simpan Perubahan
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteModal && deletingAttendance}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			on:click={closeDeleteModal}
			on:keydown={(e) => e.key === 'Escape' && closeDeleteModal()}
		>
			<div
				class="modal-content modal-delete"
				role="document"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>🗑️ Konfirmasi Penghapusan Data</h3>
					<button class="modal-close" on:click={closeDeleteModal}>×</button>
				</div>

				<div class="modal-body">
					<div class="delete-warning">
						<div class="warning-icon">⚠️</div>
						<div class="warning-content">
							<h4>Apakah Anda yakin ingin menghapus data presensi ini?</h4>
							<div class="attendance-details">
								<div class="detail-item">
									<span class="detail-label">Nama:</span>
									<span class="detail-value">{deletingAttendance.nama}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Tanggal:</span>
									<span class="detail-value">{formatDate(deletingAttendance.tanggal)}</span>
								</div>
								<div class="detail-item">
									<span class="detail-label">Waktu Masuk:</span>
									<span class="detail-value">{formatTime(deletingAttendance.waktu_masuk)}</span>
								</div>
								{#if deletingAttendance.waktu_keluar}
									<div class="detail-item">
										<span class="detail-label">Waktu Keluar:</span>
										<span class="detail-value">{formatTime(deletingAttendance.waktu_keluar)}</span>
									</div>
								{/if}
							</div>
							<p class="warning-text">
								<strong>Peringatan:</strong> Data yang dihapus tidak dapat dikembalikan!
							</p>
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<button
						type="button"
						class="btn btn-secondary"
						on:click={closeDeleteModal}
						disabled={deleteLoading}
					>
						Batalkan
					</button>
					<button
						type="button"
						class="btn btn-danger"
						on:click={confirmDeleteAttendance}
						disabled={deleteLoading}
					>
						{#if deleteLoading}
							<span class="loading-spinner-small"></span>
							Menghapus...
						{:else}
							🗑️ Ya, Hapus
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.attendance-page {
		padding: 24px;
		background: #f8fafc;
		min-height: 100vh;
	}

	.page-header {
		background: white;
		padding: 24px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}

	.header-content h1 {
		margin: 0 0 8px 0;
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
	}

	.header-content p {
		margin: 0;
		color: #64748b;
		font-size: 14px;
	}

	.header-actions {
		display: flex;
		gap: 12px;
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

	.btn-secondary {
		background: #f1f5f9;
		color: #475569;
		border: 1px solid #e2e8f0;
	}

	.btn-danger {
		background: linear-gradient(135deg, #dc2626, #ef4444);
		color: white;
	}

	.btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.filters-section {
		background: white;
		padding: 20px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-group label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.filter-input,
	.filter-select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		transition: border-color 0.2s ease;
	}

	.filter-input:focus,
	.filter-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.results-info {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.results-count {
		font-size: 14px;
		color: #64748b;
		font-weight: 500;
	}

	.content-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.loading-state,
	.error-state,
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

	.error-icon,
	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.table-container {
		overflow-x: auto;
	}

	.attendance-table {
		width: 100%;
		border-collapse: collapse;
	}

	.attendance-table th,
	.attendance-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
	}

	.attendance-table th {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		font-size: 14px;
	}

	.attendance-table td {
		font-size: 14px;
		color: #64748b;
	}

	.attendance-table tr:hover {
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

	.time-badge {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		font-family: monospace;
	}

	.time-in {
		background: #dcfce7;
		color: #166534;
	}

	.time-out {
		background: #fef3c7;
		color: #92400e;
	}

	.location-info {
		max-width: 200px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 12px;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-ontime {
		background: #dcfce7;
		color: #166534;
	}

	.status-late {
		background: #fee2e2;
		color: #991b1b;
	}

	.late-duration {
		color: #dc2626;
		font-weight: 500;
		font-size: 12px;
	}

	.no-late {
		color: #9ca3af;
	}

	.action-buttons {
		display: flex;
		gap: 6px;
		justify-content: center;
	}

	.btn-action {
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		background: #f1f5f9;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.btn-action:hover {
		background: #e2e8f0;
		transform: scale(1.05);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.btn-detail {
		background: #e0f2fe !important;
		color: #0369a1 !important;
	}

	.btn-detail:hover {
		background: #bae6fd !important;
	}

	.btn-photo {
		background: #f3e8ff !important;
		color: #7c2d12 !important;
	}

	.btn-photo:hover {
		background: #e9d5ff !important;
	}

	.btn-edit {
		background: #fef3c7 !important;
		color: #92400e !important;
	}

	.btn-edit:hover {
		background: #fde68a !important;
	}

	.btn-delete {
		background: #fee2e2 !important;
		color: #991b1b !important;
	}

	.btn-delete:hover {
		background: #fecaca !important;
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
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		max-width: 600px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-delete {
		max-width: 500px;
	}

	.delete-warning {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.warning-icon {
		font-size: 48px;
		color: #f59e0b;
		flex-shrink: 0;
	}

	.warning-content {
		flex: 1;
	}

	.warning-content h4 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}

	.attendance-details {
		background: #f8fafc;
		border-radius: 12px;
		padding: 16px;
		margin: 16px 0;
		border: 1px solid #e2e8f0;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #e2e8f0;
	}

	.detail-item:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-weight: 500;
		color: #64748b;
		font-size: 14px;
	}

	.detail-value {
		font-weight: 600;
		color: #1e293b;
		font-size: 14px;
	}

	.warning-text {
		margin: 16px 0 0 0;
		padding: 12px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #991b1b;
		font-size: 14px;
	}

	.warning-text strong {
		color: #7f1d1d;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 24px;
		color: #64748b;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background 0.2s ease;
	}

	.modal-close:hover {
		background: #f1f5f9;
	}

	.modal-body {
		padding: 24px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.required {
		color: #dc2626;
		font-weight: 600;
	}

	.form-input,
	.form-select,
	.form-textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		transition: border-color 0.2s ease;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		border-top: 1px solid #e2e8f0;
		padding-top: 20px;
	}

	.loading-spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid #f3f4f6;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		display: inline-block;
		margin-right: 8px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.attendance-page {
			padding: 16px;
		}

		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			justify-content: center;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.table-container {
			font-size: 12px;
		}

		.attendance-table th,
		.attendance-table td {
			padding: 8px 6px;
		}

		.employee-info {
			flex-direction: column;
			gap: 4px;
		}

		.edit-modal {
			width: 95%;
		}
	}
</style>
