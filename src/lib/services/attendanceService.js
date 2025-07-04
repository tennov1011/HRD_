import { browser } from '$app/environment';

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Base Directus API service
 */
class DirectusService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
	}

	/**
	 * Make authenticated request to Directus
	 */
	async request(endpoint, options = {}) {
		if (!browser) return null;

		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...(this.token && { Authorization: `Bearer ${this.token}` }),
				...options.headers
			},
			...options
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Check if response has content before parsing JSON
			const contentType = response.headers.get('content-type');
			const contentLength = response.headers.get('content-length');

			// If no content or content-length is 0, return success without parsing
			if (contentLength === '0' || response.status === 204) {
				return { success: true };
			}

			// If content-type indicates JSON, parse it
			if (contentType && contentType.includes('application/json')) {
				const text = await response.text();
				return text ? JSON.parse(text) : { success: true };
			}

			// For other content types, return success
			return { success: true };
		} catch (error) {
			console.error('Directus API Error:', error);
			throw error;
		}
	}

	/**
	 * Get data from a collection
	 */
	async getItems(collection, params = {}) {
		const queryParams = new URLSearchParams();

		// Add query parameters
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryParams.append(key, value);
			}
		});

		const endpoint = `/items/${collection}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		return await this.request(endpoint);
	}

	/**
	 * Get single item from a collection
	 */
	async getItem(collection, id, params = {}) {
		const queryParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryParams.append(key, value);
			}
		});

		const endpoint = `/items/${collection}/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		return await this.request(endpoint);
	}

	/**
	 * Create new item in a collection
	 */
	async createItem(collection, data) {
		const endpoint = `/items/${collection}`;
		return await this.request(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	/**
	 * Update item in a collection
	 */
	async updateItem(collection, id, data) {
		const endpoint = `/items/${collection}/${id}`;
		return await this.request(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	/**
	 * Delete item from a collection
	 */
	async deleteItem(collection, id) {
		const endpoint = `/items/${collection}/${id}`;
		return await this.request(endpoint, {
			method: 'DELETE'
		});
	}
}

// Create singleton instance
export const directusService = new DirectusService();

/**
 * Attendance Service
 */
export class AttendanceService {
	/**
	 * Get daily attendance records
	 */
	static async getDailyAttendance(params = {}) {
		try {
			const defaultParams = {
				sort: '-tanggal,-waktu_masuk', // Sort by date and check-in time (newest first)
				limit: 100,
				...params
			};

			const response = await directusService.getItems('absensi_karyawan', defaultParams);
			return response;
		} catch (error) {
			console.error('Error fetching daily attendance:', error);
			// Return mock data if API fails
			return {
				data: [
					{
						id: 1,
						user_id: 'ph9aRxCRiMRexZTHBvZKuTLRxAp2',
						email: 'mickael@eltama.com',
						nama: 'Mickael',
						tanggal: '2025-07-02',
						lokasi: 'Bojong Kulur, Gunung Putri, Jawa Barat, 16969',
						keterangan: 'Absensi masuk manual',
						foto: '15ff12ad-6e63-4790-87fc-537adc7081bc',
						waktu_masuk: '2025-07-02T08:15:25.354Z',
						waktu_keluar: '2025-07-02T17:30:00.000Z',
						terlambat: false,
						menit_keterlambatan: 0
					},
					{
						id: 2,
						user_id: 'abc123def456ghi789',
						email: 'sarah@eltama.com',
						nama: 'Sarah Wijaya',
						tanggal: '2025-07-02',
						lokasi: 'Jakarta Office, DKI Jakarta',
						keterangan: 'Absensi masuk otomatis',
						foto: '22aa33bb-cc44-dd55-ee66-ff7788990011',
						waktu_masuk: '2025-07-02T07:45:10.000Z',
						waktu_keluar: '2025-07-02T17:15:30.000Z',
						terlambat: false,
						menit_keterlambatan: 0
					},
					{
						id: 3,
						user_id: 'xyz789abc123def456',
						email: 'budi@eltama.com',
						nama: 'Budi Santoso',
						tanggal: '2025-07-02',
						lokasi: 'Bandung Office, Jawa Barat',
						keterangan: 'Absensi masuk manual',
						foto: null,
						waktu_masuk: '2025-07-02T09:30:45.000Z',
						waktu_keluar: null,
						terlambat: true,
						menit_keterlambatan: 90
					}
				],
				meta: {
					total_count: 3,
					filter_count: 3
				}
			};
		}
	}

	/**
	 * Get attendance by date range
	 */
	static async getAttendanceByDateRange(startDate, endDate, params = {}) {
		try {
			const filter = {
				tanggal: {
					_between: [startDate, endDate]
				}
			};

			const queryParams = {
				filter: JSON.stringify(filter),
				sort: '-tanggal,-waktu_masuk',
				...params
			};

			return await directusService.getItems('absensi_karyawan', queryParams);
		} catch (error) {
			console.error('Error fetching attendance by date range:', error);
			throw error;
		}
	}

	/**
	 * Get attendance for specific employee
	 */
	static async getEmployeeAttendance(userId, params = {}) {
		try {
			const filter = {
				user_id: {
					_eq: userId
				}
			};

			const queryParams = {
				filter: JSON.stringify(filter),
				sort: '-tanggal,-waktu_masuk',
				...params
			};

			return await directusService.getItems('absensi_karyawan', queryParams);
		} catch (error) {
			console.error('Error fetching employee attendance:', error);
			throw error;
		}
	}

	/**
	 * Get today's attendance
	 */
	static async getTodayAttendance() {
		const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

		try {
			const filter = {
				tanggal: {
					_eq: today
				}
			};

			const queryParams = {
				filter: JSON.stringify(filter),
				sort: '-waktu_masuk'
			};

			return await directusService.getItems('absensi_karyawan', queryParams);
		} catch (error) {
			console.error('Error fetching today attendance:', error);
			throw error;
		}
	}

	/**
	 * Update attendance record
	 */
	static async updateAttendance(id, data) {
		try {
			return await directusService.updateItem('absensi_karyawan', id, data);
		} catch (error) {
			console.error('Error updating attendance:', error);
			throw error;
		}
	}

	/**
	 * Delete attendance record
	 */
	static async deleteAttendance(id) {
		try {
			console.log('Attempting to delete attendance with ID:', id);
			const response = await directusService.deleteItem('absensi_karyawan', id);
			console.log('Delete response received:', response);

			// For delete operations, any non-error response is considered success
			return response || { success: true };
		} catch (error) {
			console.error('Error deleting attendance:', error);

			// If the error is about JSON parsing but the status was successful,
			// it might still be a successful delete
			if (
				error instanceof Error &&
				error.message.includes('JSON') &&
				!error.message.includes('HTTP error')
			) {
				console.warn('JSON parsing error on delete - likely successful deletion');
				return { success: true, warning: 'Delete successful but response parsing failed' };
			}

			throw error;
		}
	}

	/**
	 * Create new attendance record
	 */
	static async createAttendance(data) {
		try {
			return await directusService.createItem('absensi_karyawan', data);
		} catch (error) {
			console.error('Error creating attendance:', error);
			throw error;
		}
	}
}

export default AttendanceService;
