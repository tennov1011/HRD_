// Service untuk mengelola data pengajuan kasbon dari Directus
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
		console.log('🔗 Directus API Call (Advance):', url);
		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Directus Response (Advance):', data);
		return data;
	} catch (error) {
		console.error('❌ Directus API Error (Advance):', error);
		throw error;
	}
}

/**
 * Mengambil data pengajuan kasbon dari collection kasbon
 * @param {any} filters - Filter untuk query
 */
export async function getAdvanceRequests(filters = {}) {
	try {
		let query = 'kasbon?fields=*';

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
			response.data?.map(
				/** @param {any} item */ (item) => ({
					...item,
					employee_name: item.nama,
					employee_email: item.email,
					advance_date: item.tanggal,
					amount: item.nominal,
					description: item.keterangan,
					tenor_months: item.tenor,
					submitted_date: item.tanggal_pengajuan,
					// Format nominal sebagai currency
					formatted_amount: formatCurrency(item.nominal),
					// Hitung estimasi cicilan per bulan
					monthly_payment: item.tenor > 0 ? Math.ceil(item.nominal / item.tenor) : item.nominal,
					formatted_monthly_payment: formatCurrency(
						item.tenor > 0 ? Math.ceil(item.nominal / item.tenor) : item.nominal
					)
				})
			) || [];

		return {
			success: true,
			data: transformedData,
			total: transformedData.length
		};
	} catch (error) {
		console.error('Error fetching advance requests:', /** @type {any} */ (error));

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockAdvanceRequests(),
			total: getMockAdvanceRequests().length,
			error: /** @type {any} */ (error).message
		};
	}
}

/**
 * Update status pengajuan kasbon
 * @param {string} id - ID pengajuan
 * @param {object} updates - Data yang akan diupdate
 */
export async function updateAdvanceRequest(id, updates) {
	try {
		const response = await directusApi(`kasbon/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error updating advance request:', /** @type {any} */ (error));
		return {
			success: false,
			error: /** @type {any} */ (error).message
		};
	}
}

/**
 * Approve pengajuan kasbon
 * @param {any} request - Data pengajuan
 * @param {string} approvedBy - Nama yang menyetujui
 */
export async function approveAdvanceRequest(request, approvedBy = 'HR Manager') {
	const updates = {
		status: 'approved',
		approved_by: approvedBy,
		approved_date: new Date().toISOString().split('T')[0],
		date_updated: new Date().toISOString()
	};

	return await updateAdvanceRequest(request.id, updates);
}

/**
 * Reject pengajuan kasbon
 * @param {any} request - Data pengajuan
 * @param {string} rejectedBy - Nama yang menolak
 * @param {string} reason - Alasan penolakan
 */
export async function rejectAdvanceRequest(request, rejectedBy = 'HR Manager', reason = '') {
	const updates = {
		status: 'rejected',
		approved_by: rejectedBy,
		approved_date: new Date().toISOString().split('T')[0],
		rejection_reason: reason,
		date_updated: new Date().toISOString()
	};

	return await updateAdvanceRequest(request.id, updates);
}

/**
 * Create new advance request
 * @param {any} requestData - Data pengajuan baru
 */
export async function createAdvanceRequest(requestData) {
	try {
		const newRequest = {
			user_id: requestData.user_id,
			email: requestData.email,
			nama: requestData.nama,
			tanggal: requestData.tanggal,
			nominal: requestData.nominal,
			tenor: requestData.tenor || 1,
			keterangan: requestData.keterangan,
			status: 'pending',
			tanggal_pengajuan: new Date().toISOString().split('T')[0]
		};

		const response = await directusApi('kasbon', {
			method: 'POST',
			body: JSON.stringify(newRequest)
		});

		return {
			success: true,
			data: response.data
		};
	} catch (error) {
		console.error('Error creating advance request:', /** @type {any} */ (error));
		return {
			success: false,
			error: /** @type {any} */ (error).message
		};
	}
}

/**
 * Delete pengajuan kasbon
 * @param {string} id - ID pengajuan
 */
export async function deleteAdvanceRequest(id) {
	try {
		await directusApi(`kasbon/${id}`, {
			method: 'DELETE'
		});

		return {
			success: true,
			message: 'Advance request deleted successfully'
		};
	} catch (error) {
		console.error('Error deleting advance request:', /** @type {any} */ (error));
		return {
			success: false,
			error: /** @type {any} */ (error).message
		};
	}
}

/**
 * Format nominal sebagai currency Rupiah
 * @param {number} amount
 */
function formatCurrency(amount) {
	if (!amount || isNaN(amount)) return 'Rp 0';

	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Get advance statistics
 * @param {object} filters
 */
export async function getAdvanceStatistics(filters = {}) {
	try {
		const result = await getAdvanceRequests(filters);

		if (result.success) {
			const data = result.data;
			const pending = data.filter(/** @param {any} item */ (item) => item.status === 'pending');
			const approved = data.filter(/** @param {any} item */ (item) => item.status === 'approved');
			const rejected = data.filter(
				/** @param {any} item */ (item) => item.status === 'rejected'
			).length;

			// Calculate total approved advance amount
			const totalApprovedAmount = approved.reduce(
				/** @param {any} sum @param {any} item */ (sum, item) => {
					return sum + (item.amount || 0);
				},
				0
			);

			// Calculate average advance amount
			const averageAmount = approved.length > 0 ? totalApprovedAmount / approved.length : 0;

			return {
				success: true,
				statistics: {
					total: data.length,
					pending: pending.length,
					approved: approved.length,
					rejected,
					totalApprovedAmount: totalApprovedAmount,
					formattedTotalAmount: formatCurrency(totalApprovedAmount),
					averageAmount: Math.round(averageAmount),
					formattedAverageAmount: formatCurrency(averageAmount)
				}
			};
		}

		return result;
	} catch (error) {
		console.error('Error getting advance statistics:', /** @type {any} */ (error));
		return {
			success: false,
			error: /** @type {any} */ (error).message
		};
	}
}

// Mock data untuk fallback
function getMockAdvanceRequests() {
	return [
		{
			id: 1,
			user_id: 'EMP001',
			email: 'john.doe@company.com',
			nama: 'John Doe',
			tanggal: '2025-07-10',
			nominal: 5000000,
			status: 'pending',
			tanggal_pengajuan: '2025-07-03',
			tenor: 12,
			keterangan: 'Untuk biaya pengobatan keluarga',
			employee_name: 'John Doe',
			employee_email: 'john.doe@company.com',
			advance_date: '2025-07-10',
			amount: 5000000,
			description: 'Untuk biaya pengobatan keluarga',
			tenor_months: 12,
			submitted_date: '2025-07-03',
			formatted_amount: 'Rp 5.000.000',
			monthly_payment: 416667,
			formatted_monthly_payment: 'Rp 416.667'
		},
		{
			id: 2,
			user_id: 'EMP002',
			email: 'jane.smith@company.com',
			nama: 'Jane Smith',
			tanggal: '2025-07-08',
			nominal: 3000000,
			status: 'approved',
			tanggal_pengajuan: '2025-07-01',
			tenor: 6,
			keterangan: 'Dana pendidikan anak',
			approved_by: 'HR Manager',
			approved_date: '2025-07-02',
			employee_name: 'Jane Smith',
			employee_email: 'jane.smith@company.com',
			advance_date: '2025-07-08',
			amount: 3000000,
			description: 'Dana pendidikan anak',
			tenor_months: 6,
			submitted_date: '2025-07-01',
			formatted_amount: 'Rp 3.000.000',
			monthly_payment: 500000,
			formatted_monthly_payment: 'Rp 500.000'
		},
		{
			id: 3,
			user_id: 'EMP003',
			email: 'bob.johnson@company.com',
			nama: 'Bob Johnson',
			tanggal: '2025-07-05',
			nominal: 2000000,
			status: 'rejected',
			tanggal_pengajuan: '2025-06-30',
			tenor: 3,
			keterangan: 'Renovasi rumah',
			approved_by: 'HR Manager',
			approved_date: '2025-07-01',
			rejection_reason: 'Tidak memenuhi kriteria pengajuan kasbon',
			employee_name: 'Bob Johnson',
			employee_email: 'bob.johnson@company.com',
			advance_date: '2025-07-05',
			amount: 2000000,
			description: 'Renovasi rumah',
			tenor_months: 3,
			submitted_date: '2025-06-30',
			formatted_amount: 'Rp 2.000.000',
			monthly_payment: 666667,
			formatted_monthly_payment: 'Rp 666.667'
		}
	];
}

/**
 * Test koneksi ke Directus untuk collection kasbon
 */
export async function testAdvanceConnection() {
	try {
		const response = await fetch(`${DIRECTUS_URL}/server/info`);
		if (response.ok) {
			console.log('✅ Directus connection successful (Advance)');
			return { success: true, message: 'Connected to Directus' };
		} else {
			throw new Error('Connection failed');
		}
	} catch (error) {
		console.error('❌ Directus connection failed (Advance):', error);
		return { success: false, message: 'Failed to connect to Directus' };
	}
}
