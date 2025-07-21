<script>
	import { getStageDisplayName, APPROVAL_STAGES } from '../services/leaveApprovalService.js';
	import {
		getStageDisplayName as getOvertimeStageDisplayName,
		APPROVAL_STAGES as OVERTIME_APPROVAL_STAGES,
		getApprovalStatusSummary as getOvertimeApprovalStatusSummary
	} from '../services/overtimeApprovalService.js';

	/** @type {any} */
	export let request;
	/** @type {string} */
	export let type = 'leave'; // 'leave' or 'overtime'

	// Generate approval summary based on type
	$: approvalSummary =
		type === 'overtime'
			? getOvertimeApprovalStatusSummary(request)
			: (() => {
					// For leave requests, we expect the summary to be passed directly or generated
					if (request.approvalSummary) return request.approvalSummary;

					// Generate summary for leave if not provided
					import('../services/leaveApprovalService.js').then((module) => {
						return module.getApprovalStatusSummary(request);
					});
				})();

	// Use appropriate functions based on type
	$: stageDisplayFunction = type === 'overtime' ? getOvertimeStageDisplayName : getStageDisplayName;
	$: approvalStages = type === 'overtime' ? OVERTIME_APPROVAL_STAGES : APPROVAL_STAGES;

	/**
	 * Get CSS class for stage status
	 * @param {any} stage
	 * @param {string} currentStage
	 */
	function getStageClass(stage, currentStage) {
		if (stage.approved) {
			return 'stage-approved';
		}

		if (stage.rejectionReason) {
			return 'stage-rejected';
		}

		if (stage.stage === currentStage) {
			return 'stage-current';
		}

		return 'stage-pending';
	}

	/**
	 * Get icon for stage status
	 * @param {any} stage
	 * @param {string} currentStage
	 */
	function getStageIcon(stage, currentStage) {
		if (stage.approved) {
			return '✅';
		}

		if (stage.rejectionReason) {
			return '❌';
		}

		if (stage.stage === currentStage) {
			return '⏳';
		}

		return '⚪';
	}

	function formatDate(dateString) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('id-ID');
	}
</script>

<div class="approval-status">
	<div class="approval-header">
		<h4>📋 Status Persetujuan</h4>
		<div class="overall-status {approvalSummary.overallStatus}">
			{#if approvalSummary.isCompleted}
				✅ Disetujui
			{:else if approvalSummary.isRejected}
				❌ Ditolak
			{:else}
				⏳ {getStageDisplayName(approvalSummary.currentStage)}
			{/if}
		</div>
	</div>

	<div class="approval-timeline">
		{#each approvalSummary.stages as stage, index}
			<div class="timeline-item {getStageClass(stage, approvalSummary.currentStage)}">
				<div class="timeline-marker">
					<span class="stage-icon">{getStageIcon(stage, approvalSummary.currentStage)}</span>
					<span class="stage-number">{index + 1}</span>
				</div>

				<div class="timeline-content">
					<div class="stage-title">{stage.name}</div>

					{#if stage.approved}
						<div class="stage-details approved">
							<div class="approved-by">✓ Disetujui oleh: {stage.approvedBy}</div>
							<div class="approved-date">📅 Tanggal: {formatDate(stage.approvedDate)}</div>
						</div>
					{:else if stage.rejectionReason}
						<div class="stage-details rejected">
							<div class="rejection-reason">❌ Alasan: {stage.rejectionReason}</div>
						</div>
					{:else if stage.stage === approvalSummary.currentStage}
						<div class="stage-details current">
							<div class="current-status">⏳ Menunggu persetujuan</div>
						</div>
					{:else}
						<div class="stage-details pending">
							<div class="pending-status">⭕ Belum diproses</div>
						</div>
					{/if}
				</div>

				{#if index < approvalSummary.stages.length - 1}
					<div class="timeline-connector"></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if approvalSummary.isCompleted && approvalSummary.finalApprovedBy}
		<div class="final-approval">
			<div class="final-approval-header">🎉 Pengajuan Disetujui</div>
			<div class="final-details">
				<div>👤 Disetujui oleh: {approvalSummary.finalApprovedBy}</div>
				<div>📅 Tanggal: {formatDate(approvalSummary.finalApprovedDate)}</div>
			</div>
		</div>
	{/if}

	{#if approvalSummary.isRejected && approvalSummary.finalRejectionReason}
		<div class="final-rejection">
			<div class="final-rejection-header">❌ Pengajuan Ditolak</div>
			<div class="final-details">
				<div class="rejection-reason">📝 Alasan: {approvalSummary.finalRejectionReason}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.approval-status {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 20px;
		margin: 16px 0;
	}

	.approval-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 2px solid #dee2e6;
	}

	.approval-header h4 {
		margin: 0;
		color: #495057;
		font-size: 16px;
		font-weight: 600;
	}

	.overall-status {
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.overall-status.pending {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffecb5;
	}

	.overall-status.approved {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.overall-status.rejected {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.approval-timeline {
		position: relative;
	}

	.timeline-item {
		position: relative;
		display: flex;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.timeline-item:last-child {
		margin-bottom: 0;
	}

	.timeline-marker {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-right: 16px;
		min-width: 40px;
	}

	.stage-icon {
		font-size: 24px;
		margin-bottom: 4px;
	}

	.stage-number {
		background: #6c757d;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: bold;
	}

	.timeline-item.stage-approved .stage-number {
		background: #28a745;
	}

	.timeline-item.stage-current .stage-number {
		background: #ffc107;
		color: #000;
	}

	.timeline-item.stage-rejected .stage-number {
		background: #dc3545;
	}

	.timeline-content {
		flex: 1;
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 12px 16px;
	}

	.stage-title {
		font-weight: 600;
		color: #495057;
		margin-bottom: 8px;
	}

	.stage-details {
		font-size: 13px;
	}

	.stage-details.approved {
		color: #155724;
	}

	.stage-details.rejected {
		color: #721c24;
	}

	.stage-details.current {
		color: #856404;
	}

	.stage-details.pending {
		color: #6c757d;
	}

	.approved-by,
	.approved-date,
	.rejection-reason,
	.current-status,
	.pending-status {
		margin: 2px 0;
	}

	.timeline-connector {
		position: absolute;
		left: 19px;
		top: 50px;
		width: 2px;
		height: 24px;
		background: #dee2e6;
	}

	.timeline-item.stage-approved .timeline-connector {
		background: #28a745;
	}

	.final-approval,
	.final-rejection {
		margin-top: 20px;
		padding: 16px;
		border-radius: 8px;
		border: 2px solid;
	}

	.final-approval {
		background: #d4edda;
		border-color: #28a745;
	}

	.final-rejection {
		background: #f8d7da;
		border-color: #dc3545;
	}

	.final-approval-header,
	.final-rejection-header {
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 16px;
	}

	.final-approval-header {
		color: #155724;
	}

	.final-rejection-header {
		color: #721c24;
	}

	.final-details {
		font-size: 14px;
	}

	.final-details > div {
		margin: 4px 0;
	}
</style>
