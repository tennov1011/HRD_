<script>
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import {
		getAllLeaveRequestsWithApproval,
		approveLeaveRequestMultiLevel,
		rejectLeaveRequestMultiLevel,
		testConnection
	} from '$lib/services/leaveService.js';
	import {
		getCurrentUserApprovalLevel,
		getStageDisplayName,
		canViewApprovalDetails,
		APPROVAL_STAGES
	} from '$lib/services/leaveApprovalService.js';
	import {
		createLeaveCategory,
		getAllLeaveCategories
	} from '$lib/services/leaveCategoryService.js';
	import {
		calculateRemainingAnnualLeave,
		isAnnualLeaveCategory,
		formatRemainingLeaveDisplay,
		calculateDaysBetweenDates,
		ANNUAL_LEAVE_SETTINGS
	} from '$lib/services/annualLeaveService.js';
	import { userEmail } from '$lib/services/firebaseConfig.js';
	import { isDivisionMatch } from '$lib/utils/divisionMapping.js';
	import ApprovalStatus from '$lib/component/ApprovalStatus.svelte';

	/** @type {any[]} */
	let leaveRequests = [];
	let loading = true;
	let searchTerm = '';
	let statusFilter = 'all'; // all, pending, approved, rejected
	let typeFilter = 'all'; // all, or category ID
	let showOnlyMyApprovals = true; // 🔧 NEW: Toggle untuk melihat hanya yang perlu di-approve
	let currentPage = 1;
	let itemsPerPage = 10;
	/** @type {any} */
	let connectionStatus = null;
	let isConnected = false;

	// Leave categories
	/** @type {any[]} */
	let leaveCategories = [];
	let categoriesLoading = false;

	// Modal states
	let showAttachmentModal = false;
	/** @type {any} */
	let currentAttachment = null;
	/** @type {any} */
	let currentRequest = null;

	// Modal states for approval detail
	let showApprovalDetailModal = false;
	/** @type {any} */
	let selectedRequestForApproval = null;

	// Modal states for rejection
	let showRejectionModal = false;
	/** @type {any} */
	let rejectionRequest = null;
	let rejectionReason = '';

	// Modal states for category
	let showCategoryModal = false;
	let newCategoryName = '';
	let savingCategory = false;

	// Toast notification
	let toastMessage = '';
	let showToast = false;
	let toastType = 'success'; // success, error, info

	// Annual leave tracking
	/** @type {Map<string, any>} */
	let annualLeaveCache = new Map();
	let loadingAnnualLeave = new Set();

	$: filteredRequests = filterRequests(leaveRequests, searchTerm, statusFilter, typeFilter);
	$: userFilteredRequests =
		getCurrentUserApprovalLevel() === APPROVAL_STAGES.MANAGER_DIVISI
			? filterByManagerDivision(filteredRequests)
			: showOnlyMyApprovals
				? filterByUserRole(filteredRequests)
				: filteredRequests;
	$: paginatedRequests = paginateData(userFilteredRequests, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(userFilteredRequests.length / itemsPerPage);

	onMount(async () => {
		await checkConnection();
		await loadLeaveCategories();
		await loadLeaveRequests();
	});

	async function checkConnection() {
		connectionStatus = await testConnection();
		isConnected = connectionStatus.success;
	}

	async function loadLeaveCategories() {
		try {
			categoriesLoading = true;
			const result = await getAllLeaveCategories();

			if (result.success) {
				leaveCategories = result.data;
				console.log('📋 Loaded leave categories:', result.total, 'items');
			} else {
				console.warn('⚠️ Using fallback categories:', result.error);
				leaveCategories = result.data; // Fallback data
			}
		} catch (error) {
			console.error('Error loading leave categories:', error);
		} finally {
			categoriesLoading = false;
		}
	}

	async function loadLeaveRequests() {
		try {
			loading = true;
			const result = await getAllLeaveRequestsWithApproval();

			if (result.success) {
				leaveRequests = result.data;
				console.log('📊 Loaded leave requests with approval:', result.total, 'items');
				console.log(
					'📊 Breakdown - Hours:',
					result.breakdown?.hours,
					'Days:',
					result.breakdown?.days
				);

				// 🔧 DEBUG: Log sample request for approval buttons
				if (leaveRequests.length > 0) {
					const sampleRequest = leaveRequests[0];
					console.log('🔍 DEBUG - Sample request:', {
						id: sampleRequest.id,
						approval_stage: sampleRequest.approval_stage,
						availableActions: sampleRequest.availableActions,
						approvalSummary: sampleRequest.approvalSummary
					});
				}
			} else {
				console.warn('⚠️ Using fallback data:', result.error);
				leaveRequests = result.data; // Fallback data
			}
		} catch (error) {
			console.error('Error loading leave requests:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * Filter requests by manager division - always apply division filtering for manager divisi
	 * @param {any[]} requests
	 */
	function filterByManagerDivision(requests) {
		const userLevel = getCurrentUserApprovalLevel();

		console.log('🔍 DEBUG filterByManagerDivision:', {
			userLevel,
			totalRequests: requests.length,
			showOnlyMyApprovals,
			userEmail: get(userEmail)
		});

		if (userLevel !== APPROVAL_STAGES.MANAGER_DIVISI) {
			return requests;
		}

		// For manager divisi, always filter by division first
		const divisionFiltered = requests.filter((req) => checkIfRequestFromCurrentUserDivision(req));

		console.log('🔍 DEBUG: After division filter:', {
			originalCount: requests.length,
			divisionFilteredCount: divisionFiltered.length
		});

		if (showOnlyMyApprovals) {
			// Show only requests that need approval (pending stage)
			const approvalFiltered = divisionFiltered.filter(
				(req) => req.approval_stage === APPROVAL_STAGES.PENDING
			);
			console.log('🔍 DEBUG: After approval stage filter:', {
				divisionFilteredCount: divisionFiltered.length,
				approvalFilteredCount: approvalFiltered.length,
				pendingStage: APPROVAL_STAGES.PENDING
			});
			return approvalFiltered;
		} else {
			// Show all requests from division (any stage)
			return divisionFiltered;
		}
	}

	/**
	 * Filter requests by user role - only show requests at appropriate approval stage
	 * @param {any[]} requests
	 */
	function filterByUserRole(requests) {
		const userLevel = getCurrentUserApprovalLevel();

		console.log('🔍 DEBUG filterByUserRole START:', {
			userLevel,
			totalRequests: requests.length,
			showOnlyMyApprovals,
			userEmail: get(userEmail)
		});

		if (!userLevel) {
			// If no approval level detected, show all requests (for regular users)
			console.log('🔍 DEBUG: No user level detected, showing all requests');
			return requests;
		}

		// Filter based on user's approval level
		// CORRECT ORDER: Manager Divisi → Admin HRD → Manager HRD → Direktur
		/** @type {string|null} */
		let targetStage = null;
		let filtered = [];

		switch (userLevel) {
			case APPROVAL_STAGES.MANAGER_DIVISI:
				// Manager Divisi should see requests at "pending" stage from their division only
				targetStage = APPROVAL_STAGES.PENDING;
				console.log('🔍 DEBUG: Manager Divisi filtering for stage:', targetStage);

				// First filter by stage
				const pendingRequests = requests.filter((req) => req.approval_stage === targetStage);
				console.log('🔍 DEBUG: Requests at pending stage:', pendingRequests.length);

				// Then filter by division
				filtered = pendingRequests.filter((req) => {
					const divisionMatch = checkIfRequestFromCurrentUserDivision(req);
					console.log('🔍 DEBUG: Request division check:', {
						requestId: req.id,
						employeeName: req.employee_name,
						employeeDivision: req.employee_division || req.divisi,
						divisionMatch
					});
					return divisionMatch;
				});
				break;
			case APPROVAL_STAGES.HRD_ADMIN:
				// Admin HRD should see requests at "manager_divisi" stage (second approval)
				targetStage = APPROVAL_STAGES.MANAGER_DIVISI;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			case APPROVAL_STAGES.MANAGER_HRD:
				// Manager HRD should see requests at "hrd_admin" stage (third approval)
				targetStage = APPROVAL_STAGES.HRD_ADMIN;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			case APPROVAL_STAGES.DIREKTUR:
				// Direktur should see requests at "manager_hrd" stage (final approval)
				targetStage = APPROVAL_STAGES.MANAGER_HRD;
				filtered = requests.filter((req) => req.approval_stage === targetStage);
				break;
			default:
				// For other roles, show all requests
				return requests;
		}

		console.log('🔍 DEBUG filterByUserRole result:', {
			userLevel,
			targetStage,
			filteredCount: filtered.length,
			originalCount: requests.length,
			allRequestStages: requests.map((r) => ({ id: r.id, stage: r.approval_stage })),
			matchingRequests: filtered.map((r) => ({
				id: r.id,
				stage: r.approval_stage,
				actions: r.availableActions
			}))
		});

		return filtered;
	}

	/**
	 * Check if request is from current user's division (for manager divisi)
	 * @param {any} request
	 */
	function checkIfRequestFromCurrentUserDivision(request) {
		const userLevel = getCurrentUserApprovalLevel();

		// If not a manager divisi, allow all requests
		if (userLevel !== APPROVAL_STAGES.MANAGER_DIVISI) {
			return true;
		}

		// Get current user email from stores
		const currentUserEmail = get(userEmail);

		// Manager divisi mapping
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

		const managerDivision = currentUserEmail ? managerDivisionMap[currentUserEmail] : null;
		const employeeDivision = request.employee_division || request.divisi;

		// Use division mapping function for accurate comparison
		const isMatch = managerDivision ? isDivisionMatch(managerDivision, employeeDivision) : false;

		console.log('🔍 DEBUG: Division filter check:', {
			requestId: request.id,
			employeeEmail: request.employee_email,
			employeeDivision,
			managerEmail: currentUserEmail,
			managerDivision,
			isMatch
		});

		return isMatch;
	}

	/**
	 * @param {any[]} requests
	 * @param {string} search
	 * @param {string} status
	 * @param {string} type
	 */
	function filterRequests(requests, search, status, type) {
		let filtered = requests;

		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(req) =>
					req.employee_name?.toLowerCase().includes(searchLower) ||
					req.nama?.toLowerCase().includes(searchLower) ||
					req.employee_email?.toLowerCase().includes(searchLower) ||
					req.email?.toLowerCase().includes(searchLower) ||
					req.reason?.toLowerCase().includes(searchLower) ||
					req.keterangan?.toLowerCase().includes(searchLower) ||
					getCategoryName(req.leave_type || req.kategori)
						?.toLowerCase()
						.includes(searchLower) ||
					req.divisi?.toLowerCase().includes(searchLower) ||
					req.division?.toLowerCase().includes(searchLower)
			);
		}

		if (status !== 'all') {
			filtered = filtered.filter((req) => req.status === status);
		}

		if (type !== 'all') {
			// If type is a category ID, filter by category
			if (type === 'hours' || type === 'days') {
				// Legacy support for hours/days filter
				filtered = filtered.filter((req) => req.type === type);
			} else {
				// Filter by category ID or name
				const selectedCategory = leaveCategories.find((cat) => cat.id.toString() === type);
				if (selectedCategory) {
					filtered = filtered.filter((req) => {
						const requestCategoryName = getCategoryName(req.leave_type || req.kategori);
						return requestCategoryName?.toLowerCase() === selectedCategory.nama.toLowerCase();
					});
				} else {
					// Fallback: try to match by name directly
					filtered = filtered.filter((req) => {
						const requestCategoryName = getCategoryName(req.leave_type || req.kategori);
						return requestCategoryName?.toLowerCase() === type.toLowerCase();
					});
				}
			}
		}

		return filtered;
	}

	/**
	 * @param {any[]} data
	 * @param {number} page
	 * @param {number} perPage
	 */
	function paginateData(data, page, perPage) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return data.slice(start, end);
	}

	/** @param {string} status */
	function getStatusClass(status) {
		switch (status) {
			case 'pending':
				return 'status-pending';
			case 'approved':
				return 'status-approved';
			case 'rejected':
				return 'status-rejected';
			default:
				return 'status-pending';
		}
	}

	/** @param {string} status */
	function getStatusText(status) {
		switch (status) {
			case 'pending':
				return 'Menunggu';
			case 'approved':
				return 'Disetujui';
			case 'rejected':
				return 'Ditolak';
			default:
				return 'Menunggu';
		}
	}

	/** @param {string} dateString */
	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	/** @param {string} type */
	function getTypeText(type) {
		switch (type) {
			case 'hours':
				return 'Izin Jam';
			case 'days':
				return 'Izin Hari';
			default:
				return type;
		}
	}

	/** @param {string} type */
	function getTypeBadgeClass(type) {
		switch (type) {
			case 'hours':
				return 'type-hours';
			case 'days':
				return 'type-days';
			default:
				return 'type-hours';
		}
	}

	/** @param {any} request */
	async function approveRequest(request) {
		try {
			const result = await approveLeaveRequestMultiLevel(request);
			if (result.success) {
				// Reload data to get updated approval status
				await loadLeaveRequests();
				console.log('✅ Request approved successfully:', result.success ? 'Approved' : 'Failed');
			} else {
				console.error('❌ Failed to approve request:', result.error);
				alert('Gagal menyetujui pengajuan: ' + result.error);
			}
		} catch (error) {
			console.error('Error approving request:', error);
			alert('Terjadi kesalahan saat menyetujui pengajuan');
		}
	}

	/** @param {any} request */
	async function rejectRequest(request) {
		// Open rejection modal instead of using prompt
		rejectionRequest = request;
		rejectionReason = '';
		showRejectionModal = true;
	}

	/**
	 * Submit rejection with reason from modal
	 */
	async function submitRejection() {
		if (!rejectionReason.trim()) {
			alert('Mohon masukkan alasan penolakan');
			return;
		}

		try {
			const result = await rejectLeaveRequestMultiLevel(
				rejectionRequest,
				'',
				rejectionReason.trim()
			);
			if (result.success) {
				// Close modal and reload data
				closeRejectionModal();
				await loadLeaveRequests();
				console.log('✅ Request rejected successfully:', result.success ? 'Rejected' : 'Failed');
			} else {
				console.error('❌ Failed to reject request:', result.error);
				alert('Gagal menolak pengajuan: ' + result.error);
			}
		} catch (error) {
			console.error('Error rejecting request:', error);
			alert('Terjadi kesalahan saat menolak pengajuan');
		}
	}

	/**
	 * Close rejection modal
	 */
	function closeRejectionModal() {
		showRejectionModal = false;
		rejectionRequest = null;
		rejectionReason = '';
	}

	/**
	 * Check if request has attachment
	 * @param {any} request
	 */
	function hasAttachment(request) {
		return !!(request.attachment || request.lampiran);
	}

	/**
	 * Get attachment URL or filename
	 * @param {any} request
	 */
	function getAttachmentUrl(request) {
		const attachment = request.attachment || request.lampiran;
		if (!attachment) return null;

		// If it's a full URL, return as is
		if (attachment.startsWith('http://') || attachment.startsWith('https://')) {
			return attachment;
		}

		// If it's a Directus file ID or path, construct the URL
		const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
		if (attachment.includes('/')) {
			// It's already a path
			return `${directusUrl}/assets/${attachment}`;
		} else {
			// It's a file ID
			return `${directusUrl}/assets/${attachment}`;
		}
	}

	/** @param {any} request */
	function openAttachmentModal(request) {
		currentRequest = request;
		currentAttachment = getAttachmentUrl(request);
		showAttachmentModal = true;
	}

	function closeAttachmentModal() {
		showAttachmentModal = false;
		currentRequest = null;
		currentAttachment = null;
	}

	/**
	 * Get file extension from attachment
	 * @param {any} request
	 */
	function getFileExtension(request) {
		const attachment = request.attachment || request.lampiran;
		if (!attachment) return '';

		const parts = attachment.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
	}

	/**
	 * Check if attachment is an image
	 * @param {any} request
	 */
	function isImageAttachment(request) {
		const ext = getFileExtension(request);
		return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
	}

	/**
	 * Download attachment
	 */
	function downloadAttachment() {
		if (currentAttachment) {
			const link = document.createElement('a');
			link.href = currentAttachment;
			link.download = currentRequest?.attachment || currentRequest?.lampiran || 'attachment';
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	/**
	 * Show approval detail modal
	 * @param {any} request
	 */
	function showApprovalDetail(request) {
		console.log('🔍 Opening approval detail modal for:', request);
		selectedRequestForApproval = request;
		showApprovalDetailModal = true;
		console.log('🔍 Modal state:', { showApprovalDetailModal, selectedRequestForApproval });
	}

	/**
	 * Close approval detail modal
	 */
	function closeApprovalDetailModal() {
		showApprovalDetailModal = false;
		selectedRequestForApproval = null;
	}

	/**
	 * Open category modal
	 */
	function openCategoryModal() {
		showCategoryModal = true;
		newCategoryName = '';
	}

	/**
	 * Close category modal
	 */
	function closeCategoryModal() {
		showCategoryModal = false;
		newCategoryName = '';
		savingCategory = false;
	}

	/**
	 * Show toast notification
	 * @param {string} message
	 * @param {string} type
	 */
	function showToastMessage(message, type = 'success') {
		toastMessage = message;
		toastType = type;
		showToast = true;

		// Auto hide toast after 3 seconds
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	/**
	 * Save new leave category
	 */
	async function saveCategory() {
		if (!newCategoryName.trim()) {
			showToastMessage('Mohon masukkan nama kategori', 'error');
			return;
		}

		try {
			savingCategory = true;

			const result = await createLeaveCategory(newCategoryName.trim());

			if (result.success) {
				console.log('✅ Category saved successfully:', result.data);
				showToastMessage(result.message || 'Kategori berhasil ditambahkan', 'success');
				closeCategoryModal();
				// Reload categories to update the dropdown
				await loadLeaveCategories();
			} else {
				console.error('❌ Failed to save category:', result.error);
				showToastMessage(result.message || 'Gagal menyimpan kategori', 'error');
			}
		} catch (error) {
			console.error('Error saving category:', error);
			showToastMessage('Terjadi kesalahan saat menyimpan kategori', 'error');
		} finally {
			savingCategory = false;
		}
	}

	/**
	 * Debug function to log filter behavior
	 * @param {string} type
	 */
	function debugFilterCategory(type) {
		if (type !== 'all') {
			console.log('🔍 Filter Debug:', {
				selectedType: type,
				availableCategories: leaveCategories.map((cat) => ({ id: cat.id, nama: cat.nama })),
				sampleRequests: leaveRequests.slice(0, 3).map((req) => ({
					id: req.id,
					leave_type: req.leave_type,
					kategori: req.kategori,
					computed_name: getCategoryName(req.leave_type || req.kategori)
				}))
			});
		}
	}

	// Debug reactive statement
	$: if (typeFilter) {
		debugFilterCategory(typeFilter);
	}

	/**
	 * Get category name from ID or return the value if it's already a name
	 * @param {any} categoryValue - Category ID or name
	 * @returns {string} Category name
	 */
	function getCategoryName(categoryValue) {
		// If it's already an object with nama property, return it
		if (categoryValue && typeof categoryValue === 'object' && categoryValue.nama) {
			return categoryValue.nama;
		}

		// If it's a number (ID), try to find the name from leaveCategories
		if (
			typeof categoryValue === 'number' ||
			(typeof categoryValue === 'string' && !isNaN(Number(categoryValue)))
		) {
			const categoryId = Number(categoryValue);
			const category = leaveCategories.find((cat) => cat.id === categoryId);
			return category ? category.nama : `Kategori ${categoryId}`;
		}

		// If it's already a string (name), return it
		return typeof categoryValue === 'string' ? categoryValue : 'Tidak ada kategori';
	}

	/**
	 * Load annual leave data for an employee
	 * @param {string} userIdOrEmail - User ID or email
	 * @param {number} year - Year to calculate for
	 */
	async function loadAnnualLeaveData(userIdOrEmail, year = new Date().getFullYear()) {
		if (!userIdOrEmail) return null;

		const cacheKey = `${userIdOrEmail}-${year}`;
		
		// Return cached data if available
		if (annualLeaveCache.has(cacheKey)) {
			return annualLeaveCache.get(cacheKey);
		}

		// Prevent multiple simultaneous requests for the same user
		if (loadingAnnualLeave.has(cacheKey)) {
			return null;
		}

		try {
			loadingAnnualLeave.add(cacheKey);
			console.log('🏖️ Loading annual leave data for:', userIdOrEmail);

			const result = await calculateRemainingAnnualLeave(userIdOrEmail, year);
			
			if (result.success && result.data) {
				annualLeaveCache.set(cacheKey, result.data);
				// Trigger reactivity
				annualLeaveCache = annualLeaveCache;
				return result.data;
			} else {
				console.warn('Failed to load annual leave data:', 'Service returned no data');
				return null;
			}
		} catch (error) {
			console.error('Error loading annual leave data:', error);
			return null;
		} finally {
			loadingAnnualLeave.delete(cacheKey);
		}
	}

	/**
	 * Get annual leave data for display
	 * @param {any} request - Leave request object
	 */
	function getAnnualLeaveData(request) {
		if (!request) return null;

		const categoryName = getCategoryName(request.leave_type || request.kategori);
		if (!isAnnualLeaveCategory(categoryName)) {
			return null;
		}

		const userIdOrEmail = request.user_id || request.email || request.employee_email;
		const year = new Date().getFullYear();
		const cacheKey = `${userIdOrEmail}-${year}`;

		return annualLeaveCache.get(cacheKey) || null;
	}

	/**
	 * Load annual leave data for all annual leave requests in the current view
	 */
	async function loadAnnualLeaveForVisibleRequests() {
		const annualLeaveRequests = paginatedRequests.filter(request => {
			const categoryName = getCategoryName(request.leave_type || request.kategori);
			return isAnnualLeaveCategory(categoryName);
		});

		console.log('🏖️ Loading annual leave for', annualLeaveRequests.length, 'requests');

		// Load annual leave data for each unique user
		const uniqueUsers = [...new Set(annualLeaveRequests.map(req => 
			req.user_id || req.email || req.employee_email
		))].filter(Boolean);

		await Promise.all(uniqueUsers.map(userIdOrEmail => 
			loadAnnualLeaveData(userIdOrEmail)
		));
	}

	/**
	 * Calculate requested days for a leave request
	 * @param {any} request - Leave request object
	 */
	function getRequestedDays(request) {
		if (request.type === 'hours') return 0;
		
		const startDate = request.start_date || request.tanggal_mulai;
		const endDate = request.end_date || request.tanggal_selesai;
		
		if (!startDate || !endDate) return 1;
		
		return calculateDaysBetweenDates(startDate, endDate);
	}

	// Reactive statement to load annual leave data when requests change
	$: if (paginatedRequests.length > 0) {
		loadAnnualLeaveForVisibleRequests();
	}
</script>

<svelte:head>
	<title>Pengajuan Izin/Cuti - HRD System</title>
</svelte:head>

<div class="leave-requests-page">
	<!-- Annual Leave Summary -->
	{#if userFilteredRequests.some(req => isAnnualLeaveCategory(getCategoryName(req.leave_type || req.kategori)))}
		{@const annualLeaveRequests = userFilteredRequests.filter(req => isAnnualLeaveCategory(getCategoryName(req.leave_type || req.kategori)))}
		<div class="annual-leave-summary">
			<div class="summary-header">
				<h3>📊 Ringkasan Cuti Tahunan {new Date().getFullYear()}</h3>
				<p class="summary-description">
					Kuota cuti tahunan: <strong>{ANNUAL_LEAVE_SETTINGS.TOTAL_DAYS_PER_YEAR} hari</strong> per karyawan (1 Jan - 31 Des)
				</p>
				<div class="annual-leave-notice">
					<span class="notice-icon">ℹ️</span>
					<span class="notice-text">
						Sisa cuti tahunan ditampilkan otomatis untuk setiap pengajuan dengan kategori "Cuti Tahunan"
					</span>
				</div>
			</div>
			<div class="summary-stats">
				<div class="stat-card">
					<div class="stat-icon">📋</div>
					<div class="stat-content">
						<div class="stat-number">{annualLeaveRequests.length}</div>
						<div class="stat-label">Pengajuan Cuti Tahunan</div>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">✅</div>
					<div class="stat-content">
						<div class="stat-number">{annualLeaveRequests.filter(req => req.status === 'approved' || req.approval_stage === 'direktur').length}</div>
						<div class="stat-label">Sudah Disetujui</div>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">⏳</div>
					<div class="stat-content">
						<div class="stat-number">{annualLeaveRequests.filter(req => req.status === 'pending' || (req.approval_stage && req.approval_stage !== 'direktur')).length}</div>
						<div class="stat-label">Menunggu Persetujuan</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Header Actions -->
	<div class="page-actions">
		<!-- Connection Status -->
		<!-- {#if connectionStatus}
			<div class="connection-status {isConnected ? 'connected' : 'disconnected'}">
				{#if isConnected}
					🟢 Terhubung ke Directus
				{:else}
					🔴 Menggunakan data demo (Directus tidak tersedia)
				{/if}
			</div>
		{/if} -->

		<!-- 🔧 DEBUG: User & Division Info Panel -->
		<!-- {#if $userEmail}
			<div class="debug-panel">
				<div class="debug-title">🔍 DEBUG: Division Filtering Info</div>
				<div class="debug-content">
					<div class="debug-item">
						<strong>Current User:</strong>
						{$userEmail}
					</div>
					<div class="debug-item">
						<strong>Approval Level:</strong>
						{getCurrentUserApprovalLevel() || 'None'}
					</div>
					<div class="debug-item">
						<strong>Total Requests:</strong>
						{leaveRequests.length}
					</div>
					<div class="debug-item">
						<strong>After Status/Type Filter:</strong>
						{filteredRequests.length}
					</div>
					<div class="debug-item">
						<strong>After User Role Filter:</strong>
						{userFilteredRequests.length}
					</div>
					<div class="debug-item">
						<strong>Filter Mode:</strong>
						{#if getCurrentUserApprovalLevel() === APPROVAL_STAGES.MANAGER_DIVISI}
							Division + {showOnlyMyApprovals ? 'Pending Only' : 'All Stages'}
						{:else}
							{showOnlyMyApprovals ? 'Role-Based' : 'All Requests'}
						{/if}
					</div>
					<div class="debug-item">
						<strong>Currently Showing:</strong>
						{paginatedRequests.length} items
					</div>
				</div>
			</div>
		{/if} -->

		<div class="search-filters">
			<!-- Search -->
			<div class="filter-group">
				<!-- <label for="searchInput" class="filter-label">🔍 Pencarian</label> -->
				<input
					id="searchInput"
					type="text"
					placeholder="Cari nama karyawan, email, atau alasan..."
					bind:value={searchTerm}
					class="search-input"
				/>
			</div>

			<!-- Status Filter -->
			<div class="filter-group">
				<!-- <label for="statusFilter" class="filter-label">📊 Status</label> -->
				<select id="statusFilter" bind:value={statusFilter} class="status-filter">
					<option value="all">Semua Status</option>
					<option value="pending">Menunggu</option>
					<option value="approved">Disetujui</option>
					<option value="rejected">Ditolak</option>
				</select>
			</div>

			<!-- Type Filter -->
			<div class="filter-group">
				<!-- <label for="typeFilter" class="filter-label">
					📋 Kategori {#if leaveCategories.length > 0}({leaveCategories.length}){/if}
				</label> -->
				<select id="typeFilter" bind:value={typeFilter} class="type-filter">
					<option value="all">Semua Kategori</option>
					<!-- Type-based options -->
					<!-- <option value="hours">📝 Izin Jam</option>
					<option value="days">📅 Izin Hari</option> -->
					<!-- Separator -->
					<!-- {#if leaveCategories.length > 0}
						<option disabled>──────────────</option>
					{/if} -->
					<!-- Dynamic categories from Directus -->
					{#if categoriesLoading}
						<option disabled>⏳ Memuat kategori...</option>
					{:else if leaveCategories.length === 0}
						<option disabled>Tidak ada kategori tersimpan</option>
					{:else}
						{#each leaveCategories as category}
							<option value={category.id.toString()}>📋 {category.nama}</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- 🔧 NEW: Approval Filter Toggle -->
			{#if getCurrentUserApprovalLevel()}
				<div class="filter-group">
					<label class="toggle-container">
						<input type="checkbox" bind:checked={showOnlyMyApprovals} class="toggle-checkbox" />
						<span class="toggle-text">
							{#if getCurrentUserApprovalLevel() === APPROVAL_STAGES.MANAGER_DIVISI}
								{showOnlyMyApprovals ? '📋 Perlu Approval Saya' : '📝 Semua dari Divisi Saya'}
							{:else}
								{showOnlyMyApprovals ? '📋 Perlu Approval Saya' : '📝 Semua Request'}
							{/if}
						</span>
					</label>
				</div>
			{/if}
		</div>

		<div class="action-buttons">
			<button class="btn btn-primary" on:click={openCategoryModal}> ➕ Tambah Kategori </button>
			<!-- <button class="btn btn-secondary" on:click={loadLeaveCategories} disabled={categoriesLoading}>
				{#if categoriesLoading}
					⏳ Memuat...
				{:else}
					🔄 Refresh Kategori
				{/if}
			</button> -->
			<!-- <button class="btn btn-secondary" on:click={loadLeaveRequests}> 🔄 Refresh Data </button> -->
		</div>

		<!-- 🔧 NEW: Statistics Display -->
		<!-- <div class="stats-display>
			<div class="stat-item">
				<span class="stat-value">{userFilteredRequests.length}</span>
				<span class="stat-label">
					{showOnlyMyApprovals && getCurrentUserApprovalLevel() ? 'Perlu Approval' : 'Total Request'}
				</span>
			</div>
			{#if showOnlyMyApprovals && getCurrentUserApprovalLevel()}
				<div class="stat-item">
					<span class="stat-value">{leaveRequests.length}</span>
					<span class="stat-label">Total Semua</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{getCurrentUserApprovalLevel()}</span>
					<span class="stat-label">Level Saya</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">
						{getCurrentUserApprovalLevel() === 'manager_hrd' ? 'pending' : 
						 getCurrentUserApprovalLevel() === 'hrd_admin' ? 'manager_hrd' : 
						 getCurrentUserApprovalLevel() === 'direktur' ? 'hrd_admin' : 'unknown'}
					</span>
					<span class="stat-label">Stage Target</span>
				</div>
			{/if}
		</div> -->
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data pengajuan...</p>
			</div>
		{:else if leaveRequests.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<h3>Belum Ada Pengajuan</h3>
				<p>Belum ada pengajuan izin/cuti yang masuk.</p>
			</div>
		{:else}
			<!-- Requests Table -->
			<div class="table-container">
				<table class="requests-table">
					<thead>
						<tr>
							<th>Karyawan</th>
							<th>Kategori</th>
							<th>Tanggal Pengajuan</th>
							<th>Rentang Cuti</th>
							<!-- <th>Total Hari</th> -->
							<th>Keterangan</th>
							<th>Lampiran</th>
							<th>Status Approval</th>
							<!-- <th>Aksi</th> -->
						</tr>
					</thead>
					<tbody>
						{#each paginatedRequests as request}
							<tr>
								<td>
									<div class="employee-info">
										<div class="employee-avatar">
											{request.employee_name
												? request.employee_name.charAt(0).toUpperCase()
												: request.nama?.charAt(0).toUpperCase() || '?'}
										</div>
										<div class="employee-details">
											<div class="employee-name">{request.employee_name || request.nama}</div>
											<div class="employee-email">📧 {request.employee_email || request.email}</div>
											<div class="employee-meta">
												<span class="division-badge"
													>📍 {request.division || request.divisi || '-'}</span
												>
											</div>
										</div>
									</div>
								</td>
								<td>
									<div class="category-container">
										<span class="leave-category"
											>{getCategoryName(request.leave_type || request.kategori)}</span
										>
										
										<!-- Annual Leave Information -->
										{#if isAnnualLeaveCategory(getCategoryName(request.leave_type || request.kategori))}
											{@const annualLeaveData = getAnnualLeaveData(request)}
											{@const requestedDays = getRequestedDays(request)}
											
											{#if annualLeaveData}
												{@const displayInfo = formatRemainingLeaveDisplay(annualLeaveData.remainingDays, annualLeaveData.totalAnnualLeave)}
												{@const hasLatestUpdate = annualLeaveData.breakdown?.latestRequest}
												<div class="annual-leave-info {displayInfo.class}" style="color: {displayInfo.color}">
													<div class="leave-summary">
														<span class="leave-icon">🏖️</span>
														<span class="leave-text">{displayInfo.text}</span>
														{#if hasLatestUpdate}
															<span class="latest-indicator" title="Data terkini berdasarkan pengajuan terakhir">📊</span>
														{/if}
													</div>
													<div class="leave-details">
														<span class="detail-item">Disetujui: {annualLeaveData.usedDays} hari</span>
														{#if annualLeaveData.pendingDays > 0}
															<span class="detail-item pending-info">Menunggu: {annualLeaveData.pendingDays} hari</span>
														{/if}
														{#if requestedDays > 0}
															<span class="detail-item">Pengajuan ini: {requestedDays} hari</span>
															<span class="detail-item remaining-after" 
																style="color: {requestedDays > annualLeaveData.availableAfterPending ? '#ef4444' : '#059669'}">
																Sisa setelah: {Math.max(0, annualLeaveData.availableAfterPending - requestedDays)} hari
															</span>
														{/if}
														{#if annualLeaveData.breakdown?.totalRequests > 1}
															<span class="detail-item total-requests">
																Total pengajuan: {annualLeaveData.breakdown.totalRequests} 
																({annualLeaveData.breakdown.approvedCount} disetujui, {annualLeaveData.breakdown.pendingCount} menunggu)
															</span>
														{/if}
													</div>
												</div>
											{:else}
												<div class="annual-leave-loading">
													<span class="loading-icon">⏳</span>
													<span class="loading-text">Memuat data cuti...</span>
												</div>
											{/if}
										{/if}
										
										<!-- <span class="type-badge {getTypeBadgeClass(request.type)}">
											{getTypeText(request.type)}
										</span> -->
									</div>
								</td>
								<td>
									<div class="submission-date">
										<div class="date">
											{formatDate(request.submitted_date || request.tanggal_pengajuan)}
										</div>
									</div>
								</td>
								<td>
									<div class="date-range">
										{#if request.type === 'hours'}
											<div class="single-date">{formatDate(request.start_date)}</div>
											<div class="time-range">{request.dari_jam} - {request.sampai_jam}</div>
										{:else}
											<div class="start-date">
												{formatDate(request.start_date || request.tanggal_mulai)}
											</div>
											{#if request.start_date !== request.end_date && request.type === 'days'}
												<div class="date-separator">s.d</div>
												<div class="end-date">
													{formatDate(request.end_date || request.tanggal_selesai)}
												</div>
											{/if}
										{/if}
									</div>
								</td>
								<!-- <td>
									<span class="total-days">
										{#if request.type === 'hours'}
											<span class="hours-info">Izin Jam</span>
										{:else}
											{request.days || request.total_hari || 1} hari
										{/if}
									</span>
								</td> -->
								<td>
									<div class="reason" title={request.reason || request.keterangan}>
										{request.reason || request.keterangan || '-'}
									</div>
								</td>
								<td>
									<div class="attachment-cell">
										{#if hasAttachment(request)}
											<button
												class="btn-attachment"
												title="Lihat Lampiran: {request.attachment || request.lampiran}"
												on:click={() => openAttachmentModal(request)}
											>
												👁️ Preview
											</button>
										{:else}
											<span class="no-attachment">-</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="approval-status-mini">
										{#if request.approvalSummary}
											<span
												class="status-badge {getStatusClass(request.approvalSummary.overallStatus)}"
											>
												{getStageDisplayName(request.approvalSummary.currentStage)}
											</span>
										{:else}
											<span class="status-badge {getStatusClass(request.status)}">
												{getStatusText(request.status)}
											</span>
											{#if request.approved_by}
												<div class="approved-by">
													oleh {request.approved_by}
												</div>
											{/if}
										{/if}

										{#if canViewApprovalDetails()}
											<button
												class="btn-approval-detail"
												title="Lihat Detail Approval"
												on:click={() => {
													console.log('🔍 Button clicked for request:', request);
													showApprovalDetail(request);
												}}
											>
												📋
											</button>
										{:else}
											<!-- Debug: Show why button is not visible -->
											<!-- <span style="font-size: 10px; color: red;">No permission</span> -->
										{/if}
									</div>
								</td>
								<td>
									<div class="action-buttons">
										{#if request.availableActions && request.availableActions.includes('approve')}
											<button
												class="btn-action btn-approve"
												title="Setujui"
												on:click={() => approveRequest(request)}
											>
												✅
											</button>
										{/if}
										{#if request.availableActions && request.availableActions.includes('reject')}
											<button
												class="btn-action btn-reject"
												title="Tolak"
												on:click={() => rejectRequest(request)}
											>
												❌
											</button>
										{/if}
										<!-- {#if request.availableActions && request.availableActions.includes('view_details')}
											<button
												class="btn-action btn-detail"
												title="Detail Approval"
												on:click={() => showApprovalDetail(request)}
											>
												�
											</button>
										{/if} -->
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						class="btn-page"
						disabled={currentPage === 1}
						on:click={() => (currentPage = currentPage - 1)}
					>
						← Sebelumnya
					</button>

					<div class="page-numbers">
						{#each Array(totalPages) as _, i}
							<button
								class="btn-page {currentPage === i + 1 ? 'active' : ''}"
								on:click={() => (currentPage = i + 1)}
							>
								{i + 1}
							</button>
						{/each}
					</div>

					<button
						class="btn-page"
						disabled={currentPage === totalPages}
						on:click={() => (currentPage = currentPage + 1)}
					>
						Selanjutnya →
					</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Filter Status Info -->
	<!-- {#if searchTerm || statusFilter !== 'all' || typeFilter !== 'all'}
		<div class="filter-info">
			<span class="filter-info-label">🔍 Filter aktif:</span>
			{#if searchTerm}
				<span class="filter-tag">Pencarian: "{searchTerm}"</span>
			{/if}
			{#if statusFilter !== 'all'}
				<span class="filter-tag">Status: {statusFilter}</span>
			{/if}
			{#if typeFilter !== 'all'}
				<span class="filter-tag">
					Kategori: {typeFilter === 'hours' ? 'Izin Jam' : 
							  typeFilter === 'days' ? 'Izin Hari' : 
							  leaveCategories.find(cat => cat.id.toString() === typeFilter)?.nama || typeFilter}
				</span>
			{/if}
			<span class="filter-count">({userFilteredRequests.length} hasil)</span>
		</div>
	{/if} -->

	<!-- Attachment Modal -->
	{#if showAttachmentModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click={closeAttachmentModal}
			on:keydown={(e) => e.key === 'Escape' && closeAttachmentModal()}
		>
			<div
				class="modal-content"
				role="button"
				tabindex="0"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>
						👁️ Lampiran Pengajuan
						{#if currentRequest}
							- {currentRequest.employee_name || currentRequest.nama}
						{/if}
					</h3>
					<button class="btn-close" on:click={closeAttachmentModal}>✖️</button>
				</div>
				<div class="modal-body">
					{#if currentAttachment}
						{#if currentRequest && isImageAttachment(currentRequest)}
							<!-- Image Preview -->
							<div class="attachment-preview image-preview">
								<img
									src={currentAttachment}
									alt="Lampiran - {currentRequest.attachment || currentRequest.lampiran}"
									on:error={() => {
										console.error('Failed to load image');
									}}
								/>
							</div>
						{:else if currentAttachment.toLowerCase().includes('.pdf')}
							<!-- PDF Preview -->
							<div class="attachment-preview pdf-preview">
								<embed src={currentAttachment} type="application/pdf" width="100%" height="500px" />
							</div>
						{:else}
							<!-- File Info for other types -->
							<div class="attachment-preview file-preview">
								<div class="file-icon">📄</div>
								<div class="file-info">
									<p class="file-name">{currentRequest?.attachment || currentRequest?.lampiran}</p>
									<p class="file-type">
										File Type: {getFileExtension(currentRequest || {}).toUpperCase()}
									</p>
								</div>
							</div>
						{/if}

						<!-- Download Actions -->
						<div class="modal-actions">
							<button class="btn btn-download" on:click={downloadAttachment}> ⬇️ Download </button>
							<button
								class="btn btn-open"
								on:click={() => window.open(currentAttachment, '_blank')}
							>
								🔗 Buka di Tab Baru
							</button>
						</div>
					{:else}
						<div class="no-attachment">
							<div class="empty-icon">📎</div>
							<p>Tidak ada lampiran yang tersedia untuk pengajuan ini.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Approval Detail Modal -->
	{#if showApprovalDetailModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click|self={closeApprovalDetailModal}
			on:keydown={(e) => e.key === 'Escape' && closeApprovalDetailModal()}
		>
			<div class="modal-content">
				<div class="modal-header">
					<h3>
						📋 Detail Approval Pengajuan
						{#if selectedRequestForApproval}
							- {selectedRequestForApproval.employee_name || selectedRequestForApproval.nama}
						{/if}
					</h3>
					<button class="btn-close" on:click={closeApprovalDetailModal}>✖️</button>
				</div>
				<div class="modal-body">
					{#if selectedRequestForApproval}
						<ApprovalStatus request={selectedRequestForApproval} type="leave" />
					{:else}
						<div class="no-detail">
							<p>Tidak ada detail approval yang tersedia untuk pengajuan ini.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Rejection Modal -->
	{#if showRejectionModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click={closeRejectionModal}
			on:keydown={(e) => e.key === 'Escape' && closeRejectionModal()}
		>
			<div
				class="modal-content rejection-modal"
				role="button"
				tabindex="0"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>
						❌ Tolak Pengajuan Cuti/Izin
						{#if rejectionRequest}
							- {rejectionRequest.employee_name || rejectionRequest.nama}
						{/if}
					</h3>
					<button class="btn-close" on:click={closeRejectionModal}>✖️</button>
				</div>
				<div class="modal-body">
					{#if rejectionRequest}
						<div class="rejection-info">
							<div class="info-row">
								<span class="label">📅 Periode:</span>
								<span class="value"
									>{rejectionRequest.start_date} - {rejectionRequest.end_date}</span
								>
							</div>
							<div class="info-row">
								<span class="label">📝 Jenis:</span>
								<span class="value">{rejectionRequest.leave_type || rejectionRequest.jenis}</span>
							</div>
							{#if rejectionRequest.keterangan}
								<div class="info-row">
									<span class="label">📄 Keterangan:</span>
									<span class="value">{rejectionRequest.keterangan}</span>
								</div>
							{/if}
						</div>

						<div class="rejection-form">
							<label for="rejectionReason" class="form-label">
								<span class="required">*</span> Alasan Penolakan:
							</label>
							<textarea
								id="rejectionReason"
								bind:value={rejectionReason}
								placeholder="Masukkan alasan penolakan yang jelas dan spesifik..."
								rows="4"
								class="rejection-textarea"
								required
							></textarea>
							<p class="form-hint">
								💡 Alasan penolakan akan dilihat oleh karyawan untuk memahami mengapa pengajuan
								ditolak.
							</p>
						</div>

						<div class="modal-actions">
							<button class="btn btn-secondary" on:click={closeRejectionModal} type="button">
								Batal
							</button>
							<button
								class="btn btn-danger"
								on:click={submitRejection}
								disabled={!rejectionReason.trim()}
								type="button"
							>
								❌ Tolak Pengajuan
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Category Modal (New) -->
	{#if showCategoryModal}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			on:click={closeCategoryModal}
			on:keydown={(e) => e.key === 'Escape' && closeCategoryModal()}
		>
			<div
				class="modal-content category-modal"
				role="button"
				tabindex="0"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>➕ Tambah Kategori Izin/Cuti Baru</h3>
					<button class="btn-close" on:click={closeCategoryModal}>✖️</button>
				</div>
				<div class="modal-body">
					<div class="category-form">
						<label for="categoryName" class="form-label">
							<span class="required">*</span> Nama Kategori:
						</label>
						<input
							type="text"
							id="categoryName"
							bind:value={newCategoryName}
							placeholder="Contoh: Cuti Tahunan, Izin Sakit, dsb."
							class="category-input"
							disabled={savingCategory}
							required
							on:keydown={(e) => {
								if (e.key === 'Enter' && !savingCategory && newCategoryName.trim()) {
									saveCategory();
								}
							}}
						/>
						<p class="form-hint">
							💡 Nama kategori akan ditampilkan sebagai pilihan saat karyawan mengajukan izin/cuti
						</p>
					</div>

					<div class="modal-actions">
						<button
							class="btn btn-secondary"
							on:click={closeCategoryModal}
							type="button"
							disabled={savingCategory}
						>
							Batal
						</button>
						<button
							class="btn btn-primary"
							on:click={saveCategory}
							disabled={!newCategoryName.trim() || savingCategory}
							type="button"
						>
							{#if savingCategory}
								⏳ Menyimpan...
							{:else}
								💾 Simpan Kategori
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Toast Notification -->
	{#if showToast}
		<div class="toast-notification toast-{toastType}" class:show={showToast}>
			<div class="toast-content">
				<span class="toast-icon">
					{#if toastType === 'success'}
						✅
					{:else if toastType === 'error'}
						❌
					{:else}
						ℹ️
					{/if}
				</span>
				<span class="toast-message">{toastMessage}</span>
				<button class="toast-close" on:click={() => (showToast = false)}>✖️</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.leave-requests-page {
		padding: 24px;
	}

	.page-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.search-filters {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-label {
		font-size: 12px;
		font-weight: 500;
		color: #374151;
		margin-bottom: 2px;
	}

	.search-input,
	.status-filter,
	.type-filter {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 200px;
	}

	.search-input:focus,
	.status-filter:focus,
	.type-filter:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* 🔧 NEW: Toggle styles */
	.toggle-container {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: white;
		min-width: 200px;
		transition: all 0.2s ease;
	}

	.toggle-container:hover {
		border-color: #3b82f6;
		background: #f9fafb;
	}

	.toggle-checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.toggle-text {
		font-size: 14px;
		font-weight: 500;
		user-select: none;
	}

	/* 🔧 NEW: Statistics styles */
	.stats-display {
		display: flex;
		gap: 16px;
		margin: 16px 0;
		padding: 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-value {
		font-size: 20px;
		font-weight: bold;
		color: #1e40af;
	}

	.stat-label {
		font-size: 12px;
		color: #64748b;
		text-align: center;
	}

	.btn {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
	}

	.btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.content-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.loading-state,
	.empty-state {
		padding: 60px 20px;
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #f3f4f6;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.table-container {
		overflow-x: auto;
	}

	.requests-table {
		width: 100%;
		border-collapse: collapse;
	}

	.requests-table th,
	.requests-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #f1f5f9;
	}

	.requests-table th {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		font-size: 14px;
	}

	.requests-table td {
		font-size: 14px;
		color: #64748b;
	}

	.requests-table tr:hover {
		background: #f8fafc;
	}

	.employee-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.employee-avatar {
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 14px;
	}

	.employee-name {
		font-weight: 500;
		color: #1e293b;
	}

	.employee-meta {
		display: flex;
		gap: 0.5rem;
		margin: 0.25rem 0;
		font-size: 0.75rem;
		color: #4b5563;
	}

	.employee-id,
	.division-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background-color: #f3f4f6;
	}

	.employee-id {
		color: #1f2937;
	}

	.division-badge {
		color: #1f2937;
		background-color: #e5e7eb;
	}

	.employee-email {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #4b5563;
	}

	.leave-type {
		padding: 4px 8px;
		background: #e0f2fe;
		color: #0369a1;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.date-range {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
	}

	.date-separator {
		color: #9ca3af;
	}

	.duration {
		font-weight: 500;
		color: #1e293b;
	}

	.reason {
		max-width: 200px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-approved {
		background: #dcfce7;
		color: #166534;
	}

	.status-rejected {
		background: #fee2e2;
		color: #991b1b;
	}

	.action-buttons {
		display: flex;
		gap: 6px;
		justify-content: center;
	}

	.btn-action {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: #f1f5f9;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-action:hover {
		background: #e2e8f0;
		transform: scale(1.1);
	}

	.btn-approve {
		background: #dcfce7 !important;
	}

	.btn-approve:hover {
		background: #bbf7d0 !important;
	}

	.btn-reject {
		background: #fee2e2 !important;
	}

	.btn-reject:hover {
		background: #fecaca !important;
	}

	.pagination {
		padding: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		border-top: 1px solid #f1f5f9;
	}

	.btn-page {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.btn-page:hover:not(:disabled) {
		background: #f8fafc;
	}

	.btn-page.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.btn-page:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-numbers {
		display: flex;
		gap: 4px;
	}

	/* Enhanced styling for new columns */
	.category-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.leave-category {
		padding: 4px 8px;
		background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
		color: #0369a1;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		border: 1px solid #bae6fd;
	}

	/* Annual Leave Summary */
	.annual-leave-summary {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border: 1px solid #cbd5e1;
		border-radius: 12px;
		padding: 24px;
		margin: 20px 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.summary-header {
		margin-bottom: 20px;
	}

	.summary-header h3 {
		color: #1e293b;
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.summary-description {
		color: #64748b;
		font-size: 0.95rem;
		margin-bottom: 12px;
	}

	.annual-leave-notice {
		background: #dbeafe;
		border: 1px solid #93c5fd;
		border-radius: 8px;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.notice-icon {
		font-size: 1.2rem;
		color: #1e40af;
	}

	.notice-text {
		color: #1e40af;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.stat-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.1);
	}

	.stat-icon {
		font-size: 2rem;
		opacity: 0.8;
	}

	.stat-content {
		flex: 1;
	}

	.stat-number {
		font-size: 1.8rem;
		font-weight: 700;
		color: #1e293b;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.85rem;
		color: #64748b;
		margin-top: 4px;
		font-weight: 500;
	}

	/* Annual Leave Information Styles */
	.annual-leave-info {
		margin-top: 6px;
		padding: 6px 8px;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 6px;
		border: 1px solid currentColor;
		font-size: 11px;
	}

	.annual-leave-info.remaining-leave-good {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
	}

	.annual-leave-info.remaining-leave-low {
		background: rgba(245, 158, 11, 0.1);
		border-color: rgba(245, 158, 11, 0.3);
	}

	.annual-leave-info.remaining-leave-empty {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.leave-summary {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-bottom: 4px;
		font-weight: 600;
	}

	.leave-icon {
		font-size: 10px;
	}

	.latest-indicator {
		font-size: 8px;
		opacity: 0.8;
		cursor: help;
	}

	.leave-text {
		font-size: 10px;
		line-height: 1.2;
	}

	.leave-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 9px;
		color: #64748b;
	}

	.detail-item.pending-info {
		color: #d97706;
		font-weight: 500;
	}

	.detail-item.total-requests {
		color: #6b7280;
		font-style: italic;
		padding-top: 2px;
		border-top: 1px solid rgba(255, 255, 255, 0.3);
		margin-top: 2px;
	}

	.detail-item {
		display: block;
		line-height: 1.3;
	}

	.detail-item.remaining-after {
		font-weight: 600;
		margin-top: 2px;
	}

	.annual-leave-loading {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: rgba(148, 163, 184, 0.1);
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 4px;
		font-size: 9px;
		color: #64748b;
		margin-top: 6px;
	}

	.annual-leave-loading .loading-icon {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.submission-date {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.submission-date .date {
		font-weight: 500;
		color: #1e293b;
		font-size: 13px;
	}

	.total-days {
		font-weight: 600;
		color: #1e293b;
		padding: 4px 8px;
		background: #f0fdf4;
		border-radius: 6px;
		text-align: center;
		border: 1px solid #bbf7d0;
	}

	.hours-info {
		font-size: 11px;
		color: #059669;
		font-weight: 500;
	}

	.attachment-cell {
		text-align: center;
	}

	.btn-attachment {
		padding: 4px 8px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.btn-attachment:hover {
		background: linear-gradient(135deg, #d97706, #b45309);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.no-attachment {
		color: #9ca3af;
		font-size: 12px;
	}

	.single-date {
		font-weight: 500;
		color: #1e293b;
	}

	.time-range {
		font-size: 11px;
		color: #059669;
		font-weight: 500;
		padding: 2px 6px;
		background: #f0fdf4;
		border-radius: 4px;
		margin-top: 2px;
	}

	/* Connection Status */
	.connection-status {
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.connection-status.connected {
		background: #d1fae5;
		color: #059669;
	}

	.connection-status.disconnected {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Type Filter */
	.type-filter {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 150px;
	}

	.type-filter:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Type Badge */
	.type-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.type-badge {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.type-badge.type-hours {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.type-badge.type-days {
		background: #fef3c7;
		color: #d97706;
	}

	/* Employee Email */
	.employee-email {
		font-size: 11px;
		color: #6b7280;
		font-style: italic;
	}

	/* Time Range for Hours */
	.time-range {
		font-size: 12px;
		color: #6b7280;
		margin-top: 2px;
	}

	/* Attachment */
	.attachment {
		font-size: 11px;
		color: #3b82f6;
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	/* Approved By */
	.approved-by {
		font-size: 11px;
		color: #6b7280;
		margin-top: 4px;
	}

	/* Secondary Button */
	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 20px;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8fafc;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
		color: #1f2937;
	}

	.modal-body {
		padding: 20px;
		flex: 1;
		overflow-y: auto;
	}

	.btn-close {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 18px;
		color: #6b7280;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.btn-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	/* Attachment Preview */
	.attachment-preview {
		width: 100%;
		margin-bottom: 20px;
	}

	.image-preview {
		text-align: center;
	}

	.image-preview img {
		max-width: 100%;
		max-height: 500px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.pdf-preview embed {
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.file-preview {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 24px;
		background: #f8fafc;
		border-radius: 8px;
		border: 2px dashed #d1d5db;
	}

	.file-icon {
		font-size: 48px;
	}

	.file-info {
		flex: 1;
	}

	.file-name {
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 8px 0;
	}

	.file-type {
		font-size: 14px;
		color: #6b7280;
		margin: 0;
	}

	/* Modal Actions */
	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
		padding-top: 16px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-download,
	.btn-open {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-download {
		background: #3b82f6;
		color: white;
	}

	.btn-download:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn-open {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-open:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	/* No Attachment State */
	.no-attachment {
		text-align: center;
		padding: 40px 20px;
		color: #6b7280;
	}

	.no-attachment .empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	/* Attachment Button */
	.btn-attachment {
		background: #8b5cf6;
		color: white;
	}

	.btn-attachment:hover {
		background: #7c3aed;
	}

	/* Approval Detail */
	.approval-details {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.approval-stage {
		padding: 16px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f9fafb;
	}

	.stage-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.stage-name {
		font-size: 14px;
		font-weight: 500;
		color: #1f2937;
	}

	.stage-status {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
	}

	.stage-content {
		font-size: 14px;
		color: #374151;
	}

	.approval-status-mini {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.btn-approval-detail {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 12px;
		color: #6c757d;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-approval-detail:hover {
		background: #e9ecef;
		color: #495057;
	}

	/* Rejection Modal Styles */
	.rejection-modal {
		max-width: 600px;
	}

	.rejection-info {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.info-row {
		display: flex;
		align-items: flex-start;
		margin-bottom: 8px;
		gap: 12px;
	}

	.info-row:last-child {
		margin-bottom: 0;
	}

	.info-row .label {
		font-weight: 500;
		color: #374151;
		min-width: 100px;
		flex-shrink: 0;
	}

	.info-row .value {
		color: #1f2937;
		flex: 1;
	}

	.rejection-form {
		margin-bottom: 24px;
	}

	.form-label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 8px;
		font-size: 14px;
	}

	.form-label .required {
		color: #dc2626;
		margin-right: 4px;
	}

	.rejection-textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
		min-height: 100px;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.rejection-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.rejection-textarea::placeholder {
		color: #9ca3af;
	}

	.form-hint {
		margin-top: 8px;
		font-size: 12px;
		color: #6b7280;
		line-height: 1.4;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 10px 20px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.btn-danger {
		background: #dc2626;
		color: white;
		border: 1px solid #dc2626;
		padding: 10px 20px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b91c1c;
		border-color: #b91c1c;
	}

	.btn-danger:disabled {
		background: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Category Modal Styles */
	.category-modal {
		max-width: 500px;
	}

	.category-form {
		margin-bottom: 24px;
	}

	.category-input {
		width: 100%;
		padding: 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.category-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.category-input:disabled {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.category-input::placeholder {
		color: #9ca3af;
	}

	/* Toast Notification Styles */
	.toast-notification {
		position: fixed;
		top: 20px;
		right: 20px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 2000;
		border-left: 4px solid;
		transform: translateX(100%);
		opacity: 0;
		transition: all 0.3s ease;
		max-width: 400px;
		min-width: 300px;
	}

	.toast-notification.show {
		transform: translateX(0);
		opacity: 1;
	}

	.toast-notification.toast-success {
		border-left-color: #10b981;
	}

	.toast-notification.toast-error {
		border-left-color: #ef4444;
	}

	.toast-notification.toast-info {
		border-left-color: #3b82f6;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
	}

	.toast-icon {
		font-size: 18px;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: 14px;
		color: #374151;
		font-weight: 500;
	}

	.toast-close {
		background: transparent;
		border: none;
		cursor: pointer;
		color: #9ca3af;
		font-size: 12px;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	/* Filter info styling */
	.filter-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 16px 24px;
		padding: 12px 16px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 13px;
		flex-wrap: wrap;
	}

	.filter-info-label {
		font-weight: 600;
		color: #475569;
	}

	.filter-tag {
		padding: 4px 8px;
		background: #e0f2fe;
		color: #0369a1;
		border-radius: 4px;
		font-weight: 500;
		border: 1px solid #bae6fd;
	}

	.filter-count {
		padding: 4px 8px;
		background: #f0fdf4;
		color: #059669;
		border-radius: 4px;
		font-weight: 600;
		border: 1px solid #bbf7d0;
	}
</style>
