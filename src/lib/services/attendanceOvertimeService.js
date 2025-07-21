// Service untuk mengelola data absensi lembur dari Directus
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * @typedef {Object} AttendanceFilters
 * @property {string} [nama] - Nama karyawan
 * @property {string} [tanggal] - Tanggal absensi
 * @property {string} [date_from] - Tanggal mulai
 * @property {string} [date_to] - Tanggal akhir
 * @property {string|number} [lembur_id] - ID pengajuan lembur
 */

/**
 * @typedef {Object} AttendanceData
 * @property {number} id - ID absensi
 * @property {string} nama - Nama karyawan
 * @property {string} tanggal - Tanggal absensi
 * @property {string|null} waktu_masuk - Waktu masuk
 * @property {string|null} foto_masuk - Foto masuk
 * @property {string|null} lokasi_masuk_address - Alamat lokasi masuk
 * @property {string|null} waktu_keluar - Waktu keluar
 * @property {string|null} foto_keluar - Foto keluar
 * @property {string|null} lokasi_keluar_address - Alamat lokasi keluar
 * @property {number} durasi_aktual_jam - Durasi jam aktual
 * @property {number} durasi_aktual_menit - Durasi menit aktual
 * @property {string} status_absensi - Status absensi
 * @property {number|string} lembur_id - ID pengajuan lembur
 */

/**
 * @typedef {Object} OvertimeRequest
 * @property {number} [durasi_jam] - Durasi jam yang diajukan
 * @property {number} [duration_hours] - Durasi jam yang diajukan (alternative)
 * @property {number} [durasi_menit] - Durasi menit yang diajukan
 * @property {number} [duration_minutes] - Durasi menit yang diajukan (alternative)
 */

/**
 * @typedef {Object} ProcessedAttendanceData
 * @property {number} actual_duration_hours - Durasi jam aktual
 * @property {number} actual_duration_minutes - Durasi menit aktual
 * @property {string} attendance_status - Status absensi
 */

/**
 * Base function untuk API calls ke Directus
 * @param {string} endpoint
 * @param {RequestInit & {headers?: Record<string, string>}} options
 */
async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/${endpoint}`;

	/** @type {Record<string, string>} */
	const baseHeaders = {
		'Content-Type': 'application/json'
	};

	const headers = {
		...baseHeaders,
		...(options.headers || {})
	};

	if (DIRECTUS_TOKEN) {
		headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
	}

	const response = await fetch(url, {
		...options,
		headers
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`API Error: ${response.status} - ${errorText}`);
	}

	return await response.json();
}

/**
 * Mengambil data absensi lembur dari collection absensi_lembur
 * @param {AttendanceFilters} filters - Filter untuk query
 */
export async function getOvertimeAttendance(filters = {}) {
	try {
		let query = 'items/absensi_lembur?fields=*';

		// Tambah filter jika ada
		if (filters.nama) {
			query += `&filter[nama][_contains]=${filters.nama}`;
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
		if (filters.lembur_id) {
			query += `&filter[lembur_id][_eq]=${filters.lembur_id}`;
		}

		// Sort by tanggal descending
		query += '&sort=-tanggal';

		const response = await directusApi(query);

		// Transform data untuk konsistensi dengan UI
		const transformedData =
			response.data?.map((/** @type {AttendanceData} */ item) => ({
				...item,
				employee_name: item.nama,
				overtime_date: item.tanggal,
				check_in_time: item.waktu_masuk,
				check_in_photo: item.foto_masuk,
				check_in_location: item.lokasi_masuk_address,
				check_out_time: item.waktu_keluar,
				check_out_photo: item.foto_keluar,
				check_out_location: item.lokasi_keluar_address,
				actual_duration_hours: item.durasi_aktual_jam || 0,
				actual_duration_minutes: item.durasi_aktual_menit || 0,
				actual_duration_total: formatDuration(
					item.durasi_aktual_jam || 0,
					item.durasi_aktual_menit || 0
				),
				attendance_status: item.status_absensi,
				overtime_request_id: item.lembur_id
			})) || [];

		return {
			success: true,
			data: transformedData,
			total: transformedData.length
		};
	} catch (error) {
		console.error('Error fetching overtime attendance:', error);

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockOvertimeAttendance(),
			total: getMockOvertimeAttendance().length,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Mengambil data absensi lembur berdasarkan ID pengajuan lembur
 * @param {string} overtimeRequestId - ID pengajuan lembur
 */
export async function getOvertimeAttendanceByRequestId(overtimeRequestId) {
	try {
		const filters = { lembur_id: overtimeRequestId };
		return await getOvertimeAttendance(filters);
	} catch (error) {
		console.error('Error fetching overtime attendance by request ID:', error);
		return {
			success: false,
			data: [],
			total: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Mengambil data absensi lembur berdasarkan nama karyawan dan tanggal
 * @param {string} employeeName - Nama karyawan
 * @param {string} date - Tanggal lembur (YYYY-MM-DD)
 */
export async function getOvertimeAttendanceByEmployeeAndDate(employeeName, date) {
	try {
		const filters = { nama: employeeName, tanggal: date };
		return await getOvertimeAttendance(filters);
	} catch (error) {
		console.error('Error fetching overtime attendance by employee and date:', error);
		return {
			success: false,
			data: [],
			total: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Membandingkan data pengajuan lembur dengan absensi aktual
 * @param {OvertimeRequest} overtimeRequest - Data pengajuan lembur
 * @param {ProcessedAttendanceData} attendanceData - Data absensi lembur
 */
export function compareOvertimeWithAttendance(overtimeRequest, attendanceData) {
	if (!overtimeRequest || !attendanceData) {
		return {
			hasData: false,
			comparison: null
		};
	}

	const requestedHours = overtimeRequest.durasi_jam || overtimeRequest.duration_hours || 0;
	const requestedMinutes = overtimeRequest.durasi_menit || overtimeRequest.duration_minutes || 0;
	const actualHours = attendanceData.actual_duration_hours || 0;
	const actualMinutes = attendanceData.actual_duration_minutes || 0;

	// Convert to total minutes for easy comparison
	const requestedTotalMinutes = requestedHours * 60 + requestedMinutes;
	const actualTotalMinutes = actualHours * 60 + actualMinutes;

	const difference = actualTotalMinutes - requestedTotalMinutes;
	const differenceHours = Math.floor(Math.abs(difference) / 60);
	const differenceMinutes = Math.abs(difference) % 60;

	let status = 'match';
	let statusIcon = '✅';
	let statusText = 'Sesuai';

	if (difference > 30) {
		// Lebih dari 30 menit
		status = 'over';
		statusIcon = '⚠️';
		statusText = 'Lebih Lama';
	} else if (difference < -30) {
		// Kurang dari 30 menit
		status = 'under';
		statusIcon = '⚠️';
		statusText = 'Lebih Pendek';
	}

	return {
		hasData: true,
		comparison: {
			requested: {
				hours: requestedHours,
				minutes: requestedMinutes,
				total: formatDuration(requestedHours, requestedMinutes),
				totalMinutes: requestedTotalMinutes
			},
			actual: {
				hours: actualHours,
				minutes: actualMinutes,
				total: formatDuration(actualHours, actualMinutes),
				totalMinutes: actualTotalMinutes
			},
			difference: {
				minutes: difference,
				hours: differenceHours,
				minutesRemainder: differenceMinutes,
				text:
					difference === 0
						? 'Tepat'
						: difference > 0
							? `+${differenceHours}j ${differenceMinutes}m`
							: `-${differenceHours}j ${differenceMinutes}m`
			},
			status,
			statusIcon,
			statusText,
			isComplete: attendanceData.attendance_status === 'lengkap',
			isIncomplete: attendanceData.attendance_status === 'belum lengkap',
			isAbsent: attendanceData.attendance_status === 'tidak hadir'
		}
	};
}

/**
 * Format durasi jam dan menit
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
 * Test koneksi ke Directus untuk collection absensi_lembur
 */
export async function testOvertimeAttendanceConnection() {
	try {
		const response = await directusApi('items/absensi_lembur?limit=1');
		return {
			success: true,
			message: 'Koneksi ke collection absensi_lembur berhasil',
			data: response
		};
	} catch (error) {
		console.error('Error testing overtime attendance connection:', error);
		return {
			success: false,
			message: 'Gagal koneksi ke collection absensi_lembur',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Mock data untuk fallback
function getMockOvertimeAttendance() {
	return [
		{
			id: 1,
			nama: 'John Doe',
			tanggal: '2025-07-05',
			waktu_masuk: '17:00',
			foto_masuk: 'photo_check_in_1.jpg',
			lokasi_masuk_address: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			waktu_keluar: '20:30',
			foto_keluar: 'photo_check_out_1.jpg',
			lokasi_keluar_address: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			durasi_aktual_jam: 3,
			durasi_aktual_menit: 30,
			status_absensi: 'lengkap',
			lembur_id: 1,
			// Transformed fields
			employee_name: 'John Doe',
			overtime_date: '2025-07-05',
			check_in_time: '17:00',
			check_in_photo: 'photo_check_in_1.jpg',
			check_in_location: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			check_out_time: '20:30',
			check_out_photo: 'photo_check_out_1.jpg',
			check_out_location: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			actual_duration_hours: 3,
			actual_duration_minutes: 30,
			actual_duration_total: '3 jam 30 menit',
			attendance_status: 'lengkap',
			overtime_request_id: 1
		},
		{
			id: 2,
			nama: 'Jane Smith',
			tanggal: '2025-07-04',
			waktu_masuk: '18:00',
			foto_masuk: 'photo_check_in_2.jpg',
			lokasi_masuk_address: 'Gedung Kantor Lt.2, Jl. Sudirman No.123, Jakarta',
			waktu_keluar: '20:15',
			foto_keluar: 'photo_check_out_2.jpg',
			lokasi_keluar_address: 'Gedung Kantor Lt.2, Jl. Sudirman No.123, Jakarta',
			durasi_aktual_jam: 2,
			durasi_aktual_menit: 15,
			status_absensi: 'lengkap',
			lembur_id: 2,
			// Transformed fields
			employee_name: 'Jane Smith',
			overtime_date: '2025-07-04',
			check_in_time: '18:00',
			check_in_photo: 'photo_check_in_2.jpg',
			check_in_location: 'Gedung Kantor Lt.2, Jl. Sudirman No.123, Jakarta',
			check_out_time: '20:15',
			check_out_photo: 'photo_check_out_2.jpg',
			check_out_location: 'Gedung Kantor Lt.2, Jl. Sudirman No.123, Jakarta',
			actual_duration_hours: 2,
			actual_duration_minutes: 15,
			actual_duration_total: '2 jam 15 menit',
			attendance_status: 'lengkap',
			overtime_request_id: 2
		},
		{
			id: 3,
			nama: 'Bob Johnson',
			tanggal: '2025-07-03',
			waktu_masuk: '19:30',
			foto_masuk: 'photo_check_in_3.jpg',
			lokasi_masuk_address: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			waktu_keluar: null,
			foto_keluar: null,
			lokasi_keluar_address: null,
			durasi_aktual_jam: 0,
			durasi_aktual_menit: 0,
			status_absensi: 'belum lengkap',
			lembur_id: 3,
			// Transformed fields
			employee_name: 'Bob Johnson',
			overtime_date: '2025-07-03',
			check_in_time: '19:30',
			check_in_photo: 'photo_check_in_3.jpg',
			check_in_location: 'Gedung Kantor Lt.1, Jl. Sudirman No.123, Jakarta',
			check_out_time: null,
			check_out_photo: null,
			check_out_location: null,
			actual_duration_hours: 0,
			actual_duration_minutes: 0,
			actual_duration_total: '0 jam',
			attendance_status: 'belum lengkap',
			overtime_request_id: 3
		}
	];
}
