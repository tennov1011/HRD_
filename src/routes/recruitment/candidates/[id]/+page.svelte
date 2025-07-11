<script>
	/** @type {import('./$types').PageData} */
	export let data;

	const { applicant, jobTitle } = data;

	// Function to format date
	function formatDate(dateString) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Function to get status badge color
	function getStatusClass(status) {
		switch (status) {
			case 'pending':
				return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg';
			case 'reviewed':
				return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg';
			case 'interview':
				return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg';
			case 'test':
				return 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white shadow-lg';
			case 'accepted':
				return 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg';
			case 'rejected':
				return 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg';
			default:
				return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg';
		}
	}

	// Function to get status icon
	function getStatusIcon(status) {
		switch (status) {
			case 'pending':
				return '⏳';
			case 'reviewed':
				return '👁️';
			case 'interview':
				return '🎤';
			case 'test':
				return '📝';
			case 'accepted':
				return '✅';
			case 'rejected':
				return '❌';
			default:
				return '📋';
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
			<div class="mb-4 sm:mb-0">
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Detail Pelamar</h1>
				<p class="text-gray-600">Informasi lengkap kandidat yang melamar</p>
			</div>
			<a
				href="/recruitment/candidates"
				class="inline-flex items-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-gray-700 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
			>
				<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Kembali ke Daftar
			</a>
		</div>

		<!-- Main Content -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Left Column - Profile Summary -->
			<div class="lg:col-span-1">
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
						<div class="flex items-center space-x-4">
							<div
								class="bg-opacity-20 flex h-16 w-16 items-center justify-center rounded-full bg-white"
							>
								<svg
									class="h-8 w-8 text-white"
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
							<div>
								<h2 class="text-xl font-bold">{applicant.fullName || 'Nama Tidak Tersedia'}</h2>
								<p class="text-sm text-blue-100">{applicant.email || 'Email tidak tersedia'}</p>
							</div>
						</div>
					</div>

					<div class="p-6">
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-500">Status Seleksi</span>
								<span
									class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getStatusClass(
										applicant.applicationStatus
									)}"
								>
									<span class="mr-1">{getStatusIcon(applicant.applicationStatus)}</span>
									{applicant.applicationStatus || 'pending'}
								</span>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-500">Posisi</span>
								<span class="text-sm font-medium text-gray-900"
									>{jobTitle || 'Tidak diketahui'}</span
								>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-500">Tanggal Melamar</span>
								<span class="text-sm font-medium text-gray-900"
									>{formatDate(applicant.date_created)}</span
								>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-500">Pengalaman</span>
								<span class="text-sm font-medium text-gray-900">
									{#if applicant.workExperienceYears}
										{applicant.workExperienceYears} tahun
									{:else}
										Fresh Graduate
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column - Detailed Information -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Personal Information -->
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div class="border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4">
						<h3 class="flex items-center text-lg font-semibold text-gray-900">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
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
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
							Informasi Pribadi
						</h3>
					</div>

					<div class="p-6">
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="space-y-4">
								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
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
												d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Email</p>
										<p class="font-medium text-gray-900">{applicant.email || '-'}</p>
									</div>
								</div>

								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
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
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Nomor Telepon</p>
										<p class="font-medium text-gray-900">{applicant.phoneNumber || '-'}</p>
									</div>
								</div>

								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
										<svg
											class="h-5 w-5 text-pink-600"
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
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Tempat Lahir</p>
										<p class="font-medium text-gray-900">{applicant.placeOfBirth || '-'}</p>
									</div>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
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
												d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-5 0v6a2 2 0 002 2h2a2 2 0 002-2V7"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Jenis Kelamin</p>
										<p class="font-medium text-gray-900">{applicant.gender || '-'}</p>
									</div>
								</div>

								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
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
												d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-5 0v6a2 2 0 002 2h2a2 2 0 002-2V7"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Tanggal Lahir</p>
										<p class="font-medium text-gray-900">{formatDate(applicant.dateOfBirth)}</p>
									</div>
								</div>

								<div class="flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
										<svg
											class="h-5 w-5 text-red-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
											/>
										</svg>
									</div>
									<div>
										<p class="text-sm text-gray-500">Alamat</p>
										<p class="font-medium text-gray-900">{applicant.currentAddress || '-'}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Educational Background -->
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div
						class="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4"
					>
						<h3 class="flex items-center text-lg font-semibold text-gray-900">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
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
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
							</div>
							Riwayat Pendidikan
						</h3>
					</div>

					<div class="p-6">
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="space-y-4">
								<div class="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4">
									<p class="mb-1 text-sm text-gray-500">Pendidikan Tertinggi</p>
									<p class="text-lg font-semibold text-gray-900">
										{applicant.highestEducation || '-'}
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
									<p class="mb-1 text-sm text-gray-500">Nilai Akhir</p>
									<p class="font-semibold text-gray-900">{applicant.finalScore || '-'}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Work Experience -->
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div class="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4">
						<h3 class="flex items-center text-lg font-semibold text-gray-900">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
								<svg
									class="h-5 w-5 text-orange-600"
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
							Pengalaman Kerja
						</h3>
					</div>

					<div class="p-6">
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="space-y-4">
								<div class="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
									<p class="mb-1 text-sm text-gray-500">Lama Pengalaman</p>
									<p class="text-lg font-semibold text-gray-900">
										{#if applicant.workExperienceYears}
											{applicant.workExperienceYears} tahun
										{:else}
											Fresh Graduate
										{/if}
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
								<div class="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-4">
									<p class="mb-1 text-sm text-gray-500">Gaji Diharapkan</p>
									<p class="font-semibold text-gray-900">
										{#if applicant.expectedSalary}
											Rp {new Intl.NumberFormat('id-ID').format(applicant.expectedSalary)}
										{:else}
											Dapat dinegosiasi
										{/if}
									</p>
								</div>
							</div>
						</div>

						{#if applicant.jobDescription}
							<div class="mt-6 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 p-4">
								<p class="mb-2 text-sm text-gray-500">Deskripsi Pekerjaan Terakhir</p>
								<p class="leading-relaxed text-gray-900">{applicant.jobDescription}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Application Details -->
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div class="border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4">
						<h3 class="flex items-center text-lg font-semibold text-gray-900">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
								<svg
									class="h-5 w-5 text-teal-600"
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
							Detail Lamaran
						</h3>
					</div>

					<div class="p-6">
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
								<p class="mb-1 text-sm text-gray-500">Sumber Informasi Lowongan</p>
								<p class="font-semibold text-gray-900">{applicant.howDidYouHear || '-'}</p>
							</div>
							<div class="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
								<p class="mb-1 text-sm text-gray-500">Status Terkini</p>
								<span
									class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getStatusClass(
										applicant.applicationStatus
									)}"
								>
									<span class="mr-1">{getStatusIcon(applicant.applicationStatus)}</span>
									{applicant.applicationStatus || 'pending'}
								</span>
							</div>
						</div>

						{#if applicant.coverLetter}
							<div class="mt-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
								<p class="mb-2 text-sm text-gray-500">Surat Lamaran</p>
								<p class="leading-relaxed text-gray-900 italic">"{applicant.coverLetter}"</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Documents -->
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<div
						class="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4"
					>
						<h3 class="flex items-center text-lg font-semibold text-gray-900">
							<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
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
							Berkas Lamaran
						</h3>
					</div>

					<div class="p-6">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							{#if applicant.resumeFileUrl}
								<div
									class="rounded-xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 transition-all duration-200 hover:border-blue-200"
								>
									<div class="flex items-center space-x-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
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
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<h4 class="font-medium text-gray-900">CV / Resume</h4>
											<a
												href={applicant.resumeFileUrl}
												target="_blank"
												class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
											>
												📄 Lihat Dokumen
											</a>
										</div>
									</div>
								</div>
							{/if}

							{#if applicant.degreeCertificateUrl}
								<div
									class="rounded-xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4 transition-all duration-200 hover:border-purple-200"
								>
									<div class="flex items-center space-x-4">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100"
										>
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
													d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<h4 class="font-medium text-gray-900">Ijazah</h4>
											<a
												href={applicant.degreeCertificateUrl}
												target="_blank"
												class="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline"
											>
												🎓 Lihat Dokumen
											</a>
										</div>
									</div>
								</div>
							{/if}

							{#if applicant.transcriptUrl}
								<div
									class="rounded-xl border-2 border-yellow-100 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 transition-all duration-200 hover:border-yellow-200"
								>
									<div class="flex items-center space-x-4">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100"
										>
											<svg
												class="h-6 w-6 text-yellow-600"
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
											<h4 class="font-medium text-gray-900">Transkrip Nilai</h4>
											<a
												href={applicant.transcriptUrl}
												target="_blank"
												class="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:underline"
											>
												📊 Lihat Dokumen
											</a>
										</div>
									</div>
								</div>
							{/if}

							{#if applicant.profilePhoto}
								<div
									class="rounded-xl border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4 transition-all duration-200 hover:border-green-200"
								>
									<div class="flex items-center space-x-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
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
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<h4 class="font-medium text-gray-900">Foto Profil</h4>
											<a
												href={applicant.profilePhoto}
												target="_blank"
												class="text-sm font-medium text-green-600 hover:text-green-800 hover:underline"
											>
												📸 Lihat Foto
											</a>
										</div>
									</div>
								</div>
							{/if}
						</div>

						{#if !applicant.resumeFileUrl && !applicant.degreeCertificateUrl && !applicant.transcriptUrl && !applicant.profilePhoto}
							<div class="py-8 text-center">
								<svg
									class="mx-auto h-12 w-12 text-gray-400"
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
								<p class="mt-2 text-gray-500 italic">Tidak ada dokumen yang diunggah</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
