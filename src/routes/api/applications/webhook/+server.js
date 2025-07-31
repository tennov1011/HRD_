// src/routes/api/applications/webhook/+server.js
import { json } from '@sveltejs/kit';
import { notificationService } from '$lib/services/notificationService.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const body = await request.json();
		
		const result = await notificationService.handleWebhook(body);
		return json(result);
	} catch (error) {
		console.error('Error processing webhook:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to process webhook' },
			{ status: 500 }
		);
	}
}
