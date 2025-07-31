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
			console.log('Request URL:', url);
			console.log('Request method:', config.method);
			console.log('Request body:', config.body);

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
	 * Get all job postings
	 */
	async getAllJobPostings() {
		return this.request('/items/job_postings?sort=-date_created&fields=*,applications.id&ts=' + Date.now());
	}

	/**
	 * Toggle job posting status between active and inactive
	 * @param {number|string} id - Job posting ID
	 * @param {string} newStatus - New status ('active' or 'inactive')
	 */
	async toggleJobStatus(id, newStatus) {
		console.log('Toggling job status:', id, newStatus);
		
		return this.request(`/items/job_postings/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ status: newStatus })
		});
	}

	/**
	 * Get active job postings (status = 'active' OR null AND deadline > current date)
	 */
	async getActiveJobPostings() {
		const now = new Date().toISOString();
		
		// Filter: (status = 'active' OR status is null) AND deadline > now
		const endpoint = `/items/job_postings?filter[_and][0][_or][0][status][_eq]=active&filter[_and][0][_or][1][status][_null]=true&filter[_and][1][deadline][_gt]=${now}&sort=-date_created&fields=*,applications.id`;
		const result = await this.request(endpoint);
		return result;
	}

	/**
	 * Get inactive job postings (status = 'inactive' OR deadline <= current date)
	 */
	async getInactiveJobPostings() {
		const now = new Date().toISOString();
		
		// Filter: status = 'inactive' OR deadline <= now
		const endpoint = `/items/job_postings?filter[_or][0][status][_eq]=inactive&filter[_or][1][deadline][_lte]=${now}&sort=-date_created&fields=*,applications.id`;
		const result = await this.request(endpoint);
		return result;
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
		console.log('Updating job posting:', id, jobData);
		
		// Sekarang kita bisa menyertakan field status
		return this.request(`/items/job_postings/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(jobData)
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

	/**
	 * Automatically update expired job postings to inactive status
	 * This should be called before retrieving job postings to ensure accurate status
	 */
	async updateExpiredJobsToInactive() {
		try {
			const now = new Date().toISOString();
			
			// Get all jobs that are active but have passed their deadline
			const expiredJobsEndpoint = `/items/job_postings?filter[_and][0][deadline][_lte]=${now}&filter[_and][1][_or][0][status][_eq]=active&filter[_and][1][_or][1][status][_null]=true&fields=id,title,deadline,status`;
			
			const expiredJobsResponse = await this.request(expiredJobsEndpoint);
			const expiredJobs = expiredJobsResponse?.data || [];
			
			if (expiredJobs.length > 0) {
				console.log(`Found ${expiredJobs.length} expired jobs to update:`, expiredJobs.map(/** @param {{id: string, title: string, deadline: string}} job */ job => ({ id: job.id, title: job.title, deadline: job.deadline })));
				
				// Update each expired job to inactive status
				const updatePromises = expiredJobs.map(/** @param {{id: string}} job */ job => 
					this.request(`/items/job_postings/${job.id}`, {
						method: 'PATCH',
						body: JSON.stringify({ status: 'inactive' })
					})
				);
				
				await Promise.all(updatePromises);
				console.log(`Successfully updated ${expiredJobs.length} expired jobs to inactive status`);
			}
			
			return expiredJobs.length;
		} catch (error) {
			console.error('Error updating expired jobs:', error);
			// Don't throw error to prevent breaking the main functionality
			return 0;
		}
	}

}

export const recruitmentService = new RecruitmentService();
