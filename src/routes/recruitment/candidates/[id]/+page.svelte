<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	/** @type {import('./$types').PageData} */
	export let data;

	$: ({ applicant, jobTitle } = data);

	// Animation state
	let loaded = false;
	let showImageModal = false;

	// Status update state - make reactive to applicant data
	let showStatusModal = false;
	let selectedStatus = '';
	$: note = applicant?.note || '';
	let isUpdating = false;

	// Helper function for capitalization
	const capitalize = (str) => {
		if (!str) return '-';
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Helper functions untuk formatting
	const formatDate = (dateString) => {
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

	const formatCurrency = (amount) => {
		if (!amount) return '-';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR'
		}).format(amount);
	};

	const formatEducation = (education) => {
		const educationMap = {
			SD: 'Sekolah Dasar',
			SMP: 'SMP',
			SMA: 'SMA/SMK',
			SMK: 'SMA/SMK',
			Diploma: 'Diploma',
			S1: 'Sarjana (S1)',
			S2: 'Magister (S2)',
			S3: 'Doktor (S3)'
		};
		return educationMap[education] || capitalize(education);
	};

	const formatGender = (gender) => {
		const genderMap = {
			L: 'Laki-laki',
			P: 'Perempuan',
			Male: 'Laki-laki',
			Female: 'Perempuan',
			'laki-laki': 'Laki-laki',
			perempuan: 'Perempuan'
		};
		return genderMap[gender] || capitalize(gender);
	};

	// Function to get status badge color
	function getStatusClass(status) {
		switch (status) {
			case 'pending':
			case 'reviewed':
				return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg';
			case 'interview':
				return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg';
			case 'accepted':
				return 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg';
			case 'rejected':
				return 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg';
			default:
				return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg';
		}
	}

	// Function to get status icon and display text
	function getStatusDisplay(status) {
		switch (status) {
			case 'pending':
			case 'reviewed':
				return { icon: '⏳', text: 'Diproses' };
			case 'interview':
				return { icon: '🗣️', text: 'Interview' };
			case 'accepted':
				return { icon: '✅', text: 'Lolos' };
			case 'rejected':
				return { icon: '❌', text: 'Ditolak' };
			default:
				return { icon: '📋', text: 'Pending' };
		}
	}

	// Function to get status icon (backward compatibility)
	function getStatusIcon(status) {
		return getStatusDisplay(status).icon;
	}

	const calculateAge = (birthDate) => {
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

	// Handle status update with SvelteKit form actions
	function openStatusModal() {
		// Map database status to frontend status
		const statusMap = {
			'pending': 'diproses',
			'reviewed': 'diproses',
			'interview': 'interview',
			'accepted': 'lolos',
			'rejected': 'ditolak'
		};
		
		// Reset to current applicant data with proper mapping
		const currentDbStatus = applicant?.applicationStatus || 'pending';
		selectedStatus = statusMap[currentDbStatus] || 'diproses';
		note = applicant?.note || '';
		
		console.log('Opening modal with current data:', {
			currentDbStatus: currentDbStatus,
			mappedFrontendStatus: selectedStatus,
			currentNote: applicant?.note,
			note
		});
		showStatusModal = true;
	}

	function closeStatusModal() {
		showStatusModal = false;
		isUpdating = false;
	}

	onMount(() => {
		setTimeout(() => {
			loaded = true;
		}, 100);
	});
</script>

<svelte:head>
	<title>Detail Pelamar - {applicant?.fullName || 'Tidak ditemukan'}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
	<div class="mx-0 w-full px-0 py-0">
		<!-- Header with Animation -->
		<div class="mb-6 px-6 py-6 {loaded ? 'animate-slide-down' : 'opacity-0'}">
			<button
				on:click={() => goto('/recruitment/candidates')}
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
				<span class="font-medium">Kembali ke Daftar Pelamar</span>
			</button>

			<div class="flex items-center space-x-4">
				<div>
					<h1 class="mb-2 text-4xl font-bold text-gray-900">Detail Pelamar</h1>
				</div>
			</div>
		</div>

		{#if applicant}
			<!-- Applicant Detail with Modern Layout -->
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
								{#if applicant.profilePhotoUrl}
									<button
										on:click={() => (showImageModal = true)}
										class="focus:ring-opacity-50 h-24 w-24 overflow-hidden rounded-full border-4 border-white transition-transform duration-200 hover:scale-105 focus:ring-4 focus:ring-white focus:outline-none"
										aria-label="Lihat foto profil {applicant.fullName}"
									>
										<img
											src={applicant.profilePhotoUrl}
											alt="Foto Profil {applicant.fullName}"
											class="h-full w-full object-cover"
											on:error={(e) => {
												console.error('Error loading profile photo:', e);
												e.target.parentElement.style.display = 'none';
											}}
										/>
									</button>
								{:else}
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
								{/if}
								<div
									class="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white {getStatusClass(
										applicant.applicationStatus
									)}"
								>
									<span class="text-sm">{getStatusIcon(applicant.applicationStatus)}</span>
								</div>
							</div>
							<!-- Basic Info -->
							<div class="flex-1 text-center sm:text-left">
								<h2 class="mb-4 text-3xl font-bold text-white">{applicant.fullName || '-'}</h2>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div
										class="flex items-center justify-center space-x-2 text-blue-100 sm:justify-start"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
											/>
										</svg>
										<span class="font-medium">{jobTitle || 'Posisi tidak diketahui'}</span>
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
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="space-y-5">
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
											{applicant.fullName || '-'}
										</p>
									</div>

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
											{applicant.email || '-'}
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
											{applicant.phoneNumber || '-'}
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
												class="inline-flex rounded-full px-3 py-1 text-sm font-medium {applicant.gender ===
													'Male' || applicant.gender === 'L'
													? 'bg-blue-100 text-blue-800'
													: 'bg-pink-100 text-pink-800'}"
											>
												{formatGender(applicant.gender) || '-'}
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
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
											<span>Tempat Lahir</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{applicant.placeOfBirth || '-'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-5 0v6a2 2 0 002 2h2a2 2 0 002-2V7"
												/>
											</svg>
											<span>Tanggal Lahir</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatDate(applicant.dateOfBirth)}
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
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Umur</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{calculateAge(applicant.dateOfBirth)}
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
											<span>Alamat Saat Ini</span>
										</div>
										<p
											class="leading-relaxed font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{applicant.currentAddress || '-'}
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
											<span>Tanggal Melamar</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{formatDate(applicant.date_created)}
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
											<span>Gaji yang Diharapkan</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{applicant.expectedSalary
												? formatCurrency(applicant.expectedSalary)
												: 'Dapat dinegosiasi'}
										</p>
									</div>

									<div class="group">
										<div class="mb-2 flex items-center space-x-2 text-sm font-medium text-gray-500">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span>Sumber Informasi</span>
										</div>
										<p
											class="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600"
										>
											{applicant.howDidYouHear || '-'}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Educational Background -->
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
											d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
										/>
									</svg>
								</div>
								<h3 class="text-2xl font-bold text-gray-900">Riwayat Pendidikan</h3>
							</div>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="space-y-4">
									<div class="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4">
										<p class="mb-1 text-sm text-gray-500">Pendidikan Tertinggi</p>
										<p class="text-lg font-semibold text-gray-900">
											{formatEducation(applicant.highestEducation) || '-'}
										</p>
									</div>
									<div class="rounded-xl bg-gradient-to-r from-green-50 to-blue-50 p-4">
										<p class="mb-1 text-sm text-gray-500">Nama Institusi</p>
										<p class="font-semibold text-gray-900">{applicant.institutionName || '-'}</p>
									</div>
								</div>

								<div class="space-y-4">
									<div class="rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
										<p class="mb-1 text-sm text-gray-500">Program Studi</p>
										<p class="font-semibold text-gray-900">{applicant.studyProgram || '-'}</p>
									</div>
									<div class="rounded-xl bg-gradient-to-r from-pink-50 to-red-50 p-4">
										<p class="mb-1 text-sm text-gray-500">Nilai Akhir/IPK</p>
										<p class="font-semibold text-gray-900">{applicant.finalScore || '-'}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Work Experience -->
						<div
							class="transform rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
						>
							<div class="mb-6 flex items-center space-x-3">
								<div class="rounded-xl bg-orange-100 p-3">
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
											d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
										/>
									</svg>
								</div>
								<h3 class="text-2xl font-bold text-gray-900">Pengalaman Kerja</h3>
							</div>

							<div class="p-6">
								<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div class="space-y-4">
										<div class="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
											<p class="mb-1 text-sm text-gray-500">Lama Pengalaman</p>
											<p class="text-lg font-semibold text-gray-900">
												{applicant.workExperienceYears
													? `${applicant.workExperienceYears} tahun`
													: 'Fresh Graduate'}
											</p>
										</div>
										<div class="rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
											<p class="mb-1 text-sm text-gray-500">Perusahaan Terakhir</p>
											<p class="font-semibold text-gray-900">{applicant.previousCompany || '-'}</p>
										</div>
									</div>

									<div class="space-y-4">
										<div class="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
											<p class="mb-1 text-sm text-gray-500">Posisi Terakhir</p>
											<p class="font-semibold text-gray-900">{applicant.lastPosition || '-'}</p>
										</div>
									</div>
								</div>

								{#if applicant.jobDescription}
									<div class="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 p-4">
										<p class="mb-2 text-sm text-gray-500">Deskripsi Pekerjaan Terakhir</p>
										<p class="leading-relaxed text-gray-900">{applicant.jobDescription}</p>
									</div>
								{/if}

								{#if applicant.coverLetter}
									<div class="mt-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
										<p class="mb-2 text-sm text-gray-500">Surat Lamaran</p>
										<p class="leading-relaxed text-gray-900 italic">"{applicant.coverLetter}"</p>
									</div>
								{/if}
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
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold">Status Lamaran</h3>
							</div>

							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">Posisi:</span>
									<span class="font-semibold">{jobTitle || '-'}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">Status:</span>
									<span
										class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusClass(
											applicant.applicationStatus
										)}"
									>
										<span class="mr-1">{getStatusIcon(applicant.applicationStatus)}</span>
										{getStatusDisplay(applicant.applicationStatus).text}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-indigo-100">Pengalaman:</span>
									<span class="font-semibold">
										{applicant.workExperienceYears
											? `${applicant.workExperienceYears} tahun`
											: 'Fresh Graduate'}
									</span>
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
								{#if applicant.email}
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
												<p class="truncate text-sm font-medium text-gray-900">{applicant.email}</p>
												<p class="text-xs text-gray-500">Email</p>
											</div>
										</div>
									</div>
								{/if}

								{#if applicant.phoneNumber}
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
												<p class="text-sm font-medium text-gray-900">{applicant.phoneNumber}</p>
												<p class="text-xs text-gray-500">Telepon</p>
											</div>
										</div>
									</div>
								{/if}

								<!-- Whatsapp Number -->
								{#if applicant.whatsappNumber}
									<div class="group cursor-pointer">
										<a
											href={`https://wa.me/${applicant.whatsappNumber}`}
											target="_blank"
											rel="noopener noreferrer"
											class="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50"
										>
											<div
												class="rounded-lg bg-green-100 p-2 transition-colors duration-200 group-hover:bg-green-200"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 32 32"
													fill="currentColor"
													class="h-6 w-6 text-green-600"
												>
													<path
														d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.661 1.934 6.661L4 29l7.523-1.927A12.96 12.96 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.982 0-3.917-.521-5.604-1.507l-.401-.234-4.468 1.145 1.192-4.364-.26-.424A9.93 9.93 0 016 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.255-7.317c-.287-.144-1.697-.838-1.96-.934-.263-.096-.454-.144-.646.144-.192.287-.741.934-.909 1.127-.168.192-.335.216-.622.072-.287-.144-1.213-.447-2.31-1.424-.854-.761-1.43-1.701-1.598-1.988-.168-.287-.018-.443.126-.587.13-.13.287-.335.431-.503.144-.168.192-.287.287-.478.096-.192.048-.359-.024-.503-.072-.144-.646-1.56-.885-2.137-.233-.561-.47-.484-.646-.493-.168-.007-.359-.009-.551-.009-.192 0-.503.072-.767.359-.263.287-1.003.98-1.003 2.389 0 1.409 1.027 2.769 1.171 2.961.144.192 2.022 3.088 4.902 4.203.685.295 1.219.472 1.635.603.687.219 1.312.188 1.805.114.551-.082 1.697-.693 1.938-1.363.24-.67.24-1.244.168-1.363-.072-.119-.263-.192-.551-.335z"
													/>
												</svg>
											</div>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium text-gray-900">{applicant.whatsappNumber}</p>
												<p class="text-xs text-gray-500">Hubungi Pelamar</p>
											</div>
										</a>
									</div>
								{/if}
							</div>
						</div>

						<!-- profilePhoto -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-blue-100 p-2">
									<svg
										class="h-5 w-5 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold text-gray-900">Foto Profil</h3>
							</div>

							<div class="text-center">
								{#if applicant.profilePhotoUrl}
									<div class="relative inline-block">
										<button
											on:click={() => (showImageModal = true)}
											class="focus:ring-opacity-50 relative rounded-full focus:ring-4 focus:ring-blue-500 focus:outline-none"
											aria-label="Klik untuk memperbesar foto profil {applicant.fullName}"
										>
											<img
												src={applicant.profilePhotoUrl}
												alt="Foto Profil {applicant.fullName}"
												class="mx-auto h-32 w-32 rounded-full border-4 border-gray-200 object-cover shadow-lg transition-transform duration-200 hover:scale-105"
												on:error={(e) => {
													console.error('Error loading profile photo:', e);
													e.target.parentElement.style.display = 'none';
												}}
											/>
											<div
												class="bg-opacity-0 hover:bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-black text-white opacity-0 transition-all duration-200 hover:opacity-100"
											>
												<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
													/>
												</svg>
											</div>
										</button>
									</div>
									<p class="mt-3 text-sm text-gray-500">Klik untuk memperbesar</p>
								{:else}
									<div
										class="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-200 bg-gray-100"
									>
										<svg
											class="h-16 w-16 text-gray-400"
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
									<p class="mt-3 text-sm text-gray-500">Tidak ada foto profil</p>
								{/if}
							</div>
						</div>

						<!-- Documents -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-indigo-100 p-2">
									<svg
										class="h-5 w-5 text-indigo-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold text-gray-900">Berkas</h3>
							</div>

							<div class="space-y-3">
								{#if applicant.resumeFileUrl}
									<a
										href={applicant.resumeFileUrl}
										target="_blank"
										class="flex items-center space-x-3 rounded-lg border p-3 transition-colors duration-200 hover:bg-blue-50"
									>
										<div class="rounded-lg bg-blue-100 p-2">
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
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<p class="text-sm font-medium text-gray-900">CV / Resume</p>
											<p class="text-xs text-gray-500">Klik untuk melihat</p>
										</div>
									</a>
								{/if}

								{#if applicant.degreeCertificateUrl}
									<a
										href={applicant.degreeCertificateUrl}
										target="_blank"
										class="flex items-center space-x-3 rounded-lg border p-3 transition-colors duration-200 hover:bg-purple-50"
									>
										<div class="rounded-lg bg-purple-100 p-2">
											<svg
												class="h-4 w-4 text-purple-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<p class="text-sm font-medium text-gray-900">Ijazah</p>
											<p class="text-xs text-gray-500">Klik untuk melihat</p>
										</div>
									</a>
								{/if}

								{#if applicant.transcriptUrl}
									<a
										href={applicant.transcriptUrl}
										target="_blank"
										class="flex items-center space-x-3 rounded-lg border p-3 transition-colors duration-200 hover:bg-yellow-50"
									>
										<div class="rounded-lg bg-yellow-100 p-2">
											<svg
												class="h-4 w-4 text-yellow-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<p class="text-sm font-medium text-gray-900">Transkrip</p>
											<p class="text-xs text-gray-500">Klik untuk melihat</p>
										</div>
									</a>
								{/if}

								{#if !applicant.resumeFileUrl && !applicant.degreeCertificateUrl && !applicant.transcriptUrl}
									<div class="py-4 text-center">
										<svg
											class="mx-auto h-8 w-8 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
											/>
										</svg>
										<p class="mt-2 text-sm text-gray-500">Tidak ada dokumen</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Evaluasi & Update Status -->
						<div
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-center space-x-3">
								<div class="rounded-lg bg-blue-100 p-2">
									<svg
										class="h-5 w-5 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-bold text-gray-900">Evaluasi & Status</h3>
							</div>

							<!-- Current Status Display -->
							<div class="mb-4 rounded-lg bg-gray-50 p-4">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-600">Status Saat Ini:</span>
									<span
										class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusClass(
											applicant.applicationStatus
										)}"
									>
										<span class="mr-1">{getStatusIcon(applicant.applicationStatus)}</span>
										{applicant.applicationStatus || 'Diproses'}
									</span>
								</div>
							</div>

							<!-- Current Note Display -->
							{#if applicant.note}
								<div class="mb-4 rounded-lg bg-yellow-50 p-4">
									<h4 class="mb-2 text-sm font-medium text-gray-700">Catatan Evaluasi:</h4>
									<p class="text-sm leading-relaxed text-gray-600">{applicant.note}</p>
								</div>
							{/if}

							<div class="space-y-3">
								<button
									on:click={openStatusModal}
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
									<span>Update Status & Catatan</span>
								</button>
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
				<p class="text-gray-500">Memuat data pelamar...</p>
			</div>
		{/if}
	</div>
</div>

<!-- Modal untuk gambar yang diperbesar -->
{#if showImageModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		on:click={() => (showImageModal = false)}
		role="dialog"
		aria-label="Modal foto profil"
		tabindex="-1"
	>
		<div class="relative max-h-full max-w-full" on:click|stopPropagation>
			<button
				on:click={() => (showImageModal = false)}
				class="absolute -top-4 -right-4 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 focus:ring-4 focus:ring-blue-500 focus:outline-none"
				aria-label="Tutup modal foto profil"
			>
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			{#if applicant.profilePhotoUrl}
				<img
					src={applicant.profilePhotoUrl}
					alt="Foto Profil - Diperbesar"
					class="max-h-full max-w-full rounded-lg object-contain"
				/>
			{/if}
		</div>
	</div>
{/if}

<!-- Modal untuk Update Status dan Catatan -->
{#if showStatusModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		on:click={() => (showStatusModal = false)}
		role="dialog"
		aria-label="Modal update status"
		tabindex="-1"
	>
		<div
			class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			on:click|stopPropagation
		>
			<!-- Modal Header -->
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Update Status & Catatan</h3>
				<button
					on:click={closeStatusModal}
					class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-4 focus:ring-blue-500 focus:outline-none"
					aria-label="Tutup modal"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Form with SvelteKit action -->
			<form
				method="POST"
				action="?/updateStatus"
				use:enhance={() => {
					isUpdating = true;
					console.log('Form submission started with data:', { selectedStatus, note });

					return async ({ result, update }) => {
						console.log('Form result received:', result);
						isUpdating = false;

						if (result.type === 'success') {
							// Map frontend status to database status for updating local state
							const statusMap = {
								'diproses': 'reviewed',
								'interview': 'interview',
								'lolos': 'accepted',
								'ditolak': 'rejected'
							};
							
							// Update local data immediately with database status
							if (applicant) {
								applicant.applicationStatus = statusMap[selectedStatus] || selectedStatus;
								if (note && note.trim()) {
									applicant.note = note.trim();
								}
							}

							// Force reactive update
							data = { ...data, applicant: { ...applicant } };

							// Close modal
							closeStatusModal();

							// Show success message
							setTimeout(() => {
								alert(result.data?.message || 'Status berhasil diperbarui!');
							}, 100);

							// Update the page data
							await update({ reset: false });
						} else if (result.type === 'failure') {
							console.error('Form submission failed:', result);
							alert(result.data?.message || 'Gagal memperbarui status');
							await update({ reset: false });
						} else {
							console.log('Unexpected result type:', result.type);
							await update();
						}
					};
				}}
			>
				<!-- Status Selection -->
				<div class="mb-6">
					<label for="status" class="mb-2 block text-sm font-medium text-gray-700">
						Status Lamaran
					</label>
					<select
						id="status"
						name="status"
						bind:value={selectedStatus}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value="diproses">Diproses</option>
						<option value="interview">Interview</option>
						<option value="lolos">Lolos</option>
						<option value="ditolak">Ditolak</option>
					</select>
				</div>

				<!-- Note Textarea -->
				<div class="mb-6">
					<label for="note" class="mb-2 block text-sm font-medium text-gray-700">
						Catatan Evaluasi
					</label>
					<textarea
						id="note"
						name="note"
						bind:value={note}
						rows="4"
						placeholder="Tambahkan catatan evaluasi untuk pelamar ini..."
						class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>

				<!-- Action Buttons -->
				<div class="flex space-x-3">
					<button
						type="button"
						on:click={closeStatusModal}
						disabled={isUpdating}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-500 focus:outline-none disabled:opacity-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isUpdating || !selectedStatus}
						class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
					>
						{isUpdating ? 'Menyimpan...' : 'Simpan'}
					</button>
				</div>
			</form>
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
