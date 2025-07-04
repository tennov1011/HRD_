// Service untuk mengelola laporan presensi bulanan
import { AttendanceService } from './attendanceService.js';

/**
 * Service untuk laporan presensi bulanan
 */
export class MonthlyAttendanceService {
	/**
	 * Mendapatkan laporan presensi bulanan
	 * @param {number} year - Tahun
	 * @param {number} month - Bulan (1-12)
	 */
	static async getMonthlyReport(year, month) {
		try {
			// Get start and end date of the month
			const startDate = new Date(year, month - 1, 1);
			const endDate = new Date(year, month, 0); // Last day of month

			const startDateStr = startDate.toISOString().split('T')[0];
			const endDateStr = endDate.toISOString().split('T')[0];

			// Fetch attendance data for the month
			const params = {
				limit: -1, // Get all records
				sort: 'nama,tanggal',
				filter: JSON.stringify({
					tanggal: {
						_gte: startDateStr,
						_lte: endDateStr
					}
				})
			};

			const response = await AttendanceService.getDailyAttendance(params);
			const attendanceData = response.data || [];

			// Process data to create monthly report
			const monthlyReport = this.processMonthlyData(attendanceData, year, month);

			return {
				success: true,
				data: monthlyReport,
				period: {
					year,
					month,
					monthName: this.getMonthName(month),
					startDate: startDateStr,
					endDate: endDateStr,
					totalDays: endDate.getDate(),
					workingDays: this.getWorkingDays(year, month)
				}
			};
		} catch (error) {
			console.error('Error fetching monthly report:', error);

			// Return mock data as fallback
			return {
				success: false,
				data: this.getMockMonthlyData(year, month),
				period: {
					year,
					month,
					monthName: this.getMonthName(month),
					startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
					endDate: `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
					totalDays: new Date(year, month, 0).getDate(),
					workingDays: this.getWorkingDays(year, month)
				},
				error: /** @type {any} */ (error).message
			};
		}
	}

	/**
	 * Process raw attendance data into monthly report
	 * @param {any[]} attendanceData
	 * @param {number} year
	 * @param {number} month
	 */
	static processMonthlyData(attendanceData, year, month) {
		const employeeMap = new Map();
		const workingDays = this.getWorkingDays(year, month);

		// Group data by employee
		attendanceData.forEach((record) => {
			const key = record.email || record.nama;
			if (!employeeMap.has(key)) {
				employeeMap.set(key, {
					nama: record.nama,
					email: record.email,
					user_id: record.user_id || key,
					attendanceRecords: [],
					summary: {
						totalDays: 0,
						presentDays: 0,
						lateDays: 0,
						absentDays: 0,
						totalLateMinutes: 0,
						averageLateMinutes: 0,
						attendanceRate: 0
					}
				});
			}

			employeeMap.get(key).attendanceRecords.push(record);
		});

		// Calculate summary for each employee
		const employeeReports = Array.from(employeeMap.values()).map((employee) => {
			const summary = this.calculateEmployeeSummary(employee.attendanceRecords, workingDays);
			return {
				...employee,
				summary
			};
		});

		// Calculate overall statistics
		const overallStats = this.calculateOverallStats(employeeReports, workingDays);

		return {
			employees: employeeReports,
			statistics: overallStats
		};
	}

	/**
	 * Calculate summary for individual employee
	 * @param {any[]} records
	 * @param {number} workingDays
	 */
	static calculateEmployeeSummary(records, workingDays) {
		const presentDays = records.filter((r) => r.waktu_masuk).length;
		const lateDays = records.filter((r) => r.terlambat).length;
		const absentDays = Math.max(0, workingDays - presentDays);
		const totalLateMinutes = records.reduce((sum, r) => sum + (r.menit_keterlambatan || 0), 0);
		const averageLateMinutes = lateDays > 0 ? Math.round(totalLateMinutes / lateDays) : 0;
		const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

		return {
			totalDays: workingDays,
			presentDays,
			lateDays,
			absentDays,
			totalLateMinutes,
			averageLateMinutes,
			attendanceRate
		};
	}

	/**
	 * Calculate overall statistics
	 * @param {any[]} employeeReports
	 * @param {number} workingDays
	 */
	static calculateOverallStats(employeeReports, workingDays) {
		const totalEmployees = employeeReports.length;
		const totalPossibleAttendance = totalEmployees * workingDays;
		const totalPresent = employeeReports.reduce((sum, emp) => sum + emp.summary.presentDays, 0);
		const totalLate = employeeReports.reduce((sum, emp) => sum + emp.summary.lateDays, 0);
		const totalAbsent = employeeReports.reduce((sum, emp) => sum + emp.summary.absentDays, 0);
		const totalLateMinutes = employeeReports.reduce(
			(sum, emp) => sum + emp.summary.totalLateMinutes,
			0
		);

		return {
			totalEmployees,
			workingDays,
			totalPossibleAttendance,
			totalPresent,
			totalLate,
			totalAbsent,
			totalLateMinutes,
			averageAttendanceRate:
				totalEmployees > 0 ? Math.round((totalPresent / totalPossibleAttendance) * 100) : 0,
			averageLateMinutes: totalLate > 0 ? Math.round(totalLateMinutes / totalLate) : 0
		};
	}

	/**
	 * Get working days in a month (excluding weekends)
	 * @param {number} year
	 * @param {number} month
	 */
	static getWorkingDays(year, month) {
		let workingDays = 0;
		const daysInMonth = new Date(year, month, 0).getDate();

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month - 1, day);
			const dayOfWeek = date.getDay();

			// Monday = 1, Saturday = 6, Sunday = 0
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				workingDays++;
			}
		}

		return workingDays;
	}

	/**
	 * Get month name in Indonesian
	 * @param {number} month
	 */
	static getMonthName(month) {
		const months = [
			'Januari',
			'Februari',
			'Maret',
			'April',
			'Mei',
			'Juni',
			'Juli',
			'Agustus',
			'September',
			'Oktober',
			'November',
			'Desember'
		];
		return months[month - 1];
	}

	/**
	 * Export monthly report to CSV
	 * @param {any} reportData
	 * @param {any} period
	 */
	static exportToCSV(reportData, period) {
		const headers = [
			'Nama Karyawan',
			'Email',
			'ID Karyawan',
			'Hari Kerja',
			'Hari Hadir',
			'Hari Terlambat',
			'Hari Tidak Hadir',
			'Total Menit Terlambat',
			'Rata-rata Terlambat (menit)',
			'Tingkat Kehadiran (%)'
		];

		const rows = reportData.employees.map(
			/** @param {any} emp */ (emp) => [
				emp.nama,
				emp.email,
				emp.user_id,
				emp.summary.totalDays,
				emp.summary.presentDays,
				emp.summary.lateDays,
				emp.summary.absentDays,
				emp.summary.totalLateMinutes,
				emp.summary.averageLateMinutes,
				emp.summary.attendanceRate
			]
		);

		const csvContent = [headers, ...rows]
			.map(
				/** @param {any} row */ (row) =>
					row.map(/** @param {any} field */ (field) => `"${field}"`).join(',')
			)
			.join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `laporan-presensi-${period.monthName}-${period.year}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	/**
	 * Mock data for fallback
	 * @param {number} year
	 * @param {number} month
	 */
	static getMockMonthlyData(year, month) {
		const employees = [
			{
				nama: 'John Doe',
				email: 'john.doe@company.com',
				user_id: 'EMP001',
				summary: {
					totalDays: 22,
					presentDays: 20,
					lateDays: 3,
					absentDays: 2,
					totalLateMinutes: 45,
					averageLateMinutes: 15,
					attendanceRate: 91
				}
			},
			{
				nama: 'Jane Smith',
				email: 'jane.smith@company.com',
				user_id: 'EMP002',
				summary: {
					totalDays: 22,
					presentDays: 22,
					lateDays: 1,
					absentDays: 0,
					totalLateMinutes: 10,
					averageLateMinutes: 10,
					attendanceRate: 100
				}
			},
			{
				nama: 'Bob Johnson',
				email: 'bob.johnson@company.com',
				user_id: 'EMP003',
				summary: {
					totalDays: 22,
					presentDays: 19,
					lateDays: 5,
					absentDays: 3,
					totalLateMinutes: 75,
					averageLateMinutes: 15,
					attendanceRate: 86
				}
			}
		];

		return {
			employees,
			statistics: {
				totalEmployees: 3,
				workingDays: 22,
				totalPossibleAttendance: 66,
				totalPresent: 61,
				totalLate: 9,
				totalAbsent: 5,
				totalLateMinutes: 130,
				averageAttendanceRate: 92,
				averageLateMinutes: 14
			}
		};
	}
}
