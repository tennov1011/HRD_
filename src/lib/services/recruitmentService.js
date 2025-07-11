// src/lib/services/recruitmentService.js

import { browser } from '$app/environment';

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Recruitment Service for job postings
 */
class RecruitmentService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
	}

	/**
	 * Make authenticated request to Directus
	 */
	/**
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
		console.log('Request config:', config);

		try {
			const response = await fetch(url, config);
			
			console.log('Response status:', response.status);
			console.log('Response headers:', response.headers);

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
	 * Get all job postings
	 */
	async getAllJobPostings() {
		return this.request('/items/job_postings?sort=-date_created&fields=*,applications.id');
	}

	/**
	 * Get active job postings (deadline > current date)
	 */
	async getActiveJobPostings() {
		const now = new Date().toISOString();
		return this.request(`/items/job_postings?filter[deadline][_gt]=${now}&sort=-date_created&fields=*,applications.id`);
	}

	/**
	 * Get inactive job postings (deadline <= current date)
	 */
	async getInactiveJobPostings() {
		const now = new Date().toISOString();
		return this.request(`/items/job_postings?filter[deadline][_lte]=${now}&sort=-date_created&fields=*,applications.id`);
	}

	/**
	 * Get job posting by ID
	 * @param {number|string} id - Job posting ID
	 */
	async getJobPostingById(id) {
		return this.request(`/items/job_postings/${id}?fields=*,applications.id`);
	}

	/**
	 * Create a new job posting
	 * @param {object} jobData - Job posting data
	 */
	async createJobPosting(jobData) {
		console.log('Creating job posting with data:', jobData);
		
		// Pastikan struktur data sesuai dengan Directus
		return this.request('/items/job_postings', {
			method: 'POST',
			body: JSON.stringify(jobData) // Hapus wrapper { data: jobData }
		});
	}

	/**
	 * Update a job posting
	 * @param {number|string} id - Job posting ID
	 * @param {object} jobData - Job posting data to update
	 */
	async updateJobPosting(id, jobData) {
		return this.request(`/items/job_postings/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ data: jobData })
		});
	}

	/**
	 * Delete a job posting
	 * @param {number|string} id - Job posting ID
	 */
	async deleteJobPosting(id) {
		return this.request(`/items/job_postings/${id}`, {
			method: 'DELETE'
		});
	}
}

export const recruitmentService = new RecruitmentService();
