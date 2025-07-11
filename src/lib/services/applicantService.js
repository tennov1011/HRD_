// src/lib/services/applicantService.js

import { browser } from '$app/environment';

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

/**
 * Applicant Service for job applications
 */
class ApplicantService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
	}

	async request(endpoint, options = {}) {
		if (!browser) return null;

		const url = `${this.baseURL}${endpoint}`;
		const config = {
			headers: {
				'Content-Type': 'application/json',
				...(this.token && { Authorization: `Bearer ${this.token}` }),
				...(options.headers || {})
			},
			...options
		};

		try {
			const response = await fetch(url, config);
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error('API Error:', error);
			throw error;
		}
	}

	/**
	 * Get all applicants for a specific job posting
	 * @param {number|string} jobId - Job posting ID
	 */
	async getApplicantsByJobId(jobId) {
		console.log('Fetching applicants for job ID:', jobId);
		try {
			const endpoint = `/items/job_applications?filter[appliedJobId][_eq]=${jobId}&sort=-date_created`;
			console.log('API endpoint:', endpoint);
			const result = await this.request(endpoint);
			console.log('Applicants response:', result);
			return result;
		} catch (error) {
			console.error('Error fetching applicants:', error);
			throw error;
		}
	}

	/**
	 * Get an applicant by ID
	 * @param {number|string} id - Applicant ID
	 */
	async getApplicantById(id) {
		console.log('Fetching applicant by ID:', id);
		const result = await this.request(`/items/job_applications/${id}`);
		console.log('Applicant response:', result);
		return result;
	}

	/**
	 * Update an applicant's status
	 * @param {number|string} id - Applicant ID
	 * @param {string} status - New status (pending, reviewed, interview, test, accepted, rejected)
	 */
	async updateApplicantStatus(id, status) {
		console.log('Updating applicant status:', { id, status });
		// Fix: gunakan applicationStatus field
		return this.request(`/items/job_applications/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				applicationStatus: status
			})
		});
	}

	/**
	 * Create a new job application
	 * @param {object} applicationData - Application data
	 */
	async createApplication(applicationData) {
		return this.request('/items/job_applications', {
			method: 'POST',
			body: JSON.stringify(applicationData)
		});
	}

	/**
	 * Upload a document (resume or supporting document)
	 * @param {File} file - File to upload
	 */
	async uploadDocument(file) {
		if (!browser) return null;

		const url = `${this.baseURL}/files`;
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					...(this.token && { Authorization: `Bearer ${this.token}` })
				},
				body: formData
			});

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Upload Error:', error);
			throw error;
		}
	}

	/**
	 * Get supporting documents for an applicant
	 * @param {number|string} applicantId - Applicant ID
	 */
	async getSupportingDocuments(applicantId) {
		return this.request(`/items/application_documents?filter[application_id][_eq]=${applicantId}&fields=*,document_id.*`);
	}
}

export const applicantService = new ApplicantService();
