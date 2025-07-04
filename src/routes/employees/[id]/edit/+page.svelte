<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { ActionData } from './$types';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  
  export let form: ActionData;
  export let data: any; // Temporary fix untuk PageData type
  
  // Notification store
  const notification = writable({ show: false, type: '', message: '' });
  
  const showNotification = (type: string, message: string) => {
    notification.set({ show: true, type, message });
    setTimeout(() => {
      notification.set({ show: false, type: '', message: '' });
    }, 3000);
  };
  
	// Form fields - 30 variabel sesuai urutan yang diminta
	let nama_lengkap = '';
	let no_karyawan = '';
	let tanggal_masuk = '';
	let status_kerja = '';
	let divisi = '';
	let posisi_jabatan = '';
	let penggajian = '';
	let no_rekening_bank = '';
	let nama_bank = '';
	let email = '';
	let no_telp = '';
	let kelamin = '';
	let tempat_tanggal_lahir = '';
	let umur = '';
	let agama = '';
	let status_hubungan = '';
	let tanggungan = '';
	let kontak_darurat = '';
	let nip = '';
	let no_ktp = '';
	let no_kk = '';
	let no_npwp = '';
	let no_bpjs = '';
	let faskes_tingkat_1 = '';
	let pendidikan_terakhir = '';
	let alamat_ktp = '';
	let alamat_domisili = '';
	let asal_kota = '';
	let lokasi_absen = '';
	let foto_ktp: File | null = null;

  // State untuk loading dan animasi
  let isLoading = false;
  
  // Inisialisasi data dari server saat component mount
  onMount(() => {
    if (data?.employee) {
      console.log('Loading employee data into form:', data.employee);
      const employee = data.employee;
      
      // Populate form dengan data yang sudah ada
      nama_lengkap = employee.nama_lengkap || '';
      no_karyawan = employee.no_karyawan || '';
      tanggal_masuk = employee.tanggal_masuk || '';
      status_kerja = employee.status_kerja || '';
      divisi = employee.divisi || '';
      posisi_jabatan = employee.posisi_jabatan || '';
      penggajian = employee.penggajian || '';
      no_rekening_bank = employee.no_rekening_bank || '';
      nama_bank = employee.nama_bank || '';
      email = employee.email || '';
      no_telp = employee.no_telp || '';
      kelamin = employee.kelamin || '';
      tempat_tanggal_lahir = employee.tempat_tanggal_lahir || '';
      umur = employee.umur || '';
      agama = employee.agama || '';
      status_hubungan = employee.status_hubungan || '';
      tanggungan = employee.tanggungan || '';
      kontak_darurat = employee.kontak_darurat || '';
      nip = employee.nip || '';
      no_ktp = employee.no_ktp || '';
      no_kk = employee.no_kk || '';
      no_npwp = employee.no_npwp || '';
      no_bpjs = employee.no_bpjs || '';
      faskes_tingkat_1 = employee.faskes_tingkat_1 || '';
      pendidikan_terakhir = employee.pendidikan_terakhir || '';
      alamat_ktp = employee.alamat_ktp || '';
      alamat_domisili = employee.alamat_domisili || '';
      asal_kota = employee.asal_kota || '';
      lokasi_absen = employee.lokasi_absen || '';
      
      // Debug log untuk tanggal_masuk
      console.log('🔍 Debug tanggal_masuk:', {
        raw: employee.tanggal_masuk,
        assigned: tanggal_masuk,
        type: typeof employee.tanggal_masuk
      });
    }
    
    // Show error jika ada masalah saat loading data
    if (data?.error) {
      showNotification('error', data.error);
    }
  });
  
  // Pilihan status kerja
  const statusKerjaOptions = [
    { value: 'tetap', label: 'Tetap' },
    { value: 'kontrak', label: 'Kontrak' },
    { value: 'magang', label: 'Magang' },
    { value: 'freelance', label: 'Freelance' }
  ];

  // Pilihan divisi
  const divisiOptions = [
    { value: 'hrd', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'it', label: 'Information Technology' },
    { value: 'operations', label: 'Operations' },
    { value: 'sales', label: 'Sales' },
    { value: 'production', label: 'Production' },
    { value: 'quality_control', label: 'Quality Control' }
  ];

  // Pilihan posisi jabatan
  const posisiJabatanOptions = [
    { value: 'staff', label: 'Staff' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior_manager', label: 'Senior Manager' },
    { value: 'director', label: 'Director' },
    { value: 'gm', label: 'General Manager' },
    { value: 'ceo', label: 'CEO' }
  ];

  // Pilihan lokasi absen
  const lokasiAbsenOptions = [
    { value: 'kantor_pusat', label: 'Kantor Pusat' },
    { value: 'cabang_jakarta', label: 'Cabang Jakarta' },
    { value: 'cabang_bandung', label: 'Cabang Bandung' },
    { value: 'cabang_surabaya', label: 'Cabang Surabaya' },
    { value: 'cabang_medan', label: 'Cabang Medan' },
    { value: 'remote', label: 'Remote/WFH' }
  ];

  // Pilihan status hubungan
  const statusHubunganOptions = [
    { value: 'lajang', label: 'Lajang' },
    { value: 'menikah', label: 'Menikah' },
    { value: 'cerai', label: 'Cerai' },
    { value: 'janda_duda', label: 'Janda/Duda' }
  ];

  // Pilihan agama
  const agamaOptions = [
    { value: 'islam', label: 'Islam' },
    { value: 'kristen', label: 'Kristen' },
    { value: 'katolik', label: 'Katolik' },
    { value: 'hindu', label: 'Hindu' },
    { value: 'budha', label: 'Budha' },
    { value: 'konghucu', label: 'Konghucu' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  // Pilihan pendidikan terakhir
  const pendidikanOptions = [
    { value: 'sd', label: 'SD/Sederajat' },
    { value: 'smp', label: 'SMP/Sederajat' },
    { value: 'sma', label: 'SMA/SMK/Sederajat' },
    { value: 'd1', label: 'Diploma 1' },
    { value: 'd2', label: 'Diploma 2' },
    { value: 'd3', label: 'Diploma 3' },
    { value: 's1', label: 'Sarjana (S1)' },
    { value: 's2', label: 'Magister (S2)' },
    { value: 's3', label: 'Doktor (S3)' }
  ];
  
  // File upload handler
  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      foto_ktp = file;
    }
  };

  // Reset form values dari server jika ada error dan perlu restore values
  $: if (form?.values && form?.errors) {
    // Hanya restore values jika ada error (berarti form submission gagal)
    nama_lengkap = form.values.nama_lengkap || nama_lengkap;
    no_karyawan = form.values.no_karyawan || no_karyawan;
    tanggal_masuk = form.values.tanggal_masuk || tanggal_masuk;
    status_kerja = form.values.status_kerja || status_kerja;
    divisi = form.values.divisi || divisi;
    posisi_jabatan = form.values.posisi_jabatan || posisi_jabatan;
    penggajian = form.values.penggajian || penggajian;
    no_rekening_bank = form.values.no_rekening_bank || no_rekening_bank;
    nama_bank = form.values.nama_bank || nama_bank;
    email = form.values.email || email;
    no_telp = form.values.no_telp || no_telp;
    kelamin = form.values.kelamin || kelamin;
    tempat_tanggal_lahir = form.values.tempat_tanggal_lahir || tempat_tanggal_lahir;
    umur = form.values.umur || umur;
    agama = form.values.agama || agama;
    status_hubungan = form.values.status_hubungan || status_hubungan;
    tanggungan = form.values.tanggungan || tanggungan;
    kontak_darurat = form.values.kontak_darurat || kontak_darurat;
    nip = form.values.nip || nip;
    no_ktp = form.values.no_ktp || no_ktp;
    no_kk = form.values.no_kk || no_kk;
    no_npwp = form.values.no_npwp || no_npwp;
    no_bpjs = form.values.no_bpjs || no_bpjs;
    faskes_tingkat_1 = form.values.faskes_tingkat_1 || faskes_tingkat_1;
    pendidikan_terakhir = form.values.pendidikan_terakhir || pendidikan_terakhir;
    alamat_ktp = form.values.alamat_ktp || alamat_ktp;
    alamat_domisili = form.values.alamat_domisili || alamat_domisili;
    asal_kota = form.values.asal_kota || asal_kota;
    lokasi_absen = form.values.lokasi_absen || lokasi_absen;
  }

  // Show notifications dari server response
  $: if (form?.success) {
    showNotification('success', form.message || 'Data karyawan berhasil diperbarui!');
    // Tidak reset form setelah sukses edit, biarkan tetap menampilkan data yang sudah diupdate
  }

  $: if (form?.error) {
    showNotification('error', form.error);
  }
</script>

<svelte:head>
  <title>Edit Data Karyawan - HRD Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 px-6 py-4">
    <!-- Back Button -->
    <div class="mb-4">
      <button
        on:click={() => goto('/employees')}
        class="inline-flex items-center text-blue-600 hover:text-blue-800 transition-all duration-300 hover:translate-x-[-4px] group"
      >
        <div class="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300 mr-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </div>
        <span class="font-medium">Kembali ke Daftar Karyawan</span>
      </button>
    </div>
    
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Edit Data Karyawan</h1>
        <p class="text-gray-600 mt-1">Ubah data karyawan yang sudah terdaftar dalam sistem</p>
      </div>
      <div class="flex gap-3">
        <button
          type="button"
          on:click={() => goto('/employees')}
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          Batalkan
        </button>
        <button
          type="submit"
          form="employee-form"
          disabled={isLoading}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {#if isLoading}
            <div class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memperbarui...
            </div>
          {:else}
            Perbarui Data
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Success/Error Messages -->
  {#if $notification.show}
    <div class="mx-6 mt-4">
      <div class="p-4 {$notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-lg animate-slideDown">
        <div class="flex items-center">
          {#if $notification.type === 'success'}
            <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          {/if}
          <p class="font-medium">{$notification.message}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Show error jika ada masalah saat loading data -->
  {#if data?.error}
    <div class="mx-6 mt-4">
      <div class="p-4 bg-red-50 border-red-200 text-red-800 border rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <p class="font-medium">{data.error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading state jika data belum dimuat -->
  {#if !data?.employee && !data?.error}
    <div class="p-6">
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-center py-12">
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-lg text-gray-600">Memuat data karyawan...</span>
          </div>
        </div>
      </div>
    </div>
  {:else if data?.employee}
    <!-- Main Content - hanya tampil jika data sudah dimuat -->
  <div class="p-6">
    <form 
      id="employee-form"
      method="POST"
      use:enhance={() => {
        isLoading = true;
        return async ({ result, update }) => {
          isLoading = false;
          await update();
        };
      }}
      class="space-y-8"
      enctype="multipart/form-data"
    >
      <!-- Upload Photo KTP Section -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold mb-4 text-gray-800">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Upload Foto KTP
        </h3>
        <div class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
          <div class="flex flex-col items-center">
            <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-sm text-gray-600 mb-2 font-medium">Upload foto KTP karyawan</p>
            <p class="text-xs text-gray-400 mb-3">Format: JPG, PNG, PDF (Max 5MB)</p>
            <input
              type="file"
              name="foto_ktp"
              accept="image/*,.pdf"
              on:change={handleFileUpload}
              class="hidden"
              id="foto_ktp_input"
            />
            <label for="foto_ktp_input" class="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer shadow-sm">
              {foto_ktp ? foto_ktp.name : 'Pilih File'}
            </label>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold mb-6 text-gray-800">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Data Karyawan
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
          <!-- Left Column -->
          <div class="space-y-6">
            <!-- 1. Nama Lengkap -->
            <div>
              <label for="nama_lengkap" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Nama Lengkap
              </label>
              <input
                type="text"
                id="nama_lengkap"
                name="nama_lengkap"
                bind:value={nama_lengkap}
                placeholder="Nama lengkap karyawan..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
              />
              {#if form?.errors?.nama_lengkap}
                <p class="mt-1 text-sm text-red-600">{form.errors.nama_lengkap}</p>
              {/if}
            </div>

            <!-- 2. No Karyawan -->
            <div>
              <label for="no_karyawan" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                No. Karyawan
              </label>
              <input
                type="text"
                id="no_karyawan"
                name="no_karyawan"
                bind:value={no_karyawan}
                placeholder="ID unik internal perusahaan..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {#if form?.errors?.no_karyawan}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_karyawan}</p>
              {/if}
            </div>

            <!-- 3. Tanggal Masuk -->
            <div>
              <label for="tanggal_masuk" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Tanggal Masuk
              </label>
              <input
                type="date"
                id="tanggal_masuk"
                name="tanggal_masuk"
                bind:value={tanggal_masuk}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.tanggal_masuk}
              />
              {#if form?.errors?.tanggal_masuk}
                <p class="mt-1 text-sm text-red-600">{form.errors.tanggal_masuk}</p>
              {/if}
            </div>

            <!-- 4. Status Kerja -->
            <div>
              <label for="status_kerja" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V8"/>
                </svg>
                Status Kerja <span class="text-red-500">*</span>
              </label>
              <select
                id="status_kerja"
                name="status_kerja"
                bind:value={status_kerja}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.status_kerja}
              >
                <option value="">Pilih Status Kerja</option>
                {#each statusKerjaOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.status_kerja}
                <p class="mt-1 text-sm text-red-600">{form.errors.status_kerja}</p>
              {/if}
            </div>

            <!-- 5. Divisi -->
            <div>
              <label for="divisi" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Divisi <span class="text-red-500">*</span>
              </label>
              <select
                id="divisi"
                name="divisi"
                bind:value={divisi}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.divisi}
              >
                <option value="">Pilih Divisi</option>
                {#each divisiOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.divisi}
                <p class="mt-1 text-sm text-red-600">{form.errors.divisi}</p>
              {/if}
            </div>

            <!-- 6. Posisi Jabatan -->
            <div>
              <label for="posisi_jabatan" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                Posisi Jabatan <span class="text-red-500">*</span>
              </label>
              <select
                id="posisi_jabatan"
                name="posisi_jabatan"
                bind:value={posisi_jabatan}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.posisi_jabatan}
              >
                <option value="">Pilih Posisi Jabatan</option>
                {#each posisiJabatanOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.posisi_jabatan}
                <p class="mt-1 text-sm text-red-600">{form.errors.posisi_jabatan}</p>
              {/if}
            </div>

            <!-- 7. Penggajian -->
            <div>
              <label for="penggajian" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Penggajian
              </label>
              <input
                type="text"
                id="penggajian"
                name="penggajian"
                bind:value={penggajian}
                placeholder="Gaji pokok atau skema gaji (Rp)..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.penggajian}
              />
              {#if form?.errors?.penggajian}
                <p class="mt-1 text-sm text-red-600">{form.errors.penggajian}</p>
              {/if}
            </div>

            <!-- 8. No Rekening Bank -->
            <div>
              <label for="no_rekening_bank" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                No. Rekening Bank
              </label>
              <input
                type="text"
                id="no_rekening_bank"
                name="no_rekening_bank"
                bind:value={no_rekening_bank}
                placeholder="Nomor rekening untuk transfer gaji..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_rekening_bank}
              />
              {#if form?.errors?.no_rekening_bank}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_rekening_bank}</p>
              {/if}
            </div>

            <!-- 9. Nama Bank -->
            <div>
              <label for="nama_bank" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                </svg>
                Nama Bank
              </label>
              <input
                type="text"
                id="nama_bank"
                name="nama_bank"
                bind:value={nama_bank}
                placeholder="Nama bank untuk pembayaran..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.nama_bank}
              />
              {#if form?.errors?.nama_bank}
                <p class="mt-1 text-sm text-red-600">{form.errors.nama_bank}</p>
              {/if}
            </div>

            <!-- 10. Email -->
            <div>
              <label for="email" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                </svg>
                Email <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                bind:value={email}
                placeholder="Email untuk komunikasi resmi..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.email}
              />
              {#if form?.errors?.email}
                <p class="mt-1 text-sm text-red-600">{form.errors.email}</p>
              {/if}
            </div>

            <!-- 11. No Telp -->
            <div>
              <label for="no_telp" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                No. Telepon <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="no_telp"
                name="no_telp"
                bind:value={no_telp}
                placeholder="Kontak aktif untuk keperluan operasional..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_telp}
              />
              {#if form?.errors?.no_telp}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_telp}</p>
              {/if}
            </div>

            <!-- 12. Kelamin -->
            <div>
              <label for="kelamin" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                </svg>
                Jenis Kelamin <span class="text-red-500">*</span>
              </label>
              <select
                id="kelamin"
                name="kelamin"
                bind:value={kelamin}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.kelamin}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
              {#if form?.errors?.kelamin}
                <p class="mt-1 text-sm text-red-600">{form.errors.kelamin}</p>
              {/if}
            </div>

            <!-- 13. Tempat Tanggal Lahir -->
            <div>
              <label for="tempat_tanggal_lahir" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Tempat, Tanggal Lahir <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tempat_tanggal_lahir"
                name="tempat_tanggal_lahir"
                bind:value={tempat_tanggal_lahir}
                placeholder="Contoh: Jakarta, 15 Agustus 1990..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.tempat_tanggal_lahir}
              />
              {#if form?.errors?.tempat_tanggal_lahir}
                <p class="mt-1 text-sm text-red-600">{form.errors.tempat_tanggal_lahir}</p>
              {/if}
            </div>

            <!-- 14. Umur -->
            <div>
              <label for="umur" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Umur
              </label>
              <input
                type="text"
                id="umur"
                name="umur"
                bind:value={umur}
                placeholder="Umur (tahun)..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.umur}
              />
              {#if form?.errors?.umur}
                <p class="mt-1 text-sm text-red-600">{form.errors.umur}</p>
              {/if}
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- 15. Agama -->
            <div>
              <label for="agama" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Agama
              </label>
              <select
                id="agama"
                name="agama"
                bind:value={agama}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.agama}
              >
                <option value="">Pilih Agama</option>
                {#each agamaOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.agama}
                <p class="mt-1 text-sm text-red-600">{form.errors.agama}</p>
              {/if}
            </div>

            <!-- 16. Status Hubungan -->
            <div>
              <label for="status_hubungan" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                Status Hubungan
              </label>
              <select
                id="status_hubungan"
                name="status_hubungan"
                bind:value={status_hubungan}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.status_hubungan}
              >
                <option value="">Pilih Status Hubungan</option>
                {#each statusHubunganOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.status_hubungan}
                <p class="mt-1 text-sm text-red-600">{form.errors.status_hubungan}</p>
              {/if}
            </div>

            <!-- 17. Tanggungan -->
            <div>
              <label for="tanggungan" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Tanggungan
              </label>
              <input
                type="text"
                id="tanggungan"
                name="tanggungan"
                bind:value={tanggungan}
                placeholder="Jumlah tanggungan keluarga..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.tanggungan}
              />
              {#if form?.errors?.tanggungan}
                <p class="mt-1 text-sm text-red-600">{form.errors.tanggungan}</p>
              {/if}
            </div>

            <!-- 18. Kontak Darurat -->
            <div>
              <label for="kontak_darurat" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Kontak Darurat
              </label>
              <input
                type="tel"
                id="kontak_darurat"
                name="kontak_darurat"
                bind:value={kontak_darurat}
                placeholder="No. kontak untuk situasi darurat..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.kontak_darurat}
              />
              {#if form?.errors?.kontak_darurat}
                <p class="mt-1 text-sm text-red-600">{form.errors.kontak_darurat}</p>
              {/if}
            </div>

            <!-- 19. NIP -->
            <div>
              <label for="nip" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                </svg>
                NIP
              </label>
              <input
                type="text"
                id="nip"
                name="nip"
                bind:value={nip}
                placeholder="Nomor Induk Pegawai (jika ada)..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.nip}
              />
              {#if form?.errors?.nip}
                <p class="mt-1 text-sm text-red-600">{form.errors.nip}</p>
              {/if}
            </div>

            <!-- 20. No KTP -->
            <div>
              <label for="no_ktp" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
                </svg>
                No. KTP <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="no_ktp"
                name="no_ktp"
                bind:value={no_ktp}
                placeholder="Nomor KTP (16 digit)..."
                maxlength="16"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_ktp}
              />
              {#if form?.errors?.no_ktp}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_ktp}</p>
              {/if}
            </div>

            <!-- 21. No KK -->
            <div>
              <label for="no_kk" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                No. KK
              </label>
              <input
                type="text"
                id="no_kk"
                name="no_kk"
                bind:value={no_kk}
                placeholder="Nomor Kartu Keluarga (16 digit)..."
                maxlength="16"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_kk}
              />
              {#if form?.errors?.no_kk}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_kk}</p>
              {/if}
            </div>

            <!-- 22. No NPWP -->
            <div>
              <label for="no_npwp" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                No. NPWP
              </label>
              <input
                type="text"
                id="no_npwp"
                name="no_npwp"
                bind:value={no_npwp}
                placeholder="Nomor NPWP untuk administrasi pajak..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_npwp}
              />
              {#if form?.errors?.no_npwp}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_npwp}</p>
              {/if}
            </div>

            <!-- 23. No BPJS -->
            <div>
              <label for="no_bpjs" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                No. BPJS
              </label>
              <input
                type="text"
                id="no_bpjs"
                name="no_bpjs"
                bind:value={no_bpjs}
                placeholder="Nomor BPJS Kesehatan & Ketenagakerjaan..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.no_bpjs}
              />
              {#if form?.errors?.no_bpjs}
                <p class="mt-1 text-sm text-red-600">{form.errors.no_bpjs}</p>
              {/if}
            </div>

            <!-- 24. Faskes Tingkat 1 -->
            <div>
              <label for="faskes_tingkat_1" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
                Faskes Tingkat 1
              </label>
              <input
                type="text"
                id="faskes_tingkat_1"
                name="faskes_tingkat_1"
                bind:value={faskes_tingkat_1}
                placeholder="Fasilitas kesehatan tingkat pertama..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.faskes_tingkat_1}
              />
              {#if form?.errors?.faskes_tingkat_1}
                <p class="mt-1 text-sm text-red-600">{form.errors.faskes_tingkat_1}</p>
              {/if}
            </div>

            <!-- 25. Pendidikan Terakhir -->
            <div>
              <label for="pendidikan_terakhir" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                </svg>
                Pendidikan Terakhir
              </label>
              <select
                id="pendidikan_terakhir"
                name="pendidikan_terakhir"
                bind:value={pendidikan_terakhir}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.pendidikan_terakhir}
              >
                <option value="">Pilih Pendidikan Terakhir</option>
                {#each pendidikanOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.pendidikan_terakhir}
                <p class="mt-1 text-sm text-red-600">{form.errors.pendidikan_terakhir}</p>
              {/if}
            </div>

            <!-- 26. Alamat KTP -->
            <div>
              <label for="alamat_ktp" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Alamat KTP <span class="text-red-500">*</span>
              </label>
              <textarea
                id="alamat_ktp"
                name="alamat_ktp"
                bind:value={alamat_ktp}
                placeholder="Alamat resmi sesuai KTP..."
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                class:border-red-500={form?.errors?.alamat_ktp}
              ></textarea>
              {#if form?.errors?.alamat_ktp}
                <p class="mt-1 text-sm text-red-600">{form.errors.alamat_ktp}</p>
              {/if}
            </div>

            <!-- 27. Alamat Domisili -->
            <div>
              <label for="alamat_domisili" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Alamat Domisili <span class="text-red-500">*</span>
              </label>
              <textarea
                id="alamat_domisili"
                name="alamat_domisili"
                bind:value={alamat_domisili}
                placeholder="Alamat tempat tinggal saat ini..."
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                class:border-red-500={form?.errors?.alamat_domisili}
              ></textarea>
              {#if form?.errors?.alamat_domisili}
                <p class="mt-1 text-sm text-red-600">{form.errors.alamat_domisili}</p>
              {/if}
            </div>

            <!-- 28. Asal Kota -->
            <div>
              <label for="asal_kota" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Asal Kota
              </label>
              <input
                type="text"
                id="asal_kota"
                name="asal_kota"
                bind:value={asal_kota}
                placeholder="Asal kota untuk data demografi..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.asal_kota}
              />
              {#if form?.errors?.asal_kota}
                <p class="mt-1 text-sm text-red-600">{form.errors.asal_kota}</p>
              {/if}
            </div>

            <!-- 29. Lokasi Absen -->
            <div>
              <label for="lokasi_absen" class="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Lokasi Absen <span class="text-red-500">*</span>
              </label>
              <select
                id="lokasi_absen"
                name="lokasi_absen"
                bind:value={lokasi_absen}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                class:border-red-500={form?.errors?.lokasi_absen}
              >
                <option value="">Pilih Lokasi Absen</option>
                {#each lokasiAbsenOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if form?.errors?.lokasi_absen}
                <p class="mt-1 text-sm text-red-600">{form.errors.lokasi_absen}</p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
  {/if}
</div>

<style>
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  :global(.animate-slideDown) {
    animation: slideDown 0.3s ease-out;
  }
</style>
