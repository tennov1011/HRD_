import { json } from '@sveltejs/kit';

// Konfigurasi Directus API
const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { employee_id, email, password, nama_lengkap, divisi, posisi_jabatan } = await request.json();

    // Validasi input
    if (!employee_id || !email || !password) {
      return json(
        { error: 'Employee ID, email, dan password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah akun dengan email ini sudah ada
    const checkEmailResponse = await fetch(`${DIRECTUS_URL}/items/akun?filter[email][_eq]=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkEmailResponse.ok) {
      console.error('Error checking existing email:', await checkEmailResponse.text());
      return json(
        { error: 'Gagal memeriksa email yang sudah ada' },
        { status: 500 }
      );
    }

    const existingAccounts = await checkEmailResponse.json();
    if (existingAccounts.data && existingAccounts.data.length > 0) {
      return json(
        { error: 'Email sudah digunakan untuk akun lain' },
        { status: 409 }
      );
    }

    // Cek apakah karyawan sudah memiliki akun
    const checkEmployeeResponse = await fetch(`${DIRECTUS_URL}/items/akun?filter[employee_id][_eq]=${employee_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkEmployeeResponse.ok) {
      console.error('Error checking existing employee account:', await checkEmployeeResponse.text());
      return json(
        { error: 'Gagal memeriksa akun karyawan yang sudah ada' },
        { status: 500 }
      );
    }

    const existingEmployeeAccounts = await checkEmployeeResponse.json();
    if (existingEmployeeAccounts.data && existingEmployeeAccounts.data.length > 0) {
      return json(
        { error: 'Karyawan sudah memiliki akun' },
        { status: 409 }
      );
    }

    // Tentukan role berdasarkan posisi jabatan
    let role = 'employee'; // default role
    const managerPositions = ['manager', 'senior_manager', 'director', 'gm', 'ceo'];
    const supervisorPositions = ['supervisor'];
    
    if (managerPositions.includes(posisi_jabatan?.toLowerCase())) {
      role = 'manager';
    } else if (supervisorPositions.includes(posisi_jabatan?.toLowerCase())) {
      role = 'supervisor';
    }

    // Buat akun baru di collection akun
    const createAccountData = {
      employee_id: employee_id,
      email: email,
      password: password, // Directus akan hash password secara otomatis
      nama_lengkap: nama_lengkap,
      divisi: divisi,
      posisi_jabatan: posisi_jabatan,
      role: role,
      created_at: new Date().toISOString()
    };

    const createResponse = await fetch(`${DIRECTUS_URL}/items/akun`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createAccountData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Error creating account:', errorText);
      
      // Parse error message if possible
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          if (firstError.extensions && firstError.extensions.code === 'RECORD_NOT_UNIQUE') {
            return json(
              { error: 'Email sudah digunakan' },
              { status: 409 }
            );
          }
        }
      } catch {
        // Ignore parse error, use generic message
      }
      
      return json(
        { error: 'Gagal membuat akun' },
        { status: 500 }
      );
    }

    const newAccount = await createResponse.json();

    return json({
      success: true,
      message: 'Akun berhasil dibuat',
      account: {
        id: newAccount.data.id,
        email: newAccount.data.email,
        nama_lengkap: newAccount.data.nama_lengkap,
        role: newAccount.data.role
      }
    });

  } catch (error) {
    console.error('Error in create-account API:', error);
    return json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
