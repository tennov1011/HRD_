// Service untuk Kasbon Approval System - Single Level (Manager HRD Only)
import { userRole, userEmail, userName } from './firebaseConfig.js';
import { get } from 'svelte/store';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * Base function untuk API calls ke Directus
 */
async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/${endpoint}`;
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${DIRECTUS_TOKEN}`,
		...options.headers
	};

	const response = await fetch(url, {
		...options,
		headers
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API Error: ${response.status} - ${errorData}`);
	}

	return response.json();
}

/**
 * Approval stages configuration - Single level untuk kasbon
 * Kasbon hanya memerlukan approval dari Manager HRD
 */
export const APPROVAL_STAGES = {
	PENDING: 'pending',
	MANAGER_HRD: 'manager_hrd', // Only approval needed: Manager HRD
	APPROVED: 'approved',
	REJECTED: 'rejected'
};

/**
 * Get current user approval permissions
 */
export function getCurrentUserApprovalLevel() {
	const role = get(userRole);
	const email = get(userEmail);

	// 🔧 DEBUG: Log current user detection
	console.log('🔍 DEBUG getCurrentUserApprovalLevel (Kasbon):', {
		role,
		email,
		isManagerHRD: role === 'manager' && email === 'manager.hrd@eltama.com',
		roleType: typeof role,
		emailType: typeof email
	});

	// Manager HRD - Only user who can approve kasbon
	if (role === 'manager' && email === 'manager.hrd@eltama.com') {
		console.log('🔍 DEBUG: Manager HRD detected successfully for kasbon approval!');
		return APPROVAL_STAGES.MANAGER_HRD;
	}

	console.log('🔍 DEBUG: No matching role/email found for kasbon approval level');
	return null;
}

/**
 * Check if current user can approve kasbon at specific stage
 */
export function canApproveAtStage(request, stage) {
	const userLevel = getCurrentUserApprovalLevel();

	// 🔧 DEBUG: Log approval stage check
	console.log('🔍 DEBUG canApproveAtStage (Kasbon):', {
		requestStage: request.approval_stage,
		userLevel,
		stage,
		requestId: request.id,
		canApprove: false // will be updated below
	});

	if (!userLevel) {
		console.log('🔍 DEBUG: No user level detected for kasbon approval');
		return false;
	}

	// Simple logic: Only Manager HRD can approve pending kasbon requests
	let canApprove = false;

	if (
		userLevel === APPROVAL_STAGES.MANAGER_HRD &&
		request.approval_stage === APPROVAL_STAGES.PENDING
	) {
		canApprove = true;
		console.log('🔍 DEBUG: MANAGER HRD CAN APPROVE KASBON! 🎯', {
			userLevel,
			requestStage: request.approval_stage,
			requestId: request.id
		});
	}

	// 🔧 DEBUG: Show why approval failed if it did
	if (!canApprove) {
		console.log('❌ DEBUG: Kasbon Approval DENIED - Reason:', {
			userLevel,
			requestStage: request.approval_stage,
			explanation: `User level "${userLevel}" cannot approve kasbon request at stage "${request.approval_stage}"`
		});
	}

	console.log('🔍 DEBUG canApprove result (Kasbon):', canApprove);
	return canApprove;
}

/**
 * Get current user name based on role and email
 */
function getCurrentUserName() {
	const role = get(userRole);
	const email = get(userEmail);
	const name = get(userName);

	// Use username from store if available
	if (name) {
		return name;
	}

	// Fallback based on role/email
	if (role === 'manager' && email === 'manager.hrd@eltama.com') {
		return 'Manager HRD';
	}

	return email || 'Unknown User';
}

/**
 * Approve kasbon request (Manager HRD only)
 */
export async function approveKasbonAtStage(request, stage, reason = '') {
	const currentUser = getCurrentUserName();
	const currentDate = new Date().toISOString().split('T')[0];

	// 🔧 DEBUG: Log current user performing approval
	console.log('🔍 DEBUG approveKasbonAtStage - Current User Info:', {
		userName: get(userName),
		userEmail: get(userEmail),
		userRole: get(userRole),
		currentUser: currentUser,
		stage: stage,
		requestId: request.id
	});

	let updates = {};

	// Simple approval logic - only Manager HRD can approve
	if (stage === APPROVAL_STAGES.MANAGER_HRD) {
		updates = {
			manager_hrd_approved: true,
			manager_hrd_approved_by: currentUser,
			manager_hrd_approved_date: currentDate,
			approval_stage: APPROVAL_STAGES.APPROVED, // Final approval
			overall_status: 'approved',
			final_approved_by: currentUser,
			final_approved_date: currentDate,
			// Maintain backward compatibility
			status: 'approved',
			approved_by: currentUser,
			approved_date: currentDate
		};
	} else {
		throw new Error('Invalid approval stage for kasbon');
	}

	// Update database - kasbon collection
	try {
		const response = await directusApi(`items/kasbon/${request.id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data,
			nextStage: updates.approval_stage || 'unknown',
			message: `Pengajuan kasbon telah disetujui oleh Manager HRD`
		};
	} catch (error) {
		console.error('Error approving kasbon request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Reject kasbon request (Manager HRD only)
 */
export async function rejectKasbonAtStage(request, stage, reason = '') {
	const currentUser = getCurrentUserName();
	const currentDate = new Date().toISOString().split('T')[0];

	// 🔧 DEBUG: Log current user performing rejection
	console.log('🔍 DEBUG rejectKasbonAtStage - Current User Info:', {
		userName: get(userName),
		userEmail: get(userEmail),
		userRole: get(userRole),
		currentUser: currentUser,
		stage: stage,
		requestId: request.id,
		reason: reason
	});

	let updates = {};

	// Simple rejection logic - only Manager HRD can reject
	if (stage === APPROVAL_STAGES.MANAGER_HRD) {
		updates = {
			manager_hrd_rejection_reason: reason,
			approval_stage: APPROVAL_STAGES.REJECTED,
			overall_status: 'rejected',
			final_rejection_reason: reason,
			// Maintain backward compatibility
			status: 'rejected',
			approved_by: currentUser,
			approved_date: currentDate,
			rejection_reason: reason
		};
	} else {
		throw new Error('Invalid approval stage for kasbon');
	}

	// Update database - kasbon collection
	try {
		const response = await directusApi(`items/kasbon/${request.id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data,
			message: `Pengajuan kasbon telah ditolak oleh Manager HRD`
		};
	} catch (error) {
		console.error('Error rejecting kasbon request:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Get approval status summary
 */
export function getApprovalStatusSummary(request) {
	// Single stage untuk kasbon
	const stages = [
		{
			name: 'Manager HRD',
			stage: APPROVAL_STAGES.MANAGER_HRD,
			approved: request.manager_hrd_approved,
			approvedBy: request.manager_hrd_approved_by,
			approvedDate: request.manager_hrd_approved_date,
			rejectionReason: request.manager_hrd_rejection_reason
		}
	];

	return {
		currentStage: request.approval_stage || APPROVAL_STAGES.PENDING,
		overallStatus: request.overall_status || request.status || 'pending',
		stages,
		isCompleted: request.approval_stage === APPROVAL_STAGES.APPROVED,
		isRejected: request.approval_stage === APPROVAL_STAGES.REJECTED,
		finalApprovedBy: request.final_approved_by,
		finalApprovedDate: request.final_approved_date,
		finalRejectionReason: request.final_rejection_reason
	};
}

/**
 * Get readable stage name
 */
export function getStageDisplayName(stage) {
	const stageNames = {
		[APPROVAL_STAGES.PENDING]: 'Menunggu Persetujuan',
		[APPROVAL_STAGES.MANAGER_HRD]: 'Disetujui Manager HRD',
		[APPROVAL_STAGES.APPROVED]: 'Disetujui',
		[APPROVAL_STAGES.REJECTED]: 'Ditolak'
	};

	return stageNames[stage] || stage;
}

/**
 * Check if user can see approval details
 */
export function canViewApprovalDetails() {
	const role = get(userRole);
	const email = get(userEmail);

	// Manager HRD dan admin bisa melihat detail approval
	return (
		['admin', 'manager'].includes(role) ||
		['hrd@eltama.com', 'manager.hrd@eltama.com'].includes(email)
	);
}

/**
 * Get available actions for current user
 */
export function getAvailableActions(request) {
	const userLevel = getCurrentUserApprovalLevel();
	const currentStage = request.approval_stage || APPROVAL_STAGES.PENDING;

	// 🔧 DEBUG: Log approval detection
	console.log('🔍 DEBUG getAvailableActions (Kasbon):', {
		requestId: request.id,
		userLevel,
		currentStage,
		canApprove: canApproveAtStage(request, currentStage),
		canView: canViewApprovalDetails()
	});

	const actions = [];

	// Jika user bisa approve di stage saat ini
	if (canApproveAtStage(request, currentStage)) {
		actions.push('approve', 'reject');
	}

	// Semua yang punya akses bisa melihat detail
	if (canViewApprovalDetails()) {
		actions.push('view_details');
	}

	console.log('🔍 DEBUG final actions (Kasbon):', actions);
	return actions;
}
