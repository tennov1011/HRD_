// src/lib/services/notificationService.js

// Get Directus configuration from environment
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

/**
 * Notification Service for managing application notifications
 */
class NotificationService {
	constructor() {
		this.baseURL = DIRECTUS_URL;
		this.token = DIRECTUS_TOKEN;
	}

	/**
	 * Make authenticated request to Directus
	 * @param {string} endpoint - API endpoint
	 * @param {{headers?: Record<string, string>, method?: string, body?: string}} options - Fetch options
	 */
	async request(endpoint, options = {}) {
		if (!this.baseURL || !this.token) {
			console.error('Directus URL or token not configured');
			throw new Error('Directus configuration missing');
		}

		const url = `${this.baseURL}${endpoint}`;
		/** @type {RequestInit} */
		const config = {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.token}`,
				...(options.headers || {})
			},
			...options
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API Error Response:', errorText);
				throw new Error(`API Error: ${response.status} - ${errorText}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Request error:', error);
			throw error;
		}
	}

	/**
	 * Create notification for new job application
	 * @param {string} applicantId - ID of the applicant
	 * @param {string} jobId - ID of the job posting
	 * @param {string} applicantName - Name of the applicant
	 * @param {string} jobTitle - Title of the job
	 */
	async createNewApplicationNotification(applicantId, jobId, applicantName, jobTitle) {
		const notificationData = {
			type: 'new_application',
			message: `Pelamar baru: ${applicantName} melamar untuk posisi ${jobTitle}`,
			job_id: jobId,
			applicant_id: applicantId,
			redirect_url: `/recruitment/applications?jobId=${jobId}`,
			is_read: false,
			created_at: new Date().toISOString()
		};

		console.log('Creating notification:', notificationData);

		try {
			const response = await this.request('/items/hrd_notifications', {
				method: 'POST',
				body: JSON.stringify(notificationData)
			});

			console.log('Notification created successfully:', response);
			return response;
		} catch (error) {
			console.error('Error creating notification:', error);
			// Don't throw error to prevent breaking the main application flow
			return null;
		}
	}

	/**
	 * Get unread notifications
	 * @param {number} limit - Maximum number of notifications to fetch
	 */
	async getUnreadNotifications(limit = 20) {
		try {
			const endpoint = `/items/hrd_notifications?filter[is_read][_eq]=false&limit=${limit}&sort=-created_at`;
			const response = await this.request(endpoint);
			
			return response?.data || [];
		} catch (error) {
			console.error('Error fetching unread notifications:', error);
			return [];
		}
	}

	/**
	 * Mark notification as read
	 * @param {string} notificationId - ID of the notification
	 */
	async markAsRead(notificationId) {
		try {
			const response = await this.request(`/items/hrd_notifications/${notificationId}`, {
				method: 'PATCH',
				body: JSON.stringify({ is_read: true })
			});

			console.log('Notification marked as read:', notificationId);
			return response;
		} catch (error) {
			console.error('Error marking notification as read:', error);
			throw error;
		}
	}

	/**
	 * Get notification count (unread)
	 */
	async getUnreadCount() {
		try {
			const endpoint = '/items/hrd_notifications?filter[is_read][_eq]=false&meta=total_count&limit=0';
			const response = await this.request(endpoint);
			
			return response?.meta?.total_count || 0;
		} catch (error) {
			console.error('Error fetching notification count:', error);
			return 0;
		}
	}

	/**
	 * Check for new applications without notifications
	 * Returns count of applications that need notifications
	 */
	async getNewApplicationsCount() {
		try {
			// Get recent applications (last 7 days)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const dateFilter = sevenDaysAgo.toISOString();

			const appsResponse = await this.request(
				`/items/job_applications?filter[date_created][_gte]=${dateFilter}&fields=id&meta=total_count&limit=0`
			);
			const totalApps = appsResponse?.meta?.total_count || 0;

			// Get count of notifications for these recent applications
			const notifsResponse = await this.request(
				`/items/hrd_notifications?filter[created_at][_gte]=${dateFilter}&fields=id&meta=total_count&limit=0`
			);
			const totalNotifs = notifsResponse?.meta?.total_count || 0;

			// Return difference (applications without notifications)
			return Math.max(0, totalApps - totalNotifs);
		} catch (error) {
			console.error('Error checking new applications:', error);
			return 0;
		}
	}

	/**
	 * Get combined notification status
	 * Returns both unread notifications and new applications count
	 */
	async getNotificationStatus() {
		try {
			const [unreadCount, newAppsCount] = await Promise.all([
				this.getUnreadCount(),
				this.getNewApplicationsCount()
			]);

			return {
				unreadCount,
				newAppsCount,
				hasNotifications: unreadCount > 0 || newAppsCount > 0,
				totalPending: unreadCount + newAppsCount
			};
		} catch (error) {
			console.error('Error getting notification status:', error);
			return {
				unreadCount: 0,
				newAppsCount: 0,
				hasNotifications: false,
				totalPending: 0
			};
		}
	}

	/**
	 * Mark all notifications as read
	 */
	async markAllAsRead() {
		try {
			// Get all unread notifications
			const unreadResponse = await this.request('/items/hrd_notifications?filter[is_read][_eq]=false&fields=id');
			const unreadNotifications = unreadResponse?.data || [];

			if (unreadNotifications.length === 0) {
				console.log('No unread notifications to mark as read');
				return { success: true, marked: 0 };
			}

			// Mark all as read in batch
			const updatePromises = unreadNotifications.map((/** @type {{id: string}} */ notification) =>
				this.request(`/items/hrd_notifications/${notification.id}`, {
					method: 'PATCH',
					body: JSON.stringify({ is_read: true })
				})
			);

			await Promise.all(updatePromises);

			console.log(`Marked ${unreadNotifications.length} notifications as read`);
			return { success: true, marked: unreadNotifications.length };
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
			throw error;
		}
	}

	/**
	 * Sync notifications for applications that don't have notifications yet
	 * This replaces the /api/notifications/sync endpoint
	 */
	async syncNotifications() {
		try {
			console.log('🔄 Starting notification sync...');

			// 1. Get all job applications
			const appsResponse = await this.request('/items/job_applications?sort=-date_created&limit=50');
			const applications = appsResponse?.data || [];

			console.log(`Found ${applications.length} applications to check`);

			let createdCount = 0;
			let errorCount = 0;

			// 2. Process each application
			for (const app of applications) {
				try {
					// Check if notification already exists
					const notifResponse = await this.request(`/items/hrd_notifications?filter[applicant_id][_eq]=${app.id}`);
					
					// If no notification exists, create one
					if (!notifResponse.data || notifResponse.data.length === 0) {
						console.log(`Creating notification for applicant ${app.id}: ${app.fullName}`);

						// Get job posting info
						let jobTitle = 'Lowongan Pekerjaan';
						if (app.appliedJobId) {
							try {
								const jobResponse = await this.request(`/items/job_postings/${app.appliedJobId}`);
								const jobData = jobResponse?.data;
								jobTitle = jobData?.title || jobData?.position || jobData?.name || 'Lowongan Pekerjaan';
							} catch (jobError) {
								console.warn(`Could not fetch job info for ${app.appliedJobId}:`, jobError instanceof Error ? jobError.message : String(jobError));
							}
						}

						// Create notification
						const notificationData = {
							type: 'new_application',
							message: `Pelamar baru "${app.fullName}" telah mendaftar untuk posisi "${jobTitle}"`,
							job_id: app.appliedJobId ? String(app.appliedJobId) : null,
							applicant_id: String(app.id),
							redirect_url: `/recruitment/applications?jobId=${app.appliedJobId || ''}`,
							is_read: false,
							created_at: app.date_created || new Date().toISOString()
						};

						const createResponse = await this.request('/items/hrd_notifications', {
							method: 'POST',
							body: JSON.stringify(notificationData)
						});

						if (createResponse) {
							createdCount++;
							console.log(`✅ Created notification for ${app.fullName}`);
						} else {
							errorCount++;
							console.error(`❌ Failed to create notification for ${app.fullName}`);
						}
					}
				} catch (error) {
					errorCount++;
					console.error(`❌ Error processing application ${app.id}:`, error);
				}
			}

			console.log(`✅ Sync complete: ${createdCount} created, ${errorCount} errors`);

			return {
				success: true,
				message: `Notification sync complete`,
				stats: {
					totalApplications: applications.length,
					notificationsCreated: createdCount,
					errors: errorCount
				}
			};

		} catch (error) {
			console.error('❌ Sync error:', error);
			return { 
				success: false, 
				error: 'Failed to sync notifications',
				details: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * Handle GET requests for notifications
	 * This replaces the /api/notifications GET endpoint
	 * @param {URLSearchParams} searchParams - URL search parameters
	 */
	async handleGetNotifications(searchParams) {
		try {
			const unreadOnly = searchParams.get('unread') === 'true';
			const countOnly = searchParams.get('count') === 'true';

			if (countOnly) {
				const count = await this.getUnreadCount();
				return { count };
			}

			if (unreadOnly) {
				const notifications = await this.getUnreadNotifications();
				return { data: notifications };
			}

			// Default: get all unread notifications
			const notifications = await this.getUnreadNotifications();
			return { data: notifications };
		} catch (error) {
			console.error('Error fetching notifications:', error);
			throw new Error('Failed to fetch notifications');
		}
	}

	/**
	 * Handle POST request to mark notification as read
	 * This replaces the /api/notifications/[id]/read endpoint
	 * @param {string} notificationId - ID of the notification to mark as read
	 */
	async handleMarkAsRead(notificationId) {
		try {
			if (!notificationId) {
				throw new Error('Notification ID is required');
			}

			await this.markAsRead(notificationId);
			
			return { 
				success: true, 
				message: 'Notification marked as read' 
			};
		} catch (error) {
			console.error('Error marking notification as read:', error);
			throw new Error('Failed to mark notification as read');
		}
	}

	/**
	 * Handle webhook for new applicant notification
	 * This replaces the /api/applications/webhook endpoint
	 * @param {{applicantId: string, jobId: string, applicantName: string, jobTitle: string}} webhookData - Webhook payload
	 */
	async handleWebhook(webhookData) {
		try {
			const { applicantId, jobId, applicantName, jobTitle } = webhookData;

			// Validate required fields
			if (!applicantId || !jobId || !applicantName || !jobTitle) {
				throw new Error('Missing required fields: applicantId, jobId, applicantName, jobTitle');
			}

			// Create notification for new applicant
			await this.createNewApplicationNotification(
				applicantId,
				jobId,
				applicantName,
				jobTitle
			);

			console.log('Webhook processed successfully for new applicant:', {
				applicantId,
				jobId,
				applicantName,
				jobTitle
			});

			return { 
				success: true, 
				message: 'Notification created successfully' 
			};
		} catch (error) {
			console.error('Error processing webhook:', error);
			throw new Error('Failed to process webhook');
		}
	}
}

export const notificationService = new NotificationService();
