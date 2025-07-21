// Service untuk mengelola kategori izin/cuti dari Directus
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || '';

/**
 * Base function untuk API calls ke Directus
 * @param {string} endpoint
 * @param {object} options
 */
async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/items/${endpoint}`;
	const config = {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${DIRECTUS_TOKEN}`
		},
		...options
	};

	try {
		console.log('🔗 Directus API Call:', url);
		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('✅ Directus Response:', data);
		return data;
	} catch (error) {
		console.error('❌ Directus API Error:', error);
		throw error;
	}
}

/**
 * Mengambil semua kategori izin dari collection kategori_izin
 */
export async function getAllLeaveCategories() {
	try {
		const query = 'kategori_izin?fields=id,nama&sort=nama';
		const response = await directusApi(query);

		return {
			success: true,
			data: response.data || [],
			total: response.data?.length || 0
		};
	} catch (error) {
		console.error('Error fetching leave categories:', error);

		// Fallback dengan mock data jika Directus tidak tersedia
		return {
			success: false,
			data: getMockLeaveCategories(),
			total: getMockLeaveCategories().length,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Menambah kategori izin baru ke collection kategori_izin
 * @param {string} nama - Nama kategori
 */
export async function createLeaveCategory(nama) {
	try {
		// Validasi input
		if (!nama || !nama.trim()) {
			throw new Error('Nama kategori tidak boleh kosong');
		}

		const categoryData = {
			nama: nama.trim()
		};

		const response = await directusApi('kategori_izin', {
			method: 'POST',
			body: JSON.stringify(categoryData)
		});

		console.log('✅ Category created successfully:', response.data);

		return {
			success: true,
			data: response.data,
			message: 'Kategori berhasil ditambahkan'
		};
	} catch (error) {
		console.error('❌ Error creating leave category:', error);

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Terjadi kesalahan saat menambahkan kategori'
		};
	}
}

/**
 * Mengupdate kategori izin
 * @param {number} id - ID kategori
 * @param {string} nama - Nama kategori baru
 */
export async function updateLeaveCategory(id, nama) {
	try {
		// Validasi input
		if (!id) {
			throw new Error('ID kategori tidak boleh kosong');
		}
		if (!nama || !nama.trim()) {
			throw new Error('Nama kategori tidak boleh kosong');
		}

		const categoryData = {
			nama: nama.trim()
		};

		const response = await directusApi(`kategori_izin/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(categoryData)
		});

		console.log('✅ Category updated successfully:', response.data);

		return {
			success: true,
			data: response.data,
			message: 'Kategori berhasil diperbarui'
		};
	} catch (error) {
		console.error('❌ Error updating leave category:', error);

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Terjadi kesalahan saat memperbarui kategori'
		};
	}
}

/**
 * Menghapus kategori izin
 * @param {number} id - ID kategori
 */
export async function deleteLeaveCategory(id) {
	try {
		// Validasi input
		if (!id) {
			throw new Error('ID kategori tidak boleh kosong');
		}

		const response = await directusApi(`kategori_izin/${id}`, {
			method: 'DELETE'
		});

		console.log('✅ Category deleted successfully');

		return {
			success: true,
			message: 'Kategori berhasil dihapus'
		};
	} catch (error) {
		console.error('❌ Error deleting leave category:', error);

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Terjadi kesalahan saat menghapus kategori'
		};
	}
}

/**
 * Test koneksi ke Directus
 */
export async function testCategoryConnection() {
	try {
		const response = await directusApi('kategori_izin?limit=1');
		return {
			success: true,
			message: 'Koneksi ke Directus berhasil'
		};
	} catch (error) {
		console.error('❌ Connection test failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			message: 'Koneksi ke Directus gagal'
		};
	}
}

/**
 * Mock data untuk fallback
 */
function getMockLeaveCategories() {
	return [
		{ id: 1, nama: 'Cuti Tahunan' },
		{ id: 2, nama: 'Cuti Sakit' },
		{ id: 3, nama: 'Izin Pribadi' },
		{ id: 4, nama: 'Cuti Melahirkan' },
		{ id: 5, nama: 'Cuti Menikah' },
		{ id: 6, nama: 'Izin Urusan Keluarga' }
	];
}
