<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const employee = data.employee;
	const accountInfo = data.accountInfo;
	const errorMessage = data.error;

	// Animation state
	let loaded = false;
  let showPassword = false;

	// Modal state untuk buat akun
	let showCreateAccountModal = false;
	let isCreatingAccount = false;
	let createAccountError = '';
	let createAccountSuccess = false;

	// Form data untuk buat akun
	let accountEmail = employee?.email || '';
	let accountPassword = '';
	let confirmPassword = '';

	// Fungsi untuk buka/tutup modal
	const openCreateAccountModal = () => {
		accountEmail = employee?.email || '';
		accountPassword = '';
		confirmPassword = '';
		createAccountError = '';
		createAccountSuccess = false;
		showCreateAccountModal = true;
	};

	const closeCreateAccountModal = () => {
		showCreateAccountModal = false;
		accountPassword = '';
		confirmPassword = '';
		createAccountError = '';
	};

	// Fungsi untuk membuat akun
	const createAccount = async () => {
		if (!accountEmail || !accountPassword) {
			createAccountError = 'Email dan password harus diisi';
			return;
		}

		if (accountPassword !== confirmPassword) {
			createAccountError = 'Password dan konfirmasi password tidak cocok';
			return;
		}

		if (accountPassword.length < 6) {
			createAccountError = 'Password minimal 6 karakter';
			return;
		}

		isCreatingAccount = true;
		createAccountError = '';

		try {
			const response = await fetch('/api/create-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					employee_id: employee.id,
					email: accountEmail,
					password: accountPassword,
					nama_lengkap: employee.nama_lengkap,
					divisi: employee.divisi,
					posisi_jabatan: employee.posisi_jabatan
				})
			});

			const result = await response.json();

			if (response.ok) {
				createAccountSuccess = true;
				setTimeout(() => {
					closeCreateAccountModal();
					// Reload halaman untuk menampilkan info akun baru
					window.location.reload();
				}, 2000);
			} else {
				createAccountError = result.error || 'Gagal membuat akun';
			}
		} catch (error) {
			createAccountError = 'Terjadi kesalahan jaringan';
			console.error('Error creating account:', error);
		} finally {
			isCreatingAccount = false;
		}
	};

	// Helper function for capitalization
	const capitalize = (str: string) => {
		if (!str) return '-';
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Helper functions untuk formatting
	const formatDate = (dateString: string) => {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleDateString('id-ID', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return dateString;
		}
	};

	const formatCurrency = (amount: number) => {
		if (!amount) return '-';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR'
		}).format(amount);
	};

	const formatDivisi = (divisi: string) => {
		const divisiMap: { [key: string]: string } = {
			hrd: 'Human Resources',
			finance: 'Finance',
			marketing: 'Marketing',
			it: 'Information Technology',
			operations: 'Operations',
			sales: 'Sales',
			production: 'Production',
			quality_control: 'Quality Control'
		};
		return divisiMap[divisi] || capitalize(divisi);
	};

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
		return posisiMap[posisi] || capitalize(posisi);
	};

	const formatStatusKerja = (status: string) => {
		const statusMap: { [key: string]: string } = {
			tetap: 'Tetap',
			kontrak: 'Kontrak',
			magang: 'Magang',
			freelance: 'Freelance'
		};
		return statusMap[status] || capitalize(status);
	};

	const formatJenisKelamin = (jk: string) => {
		const genderMap: { [key: string]: string } = {
			L: 'Laki-laki',
			P: 'Perempuan',
			'laki-laki': 'Laki-laki',
			perempuan: 'Perempuan'
		};
		return genderMap[jk] || capitalize(jk);
	};

	const formatPendidikan = (pendidikan: string) => {
		const pendidikanMap: { [key: string]: string } = {
			sd: 'Sekolah Dasar',
			smp: 'SMP',
			sma: 'SMA/SMK',
			diploma: 'Diploma',
			s1: 'Sarjana (S1)',
			s2: 'Magister (S2)',
			s3: 'Doktor (S3)'
		};
		return pendidikanMap[pendidikan] || capitalize(pendidikan);
	};

	const calculateAge = (birthDate: string) => {
		if (!birthDate) return '-';
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return `${age} tahun`;
	};

	const calculateWorkPeriod = (startDate: string, endDate?: string) => {
		if (!startDate) return '-';
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : new Date();
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const years = Math.floor(diffDays / 365);
		const months = Math.floor((diffDays % 365) / 30);

		if (years > 0) {
			return `${years} tahun ${months} bulan`;
		} else if (months > 0) {
			return `${months} bulan`;
		} else {
			return `${diffDays} hari`;
		}
	};

	const formatAgama = (agama: string) => {
		const agamaMap: { [key: string]: string } = {
			islam: 'Islam',
			kristen: 'Kristen',
			katolik: 'Katolik',
			hindu: 'Hindu',
			buddha: 'Buddha',
			budha: 'Buddha',
			konghuchu: 'Konghuchu',
			lainnya: 'Lainnya'
		};
		return agamaMap[agama] || capitalize(agama);
	};

	const formatStatusPernikahan = (status: string) => {
		const statusMap: { [key: string]: string } = {
			belum_menikah: 'Belum Menikah',
			lajang: 'Lajang',
			menikah: 'Menikah',
			cerai: 'Cerai',
			janda: 'Janda',
			duda: 'Duda',
			janda_duda: 'Janda/Duda'
		};
		return statusMap[status] || capitalize(status);
	};

	const formatLokasiAbsen = (lokasi: string) => {
		const lokasiMap: { [key: string]: string } = {
			kantor_pusat: 'Kantor Pusat',
			cabang_jakarta: 'Cabang Jakarta',
			cabang_bandung: 'Cabang Bandung',
			cabang_surabaya: 'Cabang Surabaya',
			cabang_medan: 'Cabang Medan',
			remote: 'Remote/WFH'
		};
		return lokasiMap[lokasi] || capitalize(lokasi);
	};

	onMount(() => {
		setTimeout(() => {
			loaded = true;
		}, 100);
	});
</script>

<svelte:head>
	<title>Detail Karyawan - {employee?.nama_lengkap || 'Tidak ditemukan'}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
	<div class="mx-0 w-full px-0 py-0">
		<!-- Header with Animation -->
		<div class="mb-6 px-6 py-6 {loaded ? 'animate-slide-down' : 'opacity-0'}">
			<button
				on:click={() => goto('/employees')}
				class="group mb-6 inline-flex items-center text-blue-600 transition-all duration-300 hover:translate-x-[-4px] hover:text-blue-800"
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

			<div class="flex items-center space-x-4">
				<div>
					<h1 class="mb-2 text-4xl font-bold text-gray-900">Detail Karyawan</h1>
				</div>
			</div>
		</div>

		{#if errorMessage}
			<!-- Error State with Animation -->
			<div
				class="mx-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-lg {loaded
					? 'animate-fade-in'
					: 'opacity-0'}"
			>
				<div
					class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 p-4"
				>
					<svg class="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h2 class="mb-3 text-2xl font-bold text-red-800">Data Tidak Ditemukan</h2>
				<p class="text-lg text-red-600">{errorMessage}</p>
			</div>
		{:else if employee}
			<!-- Employee Detail with Modern Layout -->
			<div class="space-y-6 px-6 {loaded ? 'animate-stagger-children' : 'opacity-0'}">
				<!-- Profile Header Card -->
				<div
					class="transform overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:scale-[1.01]"
				>
					<div class="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-8 py-8">
						<div class="absolute inset-0 bg-black opacity-10"></div>
						<div
							class="relative flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6"
						>
							<!-- Avatar -->
							<div class="relative">
								<div
									class="bg-opacity-20 border-opacity-30 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white backdrop-blur-sm"
								>
									<svg
										class="h-12 w-12 text-white"
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
								<div
									class="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-green-400"
								>
									<svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							</div>
							<!-- Basic Info -->
							<div class="flex-1 text-center sm:text-left">
								<h2 class="mb-4 text-3xl font-bold text-white">{employee.nama_lengkap || '-'}</h2>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div
										class="flex items-center justify-center space-x-2 text-blue-100 sm:justify-start"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
										<span class="font-medium">{formatDivisi(employee.divisi) || '-'}</span>
									</div>
								</div>
                
							</div>
						</div>
					</div>
				</div>

				<!-- Detailed Information Cards -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<!-- Personal Information -->
					<div class="space-y-6 lg:col-span-2">
						<!-- Basic Personal Info -->
						<div
							class="transform rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
						>
							<div class="mb-6 flex items-center space-x-3">
								<div class="rounded-xl bg-blue-100 p-3">
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
								<h3 class="text-2xl font-bold text-gray-900">Informasi Personal</h3>
							</div>
qq111111111111111111111111111111111111111
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
											<span>Nama Lengkap</span>
										</div>
										<p
											class="text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{capitalize(employee.nama_lengkap) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z"
												/>
											</svg>
											<span>No. KTP</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.no_ktp || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<span>No. KK</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.no_kk || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a9.013 9.013 0 01-5-1.485"
												/>
											</svg>
											<span>Jenis Kelamin</span>
										</div>
										<div class="flex items-center space-x-2">
											<span
												class="inline-flex rounded-full px-3 py-1 text-sm font-medium {employee.kelamin ===
												'L'
													? 'bg-blue-100 text-blue-800'
													: 'bg-pink-100 text-pink-800'}"
											>
												{formatJenisKelamin(employee.kelamin) || '-'}
											</span>
										</div>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"
												/>
											</svg>
											<span>Tempat, Tanggal Lahir</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{capitalize(employee.tempat_tanggal_lahir) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Umur</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.umur || calculateAge(employee.tanggal_lahir) || '-'}
										</p>
									</div>
								</div>

								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
											<span>Email</span>
										</div>
										<p
											class="font-semibold break-all text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.email?.toLowerCase() || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
												/>
											</svg>
											<span>No. Telepon</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.no_telp || employee.no_telepon || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
												/>
											</svg>
											<span>Kontak Darurat</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.kontak_darurat || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
												/>
											</svg>
											<span>Agama</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatAgama(employee.agama) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
												/>
											</svg>
											<span>Status Hubungan</span>
										</div>
										<div class="flex items-center space-x-2">
											<span
												class="inline-flex rounded-full px-3 py-1 text-sm font-medium {employee.status_hubungan ===
												'menikah'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'}"
											>
												{formatStatusPernikahan(employee.status_hubungan) ||
													formatStatusPernikahan(employee.status_pernikahan) ||
													'-'}
											</span>
										</div>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
												/>
											</svg>
											<span>Pendidikan Terakhir</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatPendidikan(employee.pendidikan_terakhir) || '-'}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Address Information -->
						<div
							class="transform rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
						>
							<div class="mb-6 flex items-center space-x-3">
								<div class="rounded-xl bg-green-100 p-3">
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
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
										/>
									</svg>
								</div>
								<h3 class="text-2xl font-bold text-gray-900">Informasi Alamat</h3>
							</div>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
												/>
											</svg>
											<span>Alamat KTP</span>
										</div>
										<p
											class="leading-relaxed font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{capitalize(employee.alamat_ktp) ||
												capitalize(employee.alamat_lengkap) ||
												'-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
												/>
											</svg>
											<span>Alamat Domisili</span>
										</div>
										<p
											class="leading-relaxed font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{capitalize(employee.alamat_domisili) ||
												capitalize(employee.alamat_lengkap) ||
												'-'}
										</p>
									</div>
								</div>
								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
												/>
											</svg>
											<span>Asal Kota</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{capitalize(employee.asal_kota) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
												/>
											</svg>
											<span>Kode Pos</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.kode_pos || '-'}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Employment Information -->
						<div
							class="transform rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
						>
							<div class="mb-6 flex items-center space-x-3">
								<div class="rounded-xl bg-purple-100 p-3">
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
											d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
										/>
									</svg>
								</div>
								<h3 class="text-2xl font-bold text-gray-900">Informasi Pekerjaan</h3>
							</div>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
												/>
											</svg>
											<span>No. Karyawan</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.no_karyawan || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<span>NIP</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.nip || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
												/>
											</svg>
											<span>Divisi</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatDivisi(employee.divisi) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
												/>
											</svg>
											<span>Posisi Jabatan</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatPosisiJabatan(employee.posisi_jabatan) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"
												/>
											</svg>
											<span>Tanggal Masuk</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatDate(employee.tanggal_masuk) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Masa Kerja</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.masa_kerja ||
												calculateWorkPeriod(employee.tanggal_masuk, employee.tanggal_non_aktif) ||
												'-'}
										</p>
									</div>
								</div>

								<div class="space-y-4">
									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Status Kerja</span>
										</div>
										<div class="flex items-center space-x-2">
											<span
												class="inline-flex rounded-full px-4 py-2 text-sm font-semibold
                        {employee.status_kerja === 'tetap'
													? 'bg-green-100 text-green-800'
													: employee.status_kerja === 'kontrak'
														? 'bg-yellow-100 text-yellow-800'
														: employee.status_kerja === 'magang'
															? 'bg-blue-100 text-blue-800'
															: 'bg-gray-100 text-gray-800'}"
											>
												{formatStatusKerja(employee.status_kerja) || '-'}
											</span>
										</div>
									</div>

									{#if employee.tanggal_non_aktif}
										<div class="group">
											<div
												class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
												<span>Tanggal Non-Aktif</span>
											</div>
											<p
												class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
											>
												{formatDate(employee.tanggal_non_aktif) || '-'}
											</p>
										</div>
									{/if}

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"
												/>
											</svg>
											<span>Lokasi Absen</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatLokasiAbsen(employee.lokasi_absen) || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
												/>
											</svg>
											<span>Penggajian</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatCurrency(employee.penggajian) ||
												formatCurrency(employee.gaji_pokok) ||
												'-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
												/>
											</svg>
											<span>Tanggungan</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{employee.tanggungan || '0'} orang
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Sidebar - Quick Info & Actions -->
					<div class="space-y-6">
						<!-- Quick Stats -->
						<div
							class="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="bg-opacity-20 rounded-lg bg-white p-2">
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold">Info Cepat</h3>
							</div>

							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">No. Karyawan:</span>
									<span class="font-semibold">{employee.no_karyawan || '-'}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">NIP:</span>
									<span class="font-semibold">{employee.nip || '-'}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">Status:</span>
									<span class="font-semibold"
										>{formatStatusKerja(employee.status_kerja) || '-'}</span
									>
								</div>
							</div>
						</div>

						<!-- Contact Information -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-green-100 p-2">
									<svg
										class="h-5 w-5 text-green-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold text-gray-900">Kontak</h3>
							</div>

							<div class="space-y-4">
								{#if employee.email}
									<div class="group cursor-pointer">
										<div
											class="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50"
										>
											<div
												class="rounded-lg bg-blue-100 p-2 transition-colors duration-200 group-hover:bg-blue-200"
											>
												<svg
													class="h-4 w-4 text-blue-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
													/>
												</svg>
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-medium text-gray-900">{employee.email}</p>
												<p class="text-xs text-gray-500">Email</p>
											</div>
										</div>
									</div>
								{/if}

								{#if employee.no_telp}
									<div class="group cursor-pointer">
										<div
											class="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50"
										>
											<div
												class="rounded-lg bg-green-100 p-2 transition-colors duration-200 group-hover:bg-green-200"
											>
												<svg
													class="h-4 w-4 text-green-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
													/>
												</svg>
											</div>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium text-gray-900">{employee.no_telp}</p>
												<p class="text-xs text-gray-500">Telepon</p>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Informasi Akun Karyawan -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-purple-100 p-2">
									<svg
										class="h-5 w-5 text-purple-600"
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
								<h3 class="text-lg font-bold text-gray-900">Akun Karyawan</h3>
							</div>

							{#if accountInfo}
								<div class="space-y-4">
									<div
										class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
									>
										<div class="flex items-center space-x-3">
											<div class="rounded-lg bg-green-100 p-2">
												<svg
													class="h-4 w-4 text-green-600"
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
											<div>
												<p class="text-sm font-medium text-green-800">Akun Aktif</p>
												<p class="text-xs text-green-600">Karyawan sudah memiliki akun login</p>
											</div>
										</div>
										<span
											class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
										>
											{accountInfo.status || 'Active'}
										</span>
									</div>

									<div class="space-y-3">
										<div>
											<div class="mb-1 text-sm font-medium text-gray-500">Email Login</div>
											<div class="flex items-center space-x-2">
												<p
													class="flex-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm font-semibold text-gray-900"
												>
													{accountInfo.email}
												</p>
												<button
													on:click={() => navigator.clipboard.writeText(accountInfo.email)}
													class="rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
													title="Copy email"
													aria-label="Copy email address"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
														/>
													</svg>
												</button>
											</div>
										</div>

										<!-- Password -->
										<div>
											<div class="mb-1 text-sm font-medium text-gray-500">Password</div>
											<div class="flex items-center space-x-2">
												<p
													class="flex-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm font-semibold text-gray-900"
												>
													{showPassword ? accountInfo.password || '-' : '••••••••'}
												</p>
												<button
													on:click={() => navigator.clipboard.writeText(accountInfo.password || '')}
													class="rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600"
													title="Copy password"
													aria-label="Copy password"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
														/>
													</svg>
												</button>
												<button
													on:click={() => (showPassword = !showPassword)}
													class="rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-green-50 hover:text-green-600"
													title="{showPassword ? 'Hide' : 'Show'} password"
													aria-label="Toggle password visibility"
												>
													{#if showPassword}
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
															/>
														</svg>
													{:else}
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
															/>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
															/>
														</svg>
													{/if}
												</button>
											</div>
										</div>

										<div>
											<div class="mb-1 text-sm font-medium text-gray-500">Role</div>
											<span
												class="inline-flex rounded-full px-3 py-1 text-sm font-medium
                        {accountInfo.role === 'manager'
													? 'bg-purple-100 text-purple-800'
													: accountInfo.role === 'supervisor'
														? 'bg-blue-100 text-blue-800'
														: 'bg-gray-100 text-gray-800'}"
											>
												{accountInfo.role === 'manager'
													? 'Manager'
													: accountInfo.role === 'supervisor'
														? 'Supervisor'
														: 'Employee'}
											</span>
										</div>

										<div>
											<div class="mb-1 text-sm font-medium text-gray-500">Dibuat</div>
											<p class="text-sm text-gray-900">
												{formatDate(accountInfo.created_at) || '-'}
											</p>
										</div>
									</div>
								</div>
							{:else}
								<div class="py-6 text-center">
									<div
										class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 p-3"
									>
										<svg
											class="h-8 w-8 text-yellow-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
											/>
										</svg>
									</div>
									<h4 class="mb-2 text-sm font-semibold text-gray-900">Belum Memiliki Akun</h4>
									<p class="mb-4 text-xs text-gray-600">
										Karyawan ini belum memiliki akun untuk login ke sistem
									</p>
									<button
										on:click={openCreateAccountModal}
										class="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700"
									>
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 6v6m0 0v6m0-6h6m-6 0H6"
											/>
										</svg>
										Buat Akun Sekarang
									</button>
								</div>
							{/if}
						</div>

						<!-- Additional Details -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-yellow-100 p-2">
									<svg
										class="h-5 w-5 text-yellow-600"
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
								</div>
								<h3 class="text-lg font-bold text-gray-900">Info Tambahan</h3>
							</div>

							<div class="space-y-4">
								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">No. NPWP</div>
									<p class="font-mono font-semibold text-gray-900">
										{employee.no_npwp || employee.npwp || '-'}
									</p>
								</div>

								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">No. BPJS Kesehatan</div>
									<p class="font-mono font-semibold text-gray-900">
										{employee.no_bpjs || employee.bpjs_kesehatan || '-'}
									</p>
								</div>

								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">BPJS Ketenagakerjaan</div>
									<p class="font-mono font-semibold text-gray-900">
										{employee.bpjs_ketenagakerjaan || '-'}
									</p>
								</div>

								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">Faskes Tingkat 1</div>
									<p class="font-semibold text-gray-900">{employee.faskes_tingkat_1 || '-'}</p>
								</div>

								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">Nama Bank</div>
									<p class="font-semibold text-gray-900">{employee.nama_bank || '-'}</p>
								</div>

								<div>
									<div class="mb-1 text-sm font-medium text-gray-500">No. Rekening Bank</div>
									<p class="font-mono font-semibold text-gray-900">
										{employee.no_rekening_bank || employee.no_rekening || '-'}
									</p>
								</div>

								{#if employee.foto_ktp}
									<div>
										<div class="mb-2 text-sm font-medium text-gray-500">Foto KTP</div>
										<div
											class="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100"
										>
											<img
												src={employee.foto_ktp}
												alt="Foto KTP"
												class="max-h-full max-w-full rounded-lg object-contain"
												on:error={() => {}}
											/>
										</div>
									</div>
								{/if}

								{#if employee.catatan}
									<div>
										<div class="mb-1 text-sm font-medium text-gray-500">Catatan</div>
										<p class="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-900">
											{employee.catatan}
										</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
							<div class="space-y-3">
								<button
									on:click={() => goto(`/employees/${employee.id}/edit`)}
									class="focus:ring-opacity-50 flex w-full transform items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 active:scale-95"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
									<span>Edit Data</span>
								</button>

								{#if !accountInfo}
									<button
										on:click={openCreateAccountModal}
										class="focus:ring-opacity-50 flex w-full transform items-center justify-center space-x-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-green-700 focus:ring-4 focus:ring-green-500 active:scale-95"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
											/>
										</svg>
										<span>Buat Akun</span>
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="mx-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
				></div>
				<p class="text-gray-500">Memuat data karyawan...</p>
			</div>
		{/if}
	</div>
</div>

<!-- Modal untuk Buat Akun -->
{#if showCreateAccountModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="max-h-screen w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-gray-200 p-6">
				<div class="flex items-center space-x-3">
					<div class="rounded-lg bg-green-100 p-2">
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
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
					</div>
					<div>
						<h3 class="text-xl font-bold text-gray-900">Buat Akun Karyawan</h3>
						<p class="text-sm text-gray-500">Untuk: {employee.nama_lengkap}</p>
					</div>
				</div>
				<button
					on:click={closeCreateAccountModal}
					aria-label="Tutup modal"
					class="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
				>
					<svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				{#if createAccountSuccess}
					<!-- Success Message -->
					<div class="py-8 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
						>
							<svg
								class="h-8 w-8 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h4 class="mb-2 text-lg font-semibold text-gray-900">Akun Berhasil Dibuat!</h4>
						<p class="text-gray-600">Akun untuk {employee.nama_lengkap} telah berhasil dibuat.</p>
					</div>
				{:else}
					<!-- Form -->
					<form on:submit|preventDefault={createAccount} class="space-y-6">
						<!-- Email Field -->
						<div>
							<label for="accountEmail" class="mb-2 block text-sm font-medium text-gray-700">
								Email
							</label>
							<input
								type="email"
								id="accountEmail"
								bind:value={accountEmail}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500"
								placeholder="Email karyawan..."
								required
								readonly
							/>
							<p class="mt-1 text-xs text-gray-500">
								Email akan digunakan sebagai username untuk login
							</p>
						</div>

						<!-- Password Field -->
						<div>
							<label for="accountPassword" class="mb-2 block text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								type="password"
								id="accountPassword"
								bind:value={accountPassword}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500"
								placeholder="Masukkan password..."
								required
								minlength="6"
							/>
							<p class="mt-1 text-xs text-gray-500">Password minimal 6 karakter</p>
						</div>

						<!-- Confirm Password Field -->
						<div>
							<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
								Konfirmasi Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								bind:value={confirmPassword}
								class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500"
								placeholder="Ulangi password..."
								required
								minlength="6"
							/>
						</div>

						<!-- Error Message -->
						{#if createAccountError}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<div class="flex items-center">
									<svg
										class="mr-2 h-5 w-5 text-red-500"
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
									<p class="text-sm text-red-800">{createAccountError}</p>
								</div>
							</div>
						{/if}

						<!-- Form Actions -->
						<div class="flex space-x-3 pt-4">
							<button
								type="button"
								on:click={closeCreateAccountModal}
								class="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
								disabled={isCreatingAccount}
							>
								Batal
							</button>
							<button
								type="submit"
								class="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isCreatingAccount}
							>
								{#if isCreatingAccount}
									<div class="flex items-center justify-center">
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
										Membuat...
									</div>
								{:else}
									Buat Akun
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
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

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes staggerChildren {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	:global(.animate-fade-in) {
		animation: fadeIn 0.6s ease-out forwards;
	}

	:global(.animate-slide-down) {
		animation: slideDown 0.7s ease-out forwards;
	}

	:global(.animate-stagger-children) {
		animation: staggerChildren 0.8s ease-out forwards;
	}

	:global(.animate-stagger-children > *) {
		opacity: 0;
		animation: fadeIn 0.6s ease-out forwards;
	}

	:global(.animate-stagger-children > *:nth-child(1)) {
		animation-delay: 0.1s;
	}

	:global(.animate-stagger-children > *:nth-child(2)) {
		animation-delay: 0.2s;
	}

	:global(.animate-stagger-children > *:nth-child(3)) {
		animation-delay: 0.3s;
	}

	:global(.animate-stagger-children > *:nth-child(4)) {
		animation-delay: 0.4s;
	}

	/* Hover animations */
	:global(.group:hover .group-hover\\:bg-blue-200) {
		background-color: rgb(191 219 254);
	}

	:global(.group:hover .group-hover\\:bg-green-200) {
		background-color: rgb(187 247 208);
	}

	/* Loading animation enhancement */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Gradient animation */
	:global(.bg-gradient-to-r) {
		background-size: 200% 200%;
		animation: gradient-shift 3s ease-in-out infinite;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}
</style>
