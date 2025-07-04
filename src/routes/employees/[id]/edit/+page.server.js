import { fail } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN, 
  VITE_FIREBASE_API_KEY, 
  VITE_FIREBASE_AUTH_DOMAIN, 
  VITE_FIREBASE_PROJECT_ID, 
  VITE_FIREBASE_STORAGE_BUCKET, 
  VITE_FIREBASE_MESSAGING_SENDER_ID, 
  VITE_FIREBASE_APP_ID 
} from '$env/static/private';

// Load function untuk mengambil data karyawan yang akan diedit
export async function load({ params }) {
  const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
  const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
  const employeeId = params.id;

  try {
    console.log('=== LOADING EMPLOYEE DATA FOR EDIT ===');
    console.log('Employee ID:', employeeId);
    console.log('Request URL:', `${directusUrl}/items/register/${employeeId}`);

    const response = await fetch(`${directusUrl}/items/register/${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      const employeeData = result.data;
      
      console.log('✅ Employee data loaded successfully:', employeeData);
      
      // Format tanggal_masuk untuk input date HTML (YYYY-MM-DD)
      let formattedTanggalMasuk = '';
      if (employeeData.tanggal_masuk) {
        try {
          const date = new Date(employeeData.tanggal_masuk);
          if (!isNaN(date.getTime())) {
            // Format ke YYYY-MM-DD untuk input date
            formattedTanggalMasuk = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Error formatting tanggal_masuk:', error);
        }
      }
      
      // Update employeeData dengan tanggal yang sudah diformat
      const formattedEmployeeData = {
        ...employeeData,
        tanggal_masuk: formattedTanggalMasuk
      };
      
      console.log('📅 Formatted tanggal_masuk:', formattedTanggalMasuk);
      
      return {
        employee: formattedEmployeeData,
        success: true
      };
    } else {
      console.error('❌ Failed to load employee data:', response.status, response.statusText);
      return {
        employee: null,
        error: `Gagal mengambil data karyawan: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('❌ Error loading employee data:', error);
    return {
      employee: null,
      error: `Terjadi kesalahan saat mengambil data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Firebase configuration (untuk upload file jika diperlukan)
const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID
};

// Function untuk upload file ke Firebase Storage (jika diperlukan di masa depan)
async function uploadFileToFirebase(file, filename) {
  // Placeholder untuk implementasi Firebase Storage upload
  // Untuk saat ini, kita hanya return filename
  console.log('Firebase config available:', !!firebaseConfig.apiKey);
  console.log('File to upload:', filename);
  return filename;
}

export const actions = {
  default: async ({ request, params }) => {
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
    
    // Handle file upload untuk foto_ktp
    const foto_ktp = data.get('foto_ktp');
    let uploadedFileName = null;
    
    // Upload file ke Firebase jika ada
    if (foto_ktp && foto_ktp instanceof File && foto_ktp.size > 0) {
      try {
        uploadedFileName = await uploadFileToFirebase(foto_ktp, foto_ktp.name);
        console.log('File uploaded successfully:', uploadedFileName);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Tetap lanjutkan proses meskipun upload file gagal
        uploadedFileName = foto_ktp.name;
      }
    }
    
    // Ekstrak data dari form dengan type casting - 30 field baru (menghapus tanggal_non_aktif dan masa_kerja)
    const employeeData = {
      nama_lengkap: String(data.get('nama_lengkap') || '').trim(),
      status_kerja: String(data.get('status_kerja') || ''),
      penggajian: String(data.get('penggajian') || ''),
      no_karyawan: String(data.get('no_karyawan') || '').trim(),
      tanggal_masuk: String(data.get('tanggal_masuk') || ''),
      divisi: String(data.get('divisi') || ''),
      posisi_jabatan: String(data.get('posisi_jabatan') || ''),
      no_telp: String(data.get('no_telp') || '').trim(),
      email: String(data.get('email') || '').trim().toLowerCase(),
      kontak_darurat: String(data.get('kontak_darurat') || '').trim(),
      nip: String(data.get('nip') || '').trim(),
      no_ktp: String(data.get('no_ktp') || '').trim(),
      no_kk: String(data.get('no_kk') || '').trim(),
      no_npwp: String(data.get('no_npwp') || '').trim(),
      tempat_tanggal_lahir: String(data.get('tempat_tanggal_lahir') || '').trim(),
      alamat_ktp: String(data.get('alamat_ktp') || '').trim(),
      alamat_domisili: String(data.get('alamat_domisili') || '').trim(),
      asal_kota: String(data.get('asal_kota') || '').trim(),
      umur: String(data.get('umur') || ''),
      status_hubungan: String(data.get('status_hubungan') || ''),
      agama: String(data.get('agama') || ''),
      tanggungan: String(data.get('tanggungan') || ''),
      pendidikan_terakhir: String(data.get('pendidikan_terakhir') || ''),
      no_bpjs: String(data.get('no_bpjs') || '').trim(),
      faskes_tingkat_1: String(data.get('faskes_tingkat_1') || '').trim(),
      nama_bank: String(data.get('nama_bank') || '').trim(),
      no_rekening_bank: String(data.get('no_rekening_bank') || '').trim(),
      foto_ktp: uploadedFileName,
      kelamin: String(data.get('kelamin') || ''),
      lokasi_absen: String(data.get('lokasi_absen') || '')
    };

    // Validasi fleksibel untuk edit - hanya validasi format jika field diisi
    const errors = {};
    
    // Validasi nama lengkap (opsional, hanya jika diisi)
    if (employeeData.nama_lengkap && employeeData.nama_lengkap.length > 0) {
      if (employeeData.nama_lengkap.length < 2) {
        errors.nama_lengkap = 'Nama lengkap minimal 2 karakter';
      } else if (employeeData.nama_lengkap.length > 100) {
        errors.nama_lengkap = 'Nama lengkap maksimal 100 karakter';
      }
    }
    
    // Validasi status kerja (opsional, hanya jika diisi)
    const validStatusKerja = ['tetap', 'kontrak', 'magang', 'freelance'];
    if (employeeData.status_kerja && !validStatusKerja.includes(employeeData.status_kerja)) {
      errors.status_kerja = 'Status kerja tidak valid';
    }
    
    // Validasi penggajian (opsional, hanya jika diisi)
    if (employeeData.penggajian && employeeData.penggajian.length > 0) {
      if (!/^\d+$/.test(employeeData.penggajian)) {
        errors.penggajian = 'Penggajian harus berupa angka';
      } else if (employeeData.penggajian.length > 15) {
        errors.penggajian = 'Penggajian maksimal 15 digit';
      }
    }
    
    // Validasi no karyawan (opsional, hanya jika diisi)
    if (employeeData.no_karyawan && employeeData.no_karyawan.length > 0) {
      if (employeeData.no_karyawan.length < 3) {
        errors.no_karyawan = 'No karyawan minimal 3 karakter';
      } else if (employeeData.no_karyawan.length > 20) {
        errors.no_karyawan = 'No karyawan maksimal 20 karakter';
      }
    }
    
    // Validasi tanggal masuk (opsional, hanya jika diisi)
    if (employeeData.tanggal_masuk && employeeData.tanggal_masuk.length > 0) {
      const startDate = new Date(employeeData.tanggal_masuk);
      const today = new Date();
      if (isNaN(startDate.getTime())) {
        errors.tanggal_masuk = 'Format tanggal tidak valid';
      } else if (startDate > today) {
        errors.tanggal_masuk = 'Tanggal masuk tidak boleh di masa depan';
      }
    }
    
    // Validasi divisi (opsional, hanya jika diisi)
    const validDivisions = ['hrd', 'finance', 'marketing', 'it', 'operations', 'sales', 'production', 'quality_control'];
    if (employeeData.divisi && !validDivisions.includes(employeeData.divisi)) {
      errors.divisi = 'Divisi tidak valid';
    }

    // Validasi posisi jabatan (opsional, hanya jika diisi)
    const validPositions = ['staff', 'supervisor', 'manager', 'senior_manager', 'director', 'gm', 'ceo'];
    if (employeeData.posisi_jabatan && !validPositions.includes(employeeData.posisi_jabatan)) {
      errors.posisi_jabatan = 'Posisi jabatan tidak valid';
    }

    // Validasi nomor telepon (opsional, hanya jika diisi)
    if (employeeData.no_telp && employeeData.no_telp.length > 0) {
      if (employeeData.no_telp.length < 10) {
        errors.no_telp = 'Nomor telepon minimal 10 digit';
      } else if (employeeData.no_telp.length > 15) {
        errors.no_telp = 'Nomor telepon maksimal 15 digit';
      } else if (!/^[\d+\-\s()]+$/.test(employeeData.no_telp)) {
        errors.no_telp = 'Format nomor telepon tidak valid';
      }
    }
    
    // Validasi email (opsional, hanya jika diisi)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (employeeData.email && employeeData.email.length > 0) {
      if (!emailRegex.test(employeeData.email)) {
        errors.email = 'Format email tidak valid';
      } else if (employeeData.email.length > 100) {
        errors.email = 'Email maksimal 100 karakter';
      }
    }
    
    // Validasi NIP (opsional, hanya jika diisi)
    if (employeeData.nip && employeeData.nip.length > 0) {
      if (employeeData.nip.length < 8) {
        errors.nip = 'NIP minimal 8 karakter';
      }
    }
    
    // Validasi no KTP (opsional, hanya jika diisi)
    if (employeeData.no_ktp && employeeData.no_ktp.length > 0) {
      if (employeeData.no_ktp.length !== 16 || !/^\d{16}$/.test(employeeData.no_ktp)) {
        errors.no_ktp = 'No KTP harus 16 digit angka';
      }
    }
    
    // Validasi no KK (opsional, hanya jika diisi)
    if (employeeData.no_kk && employeeData.no_kk.length > 0) {
      if (employeeData.no_kk.length !== 16 || !/^\d{16}$/.test(employeeData.no_kk)) {
        errors.no_kk = 'No KK harus 16 digit angka';
      }
    }
    
    // Validasi no NPWP (opsional, hanya jika diisi)
    if (employeeData.no_npwp && employeeData.no_npwp.length > 0) {
      if (employeeData.no_npwp.length < 15) {
        errors.no_npwp = 'No NPWP minimal 15 karakter';
      }
    }
    
    // Validasi tempat tanggal lahir (opsional, hanya jika diisi)
    if (employeeData.tempat_tanggal_lahir && employeeData.tempat_tanggal_lahir.length > 0) {
      if (employeeData.tempat_tanggal_lahir.length < 10) {
        errors.tempat_tanggal_lahir = 'Tempat, tanggal lahir minimal 10 karakter';
      }
    }
    
    // Validasi alamat KTP (opsional, hanya jika diisi)
    if (employeeData.alamat_ktp && employeeData.alamat_ktp.length > 0) {
      if (employeeData.alamat_ktp.length < 10) {
        errors.alamat_ktp = 'Alamat KTP minimal 10 karakter';
      } else if (employeeData.alamat_ktp.length > 500) {
        errors.alamat_ktp = 'Alamat KTP maksimal 500 karakter';
      }
    }
    
    // Validasi alamat domisili (opsional, hanya jika diisi)
    if (employeeData.alamat_domisili && employeeData.alamat_domisili.length > 0) {
      if (employeeData.alamat_domisili.length < 10) {
        errors.alamat_domisili = 'Alamat domisili minimal 10 karakter';
      } else if (employeeData.alamat_domisili.length > 500) {
        errors.alamat_domisili = 'Alamat domisili maksimal 500 karakter';
      }
    }
    
    // Validasi asal kota (optional)
    if (employeeData.asal_kota && employeeData.asal_kota.length > 50) {
      errors.asal_kota = 'Asal kota maksimal 50 karakter';
    }
    
    // Validasi umur (optional) - sekarang sebagai String
    if (employeeData.umur && employeeData.umur.length > 0) {
      if (!/^\d+$/.test(employeeData.umur)) {
        errors.umur = 'Umur harus berupa angka';
      } else {
        const ageNum = parseInt(employeeData.umur);
        if (ageNum < 17 || ageNum > 65) {
          errors.umur = 'Umur harus antara 17-65 tahun';
        }
      }
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
    
    // Validasi tanggungan (optional) - sekarang sebagai String
    if (employeeData.tanggungan && employeeData.tanggungan.length > 0) {
      if (!/^\d+$/.test(employeeData.tanggungan)) {
        errors.tanggungan = 'Jumlah tanggungan harus berupa angka';
      } else if (employeeData.tanggungan.length > 2) {
        errors.tanggungan = 'Jumlah tanggungan maksimal 2 digit';
      }
    }
    
    // Validasi pendidikan terakhir (optional)
    const validPendidikan = ['sd', 'smp', 'sma', 'd1', 'd2', 'd3', 's1', 's2', 's3'];
    if (employeeData.pendidikan_terakhir && !validPendidikan.includes(employeeData.pendidikan_terakhir)) {
      errors.pendidikan_terakhir = 'Pendidikan terakhir tidak valid';
    }
    
    // Validasi no BPJS (opsional, hanya jika diisi)
    if (employeeData.no_bpjs && employeeData.no_bpjs.length > 0) {
      if (employeeData.no_bpjs.length < 8 || employeeData.no_bpjs.length > 13) {
        errors.no_bpjs = 'No BPJS harus 8-13 digit';
      }
    }
    
    // Validasi faskes tingkat 1 (opsional, hanya jika diisi)
    if (employeeData.faskes_tingkat_1 && employeeData.faskes_tingkat_1.length > 100) {
      errors.faskes_tingkat_1 = 'Faskes tingkat 1 maksimal 100 karakter';
    }
    
    // Validasi nama bank (opsional, hanya jika diisi)
    if (employeeData.nama_bank && employeeData.nama_bank.length > 50) {
      errors.nama_bank = 'Nama bank maksimal 50 karakter';
    }
    
    // Validasi no rekening bank (opsional, hanya jika diisi)
    if (employeeData.no_rekening_bank && employeeData.no_rekening_bank.length > 0) {
      if (employeeData.no_rekening_bank.length < 8 || employeeData.no_rekening_bank.length > 20) {
        errors.no_rekening_bank = 'No rekening bank harus 8-20 karakter';
      }
    }

    // Validasi jenis kelamin (opsional, hanya jika diisi)
    const validGenders = ['laki-laki', 'perempuan'];
    if (employeeData.kelamin && !validGenders.includes(employeeData.kelamin)) {
      errors.kelamin = 'Jenis kelamin tidak valid';
    }

    // Validasi lokasi absen (opsional, hanya jika diisi)
    const validLocations = ['kantor_pusat', 'cabang_jakarta', 'cabang_bandung', 'cabang_surabaya', 'cabang_medan', 'remote'];
    if (employeeData.lokasi_absen && !validLocations.includes(employeeData.lokasi_absen)) {
      errors.lokasi_absen = 'Lokasi absen tidak valid';
    }

    // Jika ada error, return dengan error
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return fail(400, {
        errors,
        values: employeeData
      });
    }

    // Buat data final yang akan dikirim ke Directus - hanya kirim field yang diisi
    const finalData = {};
    
    // Hanya tambahkan field ke finalData jika tidak kosong
    if (employeeData.nama_lengkap && employeeData.nama_lengkap.trim()) {
      finalData.nama_lengkap = employeeData.nama_lengkap;
    }
    if (employeeData.status_kerja) {
      finalData.status_kerja = employeeData.status_kerja;
    }
    if (employeeData.penggajian && employeeData.penggajian.trim()) {
      finalData.penggajian = employeeData.penggajian;
    }
    if (employeeData.no_karyawan && employeeData.no_karyawan.trim()) {
      finalData.no_karyawan = employeeData.no_karyawan;
    }
    if (employeeData.tanggal_masuk && employeeData.tanggal_masuk.trim()) {
      finalData.tanggal_masuk = employeeData.tanggal_masuk;
    }
    if (employeeData.divisi) {
      finalData.divisi = employeeData.divisi;
    }
    if (employeeData.posisi_jabatan) {
      finalData.posisi_jabatan = employeeData.posisi_jabatan;
    }
    if (employeeData.no_telp && employeeData.no_telp.trim()) {
      finalData.no_telp = employeeData.no_telp;
    }
    if (employeeData.email && employeeData.email.trim()) {
      finalData.email = employeeData.email;
    }
    if (employeeData.kontak_darurat && employeeData.kontak_darurat.trim()) {
      finalData.kontak_darurat = employeeData.kontak_darurat;
    }
    if (employeeData.nip && employeeData.nip.trim()) {
      finalData.nip = employeeData.nip;
    }
    if (employeeData.no_ktp && employeeData.no_ktp.trim()) {
      finalData.no_ktp = employeeData.no_ktp;
    }
    if (employeeData.no_kk && employeeData.no_kk.trim()) {
      finalData.no_kk = employeeData.no_kk;
    }
    if (employeeData.no_npwp && employeeData.no_npwp.trim()) {
      finalData.no_npwp = employeeData.no_npwp;
    }
    if (employeeData.tempat_tanggal_lahir && employeeData.tempat_tanggal_lahir.trim()) {
      finalData.tempat_tanggal_lahir = employeeData.tempat_tanggal_lahir;
    }
    if (employeeData.alamat_ktp && employeeData.alamat_ktp.trim()) {
      finalData.alamat_ktp = employeeData.alamat_ktp;
    }
    if (employeeData.alamat_domisili && employeeData.alamat_domisili.trim()) {
      finalData.alamat_domisili = employeeData.alamat_domisili;
    }
    if (employeeData.asal_kota && employeeData.asal_kota.trim()) {
      finalData.asal_kota = employeeData.asal_kota;
    }
    if (employeeData.umur && employeeData.umur.trim()) {
      finalData.umur = employeeData.umur;
    }
    if (employeeData.status_hubungan) {
      finalData.status_hubungan = employeeData.status_hubungan;
    }
    if (employeeData.agama) {
      finalData.agama = employeeData.agama;
    }
    if (employeeData.tanggungan && employeeData.tanggungan.trim()) {
      finalData.tanggungan = employeeData.tanggungan;
    }
    if (employeeData.pendidikan_terakhir) {
      finalData.pendidikan_terakhir = employeeData.pendidikan_terakhir;
    }
    if (employeeData.no_bpjs && employeeData.no_bpjs.trim()) {
      finalData.no_bpjs = employeeData.no_bpjs;
    }
    if (employeeData.faskes_tingkat_1 && employeeData.faskes_tingkat_1.trim()) {
      finalData.faskes_tingkat_1 = employeeData.faskes_tingkat_1;
    }
    if (employeeData.nama_bank && employeeData.nama_bank.trim()) {
      finalData.nama_bank = employeeData.nama_bank;
    }
    if (employeeData.no_rekening_bank && employeeData.no_rekening_bank.trim()) {
      finalData.no_rekening_bank = employeeData.no_rekening_bank;
    }
    if (employeeData.kelamin) {
      finalData.kelamin = employeeData.kelamin;
    }
    if (employeeData.lokasi_absen) {
      finalData.lokasi_absen = employeeData.lokasi_absen;
    }
    if (uploadedFileName) {
      finalData.foto_ktp = uploadedFileName;
    }

    try {
      // Environment variables dari .env
      const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
      const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
      const employeeId = params.id;
      const requestUrl = `${directusUrl}/items/register/${employeeId}`;
      
      // Log data yang akan dikirim untuk debugging
      console.log('=== DEBUGGING DIRECTUS REQUEST ===');
      console.log('Environment Variables:');
      console.log('- DIRECTUS_URL:', directusUrl);
      console.log('- DIRECTUS_TOKEN:', directusToken ? 'SET' : 'NOT SET');
      console.log('Employee ID:', employeeId);
      console.log('Request URL:', requestUrl);
      console.log('Request Method:', 'PATCH');
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directusToken}`
      });
      console.log('Request Body:', JSON.stringify(finalData, null, 2));
      
      // Update data ke Directus collection 'items/register' menggunakan PATCH
      const response = await fetch(requestUrl, {
        method: 'PATCH',
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
          message: 'Data karyawan berhasil diperbarui!'
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
