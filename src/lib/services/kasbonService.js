// Service untuk Kasbon dengan approval system
import {
	approveKasbonAtStage,
	rejectKasbonAtStage,
	getCurrentUserApprovalLevel,
	canApproveAtStage,
	APPROVAL_STAGES
} from './kasbonApprovalService.js';

/**
 * Approve kasbon request menggunakan single-level approval (Manager HRD only)
 * @param {object} request - Data pengajuan kasbon
 */
export async function approveKasbonRequestSingleLevel(request) {
	try {
		const userLevel = getCurrentUserApprovalLevel();
		const currentStage = request.approval_stage || APPROVAL_STAGES.PENDING;

		console.log('🔍 DEBUG approveKasbonRequestSingleLevel:', {
			requestId: request.id,
			userLevel,
			currentStage,
			canApprove: canApproveAtStage(request, currentStage)
		});

		if (!canApproveAtStage(request, currentStage)) {
			return {
				success: false,
				error: 'Anda tidak memiliki wewenang untuk menyetujui pengajuan kasbon ini'
			};
		}

		// Only Manager HRD can approve kasbon
		if (userLevel !== APPROVAL_STAGES.MANAGER_HRD) {
			return {
				success: false,
				error: 'Hanya Manager HRD yang dapat menyetujui pengajuan kasbon'
			};
		}

		const result = await approveKasbonAtStage(request, userLevel);
		return result;
	} catch (error) {
		console.error('Error in approveKasbonRequestSingleLevel:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyetujui pengajuan'
		};
	}
}

/**
 * Reject kasbon request menggunakan single-level approval (Manager HRD only)
 * @param {object} request - Data pengajuan kasbon
 * @param {string} reason - Alasan penolakan
 */
export async function rejectKasbonRequestSingleLevel(request, reason = '') {
	try {
		const userLevel = getCurrentUserApprovalLevel();
		const currentStage = request.approval_stage || APPROVAL_STAGES.PENDING;

		console.log('🔍 DEBUG rejectKasbonRequestSingleLevel:', {
			requestId: request.id,
			userLevel,
			currentStage,
			reason,
			canApprove: canApproveAtStage(request, currentStage)
		});

		if (!canApproveAtStage(request, currentStage)) {
			return {
				success: false,
				error: 'Anda tidak memiliki wewenang untuk menolak pengajuan kasbon ini'
			};
		}

		// Only Manager HRD can reject kasbon
		if (userLevel !== APPROVAL_STAGES.MANAGER_HRD) {
			return {
				success: false,
				error: 'Hanya Manager HRD yang dapat menolak pengajuan kasbon'
			};
		}

		const result = await rejectKasbonAtStage(request, userLevel, reason);
		return result;
	} catch (error) {
		console.error('Error in rejectKasbonRequestSingleLevel:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menolak pengajuan'
		};
	}
}
