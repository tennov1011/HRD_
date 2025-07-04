<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';
	import { writable } from 'svelte/store';

	export let form: ActionData;

	// Notification store
	const notification = writable({ show: false, type: '', message: '' });

	const showNotification = (type: string, message: string) => {
		notification.set({ show: true, type, message });
		setTimeout(() => {
			notification.set({ show: false, type: '', message: '' });
		}, 3000);
	};

	// Form fields - 12 field yang diperlukan
	let nama_lengkap = '';
	let divisi = '';
	let email = '';
	let no_ktp = '';
	let status_kerja = '';
	let tanggal_masuk = '';
	let posisi_jabatan = '';
	let agama = '';
	let status_hubungan = '';
	let kontak_darurat = '';
	let alamat_ktp = '';
	let lokasi_absen = '';
	let kelamin = '';

	// State untuk loading dan animasi
	let isLoading = false;

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

	// Reset form values dari server jika ada
	$: if (form?.values) {
		nama_lengkap = form.values.nama_lengkap || '';
		divisi = form.values.divisi || '';
		email = form.values.email || '';
		no_ktp = form.values.no_ktp || '';
		status_kerja = form.values.status_kerja || '';
		tanggal_masuk = form.values.tanggal_masuk || '';
		posisi_jabatan = form.values.posisi_jabatan || '';
		agama = form.values.agama || '';
		status_hubungan = form.values.status_hubungan || '';
		kontak_darurat = form.values.kontak_darurat || '';
		alamat_ktp = form.values.alamat_ktp || '';
		lokasi_absen = form.values.lokasi_absen || '';
		kelamin = form.values.kelamin || '';
	}

	// Show notifications dari server response
	$: if (form?.success) {
		showNotification('success', form.message || 'Karyawan berhasil didaftarkan!');
		// Reset form setelah sukses
		nama_lengkap = '';
		divisi = '';
		email = '';
		no_ktp = '';
		status_kerja = '';
		tanggal_masuk = '';
		posisi_jabatan = '';
		agama = '';
		status_hubungan = '';
		kontak_darurat = '';
		alamat_ktp = '';
		lokasi_absen = '';
		kelamin = '';
	}

	$: if (form?.error) {
		showNotification('error', form.error);
	}
</script>

<svelte:head>
	<title>Registrasi Karyawan - HRD Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white px-6 py-4">
		<!-- Back Button -->
		<div class="mb-4">
			<button
				on:click={() => goto('/employees')}
				class="group inline-flex items-center text-blue-600 transition-all duration-300 hover:translate-x-[-4px] hover:text-blue-800"
			>
				<div
					class="mr-3 rounded-full bg-blue-100 p-2 transition-colors duration-300 group-hover:bg-blue-200"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</div>
				<span class="font-medium">Kembali ke Daftar Karyawan</span>
			</button>
		</div>

		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Registrasi Karyawan Baru</h1>
				<p class="mt-1 text-gray-600">Tambahkan data karyawan baru ke dalam sistem</p>
			</div>
			<div class="flex gap-3">
				<button
					type="button"
					on:click={() => goto('/employees')}
					class="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
				>
					Batalkan
				</button>
				<button
					type="submit"
					form="employee-form"
					disabled={isLoading}
					class="rounded-lg bg-blue-600 px-6 py-2 text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading}
						<div class="flex items-center">
							<svg
								class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Menyimpan...
						</div>
					{:else}
						Simpan
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if $notification.show}
		<div class="mx-6 mt-4">
			<div
				class="p-4 {$notification.type === 'success'
					? 'border-green-200 bg-green-50 text-green-800'
					: 'border-red-200 bg-red-50 text-red-800'} animate-slideDown rounded-lg border"
			>
				<div class="flex items-center">
					{#if $notification.type === 'success'}
						<svg class="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<svg class="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
					<p class="font-medium">{$notification.message}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
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
		>
			<!-- Form Fields -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h3 class="mb-6 flex items-center text-lg font-semibold text-gray-800">
					<svg
						class="mr-2 h-5 w-5 text-gray-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Data Karyawan
				</h3>
				<div class="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-2">
					<!-- Left Column -->
					<div class="space-y-6">
						<!-- 1. Nama Lengkap -->
						<div>
							<label
								for="nama_lengkap"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
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
								Nama Lengkap <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="nama_lengkap"
								name="nama_lengkap"
								bind:value={nama_lengkap}
								placeholder="Nama lengkap karyawan..."
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.nama_lengkap}
								required
							/>
							{#if form?.errors?.nama_lengkap}
								<p class="mt-1 text-sm text-red-600">{form.errors.nama_lengkap}</p>
							{/if}
						</div>

						<!-- 11. No KTP -->
						<div>
							<label for="no_ktp" class="mb-2 flex items-center text-sm font-medium text-gray-700">
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
									/>
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
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.no_ktp}
								required
							/>
							{#if form?.errors?.no_ktp}
								<p class="mt-1 text-sm text-red-600">{form.errors.no_ktp}</p>
							{/if}
						</div>

						<!-- 9. Email -->
						<div>
							<label for="email" class="mb-2 flex items-center text-sm font-medium text-gray-700">
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
									/>
								</svg>
								Email <span class="text-red-500">*</span>
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={email}
								placeholder="Email untuk komunikasi resmi..."
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.email}
								required
							/>
							{#if form?.errors?.email}
								<p class="mt-1 text-sm text-red-600">{form.errors.email}</p>
							{/if}
						</div>

						<!-- 3. Tanggal Masuk -->
						<div>
							<label
								for="tanggal_masuk"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								Tanggal Masuk <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="tanggal_masuk"
								name="tanggal_masuk"
								bind:value={tanggal_masuk}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.tanggal_masuk}
								required
							/>
							{#if form?.errors?.tanggal_masuk}
								<p class="mt-1 text-sm text-red-600">{form.errors.tanggal_masuk}</p>
							{/if}
						</div>

						<!-- 5. Divisi -->
						<div>
							<label for="divisi" class="mb-2 flex items-center text-sm font-medium text-gray-700">
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
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
								Divisi <span class="text-red-500">*</span>
							</label>
							<select
								id="divisi"
								name="divisi"
								bind:value={divisi}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.divisi}
								required
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
							<label
								for="posisi_jabatan"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
									/>
								</svg>
								Posisi Jabatan <span class="text-red-500">*</span>
							</label>
							<select
								id="posisi_jabatan"
								name="posisi_jabatan"
								bind:value={posisi_jabatan}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.posisi_jabatan}
								required
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

						<!-- 4. Status Kerja -->
						<div>
							<label
								for="status_kerja"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V8"
									/>
								</svg>
								Status Kerja <span class="text-red-500">*</span>
							</label>
							<select
								id="status_kerja"
								name="status_kerja"
								bind:value={status_kerja}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.status_kerja}
								required
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
					</div>

					<!-- Right Column -->
					<div class="space-y-6">
						<!-- 18. Kontak Darurat -->
						<div>
							<label
								for="kontak_darurat"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								Kontak Darurat
							</label>
							<input
								type="tel"
								id="kontak_darurat"
								name="kontak_darurat"
								bind:value={kontak_darurat}
								placeholder="No. kontak untuk situasi darurat..."
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.kontak_darurat}
							/>
							{#if form?.errors?.kontak_darurat}
								<p class="mt-1 text-sm text-red-600">{form.errors.kontak_darurat}</p>
							{/if}
						</div>

						<!-- Alamat KTP -->
						<div>
							<label
								for="alamat_ktp"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								Alamat KTP
							</label>
							<textarea
								id="alamat_ktp"
								name="alamat_ktp"
								bind:value={alamat_ktp}
								placeholder="Alamat sesuai KTP"
								rows="3"
								class="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								required
							></textarea>
						</div>
						<!-- 12. Kelamin -->
						<div>
							<label for="kelamin" class="mb-2 flex items-center text-sm font-medium text-gray-700">
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
								Jenis Kelamin <span class="text-red-500">*</span>
							</label>
							<select
								id="kelamin"
								name="kelamin"
								bind:value={kelamin}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								class:border-red-500={form?.errors?.kelamin}
								required
							>
								<option value="">Pilih Jenis Kelamin</option>
								<option value="laki-laki">Laki-laki</option>
								<option value="perempuan">Perempuan</option>
							</select>
							{#if form?.errors?.kelamin}
								<p class="mt-1 text-sm text-red-600">{form.errors.kelamin}</p>
							{/if}
						</div>
						<!-- 15. Agama -->
						<div>
							<label for="agama" class="mb-2 flex items-center text-sm font-medium text-gray-700">
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
									/>
								</svg>
								Agama
							</label>
							<select
								id="agama"
								name="agama"
								bind:value={agama}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
							<label
								for="status_hubungan"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								<svg
									class="mr-2 h-4 w-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
								Status Hubungan
							</label>
							<select
								id="status_hubungan"
								name="status_hubungan"
								bind:value={status_hubungan}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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

						<!-- Lokasi Absen -->
						<div>
							<label
								for="lokasi_absen"
								class="mb-2 flex items-center text-sm font-medium text-gray-700"
							>
								Lokasi Absen
							</label>
							<select
								id="lokasi_absen"
								name="lokasi_absen"
								bind:value={lokasi_absen}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								required
							>
								<option value="">Pilih Lokasi Absen</option>
								{#each lokasiAbsenOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
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
