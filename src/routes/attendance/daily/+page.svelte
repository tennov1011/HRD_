<script>
	import { onMount } from 'svelte';
	import { AttendanceService } from '$lib/services/attendanceService.js';
	import * as XLSX from 'xlsx';

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
		lokasi_keluar: '',
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
			let loadedData = response.data || [];

			// Ensure all records have edited and edited_at fields
			loadedData = loadedData.map((record) => ({
				...record,
				edited: record.edited || false,
				edited_at: record.edited_at || null
			}));

			// Merge with localStorage backup if database doesn't have the edited status
			attendanceData = mergeEditedStatusFromStorage(loadedData);

			totalItems = response.meta?.total_count || attendanceData.length;

			// Debug: Check if edited fields are present
			console.log('=== DEBUG LOAD ATTENDANCE DATA ===');
			console.log('Total records loaded:', attendanceData.length);
			console.log('Sample data (first record):', attendanceData[0]);
			console.log('First record edited fields:', {
				edited: attendanceData[0]?.edited,
				edited_at: attendanceData[0]?.edited_at
			});

			// Check how many records have been edited
			const editedCount = attendanceData.filter((record) => record.edited === true).length;
			console.log(`Records with edited=true: ${editedCount}/${attendanceData.length}`);
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

	function formatEditedTimestamp(timestamp) {
		if (!timestamp) return 'waktu tidak diketahui';
		try {
			return new Date(timestamp).toLocaleString('id-ID', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			return 'waktu tidak valid';
		}
	}

	// Functions for local storage backup of edited status
	function getEditedStatusFromStorage() {
		if (typeof window !== 'undefined') {
			try {
				const stored = localStorage.getItem('attendance_edited_status');
				return stored ? JSON.parse(stored) : {};
			} catch (error) {
				console.warn('Error reading edited status from localStorage:', error);
				return {};
			}
		}
		return {};
	}

	function saveEditedStatusToStorage(attendanceId, editedAt) {
		if (typeof window !== 'undefined') {
			try {
				const editedStatus = getEditedStatusFromStorage();
				editedStatus[attendanceId] = {
					edited: true,
					edited_at: editedAt
				};
				localStorage.setItem('attendance_edited_status', JSON.stringify(editedStatus));
			} catch (error) {
				console.warn('Error saving edited status to localStorage:', error);
			}
		}
	}

	function mergeEditedStatusFromStorage(attendanceRecords) {
		const editedStatus = getEditedStatusFromStorage();
		return attendanceRecords.map((record) => {
			const storedStatus = editedStatus[record.id];
			if (storedStatus && (!record.edited || !record.edited_at)) {
				return {
					...record,
					edited: storedStatus.edited,
					edited_at: storedStatus.edited_at
				};
			}
			return record;
		});
	}

	// Function to clean old localStorage entries (optional)
	function cleanOldEditedStatus() {
		if (typeof window !== 'undefined') {
			try {
				const editedStatus = getEditedStatusFromStorage();
				const currentAttendanceIds = attendanceData.map((record) => record.id);
				const filteredStatus = {};

				Object.keys(editedStatus).forEach((id) => {
					if (currentAttendanceIds.includes(parseInt(id))) {
						filteredStatus[id] = editedStatus[id];
					}
				});

				localStorage.setItem('attendance_edited_status', JSON.stringify(filteredStatus));
			} catch (error) {
				console.warn('Error cleaning old edited status:', error);
			}
		}
	}

	function exportToExcel() {
		try {
			// Prepare data for export
			const exportData = filteredData.map((item) => ({
				Nama: item.nama || '',
				Email: item.email || '',
				Tanggal: item.tanggal || '',
				'Waktu Masuk': item.waktu_masuk
					? new Date(item.waktu_masuk).toLocaleTimeString('id-ID', {
							hour: '2-digit',
							minute: '2-digit'
						})
					: '',
				'Waktu Keluar': item.waktu_keluar
					? new Date(item.waktu_keluar).toLocaleTimeString('id-ID', {
							hour: '2-digit',
							minute: '2-digit'
						})
					: '',
				'Lokasi Masuk': item.lokasi || '',
				'Lokasi Keluar': item.lokasi_keluar || '',
				Status: item.terlambat ? 'Terlambat' : 'Tepat Waktu',
				'Menit Keterlambatan': item.menit_keterlambatan || 0,
				'Foto Masuk': item.foto ? 'Ada' : 'Tidak Ada',
				'Foto Keluar': item.foto_keluar ? 'Ada' : 'Tidak Ada',
				'Data Diedit': item.edited ? 'Ya' : 'Tidak',
				'Waktu Edit': item.edited_at ? new Date(item.edited_at).toLocaleString('id-ID') : '',
				Keterangan: item.keterangan || ''
			}));

			// Create workbook and worksheet
			const wb = XLSX.utils.book_new();
			const ws = XLSX.utils.json_to_sheet(exportData);

			// Set column widths
			const colWidths = [
				{ width: 20 }, // Nama
				{ width: 25 }, // Email
				{ width: 12 }, // Tanggal
				{ width: 12 }, // Waktu Masuk
				{ width: 12 }, // Waktu Keluar
				{ width: 15 }, // Lokasi Masuk
				{ width: 15 }, // Lokasi Keluar
				{ width: 15 }, // Status
				{ width: 18 }, // Menit Keterlambatan
				{ width: 12 }, // Foto Masuk
				{ width: 12 }, // Foto Keluar
				{ width: 12 }, // Data Diedit
				{ width: 20 }, // Waktu Edit
				{ width: 25 } // Keterangan
			];
			ws['!cols'] = colWidths;

			// Add worksheet to workbook
			XLSX.utils.book_append_sheet(wb, ws, 'Presensi Harian');

			// Generate filename with current date
			const currentDate = selectedDate || new Date().toISOString().split('T')[0];
			const fileName = `Presensi_Harian_${currentDate}.xlsx`;

			// Write and download file
			XLSX.writeFile(wb, fileName);

			console.log('Excel file exported successfully:', fileName);
		} catch (error) {
			console.error('Error exporting to Excel:', error);
			alert('Terjadi kesalahan saat mengekspor data ke Excel');
		}
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

	// Test function untuk verifikasi field edited di database
	async function testEditedFields() {
		console.log('=== TEST EDITED FIELDS ===');

		try {
			const result = await AttendanceService.testEditedFields();

			let message = '📊 Test Field "edited" di Database:\n\n';
			message += `✅ Field "edited" tersedia: ${result.hasEditedField ? 'YA' : 'TIDAK'}\n`;
			message += `✅ Field "edited_at" tersedia: ${result.hasEditedAtField ? 'YA' : 'TIDAK'}\n\n`;

			if (result.hasEditedField && result.hasEditedAtField) {
				message += '🎉 BAGUS! Field sudah tersedia di database.\n';
				message += 'Label "Edited" akan tersimpan permanen setelah reload.';
			} else {
				message += '⚠️ Field belum tersedia di database.\n';
				message += 'Silakan tambahkan field berikut di Directus:\n';
				message += '• edited (Boolean, default: false)\n';
				message += '• edited_at (Datetime, default: null)';
			}

			console.log('Field test result:', result);
			alert(message);
		} catch (error) {
			console.error('Edited fields test failed:', error);
			alert('❌ Test field gagal: ' + error.message);
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
			lokasi_keluar: attendance.lokasi_keluar || '',
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
				lokasi_keluar: editForm.lokasi_keluar?.trim() || null,
				keterangan: editForm.keterangan?.trim() || null,
				terlambat: editForm.terlambat,
				menit_keterlambatan: editForm.terlambat ? editForm.menit_keterlambatan || 0 : 0,
				edited: true,
				edited_at: new Date().toISOString()
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
				// Save to localStorage as backup
				saveEditedStatusToStorage(editingAttendance.id, updatedData.edited_at);

				// Update local data with all the updated fields
				const index = attendanceData.findIndex((item) => item.id === editingAttendance.id);
				if (index !== -1) {
					// Merge the updated data while preserving existing fields
					attendanceData[index] = {
						...attendanceData[index],
						...updatedData,
						// Ensure these fields are properly set
						edited: true,
						edited_at: updatedData.edited_at
					};
					attendanceData = [...attendanceData]; // Trigger reactivity

					// Debug: Log the updated record
					console.log('Updated local record:', attendanceData[index]);
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

	function viewPhoto(attendance, type = 'masuk') {
		// Implementation for viewing photo
		let photoField, photoTitle;

		if (type === 'keluar') {
			photoField = attendance.foto_keluar;
			photoTitle = 'Foto Keluar';
		} else {
			photoField = attendance.foto;
			photoTitle = 'Foto Masuk';
		}

		if (photoField) {
			// Open photo in new window or modal
			const photoUrl = `${import.meta.env.VITE_DIRECTUS_URL}/assets/${photoField}`;
			const newWindow = window.open(
				'',
				'_blank',
				'width=800,height=600,scrollbars=yes,resizable=yes'
			);

			if (newWindow) {
				newWindow.document.write(`
					<html>
						<head>
							<title>${photoTitle} - ${attendance.nama}</title>
							<style>
								body { 
									margin: 0; 
									padding: 20px; 
									font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
									background: #f5f5f5;
									display: flex;
									flex-direction: column;
									align-items: center;
								}
								.photo-header {
									background: white;
									padding: 15px 20px;
									border-radius: 8px;
									margin-bottom: 20px;
									box-shadow: 0 2px 4px rgba(0,0,0,0.1);
									text-align: center;
									width: 100%;
									max-width: 600px;
								}
								.photo-title {
									font-size: 18px;
									font-weight: 600;
									color: #1e293b;
									margin-bottom: 5px;
								}
								.photo-subtitle {
									font-size: 14px;
									color: #64748b;
								}
								.photo-container {
									background: white;
									padding: 10px;
									border-radius: 8px;
									box-shadow: 0 2px 4px rgba(0,0,0,0.1);
									max-width: 90vw;
									max-height: 90vh;
									overflow: auto;
								}
								img { 
									max-width: 100%; 
									height: auto; 
									border-radius: 4px;
									display: block;
								}
							</style>
						</head>
						<body>
							<div class="photo-header">
								<div class="photo-title">${photoTitle}</div>
								<div class="photo-subtitle">${attendance.nama} - ${formatDate(attendance.tanggal)}</div>
							</div>
							<div class="photo-container">
								<img src="${photoUrl}" alt="${photoTitle}" onload="window.focus();" />
							</div>
						</body>
					</html>
				`);
				newWindow.document.close();
			}
		} else {
			alert(`❌ ${photoTitle} tidak tersedia untuk presensi ini.`);
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
			<button class="btn btn-secondary" on:click={exportToExcel}>📗 Export Excel </button>
			<button class="btn btn-secondary" on:click={testEditedFields}>🔍 Test Fields</button>
			<!-- <button class="btn btn-secondary" on:click={testTimeConversion}> 🔍 Test Time </button> -->
			<!-- <button class="btn btn-secondary" on:click={testDirectusConnection}> 🔗 Test API </button> -->
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
							<th>Lokasi Masuk</th>
							<th>Lokasi Keluar</th>
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
											<div class="employee-name">
												{attendance.nama || 'N/A'}
												{#if attendance.edited === true}
													<span
														class="edited-label"
														title="Data telah diedit pada {formatEditedTimestamp(
															attendance.edited_at
														)}"
													>
														✏️ Edited
													</span>
												{/if}
											</div>
										</div>
									</div>
								</td>
								<td>{attendance.email}</td>
								<td>{formatDate(attendance.tanggal)}</td>
								<td>
									<div class="time-with-photo">
										<span class="time-badge time-in">
											{formatTime(attendance.waktu_masuk)}
										</span>
										{#if attendance.foto}
											<button
												class="btn-photo-inline btn-photo-masuk"
												title="Lihat Foto Masuk"
												on:click={() => viewPhoto(attendance, 'masuk')}
											>
												📷
											</button>
										{/if}
									</div>
								</td>
								<td>
									<div class="time-with-photo">
										<span class="time-badge time-out">
											{formatTime(attendance.waktu_keluar)}
										</span>
										{#if attendance.foto_keluar}
											<button
												class="btn-photo-inline btn-photo-keluar"
												title="Lihat Foto Keluar"
												on:click={() => viewPhoto(attendance, 'keluar')}
											>
												📷
											</button>
										{/if}
									</div>
								</td>
								<td>
									<div class="location-info" title={attendance.lokasi}>
										📍 {attendance.lokasi || 'Lokasi tidak tersedia'}
									</div>
								</td>
								<td>
									<div class="location-info" title={attendance.lokasi_keluar}>
										{#if attendance.lokasi_keluar}
											📍 {attendance.lokasi_keluar}
										{:else}
											<span class="no-location">-</span>
										{/if}
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

							<!-- Lokasi Masuk -->
							<div class="form-group">
								<label for="edit-lokasi">Lokasi Masuk:</label>
								<input
									id="edit-lokasi"
									type="text"
									bind:value={editForm.lokasi}
									class="form-input"
									placeholder="Masukkan lokasi check-in"
								/>
							</div>

							<!-- Lokasi Keluar -->
							<div class="form-group">
								<label for="edit-lokasi-keluar">Lokasi Keluar:</label>
								<input
									id="edit-lokasi-keluar"
									type="text"
									bind:value={editForm.lokasi_keluar}
									class="form-input"
									placeholder="Masukkan lokasi check-out"
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

	/* Time with Photo Container */
	.time-with-photo {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-start;
	}

	.time-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		background: #f1f5f9;
		color: #475569;
		border: 1px solid #e2e8f0;
	}

	.time-badge.time-in {
		background: #dcfce7;
		color: #166534;
		border-color: #bbf7d0;
	}

	.time-badge.time-out {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
	}

	/* Inline Photo Buttons */
	.btn-photo-inline {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}

	.btn-photo-inline:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.btn-photo-masuk {
		background: #dcfce7;
		color: #166534;
		border-color: #bbf7d0;
	}

	.btn-photo-masuk:hover {
		background: #bbf7d0;
		border-color: #86efac;
	}

	.btn-photo-keluar {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
	}

	.btn-photo-keluar:hover {
		background: #fde68a;
		border-color: #fcd34d;
	}

	/* Employee Info Styles */
	.employee-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.employee-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.employee-details {
		flex: 1;
		min-width: 0;
	}

	.employee-name {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		font-weight: 500;
		color: #1e293b;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.edited-label {
		display: inline-block;
		background: #fef3c7;
		color: #92400e;
		font-size: 10px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 4px;
		margin-left: 8px;
		border: 1px solid #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: help;
	}

	/* Location Info */
	.location-info {
		font-size: 12px;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	/* Status Badge */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.status-badge.status-ontime {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.status-badge.status-late {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	/* Late Duration */
	.late-duration {
		color: #dc2626;
		font-weight: 500;
		font-size: 12px;
		background: #fee2e2;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fecaca;
	}

	.no-late {
		color: #64748b;
		font-size: 12px;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: 4px;
		justify-content: center;
		align-items: center;
	}

	.btn-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}

	.btn-action:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.btn-action.btn-edit {
		background: #dbeafe;
		color: #1d4ed8;
		border-color: #bfdbfe;
	}

	.btn-action.btn-edit:hover {
		background: #bfdbfe;
		border-color: #93c5fd;
	}

	.btn-action.btn-delete {
		background: #fee2e2;
		color: #dc2626;
		border-color: #fecaca;
	}

	.btn-action.btn-delete:hover {
		background: #fecaca;
		border-color: #f87171;
	}

	/* Table Styles */
	.table-container {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
	}

	.attendance-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.attendance-table th {
		background: #f8fafc;
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		color: #475569;
		border-bottom: 1px solid #e2e8f0;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.attendance-table td {
		padding: 12px 16px;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}

	.attendance-table tbody tr:hover {
		background: #f8fafc;
	}

	.attendance-table tbody tr:last-child td {
		border-bottom: none;
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
