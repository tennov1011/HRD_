import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Validasi environment variables
  console.log('=== EMPLOYEE LIST LOAD ===');
  console.log('VITE_DIRECTUS_URL:', VITE_DIRECTUS_URL ? 'SET' : 'NOT SET');
  console.log('VITE_DIRECTUS_TOKEN:', VITE_DIRECTUS_TOKEN ? 'SET' : 'NOT SET');
  
  if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
    console.error('Missing required environment variables for Directus');
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
      'posisi_jabatan',
      'status_kerja',
      'lokasi_absen'
    ].join(',');
    
    const requestUrl = `${directusUrl}/items/register?fields=${fields}&limit=1000&sort=nama_lengkap`;
    
    // Log request untuk debugging
    console.log('=== DEBUGGING DIRECTUS FETCH ===');
    console.log('Request URL:', requestUrl);
    console.log('Request Method:', 'GET');
    console.log('Request Headers:', {
      'Authorization': `Bearer ${directusToken}`
    });
    
    // Fetch data dari Directus collection 'register'
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log response untuk debugging
    console.log('=== DIRECTUS RESPONSE ===');
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success response:', data);
      
      // Return data karyawan
      return {
        employees: data.data || [],
        error: null
      };
    } else {
      const responseText = await response.text();
      console.log('❌ Error response text:', responseText);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.log('❌ Failed to parse error response as JSON:', parseError);
        errorData = { message: responseText };
      }
      
      console.log('❌ Error data:', errorData);
      
      // Buat pesan error yang lebih spesifik
      let errorMessage = 'Terjadi kesalahan saat mengambil data karyawan';
      
      if (response.status === 401) {
        errorMessage = 'Tidak memiliki akses untuk mengambil data (Unauthorized)';
      } else if (response.status === 403) {
        errorMessage = 'Akses ditolak (Forbidden)';
      } else if (response.status === 404) {
        errorMessage = 'Collection "register" tidak ditemukan di Directus';
      } else if (response.status >= 500) {
        errorMessage = `Server Directus error (${response.status}): ${errorData?.message || response.statusText}`;
      } else {
        errorMessage = `Error ${response.status}: ${errorData?.message || response.statusText}`;
      }
      
      return {
        employees: [],
        error: errorMessage
      };
    }
  } catch (err) {
    console.error('=== NETWORK/PARSING ERROR ===');
    const error = /** @type {Error} */ (err);
    console.error('Error type:', error.constructor?.name || 'Unknown');
    console.error('Error message:', error.message || String(err));
    console.error('Error stack:', error.stack || 'No stack trace');
    
    let errorMessage = 'Terjadi kesalahan jaringan.';
    
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      errorMessage = 'Tidak dapat terhubung ke server Directus. Periksa koneksi internet.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Request timeout. Coba lagi dalam beberapa saat.';
    } else if (error.name === 'SyntaxError') {
      errorMessage = 'Response dari server tidak valid.';
    } else {
      errorMessage = `Kesalahan sistem: ${error.message || String(err)}`;
    }
    
    return {
      employees: [],
      error: errorMessage
    };
  }
}
