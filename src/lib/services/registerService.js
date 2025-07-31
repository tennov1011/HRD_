// src/lib/services/registerService.js

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Register Service for employee registration from accepted job applicants
 */
class RegisterService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
	}

	/**
	 * Make authenticated request to Directus
	 * @param {string} endpoint - API endpoint
	 * @param {{headers?: object, method?: string, body?: string}} options - Fetch options
	 */
	async request(endpoint, options = {}) {
		// Skip request if not in browser and no URL/token
		if (!this.baseURL || !this.token) {
			console.error('Directus URL or token not configured');
			throw new Error('Directus configuration missing');
		}

		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.token}`,
				...(options.headers || {})
			},
			...options
		};

		console.log('Making request to:', url);

		try {
			const response = await fetch(url, config);

			console.log('Response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API Error Response:', errorText);
				throw new Error(`API Error: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			console.log('Response data:', data);
			return data;
		} catch (error) {
			console.error('Request error:', error);
			throw error;
		}
	}

	/**
	 * Create new employee registration from job application data
	 * @param {{id: string, fullName: string, email: string, gender: string, phoneNumber: string, profilePhoto: string}} applicantData - Job application data
	 * @param {{title: string, department: string, location: string}} jobData - Job posting data
	 */
	async createEmployeeFromApplicant(applicantData, jobData) {
		console.log('Creating employee from applicant:', { applicantId: applicantData.id, jobTitle: jobData.title });

		// Map job application fields to register fields
		const registerData = {
			nama_lengkap: applicantData.fullName,
			email: applicantData.email,
			kelamin: applicantData.gender,
			no_telp: applicantData.phoneNumber,
			foto_ktp: applicantData.profilePhoto,
			// Additional fields from job posting
			jabatan: jobData.title,
			departemen: jobData.department,
			lokasi_kerja: jobData.location,
			// Default fields for new employee
			status_karyawan: 'aktif',
			tanggal_bergabung: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
			// Source information
			source_recruitment: 'job_application',
			original_application_id: applicantData.id,
			date_created: new Date().toISOString()
		};

		console.log('Register data to be created:', registerData);

		try {
			const response = await this.request('/items/register', {
				method: 'POST',
				body: JSON.stringify(registerData)
			});

			console.log('Employee registration successful:', response);
			return response;
		} catch (error) {
			console.error('Error creating employee registration:', error);
			throw error;
		}
	}

	/**
	 * Check if applicant already exists in register
	 * @param {string} email - Applicant email
	 * @param {string} originalApplicationId - Original application ID
	 */
	async checkExistingEmployee(email, originalApplicationId) {
		try {
			// Check by email or original application ID
			const endpoint = `/items/register?filter[_or][0][email][_eq]=${email}&filter[_or][1][original_application_id][_eq]=${originalApplicationId}`;
			const response = await this.request(endpoint);
			
			return response?.data && response.data.length > 0 ? response.data[0] : null;
		} catch (error) {
			console.error('Error checking existing employee:', error);
			return null;
		}
	}
}

export const registerService = new RegisterService();
