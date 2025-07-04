// Service untuk mengelola data pengajuan izin/cuti dari Directus
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
		console.log('🔗 Directus API Call:', url);
		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Directus Response:', data);
		return data;
	} catch (error) {
		console.error('❌ Directus API Error:', error);
		throw error;
	}
}

/**
 * Mengambil data pengajuan izin jam dari collection izin_jam
 * @param {object} filters - Filter untuk query
 */
export async function getLeaveByHours(filters = {}) {
	try {
		let query = 'izin_jam?fields=*';

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

		// Sort by tanggal_pengajuan descending
		query += '&sort=-tanggal_pengajuan';

		const response = await directusApi(query);
		return {
			success: true,
			data: response.data || [],
			total: response.data?.length || 0
		};
	} catch (error) {
		console.error('Error fetching leave by hours:', error);

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockLeaveByHours(),
			total: getMockLeaveByHours().length,
			error: error.message
		};
	}
}

/**
 * Mengambil data pengajuan izin hari dari collection izin_hari
 * @param {object} filters - Filter untuk query
 */
export async function getLeaveByDays(filters = {}) {
	try {
		let query = 'izin_hari?fields=*';

		// Tambah filter jika ada
		if (filters.status) {
			query += `&filter[status][_eq]=${filters.status}`;
		}
		if (filters.user_id) {
			query += `&filter[user_id][_eq]=${filters.user_id}`;
		}
		if (filters.tanggal_mulai) {
			query += `&filter[tanggal_mulai][_gte]=${filters.tanggal_mulai}`;
		}
		if (filters.tanggal_selesai) {
			query += `&filter[tanggal_selesai][_lte]=${filters.tanggal_selesai}`;
		}

		// Sort by tanggal_pengajuan descending
		query += '&sort=-tanggal_pengajuan';

		const response = await directusApi(query);
		return {
			success: true,
			data: response.data || [],
			total: response.data?.length || 0
		};
	} catch (error) {
		console.error('Error fetching leave by days:', error);

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockLeaveByDays(),
			total: getMockLeaveByDays().length,
			error: error.message
		};
	}
}

/**
 * Mengambil semua data pengajuan izin (gabungan jam dan hari)
 * @param {object} filters - Filter untuk query
 */
export async function getAllLeaveRequests(filters = {}) {
	try {
		const [hoursData, daysData] = await Promise.all([
			getLeaveByHours(filters),
			getLeaveByDays(filters)
		]);

		// Gabungkan dan transform data
		const combinedData = [
			...hoursData.data.map((item) => ({
				...item,
				type: 'hours',
				leave_type: item.kategori || 'Izin Jam',
				start_date: item.tanggal,
				end_date: item.tanggal,
				days: 0, // Untuk izin jam, tidak dihitung hari
				duration: `${item.dari_jam} - ${item.sampai_jam}`,
				reason: item.keterangan,
				status: item.status || 'pending',
				submitted_date: item.tanggal_pengajuan,
				employee_name: item.nama,
				employee_email: item.email,
				attachment: item.lampiran
			})),
			...daysData.data.map((item) => ({
				...item,
				type: 'days',
				leave_type: item.kategori || 'Izin Hari',
				start_date: item.tanggal_mulai,
				end_date: item.tanggal_selesai,
				days: item.total_hari || 1,
				duration: `${item.total_hari} hari`,
				reason: item.keterangan,
				status: item.status || 'pending',
				submitted_date: item.tanggal_pengajuan,
				employee_name: item.nama,
				employee_email: item.email,
				attachment: item.lampiran
			}))
		];

		// Sort by submitted_date descending
		combinedData.sort((a, b) => new Date(b.submitted_date) - new Date(a.submitted_date));

		return {
			success: hoursData.success && daysData.success,
			data: combinedData,
			total: combinedData.length,
			breakdown: {
				hours: hoursData.data.length,
				days: daysData.data.length
			}
		};
	} catch (error) {
		console.error('Error fetching all leave requests:', error);

		// Fallback dengan mock data
		const mockData = [
			...getMockLeaveByHours().map((item) => ({ ...item, type: 'hours' })),
			...getMockLeaveByDays().map((item) => ({ ...item, type: 'days' }))
		];

		return {
			success: false,
			data: mockData,
			total: mockData.length,
			error: error.message
		};
	}
}

/**
 * Update status pengajuan izin jam
 * @param {string} id - ID pengajuan
 * @param {object} updates - Data yang akan diupdate
 */
export async function updateLeaveByHours(id, updates) {
	try {
		const response = await directusApi(`izin_jam/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error updating leave by hours:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Update status pengajuan izin hari
 * @param {string} id - ID pengajuan
 * @param {object} updates - Data yang akan diupdate
 */
export async function updateLeaveByDays(id, updates) {
	try {
		const response = await directusApi(`izin_hari/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error updating leave by days:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Approve pengajuan izin
 * @param {object} request - Data pengajuan
 * @param {string} approvedBy - Nama yang menyetujui
 */
export async function approveLeaveRequest(request, approvedBy = 'HR Manager') {
	const updates = {
		status: 'approved',
		approved_by: approvedBy,
		approved_date: new Date().toISOString().split('T')[0]
	};

	if (request.type === 'hours') {
		return await updateLeaveByHours(request.id, updates);
	} else {
		return await updateLeaveByDays(request.id, updates);
	}
}

/**
 * Reject pengajuan izin
 * @param {object} request - Data pengajuan
 * @param {string} rejectedBy - Nama yang menolak
 * @param {string} reason - Alasan penolakan
 */
export async function rejectLeaveRequest(request, rejectedBy = 'HR Manager', reason = '') {
	const updates = {
		status: 'rejected',
		approved_by: rejectedBy,
		approved_date: new Date().toISOString().split('T')[0],
		rejection_reason: reason
	};

	if (request.type === 'hours') {
		return await updateLeaveByHours(request.id, updates);
	} else {
		return await updateLeaveByDays(request.id, updates);
	}
}

// Mock data untuk fallback
function getMockLeaveByHours() {
	return [
		{
			id: 1,
			user_id: 'EMP001',
			email: 'john.doe@company.com',
			nama: 'John Doe',
			kategori: 'Izin Pribadi',
			tanggal: '2025-07-05',
			dari_jam: '10:00',
			sampai_jam: '12:00',
			keterangan: 'Ke bank untuk urusan administrasi',
			lampiran: null,
			status: 'pending',
			tanggal_pengajuan: '2025-07-03'
		},
		{
			id: 2,
			user_id: 'EMP002',
			email: 'jane.smith@company.com',
			nama: 'Jane Smith',
			kategori: 'Izin Sakit',
			tanggal: '2025-07-04',
			dari_jam: '08:00',
			sampai_jam: '17:00',
			keterangan: 'Kontrol dokter',
			lampiran: 'surat_dokter.pdf',
			status: 'approved',
			tanggal_pengajuan: '2025-07-02'
		}
	];
}

function getMockLeaveByDays() {
	return [
		{
			id: 1,
			user_id: 'EMP003',
			email: 'bob.johnson@company.com',
			nama: 'Bob Johnson',
			kategori: 'Cuti Tahunan',
			tanggal_mulai: '2025-07-10',
			tanggal_selesai: '2025-07-12',
			total_hari: 3,
			keterangan: 'Liburan keluarga',
			lampiran: null,
			status: 'pending',
			tanggal_pengajuan: '2025-07-01'
		},
		{
			id: 2,
			user_id: 'EMP004',
			email: 'alice.brown@company.com',
			nama: 'Alice Brown',
			kategori: 'Izin Sakit',
			tanggal_mulai: '2025-07-06',
			tanggal_selesai: '2025-07-07',
			total_hari: 2,
			keterangan: 'Sakit demam tinggi',
			lampiran: 'surat_sakit.pdf',
			status: 'approved',
			tanggal_pengajuan: '2025-07-05'
		}
	];
}

/**
 * Test koneksi ke Directus
 */
export async function testConnection() {
	try {
		const response = await fetch(`${DIRECTUS_URL}/server/info`);
		if (response.ok) {
			console.log('✅ Directus connection successful');
			return { success: true, message: 'Connected to Directus' };
		} else {
			throw new Error('Connection failed');
		}
	} catch (error) {
		console.error('❌ Directus connection failed:', error);
		return { success: false, message: 'Failed to connect to Directus' };
	}
}
