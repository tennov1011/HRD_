import { browser } from '$app/environment';
import Holidays from 'date-holidays';

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Holiday service for managing holidays data
 */
export class HolidayService {
	/**
	 * Make authenticated request to Directus
	 * @param {string} endpoint API endpoint
	 * @param {object} options Request options
	 * @returns {Promise<any>} Response data
	 */
	static async request(endpoint, options = {}) {
		if (!browser) return null;

		const url = `${DIRECTUS_URL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...(DIRECTUS_TOKEN && { Authorization: `Bearer ${DIRECTUS_TOKEN}` }),
				...(options.headers || {})
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
				return text ? JSON.parse(text) : null;
			}

			return { success: true };
		} catch (error) {
			console.error('Holiday API Error:', error);
			throw error;
		}
	}

	/**
	 * Build query string from parameters
	 * @param {object} params Query parameters
	 * @returns {string} Query string
	 */
	static buildQueryString(params) {
		const queryParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (typeof value === 'object') {
					queryParams.append(key, JSON.stringify(value));
				} else {
					queryParams.append(key, value.toString());
				}
			}
		});

		return queryParams.toString();
	}

	/**
	 * Get all holidays
	 * @param {Object} params - Query parameters
	 * @returns {Promise<Object>} API response
	 */
	static async getHolidays(params = {}) {
		const defaultParams = {
			sort: 'date',
			filter: JSON.stringify({
				is_active: { _eq: true }
			})
		};

		const queryParams = { ...defaultParams, ...params };
		const queryString = this.buildQueryString(queryParams);

		return await this.request(`/items/holidays?${queryString}`);
	}

	/**
	 * Get holidays by year
	 * @param {number} year - Year to filter
	 * @returns {Promise<Object>} API response
	 */
	static async getHolidaysByYear(year) {
		const filter = JSON.stringify({
			is_active: { _eq: true },
			year: { _eq: year }
		});

		return await this.getHolidays({ filter });
	}

	/**
	 * Get holidays by date range
	 * @param {string} startDate - Start date (YYYY-MM-DD)
	 * @param {string} endDate - End date (YYYY-MM-DD)
	 * @returns {Promise<Object>} API response
	 */
	static async getHolidaysByDateRange(startDate, endDate) {
		const filter = JSON.stringify({
			is_active: { _eq: true },
			date: {
				_gte: startDate,
				_lte: endDate
			}
		});

		return await this.getHolidays({ filter });
	}

	/**
	 * Get holiday by specific date
	 * @param {string} date - Date in YYYY-MM-DD format
	 * @returns {Promise<Object>} API response
	 */
	static async getHolidayByDate(date) {
		const filter = JSON.stringify({
			is_active: { _eq: true },
			date: { _eq: date }
		});

		return await this.getHolidays({ filter, limit: 1 });
	}

	/**
	 * Create new holiday
	 * @param {Object} holidayData - Holiday data
	 * @returns {Promise<Object>} API response
	 */
	static async createHoliday(holidayData) {
		// Extract year from date
		const year = new Date(holidayData.date).getFullYear();

		const data = {
			...holidayData,
			year,
			is_active: true
		};

		return await this.request('/items/holidays', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	/**
	 * Update existing holiday
	 * @param {number} id - Holiday ID
	 * @param {Object} holidayData - Updated holiday data
	 * @returns {Promise<Object>} API response
	 */
	static async updateHoliday(id, holidayData) {
		// Extract year from date if date is being updated
		const data = { ...holidayData };
		if (holidayData.date) {
			data.year = new Date(holidayData.date).getFullYear();
		}

		return await this.request(`/items/holidays/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	/**
	 * Delete holiday (soft delete by setting is_active to false)
	 * @param {number} id - Holiday ID
	 * @returns {Promise<Object>} API response
	 */
	static async deleteHoliday(id) {
		return await this.request(`/items/holidays/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ is_active: false })
		});
	}

	/**
	 * Hard delete holiday
	 * @param {number} id - Holiday ID
	 * @returns {Promise<Object>} API response
	 */
	static async hardDeleteHoliday(id) {
		return await this.request(`/items/holidays/${id}`, {
			method: 'DELETE'
		});
	}

	/**
	 * Check if a date is a holiday
	 * @param {string} date - Date in YYYY-MM-DD format
	 * @returns {Promise<boolean>} True if date is a holiday
	 */
	static async isHoliday(date) {
		try {
			const response = await this.getHolidayByDate(date);
			return response && response.data && response.data.length > 0;
		} catch (error) {
			console.error('Error checking holiday:', error);
			return false;
		}
	}

	/**
	 * Get holiday types for dropdown
	 * @returns {Array} Array of holiday types
	 */
	static getHolidayTypes() {
		return [
			{
				value: 'public',
				label: 'Hari Libur Nasional',
				color: 'holiday-public'
			},
			{
				value: 'company',
				label: 'Libur Perusahaan',
				color: 'holiday-company'
			},
			{
				value: 'special',
				label: 'Libur Khusus',
				color: 'holiday-special'
			}
		];
	}

	/**
	 * Get holiday type label
	 * @param {string} type - Holiday type
	 * @returns {string} Holiday type label
	 */
	static getHolidayTypeLabel(type) {
		const types = this.getHolidayTypes();
		const found = types.find((t) => t.value === type);
		return found ? found.label : 'Libur';
	}

	/**
	 * Get holiday type color
	 * @param {string} type - Holiday type
	 * @returns {string} Holiday type color class
	 */
	static getHolidayTypeColor(type) {
		const types = this.getHolidayTypes();
		const found = types.find((t) => t.value === type);
		return found ? found.color : 'holiday-default';
	}

	/**
	 * Get Indonesian national holidays for a specific year
	 * @param {number} year - Year to get holidays for
	 * @returns {Array} Array of Indonesian national holidays
	 */
	static getIndonesianHolidays(year) {
		try {
			const hd = new Holidays('ID');
			const holidays = hd.getHolidays(year);
			
			// Map to store unique holidays by date
			const uniqueHolidays = new Map();
			
			holidays.forEach(holiday => {
				let dateStr = '';
				
				// Handle different date formats
				if (holiday.date instanceof Date) {
					// Use local timezone to avoid date shifting
					const year = holiday.date.getFullYear();
					const month = String(holiday.date.getMonth() + 1).padStart(2, '0');
					const day = String(holiday.date.getDate()).padStart(2, '0');
					dateStr = `${year}-${month}-${day}`;
				} else if (typeof holiday.date === 'string') {
					// If it's a string, try to parse and format it using local timezone
					const parsedDate = new Date(holiday.date);
					if (!isNaN(parsedDate.getTime())) {
						const year = parsedDate.getFullYear();
						const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
						const day = String(parsedDate.getDate()).padStart(2, '0');
						dateStr = `${year}-${month}-${day}`;
					} else {
						dateStr = holiday.date.split(' ')[0]; // Take just the date part
					}
				} else {
					// Fallback to string conversion
					dateStr = String(holiday.date).split(' ')[0];
				}
				
				// Skip if date is invalid
				if (!dateStr || dateStr === 'Invalid Date' || dateStr === 'undefined') {
					return;
				}
				
				// Create holiday object
				const holidayObj = {
					name: holiday.name,
					date: dateStr,
					description: holiday.type || 'Hari Libur Nasional',
					type: 'public',
					year: year,
					source: 'national'
				};
				
				// Only add if not already exists for this date, or if this one has a more specific name
				if (!uniqueHolidays.has(dateStr)) {
					uniqueHolidays.set(dateStr, holidayObj);
				} else {
					// Keep the one with longer/more specific name
					const existing = uniqueHolidays.get(dateStr);
					if (holiday.name.length > existing.name.length) {
						uniqueHolidays.set(dateStr, holidayObj);
					}
				}
			});
			
			// Convert Map to Array and sort by date
			return Array.from(uniqueHolidays.values()).sort((a, b) => 
				new Date(a.date).getTime() - new Date(b.date).getTime()
			);
		} catch (error) {
			console.error('Error getting Indonesian holidays:', error);
			return [];
		}
	}

	/**
	 * Import Indonesian national holidays to database
	 * @param {number} year - Year to import holidays for
	 * @returns {Promise<Object>} Import result
	 */
	static async importIndonesianHolidays(year) {
		try {
			const nationalHolidays = this.getIndonesianHolidays(year);
			const results = [];
			let imported = 0;
			let skipped = 0;

			for (const holiday of nationalHolidays) {
				// Check if holiday already exists
				const existing = await this.getHolidayByDate(holiday.date);
				
				if (!existing || !existing.data || existing.data.length === 0) {
					try {
						await this.createHoliday(holiday);
						results.push({ holiday: holiday.name, status: 'imported' });
						imported++;
					} catch (error) {
						console.error(`Error importing holiday ${holiday.name}:`, error);
						results.push({ holiday: holiday.name, status: 'error', error: error.message });
					}
				} else {
					results.push({ holiday: holiday.name, status: 'skipped' });
					skipped++;
				}
			}

			return {
				success: true,
				total: nationalHolidays.length,
				imported,
				skipped,
				results
			};
		} catch (error) {
			console.error('Error importing Indonesian holidays:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}
}
