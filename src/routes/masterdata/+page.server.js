import { fail, redirect } from '@sveltejs/kit';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://directus.eltamaprimaindo.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
  }
});

export async function load() {
  try {
    // Fetch semua data master dari collection master_data
    const response = await api.get('/items/master_data');
    const allData = response.data.data;

    // Kelompokkan data berdasarkan kategori
    const groupedData = {
      divisi: allData.filter(/** @param {any} item */ (item) => item.category === 'divisi'),
      jabatan: allData.filter(/** @param {any} item */ (item) => item.category === 'jabatan'),
      lokasi_absen: allData.filter(/** @param {any} item */ (item) => item.category === 'lokasi_absen'),
      shift: allData.filter(/** @param {any} item */ (item) => item.category === 'shift')
    };

    return {
      masterData: groupedData
    };
  } catch (error) {
    console.error('Error fetching master data:', error);
    return {
      masterData: {
        divisi: [],
        jabatan: [],
        lokasi_absen: [],
        shift: []
      }
    };
  }
}

export const actions = {
  // Action untuk menambah divisi
  addDivisi: async ({ request }) => {
    const data = await request.formData();
    const nama = data.get('nama');
    const status = data.get('status');

    if (!nama || !status) {
      return fail(400, { error: 'Nama divisi dan status wajib diisi' });
    }

    try {
      await api.post('/items/master_data', {
        category: 'divisi',
        nama: nama,
        status: status
      });

      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error adding divisi:', error);
      return fail(500, { error: 'Gagal menambah divisi' });
    }
  },

  // Action untuk menambah jabatan
  addJabatan: async ({ request }) => {
    const data = await request.formData();
    const nama = data.get('nama');
    const status = data.get('status');

    if (!nama || !status) {
      return fail(400, { error: 'Nama jabatan dan status wajib diisi' });
    }

    try {
      await api.post('/items/master_data', {
        category: 'jabatan',
        nama: nama,
        status: status
      });

      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error adding jabatan:', error);
      return fail(500, { error: 'Gagal menambah jabatan' });
    }
  },

  // Action untuk menambah lokasi absen
  addLokasiAbsen: async ({ request }) => {
    const data = await request.formData();
    const nama = data.get('nama');
    const alamat = data.get('alamat');
    const status = data.get('status');

    if (!nama || !status) {
      return fail(400, { error: 'Nama lokasi dan status wajib diisi' });
    }

    try {
      await api.post('/items/master_data', {
        category: 'lokasi_absen',
        nama: nama,
        alamat: alamat || '',
        status: status
      });

      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error adding lokasi absen:', error);
      return fail(500, { error: 'Gagal menambah lokasi absen' });
    }
  },

  // Action untuk menambah shift
  addShift: async ({ request }) => {
    console.log('🚀 addShift action called');
    
    try {
      const data = await request.formData();
      console.log('📝 FormData received');
      
      const nama = data.get('nama');
      const jam_masuk = data.get('jam_masuk');
      const jam_keluar = data.get('jam_keluar');
      const status = data.get('status') || 'aktif';

      // Log data yang diterima dari form
      // Validasi field wajib
      if (!nama || !jam_masuk || !jam_keluar) {
        return fail(400, { error: 'Nama shift, jam masuk, dan jam keluar wajib diisi' });
      }

      // Convert FormDataEntryValue to string
      const namaStr = String(nama);
      const jamMasukStr = String(jam_masuk);
      const jamKeluarStr = String(jam_keluar);
      const statusStr = String(status);

      // Convert time to timestamp format for Directus with WIB timezone
      const formatTimeToTimestamp = /** @param {string} timeString */ (timeString) => {
        if (!timeString) return null;
        
        // Get today's date in WIB timezone (UTC+7)
        const now = new Date();
        const wibOffset = 7 * 60; // WIB is UTC+7
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wibTime = new Date(utc + (wibOffset * 60000));
        
        const year = wibTime.getFullYear();
        const month = String(wibTime.getMonth() + 1).padStart(2, '0');
        const day = String(wibTime.getDate()).padStart(2, '0');
        
        // Combine with time - format: YYYY-MM-DD HH:MM:SS+07:00 (WIB)
        return `${year}-${month}-${day} ${timeString}:00+07:00`;
      };

      const jamMasukTimestamp = formatTimeToTimestamp(jamMasukStr);
      const jamKeluarTimestamp = formatTimeToTimestamp(jamKeluarStr);

      // Kirim data ke Directus
      const payload = {
        category: 'shift',
        nama: namaStr,
        jam_masuk: jamMasukTimestamp,
        jam_keluar: jamKeluarTimestamp,
        status: statusStr
      };

      await api.post('/items/master_data', payload);

      throw redirect(303, '/masterdata');
      
    } catch (error) {
      console.error('Error adding shift:', error);
      
      // Type check for axios error
      const axiosError = /** @type {any} */ (error);
      
      // Get error message from response
      const errorMessage = axiosError?.response?.data?.errors?.[0]?.message || 
                          axiosError?.response?.data?.message || 
                          axiosError?.message || 
                          'Unknown error';
      
      return fail(500, { error: `Gagal menambah shift: ${errorMessage}` });
    }
  },

  // Action untuk menghapus divisi
  deleteDivisi: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { error: 'ID divisi wajib diisi' });
    }

    try {
      await api.delete(`/items/master_data/${id}`);
      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error deleting divisi:', error);
      return fail(500, { error: 'Gagal menghapus divisi' });
    }
  },

  // Action untuk menghapus jabatan
  deleteJabatan: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { error: 'ID jabatan wajib diisi' });
    }

    try {
      await api.delete(`/items/master_data/${id}`);
      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error deleting jabatan:', error);
      return fail(500, { error: 'Gagal menghapus jabatan' });
    }
  },

  // Action untuk menghapus lokasi absen
  deleteLokasiAbsen: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { error: 'ID lokasi absen wajib diisi' });
    }

    try {
      await api.delete(`/items/master_data/${id}`);
      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error deleting lokasi absen:', error);
      return fail(500, { error: 'Gagal menghapus lokasi absen' });
    }
  },

  // Action untuk menghapus shift
  deleteShift: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { error: 'ID shift wajib diisi' });
    }

    try {
      await api.delete(`/items/master_data/${id}`);
      throw redirect(303, '/masterdata');
    } catch (error) {
      console.error('Error deleting shift:', error);
      return fail(500, { error: 'Gagal menghapus shift' });
    }
  }
};
