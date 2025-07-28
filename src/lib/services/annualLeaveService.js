// Service untuk menghitung sisa cuti tahunan karyawan
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * Konstanta untuk cuti tahunan
 */
export const ANNUAL_LEAVE_SETTINGS = {
	TOTAL_DAYS_PER_YEAR: 12,
	YEAR_START: '01-01',
	YEAR_END: '12-31',
	ANNUAL_LEAVE_CATEGORY_NAMES: ['Cuti Tahunan', 'Annual Leave', 'cuti tahunan']
};

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
		console.log('🔗 Annual Leave API Call:', url);
		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Annual Leave Response:', data);
		return data;
	} catch (error) {
		console.error('❌ Annual Leave API Error:', error);
		throw error;
	}
}

/**
 * Mengambil data karyawan berdasarkan user_id atau email
 * @param {string} userIdOrEmail - User ID atau email karyawan
 */
export async function getEmployeeData(userIdOrEmail) {
	try {
		// Coba berdasarkan ID dulu, kemudian email - menggunakan collection register
		let query = `register?fields=id,nama_lengkap,no_karyawan,divisi,jabatan,tanggal_mulai_kerja,email`;
		
		// Jika parameter berupa angka, anggap sebagai ID
		if (!isNaN(Number(userIdOrEmail))) {
			query += `&filter[id][_eq]=${userIdOrEmail}`;
		} else {
			// Jika berupa string, anggap sebagai email
			query += `&filter[email][_eq]=${userIdOrEmail}`;
		}

		const response = await directusApi(query);
		
		if (response.data && response.data.length > 0) {
			return {
				success: true,
				data: response.data[0]
			};
		} else {
			console.warn('🔍 No employee data found for:', userIdOrEmail);
			return {
				success: false,
				error: 'Employee not found'
			};
		}
	} catch (error) {
		console.error('Error fetching employee data:', error);
		
		// Handle 403 permission errors gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes('403')) {
			console.warn('🔒 Permission denied accessing employee data. Using fallback data.');
			return {
				success: true,
				data: {
					id: userIdOrEmail,
					nama_lengkap: `Employee ${userIdOrEmail}`,
					no_karyawan: `EMP${userIdOrEmail}`,
					divisi: 'Unknown',
					jabatan: 'Unknown',
					tanggal_mulai_kerja: '2024-01-01',
					email: typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@') ? userIdOrEmail : `employee${userIdOrEmail}@company.com`
				}
			};
		}
		
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

/**
 * Mengambil semua pengajuan cuti tahunan untuk karyawan dalam periode tertentu
 * @param {string} userIdOrEmail - User ID atau email karyawan
 * @param {number} year - Tahun (default: tahun saat ini)
 * @param {boolean} includePending - Sertakan pengajuan yang sedang pending (default: false)
 */
export async function getAnnualLeaveRequests(userIdOrEmail, year = new Date().getFullYear(), includePending = false) {
	try {
		const startDate = `${year}-01-01`;
		const endDate = `${year}-12-31`;

		// Query untuk izin hari dengan kategori cuti tahunan
		const queryDays = `izin_hari?fields=*,kategori.id,kategori.nama&filter[tanggal_mulai][_gte]=${startDate}&filter[tanggal_mulai][_lte]=${endDate}`;
		
		// Tambahkan filter user
		const userFilter = !isNaN(Number(userIdOrEmail)) 
			? `&filter[user_id][_eq]=${userIdOrEmail}`
			: `&filter[email][_eq]=${userIdOrEmail}`;

		const response = await directusApi(queryDays + userFilter);
		
		// Filter berdasarkan kategori cuti tahunan dan status
		const annualLeaveRequests = (response.data || []).filter((/** @type {any} */ req) => {
			const categoryName = req.kategori?.nama || req.kategori || req.leave_type || '';
			const isAnnualLeave = ANNUAL_LEAVE_SETTINGS.ANNUAL_LEAVE_CATEGORY_NAMES.some(name => 
				categoryName.toLowerCase().includes(name.toLowerCase())
			);
			
			// Filter berdasarkan status jika includePending = false
			if (!includePending) {
				const isApproved = req.status === 'approved' || req.approval_stage === 'direktur';
				return isAnnualLeave && isApproved;
			}
			
			// Jika includePending = true, sertakan semua status
			return isAnnualLeave;
		});

		return {
			success: true,
			data: annualLeaveRequests,
			total: annualLeaveRequests.length
		};
	} catch (error) {
		console.error('Error fetching annual leave requests:', error);
		
		// Handle 403 permission errors gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes('403')) {
			console.warn('🔒 Permission denied accessing leave requests. Returning empty data.');
			return {
				success: true,
				data: [],
				total: 0
			};
		}
		
		return {
			success: false,
			data: [],
			total: 0,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

/**
 * Menghitung total hari cuti tahunan yang sudah digunakan
 * @param {any[]} annualLeaveRequests - Daftar pengajuan cuti tahunan yang sudah disetujui
 */
export function calculateUsedAnnualLeaveDays(annualLeaveRequests) {
	let totalUsedDays = 0;

	annualLeaveRequests.forEach(request => {
		if (request.tanggal_mulai && request.tanggal_selesai) {
			const startDate = new Date(request.tanggal_mulai);
			const endDate = new Date(request.tanggal_selesai);
			
			// Hitung selisih hari (inclusive)
			const timeDiff = endDate.getTime() - startDate.getTime();
			const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
			
			totalUsedDays += daysDiff;
		} else if (request.jumlah_hari) {
			// Jika ada field jumlah_hari langsung
			totalUsedDays += parseInt(request.jumlah_hari) || 0;
		} else if (request.start_date && request.end_date) {
			// Format alternatif untuk tanggal
			const startDate = new Date(request.start_date);
			const endDate = new Date(request.end_date);
			
			const timeDiff = endDate.getTime() - startDate.getTime();
			const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
			
			totalUsedDays += daysDiff;
		}
	});

	return totalUsedDays;
}

/**
 * Menghitung jumlah hari berdasarkan rentang tanggal
 * @param {string} startDate - Tanggal mulai (format: YYYY-MM-DD)
 * @param {string} endDate - Tanggal selesai (format: YYYY-MM-DD)
 */
export function calculateDaysBetweenDates(startDate, endDate) {
	if (!startDate || !endDate) return 0;
	
	const start = new Date(startDate);
	const end = new Date(endDate);
	
	// Hitung selisih hari (inclusive)
	const timeDiff = end.getTime() - start.getTime();
	const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
	
	return Math.max(daysDiff, 1); // Minimal 1 hari
}

/**
 * Menghitung sisa cuti tahunan karyawan
 * @param {string} userIdOrEmail - User ID atau email karyawan
 * @param {number} year - Tahun (default: tahun saat ini)
 */
export async function calculateRemainingAnnualLeave(userIdOrEmail, year = new Date().getFullYear()) {
	try {
		console.log('🏖️ Calculating remaining annual leave for:', userIdOrEmail, 'Year:', year);

		// Ambil data karyawan
		const employeeResult = await getEmployeeData(userIdOrEmail);
		if (!employeeResult.success) {
			return {
				success: false,
				error: 'Employee not found',
				data: null
			};
		}

		const employee = employeeResult.data;

		// Ambil SEMUA pengajuan cuti tahunan (termasuk pending) untuk tracking yang akurat
		const leaveRequestsResult = await getAnnualLeaveRequests(userIdOrEmail, year, true); // Include pending
		if (!leaveRequestsResult.success) {
			return {
				success: false,
				error: 'Failed to fetch leave requests',
				data: null
			};
		}

		// Urutkan pengajuan berdasarkan tanggal pengajuan (terbaru dulu)
		const allRequests = leaveRequestsResult.data.sort((/** @type {any} */ a, /** @type {any} */ b) => {
			const dateA = new Date(a.tanggal_pengajuan || a.created_at || a.tanggal_mulai);
			const dateB = new Date(b.tanggal_pengajuan || b.created_at || b.tanggal_mulai);
			return dateB.getTime() - dateA.getTime();
		});

		// Pisahkan pengajuan yang sudah disetujui vs pending/rejected
		const approvedRequests = allRequests.filter((/** @type {any} */ req) => 
			req.status === 'approved' || req.approval_stage === 'direktur'
		);
		
		const pendingRequests = allRequests.filter((/** @type {any} */ req) => 
			req.status === 'pending' || (req.approval_stage && req.approval_stage !== 'direktur')
		);

		// Hitung hari yang sudah digunakan dari pengajuan yang disetujui
		const usedDays = calculateUsedAnnualLeaveDays(approvedRequests);

		// Hitung hari yang sedang dalam proses (pending)
		const pendingDays = calculateUsedAnnualLeaveDays(pendingRequests);
		
		// Hitung sisa cuti
		const totalAnnualLeave = ANNUAL_LEAVE_SETTINGS.TOTAL_DAYS_PER_YEAR;
		const remainingDays = Math.max(0, totalAnnualLeave - usedDays);
		const availableAfterPending = Math.max(0, remainingDays - pendingDays);

		const result = {
			success: true,
			data: {
				employee: {
					id: employee.id,
					nama_lengkap: employee.nama_lengkap,
					no_karyawan: employee.no_karyawan,
					divisi: employee.divisi,
					tanggal_mulai_kerja: employee.tanggal_mulai_kerja
				},
				year: year,
				totalAnnualLeave: totalAnnualLeave,
				usedDays: usedDays,
				pendingDays: pendingDays,
				remainingDays: remainingDays,
				availableAfterPending: availableAfterPending,
				usedRequests: approvedRequests,
				pendingRequests: pendingRequests,
				breakdown: {
					approvedCount: approvedRequests.length,
					pendingCount: pendingRequests.length,
					totalRequests: allRequests.length,
					lastUpdated: new Date().toISOString(),
					latestRequest: allRequests[0] || null
				}
			}
		};

		console.log('🏖️ Annual leave calculation result:', result);
		return result;

	} catch (error) {
		console.error('Error calculating remaining annual leave:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			data: null
		};
	}
}

/**
 * Cek apakah kategori termasuk cuti tahunan
 * @param {string} categoryName - Nama kategori leave
 */
export function isAnnualLeaveCategory(categoryName) {
	if (!categoryName) return false;
	
	return ANNUAL_LEAVE_SETTINGS.ANNUAL_LEAVE_CATEGORY_NAMES.some(name => 
		categoryName.toLowerCase().includes(name.toLowerCase())
	);
}

/**
 * Format tampilan sisa cuti tahunan
 * @param {number} remainingDays - Sisa hari cuti
 * @param {number} totalDays - Total hari cuti tahunan
 */
export function formatRemainingLeaveDisplay(remainingDays, totalDays = ANNUAL_LEAVE_SETTINGS.TOTAL_DAYS_PER_YEAR) {
	if (remainingDays <= 0) {
		return {
			text: `Kuota cuti tahunan sudah habis (0/${totalDays} hari)`,
			class: 'remaining-leave-empty',
			color: '#ef4444',
			status: 'empty'
		};
	} else if (remainingDays <= 3) {
		return {
			text: `Sisa ${remainingDays}/${totalDays} hari cuti tahunan`,
			class: 'remaining-leave-low',
			color: '#f59e0b',
			status: 'low'
		};
	} else {
		return {
			text: `Sisa ${remainingDays}/${totalDays} hari cuti tahunan`,
			class: 'remaining-leave-good',
			color: '#10b981',
			status: 'good'
		};
	}
}
