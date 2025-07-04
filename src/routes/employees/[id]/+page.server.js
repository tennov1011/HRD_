import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN 
} from '$env/static/private';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const { id } = params; // id adalah ID karyawan dari database
  
  // Validasi environment variables
  if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
    throw error(500, 'Konfigurasi server tidak lengkap');
  }

  try {
    const directusUrl = VITE_DIRECTUS_URL;
    const directusToken = VITE_DIRECTUS_TOKEN;
    
    // Fetch detail karyawan berdasarkan ID - ambil semua field
    const requestUrl = `${directusUrl}/items/register/${encodeURIComponent(id)}`;
    
    console.log('=== FETCH EMPLOYEE DETAIL ===');
    console.log('Employee ID:', id);
    console.log('Request URL:', requestUrl);
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const employee = data.data;
      
      // Ambil informasi akun karyawan jika ada
      let accountInfo = null;
      try {
        const accountResponse = await fetch(`${directusUrl}/items/akun?filter[employee_id][_eq]=${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${directusToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.data && accountData.data.length > 0) {
            accountInfo = accountData.data[0]; // Ambil akun pertama
          }
        }
      } catch (error) {
        console.error('Error fetching account info:', error);
        // Tidak perlu throw error, cukup log saja
      }
      
      // Untuk request langsung ke ID, response berupa object tunggal
      return {
        employee: employee,
        accountInfo: accountInfo,
        error: null
      };
    } else {
      console.error('Error response:', response.status, response.statusText);
      if (response.status === 404) {
        throw error(404, `Karyawan dengan ID ${id} tidak ditemukan`);
      }
      throw error(response.status, 'Gagal mengambil data karyawan');
    }
  } catch (err) {
    console.error('Error fetching employee detail:', err);
    
    // Type guard untuk SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, 'Terjadi kesalahan server');
  }
}
