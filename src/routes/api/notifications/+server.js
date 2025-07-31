// src/routes/api/notifications/+server.js
import { json } from '@sveltejs/kit';
import { notificationService } from '$lib/services/notificationService.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const action = url.searchParams.get('action');
		
		if (action === 'status') {
			const statusResult = await notificationService.getNotificationStatus();
			return json(statusResult);
		}
		
		// Default GET - fetch notifications
		const result = await notificationService.handleGetNotifications(url.searchParams);
		return json(result);
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return json(
			{ error: 'Failed to fetch notifications' },
			{ status: 500 }
		);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		const action = body.action;

		switch (action) {
			case 'sync': {
				const syncResult = await notificationService.syncNotifications();
				return json(syncResult);
			}
			
			case 'mark_read': {
				const markResult = await notificationService.handleMarkAsRead(body.id);
				return json(markResult);
			}
			
			case 'mark_all_read': {
				const markAllResult = await notificationService.markAllAsRead();
				return json(markAllResult);
			}
			
			case 'webhook': {
				const webhookResult = await notificationService.handleWebhook(body);
				return json(webhookResult);
			}
			
			default:
				return json(
					{ error: 'Invalid action. Supported actions: sync, mark_read, mark_all_read, webhook' },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error('Error processing POST request:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to process request' },
			{ status: 500 }
		);
	}
}
