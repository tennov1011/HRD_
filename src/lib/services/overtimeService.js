// Service untuk mengelola data pengajuan lembur dari Directus
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * Base function untuk API calls ke Directus
 * @param {string} endpoint
 * @param {object} options
 */
async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/items/${endpoint}`;
	const config = {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${DIRECTUS_TOKEN}`
		},
		...options
	};

	try {
		console.log('🔗 Directus API Call (Overtime):', url);
		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Directus Response (Overtime):', data);
		return data;
	} catch (error) {
		console.error('❌ Directus API Error (Overtime):', error);
		throw error;
	}
}

/**
 * Mengambil data pengajuan lembur dari collection lembur
 * @param {object} filters - Filter untuk query
 */
export async function getOvertimeRequests(filters = {}) {
	try {
		let query = 'lembur?fields=*';

		// Tambah filter jika ada
		if (filters.status) {
			query += `&filter[status][_eq]=${filters.status}`;
		}
		if (filters.user_id) {
			query += `&filter[user_id][_eq]=${filters.user_id}`;
		}
		if (filters.tanggal) {
			query += `&filter[tanggal][_eq]=${filters.tanggal}`;
		}
		if (filters.date_from) {
			query += `&filter[tanggal][_gte]=${filters.date_from}`;
		}
		if (filters.date_to) {
			query += `&filter[tanggal][_lte]=${filters.date_to}`;
		}

		// Sort by tanggal_pengajuan descending
		query += '&sort=-tanggal_pengajuan';

		const response = await directusApi(query);

		// Transform data untuk konsistensi dengan UI
		const transformedData =
			response.data?.map((item) => ({
				...item,
				employee_name: item.nama,
				employee_email: item.email,
				overtime_date: item.tanggal,
				duration_hours: item.durasi_jam || 0,
				duration_minutes: item.durasi_menit || 0,
				total_duration: formatDuration(item.durasi_jam || 0, item.durasi_menit || 0),
				description: item.deskripsi,
				submitted_date: item.tanggal_pengajuan,
				created_date: item.date_created,
				updated_date: item.date_updated
			})) || [];

		return {
			success: true,
			data: transformedData,
			total: transformedData.length
		};
	} catch (error) {
		console.error('Error fetching overtime requests:', error);

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockOvertimeRequests(),
			total: getMockOvertimeRequests().length,
			error: error.message
		};
	}
}

/**
 * Update status pengajuan lembur
 * @param {string} id - ID pengajuan
 * @param {object} updates - Data yang akan diupdate
 */
export async function updateOvertimeRequest(id, updates) {
	try {
		const response = await directusApi(`lembur/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error updating overtime request:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Approve pengajuan lembur menggunakan multi-level approval
 * @param {object} request - Data pengajuan
 */
export async function approveOvertimeRequestMultiLevel(request) {
	try {
		// Import approval service
		const { approveOvertimeAtStage, getCurrentUserApprovalLevel, canApproveAtStage } = await import(
			'./overtimeApprovalService.js'
		);

		const userLevel = getCurrentUserApprovalLevel();
		const currentStage = request.approval_stage || 'pending';

		console.log('🔍 DEBUG approveOvertimeRequestMultiLevel:', {
			requestId: request.id,
			userLevel,
			currentStage,
			canApprove: canApproveAtStage(request, currentStage)
		});

		if (!canApproveAtStage(request, currentStage)) {
			return {
				success: false,
				error: 'Anda tidak memiliki wewenang untuk menyetujui pengajuan lembur ini'
			};
		}

		const result = await approveOvertimeAtStage(request, userLevel);
		return result;
	} catch (error) {
		console.error('Error in approveOvertimeRequestMultiLevel:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyetujui pengajuan'
		};
	}
}

/**
 * Reject pengajuan lembur menggunakan multi-level approval
 * @param {object} request - Data pengajuan
 * @param {string} reason - Alasan penolakan
 */
export async function rejectOvertimeRequestMultiLevel(request, reason = '') {
	try {
		// Import approval service
		const { rejectOvertimeAtStage, getCurrentUserApprovalLevel, canApproveAtStage } = await import(
			'./overtimeApprovalService.js'
		);

		const userLevel = getCurrentUserApprovalLevel();
		const currentStage = request.approval_stage || 'pending';

		console.log('🔍 DEBUG rejectOvertimeRequestMultiLevel:', {
			requestId: request.id,
			userLevel,
			currentStage,
			reason,
			canApprove: canApproveAtStage(request, currentStage)
		});

		if (!canApproveAtStage(request, currentStage)) {
			return {
				success: false,
				error: 'Anda tidak memiliki wewenang untuk menolak pengajuan lembur ini'
			};
		}

		const result = await rejectOvertimeAtStage(request, userLevel, reason);
		return result;
	} catch (error) {
		console.error('Error in rejectOvertimeRequestMultiLevel:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menolak pengajuan'
		};
	}
}

/**
 * Approve pengajuan lembur (backward compatibility)
 * @param {object} request - Data pengajuan
 * @param {string} approvedBy - Nama yang menyetujui
 */
export async function approveOvertimeRequest(request, approvedBy = 'HR Manager') {
	// Use new multi-level approval system
	return await approveOvertimeRequestMultiLevel(request);
}

/**
 * Reject pengajuan lembur (backward compatibility)
 * @param {object} request - Data pengajuan
 * @param {string} rejectedBy - Nama yang menolak
 * @param {string} reason - Alasan penolakan
 */
export async function rejectOvertimeRequest(request, rejectedBy = 'HR Manager', reason = '') {
	// Use new multi-level approval system
	return await rejectOvertimeRequestMultiLevel(request, reason);
}

/**
 * Create new overtime request
 * @param {object} requestData - Data pengajuan baru
 */
export async function createOvertimeRequest(requestData) {
	try {
		const newRequest = {
			user_id: requestData.user_id,
			email: requestData.email,
			nama: requestData.nama,
			tanggal: requestData.tanggal,
			durasi_jam: requestData.durasi_jam || 0,
			durasi_menit: requestData.durasi_menit || 0,
			deskripsi: requestData.deskripsi,
			status: 'pending',
			tanggal_pengajuan: new Date().toISOString().split('T')[0]
		};

		const response = await directusApi('lembur', {
			method: 'POST',
			body: JSON.stringify(newRequest)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error creating overtime request:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Delete pengajuan lembur
 * @param {string} id - ID pengajuan
 */
export async function deleteOvertimeRequest(id) {
	try {
		await directusApi(`lembur/${id}`, {
			method: 'DELETE'
		});

		return {
			success: true,
			message: 'Overtime request deleted successfully'
		};
	} catch (error) {
		console.error('Error deleting overtime request:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Format durasi lembur
 * @param {number} hours
 * @param {number} minutes
 */
function formatDuration(hours, minutes) {
	if (hours === 0 && minutes === 0) return '0 jam';

	let result = '';
	if (hours > 0) {
		result += `${hours} jam`;
	}
	if (minutes > 0) {
		if (result) result += ' ';
		result += `${minutes} menit`;
	}

	return result;
}

/**
 * Calculate total hours from hours and minutes
 * @param {number} hours
 * @param {number} minutes
 */
export function calculateTotalHours(hours, minutes) {
	return hours + minutes / 60;
}

/**
 * Get overtime statistics
 * @param {object} filters
 */
export async function getOvertimeStatistics(filters = {}) {
	try {
		const result = await getOvertimeRequests(filters);

		if (result.success) {
			const data = result.data;
			const pending = data.filter((item) => item.status === 'pending').length;
			const approved = data.filter((item) => item.status === 'approved');
			const rejected = data.filter((item) => item.status === 'rejected').length;

			// Calculate total approved overtime hours
			const totalHours = approved.reduce((sum, item) => {
				return sum + calculateTotalHours(item.duration_hours, item.duration_minutes);
			}, 0);

			return {
				success: true,
				statistics: {
					total: data.length,
					pending,
					approved: approved.length,
					rejected,
					totalApprovedHours: Math.round(totalHours * 100) / 100 // Round to 2 decimal places
				}
			};
		}

		return result;
	} catch (error) {
		console.error('Error getting overtime statistics:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

// Mock data untuk fallback
function getMockOvertimeRequests() {
	return [
		{
			id: 1,
			user_id: 'EMP001',
			email: 'john.doe@company.com',
			nama: 'John Doe',
			divisi: 'IT',
			tanggal: '2025-07-05',
			jam_masuk: '08:00',
			jam_keluar: '20:30',
			durasi_jam: 3,
			durasi_menit: 30,
			deskripsi: 'Menyelesaikan project urgent untuk client ABC',
			lampiran_foto_opsional: null, // No attachment for this record
			status: 'pending',
			tanggal_pengajuan: '2025-07-03',
			employee_name: 'John Doe',
			employee_email: 'john.doe@company.com',
			employee_division: 'IT',
			overtime_date: '2025-07-05',
			duration_hours: 3,
			duration_minutes: 30,
			total_duration: '3 jam 30 menit',
			description: 'Menyelesaikan project urgent untuk client ABC',
			submitted_date: '2025-07-03'
		},
		{
			id: 2,
			user_id: 'EMP002',
			email: 'jane.smith@company.com',
			nama: 'Jane Smith',
			divisi: 'Finance',
			tanggal: '2025-07-04',
			jam_masuk: '09:00',
			jam_keluar: '18:00',
			durasi_jam: 2,
			durasi_menit: 0,
			deskripsi: 'Meeting dengan vendor dan persiapan presentasi',
			lampiran_foto_opsional: 'dcdd8c93-7a06-47a8-a064-cb0b7aee2ddd', // Sample UUID - will construct proper URL
			status: 'approved',
			tanggal_pengajuan: '2025-07-02',
			approved_by: 'HR Manager',
			approved_date: '2025-07-03',
			employee_name: 'Jane Smith',
			employee_email: 'jane.smith@company.com',
			employee_division: 'Finance',
			overtime_date: '2025-07-04',
			duration_hours: 2,
			duration_minutes: 0,
			total_duration: '2 jam',
			description: 'Meeting dengan vendor dan persiapan presentasi',
			submitted_date: '2025-07-02'
		},
		{
			id: 3,
			user_id: 'EMP003',
			email: 'bob.johnson@company.com',
			nama: 'Bob Johnson',
			divisi: 'Maintenance',
			tanggal: '2025-07-03',
			jam_masuk: '07:30',
			jam_keluar: '19:45',
			durasi_jam: 4,
			durasi_menit: 15,
			deskripsi: 'Maintenance server dan backup data',
			lampiran_foto_opsional: 'https://picsum.photos/800/600?random=1', // Sample image URL for testing
			status: 'rejected',
			tanggal_pengajuan: '2025-07-01',
			approved_by: 'HR Manager',
			approved_date: '2025-07-02',
			rejection_reason: 'Tidak sesuai dengan kebijakan overtime',
			employee_name: 'Bob Johnson',
			employee_email: 'bob.johnson@company.com',
			employee_division: 'Maintenance',
			overtime_date: '2025-07-03',
			duration_hours: 4,
			duration_minutes: 15,
			total_duration: '4 jam 15 menit',
			description: 'Maintenance server dan backup data',
			submitted_date: '2025-07-01'
		}
	];
}

/**
 * Test koneksi ke Directus untuk collection lembur
 */
export async function testOvertimeConnection() {
	try {
		const response = await fetch(`${DIRECTUS_URL}/server/info`);
		if (response.ok) {
			console.log('✅ Directus connection successful (Overtime)');
			return { success: true, message: 'Connected to Directus' };
		} else {
			throw new Error('Connection failed');
		}
	} catch (error) {
		console.error('❌ Directus connection failed (Overtime):', error);
		return { success: false, message: 'Failed to connect to Directus' };
	}
}
