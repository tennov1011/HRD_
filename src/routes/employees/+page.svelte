<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getDivisionDisplayName, getUserDivisionInfo } from '$lib/utils/divisionMapping.js';
	import type { PageData } from './$types';

	export let data: PageData;

	// Interface untuk data karyawan sesuai dengan field yang di-fetch dari server
	interface Employee {
		id: string;
		nama_lengkap: string;
		no_karyawan: string;
		divisi: string;
		jabatan: string;
		status_kerja: string;
		lokasi_absen: string;
		shift?: string;
	}

	// Data karyawan dari server (sudah difilter berdasarkan divisi user)
	let employees: Employee[] = data.employees || [];
	let errorMessage = data.error || '';
	let user = data.user || null;

	// Get user division info for display
	$: userDivisionInfo = getUserDivisionInfo(user);

	// Search and filter states
	let searchQuery = '';
	let selectedDivisi = '';
	let selectedStatusKerja = '';
	let currentPage = 1;
	const itemsPerPage = 8;

	// Loading state
	let isLoading = false;

	// Computed filtered employees
	$: filteredEmployees = employees.filter((employee) => {
		// Jika tidak ada search query, hanya filter berdasarkan divisi dan status
		if (!searchQuery.trim()) {
			// Normalisasi divisi untuk perbandingan
			const normalizedDivisi = employee.divisi?.toLowerCase()?.trim();
			const matchesDivisi = selectedDivisi === '' || normalizedDivisi === selectedDivisi;

			// Normalisasi status kerja untuk perbandingan
			const normalizedStatus = employee.status_kerja?.toLowerCase()?.trim();
			const matchesStatus = selectedStatusKerja === '' || normalizedStatus === selectedStatusKerja;

			return matchesDivisi && matchesStatus;
		}

		// Search logic - fokus pada nama dan nomor karyawan
		const searchTerm = searchQuery.toLowerCase().trim();
		const namaLengkap = (employee.nama_lengkap || '').toLowerCase().trim();
		const noKaryawan = (employee.no_karyawan || '').toLowerCase().trim();
		const employeeId = (employee.id || '').toLowerCase().trim();

		const matchesSearch =
			namaLengkap.includes(searchTerm) ||
			noKaryawan.includes(searchTerm) ||
			employeeId.includes(searchTerm);

		// Jika search tidak cocok, return false
		if (!matchesSearch) return false;

		// Filter divisi dan status hanya jika search cocok
		const normalizedDivisi = employee.divisi?.toLowerCase()?.trim();
		const matchesDivisi = selectedDivisi === '' || normalizedDivisi === selectedDivisi;

		const normalizedStatus = employee.status_kerja?.toLowerCase()?.trim();
		const matchesStatus = selectedStatusKerja === '' || normalizedStatus === selectedStatusKerja;

		return matchesDivisi && matchesStatus;
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

	// Format divisi display - Enhanced version
	const formatDivisi = (divisi: string) => {
		if (!divisi) return '-';
		return getDivisionDisplayName(divisi);
	};

	// Format posisi jabatan display
	const formatPosisiJabatan = (posisi: string) => {
		const posisiMap: { [key: string]: string } = {
			staff: 'Staff',
			supervisor: 'Supervisor',
			manager: 'Manager',
			senior_manager: 'Senior Manager',
			director: 'Director',
			gm: 'General Manager',
			ceo: 'CEO'
		};
		return posisiMap[posisi] || posisi;
	};

	// Format status kerja display
	const formatStatusKerja = (status: string) => {
		if (!status) return '-';

		// Normalisasi ke lowercase untuk mapping
		const normalizedStatus = status.toLowerCase().trim();

		const statusMap: { [key: string]: string } = {
			tetap: 'Tetap',
			kontrak: 'Kontrak',
			magang: 'Magang',
			freelance: 'Freelance'
		};
		return statusMap[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1);
	};

	// Format lokasi absen display
	const formatLokasiAbsen = (lokasi: string) => {
		const lokasiMap: { [key: string]: string } = {
			kantor_pusat: 'Kantor Pusat',
			cabang_jakarta: 'Cabang Jakarta',
			cabang_bandung: 'Cabang Bandung',
			cabang_surabaya: 'Cabang Surabaya',
			cabang_medan: 'Cabang Medan',
			remote: 'Remote/WFH'
		};
		return lokasiMap[lokasi] || lokasi;
	};

	// Format shift display
	const formatShift = (shift: string) => {
		if (!shift) return '-';

		const shiftMap: { [key: string]: string } = {
			pagi: 'Pagi',
			siang: 'Siang',
			malam: 'Malam',
			reguler: 'Reguler',
			fleksibel: 'Fleksibel'
		};
		return shiftMap[shift.toLowerCase()?.trim()] || shift;
	};

	// Get unique divisi untuk filter
	$: uniqueDivisi = [
		...new Set(employees.map((emp) => emp.divisi?.toLowerCase()?.trim()).filter(Boolean))
	];

	// Get unique status kerja untuk filter dengan normalisasi
	$: uniqueStatusKerja = [
		...new Set(
			employees
				.map((emp) => {
					if (!emp.status_kerja) return null;
					// Normalisasi status kerja ke lowercase dan trim whitespace
					return emp.status_kerja.toLowerCase().trim();
				})
				.filter(Boolean)
		)
	];

	// Debug: log untuk troubleshooting division filtering
	$: {
		console.log('🔍 EMPLOYEE PAGE DEBUG:');
		console.log('User:', user);
		console.log('User Division Info:', userDivisionInfo);
		console.log('Total employees loaded:', employees.length);
		console.log('Unique Status Kerja:', uniqueStatusKerja);
		console.log('All Status Kerja:', employees.map((emp) => emp.status_kerja).filter(Boolean));
		console.log('Search query:', searchQuery);
		console.log('Filtered employees:', filteredEmployees.length);

		// Debug division data
		if (employees.length > 0) {
			const employeeDivisions = [...new Set(employees.map((emp) => emp.divisi).filter(Boolean))];
			console.log('Employee divisions in current dataset:', employeeDivisions);
		}

		// Debug search results
		if (searchQuery.trim()) {
			console.log('Search term:', searchQuery.toLowerCase().trim());
			console.log(
				'Employees names:',
				employees.map((emp) => emp.nama_lengkap?.toLowerCase())
			);
			console.log(
				'Matches:',
				employees
					.filter((emp) =>
						emp.nama_lengkap?.toLowerCase()?.includes(searchQuery.toLowerCase().trim())
					)
					.map((emp) => emp.nama_lengkap)
			);
		}
	}

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
		<div class="mb-8 border-b border-gray-200 bg-white px-6 py-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold text-gray-900">
						Data Karyawan
						{#if !userDivisionInfo.canViewAllDivisions}
							<span class="text-lg font-normal text-blue-600"
								>- {getDivisionDisplayName(userDivisionInfo.division)}</span
							>
						{/if}
					</h1>
					<p class="text-gray-600">
						{#if userDivisionInfo.canViewAllDivisions}
							Kelola data karyawan perusahaan
						{:else}
							Kelola data karyawan divisi {getDivisionDisplayName(userDivisionInfo.division)}
						{/if}
					</p>

					<!-- Division Filter Info -->
					{#if !userDivisionInfo.canViewAllDivisions}
						<div
							class="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
								/>
							</svg>
							Menampilkan karyawan divisi Anda saja
						</div>
					{/if}
				</div>

				<!-- Add Employee Button -->
				<button
					on:click={handleAddEmployee}
					class="focus:ring-opacity-50 inline-flex transform items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-xl focus:ring-4 focus:ring-blue-500 active:scale-95"
				>
					<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
					Tambah Karyawan
				</button>
			</div>
		</div>

		<!-- User Access Info -->
		{#if user}
			<div class="mb-6 px-6">
				<div
					class="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
				>
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<div class="ml-4 flex-1">
							<h3 class="text-sm font-medium text-blue-900">
								Masuk sebagai: {user.nama || user.email}
							</h3>
							<div class="mt-1 text-sm text-blue-700">
								<span class="font-medium">Role:</span>
								{user.role || 'User'} |
								<span class="font-medium">Divisi:</span>
								{getDivisionDisplayName(user.divisi || 'Tidak diketahui')}
								{#if !userDivisionInfo.canViewAllDivisions}
									| <span class="font-medium text-orange-600">Filter Aktif: Divisi Anda saja</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="mb-6 px-6">
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<div class="flex items-center">
						<svg
							class="mr-3 h-5 w-5 text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="font-medium text-red-800">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Stats Cards -->
		<div class="mb-8 px-6">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-4">
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="flex items-center">
						<div class="rounded-full bg-blue-100 p-3">
							<svg
								class="h-6 w-6 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-gray-500">Total Karyawan</p>
							<p class="text-2xl font-bold text-gray-900">{employees.length}</p>
						</div>
					</div>
				</div>

				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="flex items-center">
						<div class="rounded-full bg-green-100 p-3">
							<svg
								class="h-6 w-6 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-gray-500">Karyawan Tetap</p>
							<p class="text-2xl font-bold text-gray-900">
								{employees.filter((emp) => emp.status_kerja?.toLowerCase()?.trim() === 'tetap')
									.length}
							</p>
						</div>
					</div>
				</div>

				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="flex items-center">
						<div class="rounded-full bg-orange-100 p-3">
							<svg
								class="h-6 w-6 text-orange-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-gray-500">Karyawan Kontrak</p>
							<p class="text-2xl font-bold text-gray-900">
								{employees.filter((emp) => emp.status_kerja?.toLowerCase()?.trim() === 'kontrak')
									.length}
							</p>
						</div>
					</div>
				</div>

				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
				>
					<div class="flex items-center">
						<div class="rounded-full bg-purple-100 p-3">
							<svg
								class="h-6 w-6 text-purple-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
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
		<div class="mb-8 px-6">
			<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
				<div class="flex flex-col gap-4 sm:flex-row">
					<!-- Search -->
					<div class="flex-1">
						<label for="search" class="mb-2 block text-sm font-medium text-gray-700">
							Cari Karyawan {searchQuery ? `(${filteredEmployees.length} hasil)` : ''}
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<svg
									class="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<input
								type="text"
								id="search"
								bind:value={searchQuery}
								placeholder="Cari berdasarkan nama, nomor karyawan, atau ID..."
								class="block w-full rounded-lg border border-gray-300 py-3 pr-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 {searchQuery
									? 'bg-blue-50'
									: ''}"
							/>
						</div>
					</div>

					<!-- Divisi Filter -->
					<div class="sm:w-64">
						<label for="divisi-filter" class="mb-2 block text-sm font-medium text-gray-700">
							Filter Divisi
						</label>
						<select
							id="divisi-filter"
							bind:value={selectedDivisi}
							class="block w-full rounded-lg border border-gray-300 px-3 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Semua Divisi</option>
							{#each uniqueDivisi as divisi}
								<option value={divisi}>{formatDivisi(divisi)}</option>
							{/each}
						</select>
					</div>

					<!-- Status Kerja Filter -->
					<div class="sm:w-64">
						<label for="status-filter" class="mb-2 block text-sm font-medium text-gray-700">
							Filter Status
						</label>
						<select
							id="status-filter"
							bind:value={selectedStatusKerja}
							class="block w-full rounded-lg border border-gray-300 px-3 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Semua Status</option>
							{#each uniqueStatusKerja as status}
								{#if status}
									<option value={status}>{formatStatusKerja(status)}</option>
								{/if}
							{/each}
						</select>
					</div>

					<!-- Reset Button -->
					<div class="sm:w-auto">
						<div class="mb-2 block text-sm font-medium text-gray-700 opacity-0">Reset</div>
						<button
							on:click={resetSearch}
							class="focus:ring-opacity-50 w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 sm:w-auto"
						>
							Reset
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Search Results Info -->
		{#if searchQuery || selectedDivisi || selectedStatusKerja}
			<div class="mb-4 px-6">
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div class="flex items-center">
						<svg
							class="mr-3 h-5 w-5 text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="text-blue-800">
							Menampilkan <span class="font-semibold">{filteredEmployees.length}</span> karyawan
							{#if searchQuery}dengan pencarian "{searchQuery}"{/if}
							{#if selectedDivisi}di divisi {formatDivisi(selectedDivisi)}{/if}
							{#if selectedStatusKerja}dengan status {formatStatusKerja(selectedStatusKerja)}{/if}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Table -->
		<div class="px-6">
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Nama & ID Karyawan
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Divisi
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Posisi
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Status Kerja
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Lokasi Absen
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Shift
								</th>
								<th
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each paginatedEmployees as employee (employee.id)}
								<tr class="transition-colors duration-200 hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div>
											<div class="font-medium text-gray-900">
												{employee.nama_lengkap || 'Nama tidak tersedia'}
											</div>
											<div class="text-sm text-gray-500">
												{employee.no_karyawan || 'Nomor tidak tersedia'}
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-sm text-gray-900">{formatDivisi(employee.divisi)}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-sm text-gray-900"
											>{formatPosisiJabatan(employee.jabatan)}</span
										>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class="inline-flex rounded-full px-3 py-1 text-xs font-medium
                    {employee.status_kerja?.toLowerCase()?.trim() === 'tetap'
												? 'bg-green-100 text-green-800'
												: employee.status_kerja?.toLowerCase()?.trim() === 'kontrak'
													? 'bg-yellow-100 text-yellow-800'
													: employee.status_kerja?.toLowerCase()?.trim() === 'magang'
														? 'bg-blue-100 text-blue-800'
														: 'bg-gray-100 text-gray-800'}"
										>
											{formatStatusKerja(employee.status_kerja || '')}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="text-sm text-gray-900"
											>{formatLokasiAbsen(employee.lokasi_absen)}</span
										>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class="inline-flex rounded-full px-3 py-1 text-xs font-medium
                    {employee.shift === 'pagi'
												? 'bg-orange-100 text-orange-800'
												: employee.shift === 'siang'
													? 'bg-yellow-100 text-yellow-800'
													: employee.shift === 'malam'
														? 'bg-indigo-100 text-indigo-800'
														: employee.shift === 'reguler'
															? 'bg-green-100 text-green-800'
															: 'bg-gray-100 text-gray-800'}"
										>
											{formatShift(employee.shift || '')}
										</span>
									</td>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
										<button
											on:click={() => handleViewEmployee(employee.id)}
											class="text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline"
										>
											Lihat Detail
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="7" class="px-6 py-12 text-center">
										<div class="flex flex-col items-center">
											<svg
												class="w-12 h-12 text-gray-400 mb-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
												/>
											</svg>
											<p class="text-gray-500 text-lg font-medium">Tidak ada data karyawan</p>
											<p class="text-gray-400 text-sm mt-1">
												{searchQuery || selectedDivisi || selectedStatusKerja
													? 'Coba ubah filter pencarian'
													: 'Mulai dengan menambah karyawan baru'}
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
					<div class="border-t border-gray-200 bg-white px-6 py-4">
						<div class="flex items-center justify-between">
							<!-- Info hasil -->
							<div class="flex-1">
								<p class="text-sm text-gray-700">
									Menampilkan
									<span class="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span>
									-
									<span class="font-semibold"
										>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span
									>
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
									class="relative inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-50 disabled:hover:bg-gray-100"
								>
									<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 19l-7-7 7-7"
										/>
									</svg>
									Previous
								</button>

								<!-- Page indicator -->
								<div
									class="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
								>
									<span>Halaman {currentPage} dari {totalPages}</span>
								</div>

								<!-- Next Button -->
								<button
									on:click={() => goToPage(currentPage + 1)}
									disabled={currentPage === totalPages}
									class="relative inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-50 disabled:hover:bg-gray-100"
								>
									Next
									<svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Mobile pagination -->
						<div class="mt-4 flex justify-between sm:hidden">
							<button
								on:click={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								class="relative inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-50 disabled:hover:bg-gray-100"
							>
								<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								Previous
							</button>

							<div class="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
								{currentPage} / {totalPages}
							</div>

							<button
								on:click={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								class="relative inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-50 disabled:hover:bg-gray-100"
							>
								Next
								<svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
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
