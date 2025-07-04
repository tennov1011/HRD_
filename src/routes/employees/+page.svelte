<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Interface untuk data karyawan sesuai dengan field yang di-fetch dari server
  interface Employee {
    id: string;
    nama_lengkap: string;
    no_karyawan: string;
    divisi: string;
    posisi_jabatan: string;
    status_kerja: string;
    lokasi_absen: string;
  }
  
  // Data karyawan dari server
  let employees: Employee[] = data.employees || [];
  let errorMessage = data.error || '';
  
  // Search and filter states
  let searchQuery = '';
  let selectedDivisi = '';
  let selectedStatusKerja = '';
  let currentPage = 1;
  const itemsPerPage = 8;
  
  // Loading state
  let isLoading = false;
  
  // Computed filtered employees
  $: filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (employee.no_karyawan && employee.no_karyawan.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         employee.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivisi = selectedDivisi === '' || employee.divisi === selectedDivisi;
    const matchesStatus = selectedStatusKerja === '' || employee.status_kerja === selectedStatusKerja;
    return matchesSearch && matchesDivisi && matchesStatus;
  });
  
  // Reset to first page when filters change
  $: if (searchQuery || selectedDivisi || selectedStatusKerja) {
    currentPage = 1;
  }
  
  // Pagination
  $: totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  $: paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Format divisi display
  const formatDivisi = (divisi: string) => {
    const divisiMap: { [key: string]: string } = {
      'hrd': 'Human Resources',
      'finance': 'Finance',
      'marketing': 'Marketing',
      'it': 'Information Technology',
      'operations': 'Operations',
      'sales': 'Sales',
      'production': 'Production',
      'quality_control': 'Quality Control'
    };
    return divisiMap[divisi] || divisi;
  };

  // Format posisi jabatan display
  const formatPosisiJabatan = (posisi: string) => {
    const posisiMap: { [key: string]: string } = {
      'staff': 'Staff',
      'supervisor': 'Supervisor',
      'manager': 'Manager',
      'senior_manager': 'Senior Manager',
      'director': 'Director',
      'gm': 'General Manager',
      'ceo': 'CEO'
    };
    return posisiMap[posisi] || posisi;
  };

  // Format status kerja display
  const formatStatusKerja = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'tetap': 'Tetap',
      'kontrak': 'Kontrak',
      'magang': 'Magang',
      'freelance': 'Freelance'
    };
    return statusMap[status] || status;
  };

  // Format lokasi absen display
  const formatLokasiAbsen = (lokasi: string) => {
    const lokasiMap: { [key: string]: string } = {
      'kantor_pusat': 'Kantor Pusat',
      'cabang_jakarta': 'Cabang Jakarta',
      'cabang_bandung': 'Cabang Bandung',
      'cabang_surabaya': 'Cabang Surabaya',
      'cabang_medan': 'Cabang Medan',
      'remote': 'Remote/WFH'
    };
    return lokasiMap[lokasi] || lokasi;
  };
  
  // Get unique divisi untuk filter
  $: uniqueDivisi = [...new Set(employees.map(emp => emp.divisi))].filter(Boolean);
  
  // Get unique status kerja untuk filter
  $: uniqueStatusKerja = [...new Set(employees.map(emp => emp.status_kerja))].filter(Boolean);
  
  // Navigation functions
  const handleAddEmployee = () => {
    goto('/employees/register');
  };
  
  const handleViewEmployee = (id: string) => {
    goto(`/employees/${id}`);
  };
  
  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  };
  
  const resetSearch = () => {
    searchQuery = '';
    selectedDivisi = '';
    selectedStatusKerja = '';
    currentPage = 1;
  };
  
  onMount(() => {
    // Animasi masuk halaman
    const container = document.querySelector('.employees-container');
    if (container) {
      container.classList.add('animate-fadeIn');
    }
  });
</script>

<svelte:head>
  <title>Data Karyawan - HRD Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="employees-container opacity-0 transition-opacity duration-700">
    <!-- Header Section -->
    <div class="bg-white border-b border-gray-200 px-6 py-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Data Karyawan</h1>
          <p class="text-gray-600">Kelola data karyawan perusahaan</p>
        </div>
        
        <!-- Add Employee Button -->
        <button
          on:click={handleAddEmployee}
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Tambah Karyawan
        </button>
      </div>
    </div>

    <!-- Error Message -->
    {#if errorMessage}
      <div class="px-6 mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Stats Cards -->
    <div class="px-6 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total Karyawan</p>
              <p class="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Karyawan Tetap</p>
              <p class="text-2xl font-bold text-gray-900">{employees.filter(emp => emp.status_kerja === 'tetap').length}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center">
            <div class="p-3 bg-orange-100 rounded-full">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Karyawan Kontrak</p>
              <p class="text-2xl font-bold text-gray-900">{employees.filter(emp => emp.status_kerja === 'kontrak').length}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center">
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total Divisi</p>
              <p class="text-2xl font-bold text-gray-900">{uniqueDivisi.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="px-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Cari Karyawan
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              id="search"
              bind:value={searchQuery}
              placeholder="Cari berdasarkan nama, nomor karyawan, atau ID..."
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
        
        <!-- Divisi Filter -->
        <div class="sm:w-64">
          <label for="divisi-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Filter Divisi
          </label>
          <select
            id="divisi-filter"
            bind:value={selectedDivisi}
            class="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Semua Divisi</option>
            {#each uniqueDivisi as divisi}
              <option value={divisi}>{formatDivisi(divisi)}</option>
            {/each}
          </select>
        </div>
        
        <!-- Status Kerja Filter -->
        <div class="sm:w-64">
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-2">
            Filter Status
          </label>
          <select
            id="status-filter"
            bind:value={selectedStatusKerja}
            class="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">Semua Status</option>
            {#each uniqueStatusKerja as status}
              <option value={status}>{formatStatusKerja(status)}</option>
            {/each}
          </select>
        </div>
        
        <!-- Reset Button -->
        <div class="sm:w-auto">
          <div class="block text-sm font-medium text-gray-700 mb-2 opacity-0">
            Reset
          </div>
          <button
            on:click={resetSearch}
            class="w-full sm:w-auto px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Table -->
    <div class="px-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nama & ID Karyawan
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Divisi
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Posisi
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status Kerja
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Lokasi Absen
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each paginatedEmployees as employee (employee.id)}
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="font-medium text-gray-900">{employee.nama_lengkap}</div>
                    <div class="text-sm text-gray-500">
                      {employee.no_karyawan}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{formatDivisi(employee.divisi)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{formatPosisiJabatan(employee.posisi_jabatan)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-3 py-1 text-xs font-medium rounded-full
                    {employee.status_kerja === 'tetap' ? 'bg-green-100 text-green-800' : 
                     employee.status_kerja === 'kontrak' ? 'bg-yellow-100 text-yellow-800' : 
                     employee.status_kerja === 'magang' ? 'bg-blue-100 text-blue-800' :
                     'bg-gray-100 text-gray-800'}">
                    {formatStatusKerja(employee.status_kerja)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{formatLokasiAbsen(employee.lokasi_absen)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    on:click={() => handleViewEmployee(employee.id)}
                    class="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    Lihat Detail
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="text-gray-500 text-lg font-medium">Tidak ada data karyawan</p>
                    <p class="text-gray-400 text-sm mt-1">
                      {searchQuery || selectedDivisi || selectedStatusKerja ? 'Coba ubah filter pencarian' : 'Mulai dengan menambah karyawan baru'}
                    </p>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <!-- Info hasil -->
            <div class="flex-1">
              <p class="text-sm text-gray-700">
                Menampilkan 
                <span class="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span>
                - 
                <span class="font-semibold">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span>
                dari 
                <span class="font-semibold">{filteredEmployees.length}</span>
                data karyawan
              </p>
            </div>
            
            <!-- Navigation buttons -->
            <div class="flex items-center space-x-2">
              <!-- Previous Button -->
              <button
                on:click={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                class="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 transition-all duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>
              
              <!-- Page indicator -->
              <div class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                <span>Halaman {currentPage} dari {totalPages}</span>
              </div>
              
              <!-- Next Button -->
              <button
                on:click={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                class="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 transition-all duration-200"
              >
                Next
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Mobile pagination -->
          <div class="flex justify-between sm:hidden mt-4">
            <button
              on:click={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              class="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 transition-all duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
            
            <div class="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </div>
            
            <button
              on:click={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-100 transition-all duration-200"
            >
              Next
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      {/if}
    </div>
    </div>
  </div>
</div>

<style>
  :global(.employees-container.animate-fadeIn) {
    animation: fadeIn 0.7s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>