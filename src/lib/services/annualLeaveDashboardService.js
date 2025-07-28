/**
 * Service untuk Dashboard Admin - Annual Leave Management
 * Mengelola data cuti tahunan semua karyawan untuk tampilan admin
 */

import api from './api.js';
import { calculateRemainingAnnualLeave } from './annualLeaveService.js';

const ANNUAL_LEAVE_QUOTA = 12; // Alokasi cuti tahunan per karyawan

/**
 * Mengambil ringkasan data cuti tahunan untuk dashboard admin
 * @param {number} year - Tahun yang ingin dianalisa
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getAnnualLeaveDashboardSummary(year = new Date().getFullYear()) {
	try {
		console.log('📊 Fetching dashboard summary for year:', year);

		// 1. Ambil semua data karyawan aktif
		const employeesResponse = await api.get(`/items/register?fields=id,nama_lengkap,jabatan,divisi,email,tanggal_mulai_kerja&filter[status][_eq]=aktif`);
		const employees = employeesResponse.data.data || [];

		// 2. Ambil semua data cuti tahunan untuk tahun tersebut
		const startDate = `${year}-01-01`;
		const endDate = `${year}-12-31`;
		const leaveResponse = await api.get(`/items/izin_hari?fields=*,kategori.nama,user_id&filter[tanggal_mulai][_gte]=${startDate}&filter[tanggal_mulai][_lte]=${endDate}&filter[status][_eq]=approved`);
		const allLeaveRequests = leaveResponse.data.data || [];

		// 3. Filter hanya cuti tahunan
		const annualLeaveRequests = allLeaveRequests.filter((/** @type {any} */ leave) => {
			const categoryName = leave.kategori?.nama || '';
			return categoryName.toLowerCase().includes('cuti tahunan') || categoryName.toLowerCase().includes('annual leave');
		});

		// 4. Proses data per karyawan
		const employeeStats = employees.map((/** @type {any} */ employee) => {
			// Ambil semua cuti tahunan karyawan ini
			const employeeLeaves = annualLeaveRequests.filter((/** @type {any} */ leave) => 
				leave.user_id === employee.id || leave.email === employee.email
			);

			// Hitung total hari cuti yang digunakan
			const usedDays = employeeLeaves.reduce((/** @type {number} */ total, /** @type {any} */ leave) => {
				const startDate = new Date(leave.tanggal_mulai);
				const endDate = new Date(leave.tanggal_selesai);
				const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
				return total + Math.max(daysDiff, 1);
			}, 0);

			const remainingDays = Math.max(0, ANNUAL_LEAVE_QUOTA - usedDays);
			const usagePercentage = Math.round((usedDays / ANNUAL_LEAVE_QUOTA) * 100);

			// Status indicator
			let status = 'good';
			let statusLabel = 'Baik';
			let statusColor = '#10b981';

			if (remainingDays <= 0) {
				status = 'critical';
				statusLabel = 'Habis';
				statusColor = '#ef4444';
			} else if (remainingDays <= 3) {
				status = 'warning';
				statusLabel = 'Sedikit';
				statusColor = '#f59e0b';
			}

			return {
				employee: {
					id: employee.id,
					nama_lengkap: employee.nama_lengkap,
					jabatan: employee.jabatan,
					divisi: employee.divisi,
					email: employee.email,
					tanggal_mulai_kerja: employee.tanggal_mulai_kerja
				},
				allocation: ANNUAL_LEAVE_QUOTA,
				usedDays,
				remainingDays,
				usagePercentage,
				status,
				statusLabel,
				statusColor,
				leaveHistory: employeeLeaves.map((/** @type {any} */ leave) => ({
					id: leave.id,
					tanggal_mulai: leave.tanggal_mulai,
					tanggal_selesai: leave.tanggal_selesai,
					days: Math.ceil((new Date(leave.tanggal_selesai).getTime() - new Date(leave.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24)) + 1,
					keterangan: leave.keterangan,
					tanggal_pengajuan: leave.tanggal_pengajuan
				}))
			};
		});

		// 5. Hitung statistik keseluruhan
		const totalEmployees = employees.length;
		const totalAllocation = totalEmployees * ANNUAL_LEAVE_QUOTA;
		const totalUsed = employeeStats.reduce((/** @type {number} */ sum, /** @type {any} */ emp) => sum + emp.usedDays, 0);
		const totalRemaining = totalAllocation - totalUsed;
		const averageUsage = totalEmployees > 0 ? Math.round(totalUsed / totalEmployees * 10) / 10 : 0;

		// Statistik berdasarkan status
		const criticalCount = employeeStats.filter((/** @type {any} */ emp) => emp.status === 'critical').length;
		const warningCount = employeeStats.filter((/** @type {any} */ emp) => emp.status === 'warning').length;
		const goodCount = employeeStats.filter((/** @type {any} */ emp) => emp.status === 'good').length;

		// Data untuk chart
		const usageDistribution = {
			labels: ['0-25%', '26-50%', '51-75%', '76-100%', '100%+'],
			data: [
				employeeStats.filter((/** @type {any} */ emp) => emp.usagePercentage <= 25).length,
				employeeStats.filter((/** @type {any} */ emp) => emp.usagePercentage > 25 && emp.usagePercentage <= 50).length,
				employeeStats.filter((/** @type {any} */ emp) => emp.usagePercentage > 50 && emp.usagePercentage <= 75).length,
				employeeStats.filter((/** @type {any} */ emp) => emp.usagePercentage > 75 && emp.usagePercentage <= 100).length,
				employeeStats.filter((/** @type {any} */ emp) => emp.usagePercentage > 100).length
			]
		};

		// Data departemen
		const departmentStats = /** @type {Record<string, any>} */ ({});
		employeeStats.forEach((/** @type {any} */ emp) => {
			const dept = emp.employee.divisi || 'Unknown';
			if (!departmentStats[dept]) {
				departmentStats[dept] = {
					name: dept,
					totalEmployees: 0,
					totalUsed: 0,
					averageUsage: 0,
					criticalCount: 0,
					warningCount: 0
				};
			}
			departmentStats[dept].totalEmployees++;
			departmentStats[dept].totalUsed += emp.usedDays;
			if (emp.status === 'critical') departmentStats[dept].criticalCount++;
			if (emp.status === 'warning') departmentStats[dept].warningCount++;
		});

		// Hitung rata-rata per departemen
		Object.values(departmentStats).forEach((/** @type {any} */ dept) => {
			dept.averageUsage = dept.totalEmployees > 0 ? 
				Math.round((dept.totalUsed / dept.totalEmployees) * 10) / 10 : 0;
		});

		return {
			success: true,
			data: {
				year,
				summary: {
					totalEmployees,
					totalAllocation,
					totalUsed,
					totalRemaining,
					averageUsage,
					usagePercentage: Math.round((totalUsed / totalAllocation) * 100)
				},
				statusCounts: {
					good: goodCount,
					warning: warningCount,
					critical: criticalCount
				},
				employees: employeeStats,
				departments: Object.values(departmentStats),
				charts: {
					usageDistribution
				},
				lastUpdated: new Date().toISOString()
			}
		};

	} catch (error) {
		console.error('Error fetching dashboard summary:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

/**
 * Mengambil data detail karyawan dengan filter
 * @param {Object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getFilteredEmployeeLeaveData(filters = {}) {
	try {
		const {
			year = new Date().getFullYear(),
			department = 'all',
			search = '',
			sortBy = 'nama_lengkap',
			sortOrder = 'asc',
			status = 'all'
		} = /** @type {any} */ (filters);

		// Ambil data dashboard lengkap
		const dashboardResult = await getAnnualLeaveDashboardSummary(year);
		if (!dashboardResult.success) {
			return dashboardResult;
		}

		let filteredEmployees = [...dashboardResult.data.employees];

		// Filter berdasarkan departemen
		if (department !== 'all') {
			filteredEmployees = filteredEmployees.filter(emp => 
				emp.employee.divisi === department
			);
		}

		// Filter berdasarkan status
		if (status !== 'all') {
			filteredEmployees = filteredEmployees.filter(emp => emp.status === status);
		}

		// Search berdasarkan nama
		if (search.trim()) {
			const searchLower = search.toLowerCase();
			filteredEmployees = filteredEmployees.filter(emp =>
				emp.employee.nama_lengkap.toLowerCase().includes(searchLower) ||
				emp.employee.email.toLowerCase().includes(searchLower) ||
				emp.employee.jabatan?.toLowerCase().includes(searchLower) ||
				emp.employee.divisi?.toLowerCase().includes(searchLower)
			);
		}

		// Sorting
		filteredEmployees.sort((a, b) => {
			let valueA, valueB;

			switch (sortBy) {
				case 'nama_lengkap':
					valueA = a.employee.nama_lengkap;
					valueB = b.employee.nama_lengkap;
					break;
				case 'jabatan':
					valueA = a.employee.jabatan || '';
					valueB = b.employee.jabatan || '';
					break;
				case 'divisi':
					valueA = a.employee.divisi || '';
					valueB = b.employee.divisi || '';
					break;
				case 'usedDays':
					valueA = a.usedDays;
					valueB = b.usedDays;
					break;
				case 'remainingDays':
					valueA = a.remainingDays;
					valueB = b.remainingDays;
					break;
				case 'usagePercentage':
					valueA = a.usagePercentage;
					valueB = b.usagePercentage;
					break;
				default:
					valueA = a.employee.nama_lengkap;
					valueB = b.employee.nama_lengkap;
			}

			if (typeof valueA === 'string') {
				valueA = valueA.toLowerCase();
				valueB = valueB.toLowerCase();
			}

			if (sortOrder === 'desc') {
				return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
			} else {
				return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
			}
		});

		return {
			success: true,
			data: {
				employees: filteredEmployees,
				summary: dashboardResult.data.summary,
				filters: {
					year,
					department,
					search,
					sortBy,
					sortOrder,
					status,
					totalResults: filteredEmployees.length
				}
			}
		};

	} catch (error) {
		console.error('Error filtering employee data:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

/**
 * Mengambil daftar departemen untuk filter
 * @returns {Promise<{success: boolean, data?: string[], error?: string}>}
 */
export async function getDepartmentList() {
	try {
		const response = await api.get('/items/register?fields=divisi&filter[status][_eq]=aktif');
		const employees = response.data.data || [];
		
		const departments = [...new Set(employees
			.map((/** @type {any} */ emp) => emp.divisi)
			.filter(Boolean)
		)].sort();

		return {
			success: true,
			data: departments
		};
	} catch (error) {
		console.error('Error fetching departments:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
