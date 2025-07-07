import { fail } from '@sveltejs/kit';
import {
  VITE_DIRECTUS_URL,
  VITE_DIRECTUS_TOKEN,
  VITE_FIREBASE_API_KEY,
} from '$env/static/private';

// Fungsi untuk format tampilan jam dari timestamp dengan WIB
function formatTimeDisplay(timestamp) {
  if (!timestamp) return '-';
  
  try {
    // Jika timestamp dalam format YYYY-MM-DD HH:MM:SS+07:00 atau YYYY-MM-DD HH:MM:SS
    if (typeof timestamp === 'string') {
      // Hapus timezone offset jika ada (+07:00)
      const cleanTimestamp = timestamp.replace(/\+\d{2}:\d{2}$/, '');
      
      if (cleanTimestamp.includes(' ')) {
        const timePart = cleanTimestamp.split(' ')[1];
        if (timePart) {
          // Ambil HH:MM dari HH:MM:SS dan tambahkan WIB
          const timeFormatted = timePart.substring(0, 5);
          return `${timeFormatted} WIB`;
        }
      }
    }
    
    // Jika format lain, coba parse sebagai Date
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      const timeFormatted = date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
      });
      return `${timeFormatted} WIB`;
    }
    
    return timestamp;
  } catch {
    return timestamp || '-';
  }
}

// Load function untuk mengambil data karyawan yang akan diedit
export async function load({ params }) {
  const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
  const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
  const employeeId = params.id;

  try {
    console.log('=== LOADING EMPLOYEE DATA FOR EDIT ===');
    console.log('Employee ID:', employeeId);
    console.log('Request URL:', `${directusUrl}/items/register/${employeeId}`);

    // Fetch employee data
    const employeeResponse = await fetch(`${directusUrl}/items/register/${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Fetch master data
    const masterDataResponse = await fetch(`${directusUrl}/items/master_data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (employeeResponse.ok && masterDataResponse.ok) {
      const employeeResult = await employeeResponse.json();
      const masterDataResult = await masterDataResponse.json();
      
      const employeeData = employeeResult.data;
      const allMasterData = masterDataResult.data || [];

      console.log('✅ Employee data loaded successfully:', employeeData);
      console.log('✅ Master data loaded successfully:', allMasterData.length, 'items');

      // Debug master data shift items
      const shiftItems = allMasterData.filter(item => item.category === 'shift' && item.status === 'aktif');
      console.log('🔍 Raw shift items from master_data:', shiftItems);

      // Kelompokkan data master berdasarkan kategori dan hanya ambil yang statusnya aktif
      const masterData = {
        divisi: allMasterData
          .filter(item => item.category === 'divisi' && item.status === 'aktif')
          .map(item => ({
            value: item.nama,
            label: item.nama,
            id: item.id
          })),
        jabatan: allMasterData
          .filter(item => item.category === 'jabatan' && item.status === 'aktif')
          .map(item => ({
            value: item.nama,
            label: item.nama,
            id: item.id
          })),
        lokasi_absen: allMasterData
          .filter(item => item.category === 'lokasi_absen' && item.status === 'aktif')
          .map(item => ({
            value: item.nama,
            label: item.nama,
            id: item.id,
            alamat: item.alamat || ''
          })),
        shift: allMasterData
          .filter(item => item.category === 'shift' && item.status === 'aktif')
          .map(item => ({
            value: item.nama,
            label: item.nama,
            id: item.id,
            jam_masuk: formatTimeDisplay(item.jam_masuk),
            jam_keluar: formatTimeDisplay(item.jam_keluar)
          }))
      };

      // Debug mapped master data
      console.log('🔍 Mapped shift options:', masterData.shift);
      
      // Debug dropdown values
      console.log('=== DEBUGGING DROPDOWN VALUES ===');
      console.log('Status Kerja:', employeeData.status_kerja);
      console.log('Divisi:', employeeData.divisi);
      console.log('Posisi Jabatan:', employeeData.jabatan);
      console.log('Sistem Penggajian:', employeeData.penggajian);
      console.log('Shift:', employeeData.shift);
      console.log('Jenis Kelamin:', employeeData.kelamin);
      console.log('Status Hubungan:', employeeData.status_hubungan);
      console.log('Agama:', employeeData.agama);
      console.log('Pendidikan Terakhir:', employeeData.pendidikan_terakhir);
      console.log('Lokasi Absen:', employeeData.lokasi_absen);

      // Format tanggal_masuk untuk input date HTML (YYYY-MM-DD)
      let formattedTanggalMasuk = '';
      if (employeeData.tanggal_masuk) {
        try {
          const date = new Date(employeeData.tanggal_masuk);
          if (!isNaN(date.getTime())) {
            formattedTanggalMasuk = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Error formatting tanggal_masuk:', error);
        }
      }

      // Normalisasi nilai dropdown untuk memastikan matching dengan options
      const normalizedEmployeeData = {
        ...employeeData,
        tanggal_masuk: formattedTanggalMasuk,
        // Normalisasi nilai dropdown ke lowercase
        status_kerja: employeeData.status_kerja?.toLowerCase() || '',
        divisi: employeeData.divisi?.toLowerCase() || '',
        jabatan: employeeData.jabatan?.toLowerCase() || '',
        penggajian: employeeData.penggajian?.toLowerCase() || '',
        shift: employeeData.shift?.toLowerCase() || '',
        kelamin: employeeData.kelamin?.toLowerCase() || '',
        status_hubungan: employeeData.status_hubungan?.toLowerCase() || '',
        agama: employeeData.agama?.toLowerCase() || '',
        pendidikan_terakhir: employeeData.pendidikan_terakhir?.toLowerCase() || '',
        lokasi_absen: employeeData.lokasi_absen?.toLowerCase() || ''
      };

      console.log('=== NORMALIZED DROPDOWN VALUES ===');
      console.log('Status Kerja (normalized):', normalizedEmployeeData.status_kerja);
      console.log('Divisi (normalized):', normalizedEmployeeData.divisi);
      console.log('Posisi Jabatan (normalized):', normalizedEmployeeData.jabatan);

      return {
        employee: normalizedEmployeeData,
        masterData,
        success: true
      };
    } else {
      // Handle error saat fetch employee atau master data
      let errorMessage = 'Gagal mengambil data';
      
      if (!employeeResponse.ok) {
        console.error('❌ Failed to load employee data:', employeeResponse.status, employeeResponse.statusText);
        errorMessage = `Gagal mengambil data karyawan: ${employeeResponse.status} ${employeeResponse.statusText}`;
      }
      
      if (!masterDataResponse.ok) {
        console.error('❌ Failed to load master data:', masterDataResponse.status, masterDataResponse.statusText);
        errorMessage += ` | Gagal mengambil master data: ${masterDataResponse.status} ${masterDataResponse.statusText}`;
      }

      return {
        employee: null,
        masterData: { divisi: [], jabatan: [], lokasi_absen: [], shift: [] },
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('❌ Error loading employee data:', error);
    return {
      employee: null,
      masterData: { divisi: [], jabatan: [], lokasi_absen: [], shift: [] },
      error: `Terjadi kesalahan saat mengambil data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Function untuk upload file ke Directus Files collection
async function uploadFileToDirectus(file, directusUrl, directusToken) {
  try {
    console.log('=== UPLOADING FILE TO DIRECTUS ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    // Buat FormData untuk upload file
    const formData = new FormData();
    formData.append('file', file);

    // Upload ke Directus Files collection
    const uploadResponse = await fetch(`${directusUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${directusToken}`
        // Jangan set Content-Type untuk FormData, biarkan browser yang set
      },
      body: formData
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response ok:', uploadResponse.ok);

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ File uploaded successfully:', uploadResult);
      
      // Return file ID yang bisa digunakan untuk relasi
      return uploadResult.data.id;
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ File upload failed:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
  } catch (error) {
    console.error('❌ File upload error:', error);
    throw error;
  }
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
    let uploadedFileId = null;

    // Upload file ke Directus jika ada
    if (foto_ktp && foto_ktp instanceof File && foto_ktp.size > 0) {
      try {
        console.log('=== PROCESSING FILE UPLOAD ===');
        console.log('File detected:', foto_ktp.name, foto_ktp.size, 'bytes');
        
        const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
        const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
        
        uploadedFileId = await uploadFileToDirectus(foto_ktp, directusUrl, directusToken);
        console.log('✅ File uploaded with ID:', uploadedFileId);
      } catch (uploadError) {
        console.error('❌ File upload failed:', uploadError);
        return fail(400, {
          error: `Gagal mengupload file: ${uploadError.message}`,
          values: {}
        });
      }
    }

    // Ekstrak data dari form dengan type casting
    const employeeData = {
      nama_lengkap: String(data.get('nama_lengkap') || '').trim(),
      status_kerja: String(data.get('status_kerja') || ''),
      penggajian: String(data.get('penggajian') || ''),
      shift: String(data.get('shift') || ''),
      no_karyawan: String(data.get('no_karyawan') || '').trim(),
      tanggal_masuk: String(data.get('tanggal_masuk') || ''),
      divisi: String(data.get('divisi') || ''),
      jabatan: String(data.get('jabatan') || ''),
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
      foto_ktp: uploadedFileId, // Simpan file ID, bukan filename
      kelamin: String(data.get('kelamin') || ''),
      lokasi_absen: String(data.get('lokasi_absen') || '')
    };

    // Validasi fleksibel untuk edit - hanya validasi format jika field diisi
    const errors = {};

    // Fetch master data untuk validasi
    let masterDataForValidation;
    try {
      const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
      const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
      
      const masterDataResponse = await fetch(`${directusUrl}/items/master_data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${directusToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (masterDataResponse.ok) {
        const masterDataResult = await masterDataResponse.json();
        const allData = masterDataResult.data || [];
        
        masterDataForValidation = {
          divisi: allData.filter(item => item.category === 'divisi' && item.status === 'aktif').map(item => item.nama),
          jabatan: allData.filter(item => item.category === 'jabatan' && item.status === 'aktif').map(item => item.nama),
          lokasi_absen: allData.filter(item => item.category === 'lokasi_absen' && item.status === 'aktif').map(item => item.nama),
          shift: allData.filter(item => item.category === 'shift' && item.status === 'aktif').map(item => item.nama)
        };
      } else {
        throw new Error('Failed to fetch master data for validation');
      }
    } catch (error) {
      console.warn('Error fetching master data for validation, using fallback:', error);
      // Fallback to static validation
      masterDataForValidation = {
        divisi: ['hrd', 'finance', 'marketing', 'it', 'operations', 'sales', 'production', 'quality_control'],
        jabatan: ['staff', 'supervisor', 'manager', 'senior_manager', 'director', 'gm', 'ceo'],
        lokasi_absen: ['kantor_pusat', 'cabang_jakarta', 'cabang_bandung', 'cabang_surabaya', 'cabang_medan', 'remote'],
        shift: ['pagi', 'siang', 'malam', 'reguler', 'fleksibel']
      };
    }

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
    const validPenggajian = ['harian', 'bulanan'];
    if (employeeData.penggajian && !validPenggajian.includes(employeeData.penggajian)) {
      errors.penggajian = 'Penggajian harus berupa "Harian" atau "Bulanan"';
    }

    // Validasi shift (opsional, hanya jika diisi)
    if (employeeData.shift && !masterDataForValidation.shift.includes(employeeData.shift)) {
      errors.shift = 'Shift tidak valid';
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
    if (employeeData.divisi && !masterDataForValidation.divisi.includes(employeeData.divisi)) {
      errors.divisi = 'Divisi tidak valid';
    }

    // Validasi posisi jabatan (opsional, hanya jika diisi)
    if (employeeData.jabatan && !masterDataForValidation.jabatan.includes(employeeData.jabatan)) {
      errors.jabatan = 'Posisi jabatan tidak valid';
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

    // Validasi tanggungan (optional) - format K/(tanggungan)
    if (employeeData.tanggungan && employeeData.tanggungan.length > 0) {
      // Format yang diharapkan: K/0, K/1, K/2, K/3, dst.
      const tanggunganPattern = /^K\/\d{1,2}$/;
      if (!tanggunganPattern.test(employeeData.tanggungan)) {
        errors.tanggungan = 'Format tanggungan harus K/(angka), contoh: K/0, K/1, K/2';
      } else {
        // Validasi nilai tanggungan (ambil angka setelah K/)
        const tanggunganValue = parseInt(employeeData.tanggungan.split('/')[1]);
        if (tanggunganValue > 20) {
          errors.tanggungan = 'Jumlah tanggungan maksimal 20';
        }
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
    if (employeeData.lokasi_absen && !masterDataForValidation.lokasi_absen.includes(employeeData.lokasi_absen)) {
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
    if (employeeData.shift) {
      finalData.shift = employeeData.shift;
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
    if (employeeData.jabatan) {
      finalData.jabatan = employeeData.jabatan;
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
    if (uploadedFileId) {
      finalData.foto_ktp = uploadedFileId;
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
