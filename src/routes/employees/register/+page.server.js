import { fail } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN, 
  VITE_FIREBASE_API_KEY
} from '$env/static/private';

export const actions = {
  default: async ({ request }) => {
    // Validasi environment variables
    console.log('=== ENVIRONMENT VARIABLES CHECK ===');
    console.log('VITE_DIRECTUS_URL:', VITE_DIRECTUS_URL ? 'SET' : 'NOT SET');
    console.log('VITE_DIRECTUS_TOKEN:', VITE_DIRECTUS_TOKEN ? 'SET' : 'NOT SET');
    console.log('VITE_FIREBASE_API_KEY:', VITE_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
    
    if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
      console.error('Missing required environment variables for Directus');
      return fail(500, {
        error: 'Konfigurasi server tidak lengkap. Hubungi administrator.',
        values: {}
      });
    }
    
    const data = await request.formData();
    
    // Ekstrak data dari form dengan type casting - 30 field baru (menghapus tanggal_non_aktif dan masa_kerja)
    const employeeData = {
      nama_lengkap: String(data.get('nama_lengkap') || '').trim(),
      status_kerja: String(data.get('status_kerja') || ''),
      tanggal_masuk: String(data.get('tanggal_masuk') || ''),
      divisi: String(data.get('divisi') || ''),
      posisi_jabatan: String(data.get('posisi_jabatan') || ''),
      email: String(data.get('email') || '').trim().toLowerCase(),
      kontak_darurat: String(data.get('kontak_darurat') || '').trim(),
      no_ktp: String(data.get('no_ktp') || '').trim(),
      alamat_ktp: String(data.get('alamat_ktp') || '').trim(),
      status_hubungan: String(data.get('status_hubungan') || ''),
      agama: String(data.get('agama') || ''),
      kelamin: String(data.get('kelamin') || ''),
      lokasi_absen: String(data.get('lokasi_absen') || '')
    };

    // Validasi basic dengan field baru
    const errors = {};
    
    // Validasi nama lengkap
    if (!employeeData.nama_lengkap || employeeData.nama_lengkap.length < 2) {
      errors.nama_lengkap = 'Nama lengkap harus diisi minimal 2 karakter';
    } else if (employeeData.nama_lengkap.length > 100) {
      errors.nama_lengkap = 'Nama lengkap maksimal 100 karakter';
    }
    
    // Validasi status kerja
    const validStatusKerja = ['tetap', 'kontrak', 'magang', 'freelance'];
    if (!employeeData.status_kerja || !validStatusKerja.includes(employeeData.status_kerja)) {
      errors.status_kerja = 'Status kerja harus dipilih';
    }
    
    // Validasi tanggal masuk
    if (!employeeData.tanggal_masuk) {
      errors.tanggal_masuk = 'Tanggal masuk harus diisi';
    } else {
      const startDate = new Date(employeeData.tanggal_masuk);
      const today = new Date();
      if (startDate > today) {
        errors.tanggal_masuk = 'Tanggal masuk tidak boleh di masa depan';
      }
    }
    
    // Validasi divisi
    const validDivisions = ['hrd', 'finance', 'marketing', 'it', 'operations', 'sales', 'production', 'quality_control'];
    if (!employeeData.divisi || !validDivisions.includes(employeeData.divisi)) {
      errors.divisi = 'Divisi harus dipilih';
    }

    // Validasi posisi jabatan
    const validPositions = ['staff', 'supervisor', 'manager', 'senior_manager', 'director', 'gm', 'ceo'];
    if (!employeeData.posisi_jabatan || !validPositions.includes(employeeData.posisi_jabatan)) {
      errors.posisi_jabatan = 'Posisi jabatan harus dipilih';
    }
    
    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!employeeData.email || !emailRegex.test(employeeData.email)) {
      errors.email = 'Email tidak valid';
    } else if (employeeData.email.length > 100) {
      errors.email = 'Email maksimal 100 karakter';
    }
    
    // Validasi no KTP
    if (!employeeData.no_ktp || employeeData.no_ktp.length !== 16 || !/^\d{16}$/.test(employeeData.no_ktp)) {
      errors.no_ktp = 'No KTP harus 16 digit angka';
    }
    
    // Validasi alamat KTP
    if (!employeeData.alamat_ktp || employeeData.alamat_ktp.length < 10) {
      errors.alamat_ktp = 'Alamat KTP harus diisi minimal 10 karakter';
    } else if (employeeData.alamat_ktp.length > 500) {
      errors.alamat_ktp = 'Alamat KTP maksimal 500 karakter';
    }
    
    // Validasi status hubungan (optional)
    const validStatusHubungan = ['lajang', 'menikah', 'cerai', 'janda_duda'];
    if (employeeData.status_hubungan && !validStatusHubungan.includes(employeeData.status_hubungan)) {
      errors.status_hubungan = 'Status hubungan tidak valid';
    }
    
    // Validasi agama (optional)
    const validAgama = ['islam', 'kristen', 'katolik', 'hindu', 'budha', 'konghucu', 'lainnya'];
    if (employeeData.agama && !validAgama.includes(employeeData.agama)) {
      errors.agama = 'Agama tidak valid';
    }

    // Validasi jenis kelamin
    const validGenders = ['laki-laki', 'perempuan'];
    if (!employeeData.kelamin || !validGenders.includes(employeeData.kelamin)) {
      errors.kelamin = 'Jenis kelamin harus dipilih';
    }

    // Validasi lokasi absen
    const validLocations = ['kantor_pusat', 'cabang_jakarta', 'cabang_bandung', 'cabang_surabaya', 'cabang_medan', 'remote'];
    if (!employeeData.lokasi_absen || !validLocations.includes(employeeData.lokasi_absen)) {
      errors.lokasi_absen = 'Lokasi absen harus dipilih';
    }

    // Jika ada error, return dengan error
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return fail(400, {
        errors,
        values: employeeData
      });
    }

    // Buat data final yang akan dikirim ke Directus dengan field baru (semua String kecuali tanggal_masuk dan foto_ktp)
    const finalData = {
      nama_lengkap: employeeData.nama_lengkap,
      status_kerja: employeeData.status_kerja,
      tanggal_masuk: employeeData.tanggal_masuk, // tetap sebagai date
      divisi: employeeData.divisi,
      posisi_jabatan: employeeData.posisi_jabatan,
      email: employeeData.email,
      kontak_darurat: employeeData.kontak_darurat || null,
      status_hubungan: employeeData.status_hubungan || null,
      agama: employeeData.agama || null,
      kelamin: employeeData.kelamin,
      lokasi_absen: employeeData.lokasi_absen,
      no_ktp: employeeData.no_ktp,
      alamat_ktp: employeeData.alamat_ktp,
    };

    try {
      // Environment variables dari .env
      const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
      const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
      const requestUrl = `${directusUrl}/items/register`;
      
      // Log data yang akan dikirim untuk debugging
      console.log('=== DEBUGGING DIRECTUS REQUEST ===');
      console.log('Environment Variables:');
      console.log('- DIRECTUS_URL:', directusUrl);
      console.log('- DIRECTUS_TOKEN:', directusToken ? 'SET' : 'NOT SET');
      console.log('Request URL:', requestUrl);
      console.log('Request Method:', 'POST');
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directusToken}`
      });
      console.log('Request Body:', JSON.stringify(finalData, null, 2));
      
      // Post data ke Directus collection 'items/register' menggunakan fetch
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${directusToken}`
        },
        body: JSON.stringify(finalData)
      });
      
      // Log response untuk debugging
      console.log('=== DIRECTUS RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Status Text:', response.statusText);
      console.log('Response OK:', response.ok);
      
      // Clone response untuk bisa dibaca berkali-kali
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log('Response Text:', responseText);
      
      if (response.ok) {
        const successData = await response.json();
        console.log('✅ Success response:', successData);
        return {
          success: true,
          message: 'Karyawan berhasil didaftarkan!'
        };
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('❌ Failed to parse error response as JSON:', parseError);
          errorData = { message: responseText };
        }
        
        console.log('❌ Error data:', errorData);
        
        // Buat pesan error yang lebih spesifik
        let errorMessage = 'Terjadi kesalahan saat menyimpan data';
        
        if (response.status === 400) {
          if (errorData?.errors) {
            // Jika ada detail error dari validasi
            const errorMessages = Object.values(errorData.errors).flat();
            errorMessage = `Validasi gagal: ${errorMessages.join(', ')}`;
          } else if (errorData?.message) {
            errorMessage = `Bad Request: ${errorData.message}`;
          } else {
            errorMessage = 'Data tidak valid. Periksa kembali form Anda.';
          }
        } else if (response.status === 401) {
          errorMessage = 'Tidak memiliki akses untuk menyimpan data (Unauthorized)';
        } else if (response.status === 403) {
          errorMessage = 'Akses ditolak (Forbidden)';
        } else if (response.status === 404) {
          errorMessage = 'Collection "register" tidak ditemukan di Directus';
        } else if (response.status === 409) {
          errorMessage = 'Email atau NIK sudah terdaftar (Conflict)';
        } else if (response.status === 422) {
          if (errorData?.errors) {
            const errorDetails = Object.entries(errorData.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMessage = `Validasi gagal: ${errorDetails}`;
          } else {
            errorMessage = 'Format data tidak valid atau field yang required tidak lengkap';
          }
        } else if (response.status >= 500) {
          errorMessage = `Server Directus error (${response.status}): ${errorData?.message || response.statusText}`;
        } else {
          errorMessage = `HTTP Error ${response.status}: ${errorData?.message || response.statusText}`;
        }
        
        return fail(response.status, {
          error: errorMessage,
          values: employeeData
        });
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
      
      return fail(500, {
        error: errorMessage,
        values: employeeData
      });
    }
  }
};
