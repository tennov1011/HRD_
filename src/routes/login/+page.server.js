import { redirect, fail } from '@sveltejs/kit';

// Simulasi database users
const users = [
	{ id: 1, email: 'admin@eltama.com', password: 'admin123', nama: 'Administrator', divisi: 'IT' },
	{ id: 2, email: 'michael@eltama.com', password: 'michael123', nama: 'Michael Johnson', divisi: 'HRD' },
	{ id: 3, email: 'sarah@eltama.com', password: 'sarah123', nama: 'Sarah Wilson', divisi: 'Finance' },
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
		const user = users.find(u => u.email === email && u.password === password);

		if (!user) {
			return fail(400, {
				error: 'Email atau password salah',
				email
			});
		}

		// Set session/cookie untuk user yang berhasil login
		cookies.set('session', JSON.stringify({
			userId: user.id,
			email: user.email,
			nama: user.nama,
			divisi: user.divisi
		}), {
			path: '/',
			httpOnly: true,
			secure: false, // Set true untuk production dengan HTTPS
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 hari
		});

		// Redirect ke dashboard setelah login berhasil
		throw redirect(302, '/admin');
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