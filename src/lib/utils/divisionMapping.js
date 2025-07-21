/**
 * Division Mapping Utility
 * Handles mapping between Firebase (login) and Directus (employee) division data
 */

// Mapping standardisasi divisi antara Firebase dan Directus
export const DIVISION_MAPPING = {
	// Firebase divisi (dari login) -> Directus divisi (dari database karyawan)
	IT: ['it', 'IT', 'Information Technology', 'teknologi informasi'],
	Finance: ['finance', 'Finance', 'FINANCE', 'Keuangan', 'keuangan'],
	HRD: ['hrd', 'HRD', 'Human Resources', 'sumber daya manusia'],
	Marketing: ['marketing', 'Marketing', 'Pemasaran', 'pemasaran'],
	Procurement: ['procurement', 'Procurement', 'Pengadaan', 'pengadaan'],
	Inventory: ['inventory', 'Inventory', 'Gudang', 'gudang'],
	Produksi: ['produksi', 'Produksi', 'Production', 'production'],
	Project: ['project', 'Project', 'Proyek', 'proyek'],
	Maintenance: ['maintenance', 'Maintenance', 'Pemeliharaan', 'pemeliharaan'],
	Management: ['management', 'Management', 'Manajemen', 'manajemen'],
	Direksi: ['direksi', 'DIREKSI', 'Direksi', 'direktur', 'DIREKTUR'] // Added Direksi variants
};

// Reverse mapping untuk lookup cepat
export const REVERSE_DIVISION_MAPPING = {};
Object.keys(DIVISION_MAPPING).forEach((standardDivision) => {
	DIVISION_MAPPING[standardDivision].forEach((variant) => {
		REVERSE_DIVISION_MAPPING[variant.toLowerCase()] = standardDivision;
	});
});

/**
 * Normalize division name to standard format
 * @param {string} divisionName - Division name from any source
 * @returns {string} - Standardized division name
 */
export function normalizeDivision(divisionName) {
	if (!divisionName) return '';

	const normalized = divisionName.toLowerCase().trim();
	return REVERSE_DIVISION_MAPPING[normalized] || divisionName;
}

/**
 * Check if user's division matches employee's division
 * @param {string} userDivision - User's division from Firebase
 * @param {string} employeeDivision - Employee's division from Directus
 * @returns {boolean} - True if divisions match
 */
export function isDivisionMatch(userDivision, employeeDivision) {
	if (!userDivision || !employeeDivision) return false;

	const normalizedUserDiv = normalizeDivision(userDivision);
	const normalizedEmpDiv = normalizeDivision(employeeDivision);

	return normalizedUserDiv === normalizedEmpDiv;
}

/**
 * Filter employees based on user's division and role
 * @param {Array} employees - Array of employee objects
 * @param {Object} user - User object with division and role info
 * @returns {Array} - Filtered employees
 */
export function filterEmployeesByUserDivision(employees, user) {
	if (!user || !Array.isArray(employees)) {
		return employees || [];
	}

	// If user is not a manager, show all employees (for HR/Admin view)
	if (!isManagerRole(user.role)) {
		return employees;
	}

	// For managers, filter by division
	if (user.role === 'manager_divisi') {
		return employees.filter((employee) =>
			isDivisionMatch(user.divisi || user.department, employee.divisi)
		);
	}

	// For HRD managers and above, show all employees
	if (['manager_hrd', 'hrd_admin', 'direktur', 'admin'].includes(user.role)) {
		return employees;
	}

	// Default: show all employees
	return employees;
}

/**
 * Check if user role is a manager role
 * @param {string} role - User role
 * @returns {boolean} - True if role is manager
 */
export function isManagerRole(role) {
	if (!role) return false;

	const managerRoles = [
		'manager_divisi',
		'manager_hrd',
		'hrd_admin',
		'direktur',
		'admin',
		'manager'
	];

	return managerRoles.includes(role);
}

/**
 * Get user division info from session or user object
 * @param {Object} user - User object from session
 * @returns {Object} - Division info object
 */
export function getUserDivisionInfo(user) {
	if (!user) {
		return {
			division: null,
			role: null,
			canViewAllDivisions: true
		};
	}

	const division = user.divisi || user.department || user.division;
	const role = user.role;

	return {
		division: normalizeDivision(division),
		role,
		canViewAllDivisions:
			!isManagerRole(role) || ['manager_hrd', 'hrd_admin', 'direktur', 'admin'].includes(role)
	};
}

/**
 * Get display name for division
 * @param {string} division - Division name
 * @returns {string} - Display name
 */
export function getDivisionDisplayName(division) {
	if (!division) return '-';

	const displayNames = {
		IT: 'Information Technology',
		Finance: 'Finance & Accounting',
		HRD: 'Human Resources',
		Marketing: 'Marketing & Sales',
		Procurement: 'Procurement',
		Inventory: 'Inventory & Warehouse',
		Produksi: 'Production',
		Project: 'Project Management',
		Maintenance: 'Maintenance',
		Management: 'Management',
		Direksi: 'Direksi'
	};

	const normalized = normalizeDivision(division);
	return displayNames[normalized] || division;
}

/**
 * Debug function to help troubleshoot division mapping
 * @param {Array} employees - Employees array
 * @param {Object} user - User object
 */
export function debugDivisionMapping(employees, user) {
	console.log('🔍 DIVISION MAPPING DEBUG');
	console.log('User:', {
		division: user?.divisi || user?.department,
		role: user?.role,
		normalized: normalizeDivision(user?.divisi || user?.department)
	});

	console.log('Employee divisions found:');
	const uniqueDivisions = [...new Set(employees.map((emp) => emp.divisi).filter(Boolean))];
	uniqueDivisions.forEach((div) => {
		console.log(`- "${div}" -> normalized: "${normalizeDivision(div)}"`);
	});

	console.log('Division mapping result:');
	const userDiv = user?.divisi || user?.department;
	if (userDiv) {
		const matchingEmployees = employees.filter((emp) => isDivisionMatch(userDiv, emp.divisi));
		console.log(`Found ${matchingEmployees.length} employees matching division "${userDiv}"`);
	}
}
