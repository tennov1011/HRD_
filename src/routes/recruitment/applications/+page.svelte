<script>
	import { formatDate } from '$lib/utils/dateUtils';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	$: selectedJob = data.selectedJob;
	$: applications = data.applications || [];
	$: jobPostings = data.jobPostings || [];
	$: masterData = data.masterData || { lokasi_absen: [] };

	// Helper function to get location display with address
	function getLocationDisplay(locationValue) {
		if (!locationValue || !masterData.lokasi_absen) return locationValue || 'Not specified';
		
		const location = masterData.lokasi_absen.find(lokasi => lokasi.value === locationValue);
		if (location && location.alamat) {
			return `${location.value} | ${location.alamat}`;
		}
		return locationValue;
	}

	// Format requirements for display
	function formatRequirements(requirements) {
		if (typeof requirements === 'string') {
			// Jika requirements adalah string, split berdasarkan newline
			return requirements
				.split('\n')
				.map((item) => item.trim())
				.filter((item) => item.length > 0);
		}
		if (Array.isArray(requirements)) {
			return requirements.filter((item) => item && item.trim().length > 0);
		}
		return [];
	}

	// Function to check if job is inactive
	// Jobs are automatically marked as inactive when they pass their deadline
	function isJobInactive(job) {
		return job.status === 'inactive';
	}
</script>

<svelte:head>
	<title>Job Applications</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	{#if !selectedJob}
		<!-- Job Selection Screen -->
		<div>
			<h1 class="mb-6 text-2xl font-bold">Pilih Lowongan</h1>

			{#if jobPostings.length === 0}
				<div class="rounded-lg bg-gray-50 p-6 text-center shadow-sm">
					<p class="text-gray-500">Lowongan tidak ditemukan.</p>
					<a href="/recruitment/list" class="mt-2 inline-block text-blue-600 hover:underline">
						Go to job postings
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each jobPostings as job}
						<a
							href={`/recruitment/applications?jobId=${job.id}`}
							class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
						>
							<h3
								class="mb-2 text-lg font-medium text-gray-900"
								class:line-through={isJobInactive(job)}
							>
								{job.title}
							</h3>
							<p class="mb-2 text-sm text-gray-500" class:line-through={isJobInactive(job)}>
								Department: {job.department}
							</p>
							<p class="mb-4 text-sm text-gray-500" class:line-through={isJobInactive(job)}>
								Deadline: {formatDate(job.deadline)}
							</p>

							<div class="flex items-center justify-between">
								<span
									class="text-sm font-medium text-blue-600"
									class:line-through={isJobInactive(job)}
								>
									{job.applicantCount || 0} pelamar
								</span>
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
								>
									Lihat Lowongan
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Job Applications View -->
		<div>
			<!-- Header with navigation -->
			<div class="mb-8 flex items-center">
				<a
					href="/recruitment/applications
				"
					class="mr-4 text-gray-500 hover:text-gray-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
				<h1 class="text-2xl font-bold">Applications: {selectedJob.title}</h1>
			</div>

			<!-- Status Messages -->
			{#if form?.success}
				<div class="mb-6 border-l-4 border-green-500 bg-green-100 p-4 text-green-700" role="alert">
					<p class="font-bold">Success!</p>
					<p>{form.message}</p>
					{#if form.message.includes('accepted')}
						<p class="text-sm mt-1">💼 Pelamar yang diterima akan otomatis ditambahkan ke database register sebagai karyawan baru.</p>
					{/if}
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
					<p class="font-bold">Error</p>
					<p>{form.error}</p>
				</div>
			{/if}

			<!-- Job details -->
			<div class="mb-8 rounded-lg bg-white shadow">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-5">
					<h2 class="text-lg font-medium text-gray-900">Job Details</h2>
					<!-- Button Edit -->
					<a
						href={`/recruitment/applications/edit/${selectedJob.id}`}
						class="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-700"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"
							/>
						</svg>
						Edit
					</a>
				</div>
				<div class="px-6 py-5">
					<dl class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
						<div>
							<dt class="text-sm font-medium text-gray-500">Lowongan</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.title}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Departemen</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.department}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Lokasi Pekerjaan</dt>
							<dd class="mt-1 text-sm text-gray-900">{getLocationDisplay(selectedJob.location)}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Rentang Gaji</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.salary || 'Not specified'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Status Waktu Kerja</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{#if selectedJob.employment_type}
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
										class:bg-green-100={selectedJob.employment_type === 'full-time'}
										class:text-green-800={selectedJob.employment_type === 'full-time'}
										class:bg-blue-100={selectedJob.employment_type === 'part-time'}
										class:text-blue-800={selectedJob.employment_type === 'part-time'}
										class:bg-purple-100={selectedJob.employment_type === 'contract'}
										class:text-purple-800={selectedJob.employment_type === 'contract'}
										class:bg-orange-100={selectedJob.employment_type === 'internship'}
										class:text-orange-800={selectedJob.employment_type === 'internship'}
										class:bg-gray-100={selectedJob.employment_type === 'freelance'}
										class:text-gray-800={selectedJob.employment_type === 'freelance'}
									>
										{selectedJob.employment_type === 'full-time'
											? 'Full Time'
											: selectedJob.employment_type === 'part-time'
												? 'Part Time'
												: selectedJob.employment_type === 'contract'
													? 'Kontrak'
													: selectedJob.employment_type === 'internship'
														? 'Magang'
														: selectedJob.employment_type === 'freelance'
															? 'Freelance'
															: selectedJob.employment_type}
									</span>
								{:else}
									<span class="text-gray-500">Not specified</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Pendidikan Minimal</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{#if selectedJob.min_education}
									<span
										class="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
									>
										{selectedJob.min_education === 'sma'
											? 'SMA/SMK'
											: selectedJob.min_education === 'diploma'
												? 'Diploma (D3)'
												: selectedJob.min_education === 'sarjana'
													? 'Sarjana (S1)'
													: selectedJob.min_education === 'magister'
														? 'Magister (S2)'
														: selectedJob.min_education === 'doktor'
															? 'Doktor (S3)'
															: selectedJob.min_education}
									</span>
								{:else}
									<span class="text-gray-500">Not specified</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Pengalaman Kerja</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{#if selectedJob.experience}
									<span
										class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
									>
										{selectedJob.experience === 'fresh-graduate'
											? 'Fresh Graduate'
											: selectedJob.experience === '1-2-years'
												? '1-2 Tahun'
												: selectedJob.experience === '3-5-years'
													? '3-5 Tahun'
													: selectedJob.experience === '5-plus-years'
														? '5+ Tahun'
														: selectedJob.experience === '10-plus-years'
															? '10+ Tahun'
															: selectedJob.experience}
									</span>
								{:else}
									<span class="text-gray-500">Not specified</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Deadline Lowongan</dt>
							<dd class="mt-1 text-sm text-gray-900">{formatDate(selectedJob.deadline, 'long')}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
							<dd class="mt-1 text-sm whitespace-pre-wrap text-gray-900">
								{selectedJob.description}
							</dd>
							<div>
								<dt class="text-sm font-medium text-gray-500">Syarat / Kualifikasi</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{#if selectedJob.requirements}
										<ul class="list-inside list-disc space-y-1">
											{#each formatRequirements(selectedJob.requirements) as requirement}
												<li>{requirement}</li>
											{/each}
										</ul>
									{:else}
										<span class="text-gray-500">No requirements specified</span>
									{/if}
								</dd>
							</div>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Tanggal Publikasi</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{formatDate(selectedJob.date_created, 'long')}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<!-- Applications List -->
			{#if applications.length > 0}
				<div class="overflow-x-auto rounded-lg bg-white shadow">
					<div class="border-b border-gray-200 px-6 py-5">
						<h2 class="text-lg font-medium text-gray-900">
							Daftar Pelamar ({applications.length} pelamar)
						</h2>
					</div>
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Nama</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Email</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Status</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Pengalaman</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Pendidikan</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Sumber</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Tanggal</th
								>
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-800 uppercase"
									>Aksi</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each applications as application}
								<tr>
									<td class="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900"
										>{application.fullName || 'Nama tidak tersedia'}</td
									>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-800"
										>{application.email || '-'}</td
									>
									<td class="px-4 py-3 whitespace-nowrap">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
											class:bg-yellow-100={application.applicationStatus === 'Diproses'}
											class:text-yellow-800={application.applicationStatus === 'Diproses'}
											class:bg-purple-100={application.applicationStatus === 'Interview'}
											class:text-purple-800={application.applicationStatus === 'Interview'}
											class:bg-green-100={application.applicationStatus === 'Lolos'}
											class:text-green-800={application.applicationStatus === 'Lolos'}
											class:bg-red-100={application.applicationStatus === 'Ditolak'}
											class:text-red-800={application.applicationStatus === 'Ditolak'}
											class:bg-gray-100={!application.applicationStatus ||
												application.applicationStatus === 'Pending'}
											class:text-gray-800={!application.applicationStatus ||
												application.applicationStatus === 'Pending'}
										>
											{application.applicationStatus || 'Pending'}
										</span>
									</td>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-800"
										>{application.workExperienceYears || 0} tahun</td
									>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-800"
										>{application.highestEducation || '-'}</td
									>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-800"
										>{application.howDidYouHear || '-'}</td
									>
									<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-800"
										>{formatDate(application.date_created)}</td
									>
									<td class="px-4 py-3 text-sm whitespace-nowrap">
										<div class="flex items-center space-x-2">
											{#if application.resumeFileUrl}
												<a
													href={application.resumeFileUrl}
													target="_blank"
													rel="noopener noreferrer"
													class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-4 font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
												>
													<svg
														class="mr-1 h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													CV
												</a>
											{/if}
											
											<a
												href={`/recruitment/candidates/${application.id}`}
												class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm leading-4 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
											>
												Detail
											</a>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="rounded-lg bg-gray-50 p-6 text-center shadow-sm">
					<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
						<svg
							class="h-6 w-6 text-gray-400"
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
					<h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada pelamar</h3>
					<p class="mt-1 text-sm text-gray-500">Belum ada yang melamar untuk posisi ini.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
