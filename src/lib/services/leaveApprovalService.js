// Service untuk Multi-Level Leave Approval System
import { userRole, userEmail, userName } from './firebaseConfig.js';
import { get } from 'svelte/store';
import { isDivisionMatch } from '../utils/divisionMapping.js';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * Base function untuk API calls ke Directus
 */
async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/${endpoint}`;
	const headers = {
		'Content-Type': 'application/json',
		...(DIRECTUS_TOKEN && { Authorization: `Bearer ${DIRECTUS_TOKEN}` }),
		...options.headers
	};

	const response = await fetch(url, {
		...options,
		headers
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.json();
}

/**
 * Approval stages configuration
 * CORRECT ORDER: Manager Divisi → Admin HRD → Manager HRD → Direktur
 */
export const APPROVAL_STAGES = {
	PENDING: 'pending',
	MANAGER_DIVISI: 'manager_divisi', // 1st approval: Manager Divisi
	HRD_ADMIN: 'hrd_admin', // 2nd approval: Admin HRD
	MANAGER_HRD: 'manager_hrd', // 3rd approval: Manager HRD
	DIREKTUR: 'direktur', // 4th approval: Direktur
	APPROVED: 'approved',
	REJECTED: 'rejected'
};

/**
 * Role permissions untuk approval
 */
export const APPROVAL_PERMISSIONS = {
	[APPROVAL_STAGES.MANAGER_HRD]: ['manager'],
	[APPROVAL_STAGES.HRD_ADMIN]: ['admin'],
	[APPROVAL_STAGES.DIREKTUR]: ['direktur']
};

/**
 * Get current user approval permissions
 */
export function getCurrentUserApprovalLevel() {
	const role = get(userRole);
	const email = get(userEmail);

	// 🔧 DEBUG: Log current user detection
	console.log('🔍 DEBUG getCurrentUserApprovalLevel:', {
		role,
		email,
		isHRDAdmin: role === 'admin' && email === 'hrd@eltama.com',
		isDirektur: role === 'direktur' && email === 'direktur@eltama.com',
		roleType: typeof role,
		emailType: typeof email
	});

	// HRD Admin
	if (role === 'admin' && email === 'hrd@eltama.com') {
		return APPROVAL_STAGES.HRD_ADMIN;
	}

	// Manager HRD
	if (role === 'manager' && email === 'manager.hrd@eltama.com') {
		console.log('🔍 DEBUG: Manager HRD detected successfully!');
		return APPROVAL_STAGES.MANAGER_HRD;
	}

	// Direktur
	if (role === 'direktur' && email === 'direktur@eltama.com') {
		console.log('🔍 DEBUG: Direktur detected successfully!');
		return APPROVAL_STAGES.DIREKTUR;
	}

	// Manager Divisi - Check by email pattern and role
	if (role === 'manager_divisi' || role === 'manager' || role === 'user') {
		// List manager divisi emails
		const managerDivisiEmails = [
			'manager.it@eltama.com',
			'manager.finance@eltama.com',
			'manager.procurement@eltama.com',
			'manager.inventory@eltama.com',
			'manager.produksi@eltama.com',
			'manager.project@eltama.com',
			'manager.marketing@eltama.com',
			'manager.maintenance@eltama.com',
			'general.manager@eltama.com',
			'plant.manager@eltama.com'
		];

		if (managerDivisiEmails.includes(email)) {
			console.log('🔍 DEBUG: Manager Divisi detected!', { email });
			return APPROVAL_STAGES.MANAGER_DIVISI;
		}
	}

	console.log('🔍 DEBUG: No matching role/email found for approval level');
	return null;
}

/**
 * Check if current user can approve at specific stage
 */
export function canApproveAtStage(request, stage) {
	const userLevel = getCurrentUserApprovalLevel();
	const currentUserEmail = get(userEmail);

	// 🔧 DEBUG: Log approval stage check
	console.log('🔍 DEBUG canApproveAtStage:', {
		requestStage: request.approval_stage,
		userLevel,
		stage,
		currentUserEmail,
		requestEmployeeEmail: request.employee_email,
		canApprove: false // will be updated below
	});

	if (!userLevel) {
		console.log('🔍 DEBUG: No user level detected');
		return false;
	}

	// NEW LOGIC: Manager Divisi → Manager HRD → HRD Admin → Direktur
	let canApprove = false;

	// Manager Divisi dapat approve request yang ada di stage "pending"
	// HANYA jika request berasal dari divisi yang sama
	if (
		userLevel === APPROVAL_STAGES.MANAGER_DIVISI &&
		request.approval_stage === APPROVAL_STAGES.PENDING
	) {
		// Check if request is from same division as current manager
		const isFromSameDivision = checkIfRequestFromSameDivision(request, currentUserEmail);

		if (isFromSameDivision) {
			canApprove = true;
			console.log('🔍 DEBUG: MANAGER DIVISI CAN APPROVE! 🎯', {
				userLevel,
				requestStage: request.approval_stage,
				requestEmployeeEmail: request.employee_email,
				managerEmail: currentUserEmail
			});
		} else {
			console.log('🔍 DEBUG: Manager Divisi cannot approve - different division', {
				requestEmployeeEmail: request.employee_email,
				managerEmail: currentUserEmail
			});
		}
	} else if (
		userLevel === APPROVAL_STAGES.HRD_ADMIN &&
		request.approval_stage === APPROVAL_STAGES.MANAGER_DIVISI
	) {
		canApprove = true;
		console.log('🔍 DEBUG: HRD ADMIN CAN APPROVE! 🎯', {
			userLevel,
			requestStage: request.approval_stage,
			expectedStage: APPROVAL_STAGES.MANAGER_DIVISI
		});
	} else if (
		userLevel === APPROVAL_STAGES.MANAGER_HRD &&
		request.approval_stage === APPROVAL_STAGES.HRD_ADMIN
	) {
		canApprove = true;
		console.log('🔍 DEBUG: MANAGER HRD CAN APPROVE! 🎯', {
			userLevel,
			requestStage: request.approval_stage,
			expectedStage: APPROVAL_STAGES.HRD_ADMIN
		});
	} else if (
		userLevel === APPROVAL_STAGES.DIREKTUR &&
		request.approval_stage === APPROVAL_STAGES.MANAGER_HRD
	) {
		canApprove = true;
		console.log('🔍 DEBUG: DIREKTUR CAN APPROVE! 🎯', {
			userLevel,
			requestStage: request.approval_stage,
			expectedStage: APPROVAL_STAGES.MANAGER_HRD
		});
	}

	// 🔧 DEBUG: Show why approval failed if it did
	if (!canApprove) {
		console.log('❌ DEBUG: Approval DENIED - Reason:', {
			userLevel,
			requestStage: request.approval_stage,
			explanation: `User level "${userLevel}" cannot approve request at stage "${request.approval_stage}"`
		});
	}

	console.log('🔍 DEBUG canApprove result:', canApprove);
	return canApprove;
}

/**
 * Check if leave request is from same division as current manager
 */
function checkIfRequestFromSameDivision(request, managerEmail) {
	// Mapping email manager ke divisi
	const managerDivisionMap = {
		'manager.it@eltama.com': 'IT',
		'manager.finance@eltama.com': 'Finance',
		'manager.procurement@eltama.com': 'Procurement',
		'manager.inventory@eltama.com': 'Inventory',
		'manager.produksi@eltama.com': 'Produksi',
		'manager.project@eltama.com': 'Project',
		'manager.marketing@eltama.com': 'Marketing',
		'manager.maintenance@eltama.com': 'Maintenance',
		'general.manager@eltama.com': 'Management',
		'plant.manager@eltama.com': 'Management'
	};

	const managerDivision = managerDivisionMap[managerEmail];

	if (!managerDivision) {
		console.log('🔍 DEBUG: Manager division not found for email:', managerEmail);
		return false;
	}

	// Get employee division from request
	const employeeDivision = request.employee_division || request.divisi;

	// Use division mapping for accurate comparison
	const isSameDivision = isDivisionMatch(managerDivision, employeeDivision);

	console.log('🔍 DEBUG checkIfRequestFromSameDivision:', {
		managerEmail,
		managerDivision,
		employeeDivision,
		requestEmployeeEmail: request.employee_email,
		isSameDivision
	});

	return isSameDivision;
}

/**
 * Get next approval stage
 */
export function getNextApprovalStage(currentStage) {
	// CORRECT ORDER: pending → manager_divisi → hrd_admin → manager_hrd → direktur → approved
	const stages = [
		APPROVAL_STAGES.PENDING,
		APPROVAL_STAGES.MANAGER_DIVISI,
		APPROVAL_STAGES.HRD_ADMIN,
		APPROVAL_STAGES.MANAGER_HRD,
		APPROVAL_STAGES.DIREKTUR,
		APPROVAL_STAGES.APPROVED
	];

	const currentIndex = stages.indexOf(currentStage);
	return currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
}

/**
 * Get current user name based on role and email
 */
function getCurrentUserName() {
	const role = get(userRole);
	const email = get(userEmail);
	const name = get(userName);

	// Map email to specific name for approval tracking
	const userNameMap = {
		'hrd@eltama.com': 'HRD Admin',
		'manager.hrd@eltama.com': 'Manager HRD',
		'direktur@eltama.com': 'Direktur Utama',
		// Manager Divisi accounts
		'manager.it@eltama.com': 'Manager IT',
		'manager.finance@eltama.com': 'Manager Finance',
		'manager.procurement@eltama.com': 'Manager Procurement',
		'manager.inventory@eltama.com': 'Manager Inventory',
		'manager.produksi@eltama.com': 'Manager Produksi',
		'manager.project@eltama.com': 'Manager Project',
		'manager.marketing@eltama.com': 'Manager Marketing',
		'manager.maintenance@eltama.com': 'Manager Maintenance',
		'general.manager@eltama.com': 'General Manager',
		'plant.manager@eltama.com': 'Plant Manager'
	};

	// Use mapped name if available, otherwise use stored name or email
	const mappedName = email ? userNameMap[email] : null;
	const finalName = mappedName || name || email || 'Unknown User';

	console.log('🔍 DEBUG getCurrentUserName:', {
		email,
		role,
		storedName: name,
		mappedName,
		finalName
	});

	return finalName;
}

/**
 * Approve leave request at current stage
 */
export async function approveLeaveAtStage(request, stage, reason = '') {
	const currentUser = getCurrentUserName();
	const currentRole = get(userRole);
	const currentEmail = get(userEmail);
	const currentDate = new Date().toISOString().split('T')[0];

	// 🔧 DEBUG: Log current user performing approval
	console.log('🔍 DEBUG approveLeaveAtStage - Current User Info:', {
		userName: get(userName),
		userEmail: get(userEmail),
		userRole: get(userRole),
		currentUser: currentUser,
		stage: stage,
		requestId: request.id
	});

	let updates = {};

	// Set approval for current stage and move to next stage
	// CORRECT ORDER: Manager Divisi → Admin HRD → Manager HRD → Direktur
	switch (stage) {
		case APPROVAL_STAGES.MANAGER_DIVISI:
			// Manager Divisi is approving a pending request → move to manager_divisi stage
			updates = {
				manager_divisi_approved: true,
				manager_divisi_approved_by: currentUser,
				manager_divisi_approved_date: currentDate,
				approval_stage: APPROVAL_STAGES.MANAGER_DIVISI // Move from 'pending' to 'manager_divisi'
			};
			break;

		case APPROVAL_STAGES.HRD_ADMIN:
			// Admin HRD is approving a manager_divisi request → move to hrd_admin stage
			updates = {
				hrd_admin_approved: true,
				hrd_admin_approved_by: currentUser,
				hrd_admin_approved_date: currentDate,
				approval_stage: APPROVAL_STAGES.HRD_ADMIN // Move from 'manager_divisi' to 'hrd_admin'
			};
			break;

		case APPROVAL_STAGES.MANAGER_HRD:
			// Manager HRD is approving a hrd_admin request → move to manager_hrd stage
			updates = {
				manager_hrd_approved: true,
				manager_hrd_approved_by: currentUser,
				manager_hrd_approved_date: currentDate,
				approval_stage: APPROVAL_STAGES.MANAGER_HRD // Move from 'hrd_admin' to 'manager_hrd'
			};
			break;

		case APPROVAL_STAGES.DIREKTUR:
			// Direktur is approving a manager_hrd request → final approval
			updates = {
				direktur_approved: true,
				direktur_approved_by: currentUser,
				direktur_approved_date: currentDate,
				approval_stage: APPROVAL_STAGES.APPROVED, // Move from 'manager_hrd' to 'approved'
				overall_status: 'approved',
				final_approved_by: currentUser,
				final_approved_date: currentDate,
				// Maintain backward compatibility
				status: 'approved',
				approved_by: currentUser,
				approved_date: currentDate
			};
			break;

		default:
			throw new Error('Invalid approval stage');
	}

	// Update database
	const collection = request.type === 'hours' ? 'izin_jam' : 'izin_hari';

	try {
		const response = await directusApi(`items/${collection}/${request.id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data,
			nextStage: updates.approval_stage || 'unknown',
			message: `Pengajuan telah disetujui di level ${stage}`
		};
	} catch (error) {
		console.error('Error approving leave request:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Reject leave request at current stage
 */
export async function rejectLeaveAtStage(request, stage, reason = '') {
	const currentUser = getCurrentUserName();
	const currentDate = new Date().toISOString().split('T')[0];

	// 🔧 DEBUG: Log current user performing rejection
	console.log('🔍 DEBUG rejectLeaveAtStage - Current User Info:', {
		userName: get(userName),
		userEmail: get(userEmail),
		userRole: get(userRole),
		currentUser: currentUser,
		stage: stage,
		requestId: request.id,
		reason: reason
	});

	let updates = {};

	// Set rejection for current stage
	switch (stage) {
		case APPROVAL_STAGES.MANAGER_DIVISI:
			updates = {
				manager_divisi_rejection_reason: reason,
				approval_stage: APPROVAL_STAGES.REJECTED,
				overall_status: 'rejected',
				final_rejection_reason: reason,
				// Maintain backward compatibility
				status: 'rejected',
				approved_by: currentUser,
				approved_date: currentDate,
				rejection_reason: reason
			};
			break;

		case APPROVAL_STAGES.HRD_ADMIN:
			updates = {
				hrd_admin_rejection_reason: reason,
				approval_stage: APPROVAL_STAGES.REJECTED,
				overall_status: 'rejected',
				final_rejection_reason: reason,
				// Maintain backward compatibility
				status: 'rejected',
				approved_by: currentUser,
				approved_date: currentDate,
				rejection_reason: reason
			};
			break;

		case APPROVAL_STAGES.MANAGER_HRD:
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
			break;

		case APPROVAL_STAGES.HRD_ADMIN:
			updates = {
				hrd_admin_rejection_reason: reason,
				approval_stage: APPROVAL_STAGES.REJECTED,
				overall_status: 'rejected',
				final_rejection_reason: reason,
				// Maintain backward compatibility
				status: 'rejected',
				approved_by: currentUser,
				approved_date: currentDate,
				rejection_reason: reason
			};
			break;

		case APPROVAL_STAGES.DIREKTUR:
			updates = {
				direktur_rejection_reason: reason,
				approval_stage: APPROVAL_STAGES.REJECTED,
				overall_status: 'rejected',
				final_rejection_reason: reason,
				// Maintain backward compatibility
				status: 'rejected',
				approved_by: currentUser,
				approved_date: currentDate,
				rejection_reason: reason
			};
			break;

		default:
			throw new Error('Invalid approval stage');
	}

	// Update database
	const collection = request.type === 'hours' ? 'izin_jam' : 'izin_hari';

	try {
		const response = await directusApi(`items/${collection}/${request.id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		return {
			success: true,
			data: response.data,
			message: `Pengajuan telah ditolak di level ${stage}`
		};
	} catch (error) {
		console.error('Error rejecting leave request:', error);
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
	// CORRECT ORDER: Manager Divisi → Admin HRD → Manager HRD → Direktur
	const stages = [
		{
			name: 'Manager Divisi',
			stage: APPROVAL_STAGES.MANAGER_DIVISI,
			approved: request.manager_divisi_approved,
			approvedBy: request.manager_divisi_approved_by,
			approvedDate: request.manager_divisi_approved_date,
			rejectionReason: request.manager_divisi_rejection_reason
		},
		{
			name: 'Admin HRD',
			stage: APPROVAL_STAGES.HRD_ADMIN,
			approved: request.hrd_admin_approved,
			approvedBy: request.hrd_admin_approved_by,
			approvedDate: request.hrd_admin_approved_date,
			rejectionReason: request.hrd_admin_rejection_reason
		},
		{
			name: 'Manager HRD',
			stage: APPROVAL_STAGES.MANAGER_HRD,
			approved: request.manager_hrd_approved,
			approvedBy: request.manager_hrd_approved_by,
			approvedDate: request.manager_hrd_approved_date,
			rejectionReason: request.manager_hrd_rejection_reason
		},
		{
			name: 'Direktur Utama',
			stage: APPROVAL_STAGES.DIREKTUR,
			approved: request.direktur_approved,
			approvedBy: request.direktur_approved_by,
			approvedDate: request.direktur_approved_date,
			rejectionReason: request.direktur_rejection_reason
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
		[APPROVAL_STAGES.PENDING]: 'Menunggu Review',
		[APPROVAL_STAGES.MANAGER_DIVISI]: 'Review Manager Divisi',
		[APPROVAL_STAGES.HRD_ADMIN]: 'Review Admin HRD',
		[APPROVAL_STAGES.MANAGER_HRD]: 'Review Manager HRD',
		[APPROVAL_STAGES.DIREKTUR]: 'Review Direktur',
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

	// Admin, Manager, dan Direktur bisa melihat detail approval
	return (
		['admin', 'manager', 'direktur'].includes(role) ||
		['hrd@eltama.com', 'manager.hrd@eltama.com', 'direktur@eltama.com'].includes(email)
	);
}

/**
 * Get available actions for current user
 */
export function getAvailableActions(request) {
	const userLevel = getCurrentUserApprovalLevel();
	const currentStage = request.approval_stage || APPROVAL_STAGES.PENDING;

	// 🔧 DEBUG: Log approval detection
	console.log('🔍 DEBUG getAvailableActions:', {
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

	console.log('🔍 DEBUG final actions:', actions);
	return actions;
}
