import { redirect, fail } from '@sveltejs/kit';

// Simulasi database users - Updated configuration with Department Managers
const users = [
	// HRD System Users
	{
		id: 1,
		email: 'hrd@eltama.com',
		password: 'isi_password_HRD_Admin',
		nama: 'HRD Admin',
		divisi: 'HRD',
		role: 'hrd_admin'
	},
	{
		id: 2,
		email: 'manager.hrd@eltama.com',
		password: 'isi_password_Manager_HRD',
		nama: 'Manager HRD',
		divisi: 'HRD',
		role: 'manager_hrd'
	},
	{
		id: 3,
		email: 'direktur@eltama.com',
		password: 'isi_password_Direktur',
		nama: 'Direktur Utama',
		divisi: 'Direktur',
		role: 'direktur'
	},
	// Department Managers
	{
		id: 4,
		email: 'manager.it@eltama.com',
		password: 'isi_password_Manager_IT',
		nama: 'Manager IT',
		divisi: 'IT',
		role: 'manager_divisi'
	},
	{
		id: 5,
		email: 'manager.finance@eltama.com',
		password: 'isi_password_Manager_Finance',
		nama: 'Manager Finance',
		divisi: 'Finance',
		role: 'manager_divisi'
	},
	{
		id: 6,
		email: 'manager.procurement@eltama.com',
		password: 'isi_password_Manager_Procurement',
		nama: 'Manager Procurement',
		divisi: 'Procurement',
		role: 'manager_divisi'
	},
	{
		id: 7,
		email: 'manager.inventory@eltama.com',
		password: 'isi_password_Manager_Inventory',
		nama: 'Manager Inventory',
		divisi: 'Inventory',
		role: 'manager_divisi'
	},
	{
		id: 8,
		email: 'manager.produksi@eltama.com',
		password: 'isi_password_Manager_Produksi',
		nama: 'Manager Produksi',
		divisi: 'Produksi',
		role: 'manager_divisi'
	},
	{
		id: 9,
		email: 'manager.project@eltama.com',
		password: 'isi_password_Manager_Project',
		nama: 'Manager Project',
		divisi: 'Project',
		role: 'manager_divisi'
	},
	{
		id: 10,
		email: 'manager.marketing@eltama.com',
		password: 'isi_password_Manager_Marketing',
		nama: 'Manager Marketing',
		divisi: 'Marketing',
		role: 'manager_divisi'
	},
	{
		id: 11,
		email: 'manager.maintenance@eltama.com',
		password: 'isi_password_Manager_Maintenance',
		nama: 'Manager Maintenance',
		divisi: 'Maintenance',
		role: 'manager_divisi'
	},
	{
		id: 12,
		email: 'general.manager@eltama.com',
		password: 'isi_password_General_Manager',
		nama: 'General Manager',
		divisi: 'Management',
		role: 'manager_divisi'
	},
	{
		id: 13,
		email: 'plant.manager@eltama.com',
		password: 'isi_password_Plant_Manager',
		nama: 'Plant Manager',
		divisi: 'Management',
		role: 'manager_divisi'
	}
];

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		// Validasi input
		if (!email || !password) {
			return fail(400, {
				error: 'Email dan password harus diisi',
				email
			});
		}

		// Validasi format email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Format email tidak valid',
				email
			});
		}

		// Cari user di database simulasi
		const user = users.find((u) => u.email === email && u.password === password);

		if (!user) {
			return fail(400, {
				error: 'Email atau password salah',
				email
			});
		}

		// Set session/cookie untuk user yang berhasil login
		cookies.set(
			'session',
			JSON.stringify({
				userId: user.id,
				email: user.email,
				nama: user.nama,
				divisi: user.divisi,
				role: user.role || 'user' // Tambahkan role ke session
			}),
			{
				path: '/',
				httpOnly: true,
				secure: false, // Set true untuk production dengan HTTPS
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 7 hari
			}
		);

		// Redirect ke dashboard setelah login berhasil
		throw redirect(302, '/dashboard');
	}
};

export async function load({ cookies }) {
	// Cek apakah user sudah login
	const session = cookies.get('session');
	if (session) {
		try {
			JSON.parse(session);
			// Jika sudah login, redirect ke dashboard
			throw redirect(302, '/dashboard');
		} catch {
			// Cookie rusak, hapus
			cookies.delete('session', { path: '/' });
		}
	}

	return {};
}
