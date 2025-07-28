import { VITE_DIRECTUS_URL, VITE_DIRECTUS_TOKEN } from '$env/static/private';
import { filterEmployeesByUserDivision, debugDivisionMapping } from '$lib/utils/divisionMapping.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, url }) {
	// Get user session first
	const session = cookies.get('session');
	let user = null;

	if (session) {
		try {
			user = JSON.parse(session);
		} catch (error) {
			// ignore
		}
	}

	// Validasi environment variables
	if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
		return {
			employees: [],
			error: 'Konfigurasi server tidak lengkap. Hubungi administrator.'
		};
	}

	try {
		// Environment variables dari .env
		const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
		const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

		// Fetch hanya field yang diperlukan untuk tampilan tabel employees
		const fields = [
			'id',
			'nama_lengkap',
			'no_karyawan',
			'divisi',
			'jabatan',
			'status_kerja',
			'lokasi_absen',
			'shift'
		].join(',');

		// Ambil searchQuery dari query params
		const searchQuery = url.searchParams.get('searchQuery')?.toLowerCase().trim() || '';

		// Build filter for Directus API (search only by nama_lengkap)
		let filterParam = '';
		if (searchQuery) {
			// Directus filter: { "_contains": searchQuery }
			filterParam = `&filter[nama_lengkap][_contains]=${encodeURIComponent(searchQuery)}`;
		}

		const requestUrl = `${directusUrl}/items/register?fields=${fields}&limit=1000&sort=nama_lengkap${filterParam}`;

		const response = await fetch(requestUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${directusToken}`,
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			const data = await response.json();
			let employees = data.data || [];

			// Apply division filtering based on user role
			if (user) {
				employees = filterEmployeesByUserDivision(employees, user);
			}

			return {
				employees,
				user,
				error: null
			};
		} else {
			return {
				employees: [],
				user,
				error: 'Terjadi kesalahan saat mengambil data karyawan'
			};
		}
	} catch (err) {
		return {
			employees: [],
			user,
			error: 'Terjadi kesalahan jaringan.'
		};
	}
}
