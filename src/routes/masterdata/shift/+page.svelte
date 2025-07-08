<script>
	export let form;

	let isSubmitting = false;

	function handleSubmit() {
		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Tambah Shift - Master Data</title>
</svelte:head>

<!-- Modern Background with Gradient -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
	<div class="container mx-auto max-w-7xl px-6 py-12">
		<!-- Header Section - Desktop Optimized -->
		<div class="mb-12 flex items-center justify-between">
			<!-- Left Side: Title and Description -->
			<div class="flex-1">
				<div class="mb-4 flex items-center">
					<div
						class="mr-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
					>
						<span class="text-3xl text-white">⏰</span>
					</div>
					<div>
						<h1 class="mb-2 text-4xl font-bold text-gray-800">Tambah Shift Kerja</h1>
						<p class="text-lg text-gray-600">
							Buat shift kerja baru untuk sistem kehadiran karyawan
						</p>
					</div>
				</div>

				<!-- Breadcrumb -->
				<nav class="flex items-center space-x-2 text-sm">
					<a
						href="/masterdata"
						class="flex items-center text-blue-600 transition-colors hover:text-blue-700"
					>
						<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							></path>
						</svg>
						Master Data
					</a>
					<span class="text-gray-400">/</span>
					<span class="text-gray-600">Tambah Shift</span>
				</nav>
			</div>

			<!-- Right Side: Quick Actions -->
			<div class="hidden items-center space-x-4 lg:flex">
				<div class="rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
					<div class="flex items-center text-sm text-gray-600">
						<svg
							class="mr-2 h-4 w-4 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						Form input shift baru
					</div>
				</div>
			</div>
		</div>

		<!-- Desktop Layout: Split View -->
		<div class="grid grid-cols-1 gap-8 xl:grid-cols-3">
			<!-- Main Form Card - Takes 2/3 of desktop width -->
			<div class="xl:col-span-2">
				<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
					<!-- Card Header -->
					<div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="text-xl font-semibold text-white">Informasi Shift</h2>
								<p class="mt-1 text-sm text-blue-100">Isi form di bawah untuk membuat shift baru</p>
							</div>
							<div class="rounded-lg bg-white/20 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Form Container -->
					<div class="p-8">
						<form
							method="POST"
							action="/masterdata?/addShift"
							on:submit={handleSubmit}
							class="space-y-8"
						>
							<!-- Nama Shift Field -->
							<div class="space-y-3">
								<label for="nama" class="flex items-center text-base font-medium text-gray-700">
									<svg
										class="mr-3 h-5 w-5 text-blue-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										></path>
									</svg>
									Nama Shift
									<span class="ml-2 text-red-500">*</span>
								</label>
								<div class="relative">
									<input
										type="text"
										id="nama"
										name="nama"
										required
										class="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 pl-14 text-base transition-all duration-200 hover:bg-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
										placeholder="Contoh: Shift Pagi, Shift Siang, Shift Malam"
									/>
									<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
										<span class="text-xl text-gray-400">⏰</span>
									</div>
								</div>
							</div>

							<!-- Time Fields - Desktop Grid -->
							<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
								<!-- Jam Masuk -->
								<div class="space-y-3">
									<label
										for="jam_masuk"
										class="flex items-center text-base font-medium text-gray-700"
									>
										<svg
											class="mr-3 h-5 w-5 text-green-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										Jam Masuk
										<span class="ml-2 text-red-500">*</span>
									</label>
									<div class="relative">
										<input
											type="time"
											id="jam_masuk"
											name="jam_masuk"
											required
											class="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 pl-14 text-base transition-all duration-200 hover:bg-gray-100 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
										/>
										<div
											class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
										>
											<span class="text-xl text-gray-400">🕐</span>
										</div>
									</div>
									<p class="ml-8 text-sm text-gray-500">Waktu mulai kerja</p>
								</div>

								<!-- Jam Keluar -->
								<div class="space-y-3">
									<label
										for="jam_keluar"
										class="flex items-center text-base font-medium text-gray-700"
									>
										<svg
											class="mr-3 h-5 w-5 text-red-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
											></path>
										</svg>
										Jam Keluar
										<span class="ml-2 text-red-500">*</span>
									</label>
									<div class="relative">
										<input
											type="time"
											id="jam_keluar"
											name="jam_keluar"
											required
											class="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 pl-14 text-base transition-all duration-200 hover:bg-gray-100 focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none"
										/>
										<div
											class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
										>
											<span class="text-xl text-gray-400">🕕</span>
										</div>
									</div>
									<p class="ml-8 text-sm text-gray-500">Waktu selesai kerja</p>
								</div>
							</div>

							<!-- Status Field -->
							<div class="space-y-3">
								<label for="status" class="flex items-center text-base font-medium text-gray-700">
									<svg
										class="mr-3 h-5 w-5 text-purple-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									Status
									<span class="ml-2 text-red-500">*</span>
								</label>
								<div class="relative">
									<select
										id="status"
										name="status"
										required
										class="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 pl-14 text-base transition-all duration-200 hover:bg-gray-100 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
									>
										<option value="aktif">✅ Aktif</option>
										<option value="tidak_aktif">❌ Tidak Aktif</option>
									</select>
									<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
										<span class="text-xl text-gray-400">🎯</span>
									</div>
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4"
									>
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
												d="M19 9l-7 7-7-7"
											></path>
										</svg>
									</div>
								</div>
								<p class="ml-8 text-sm text-gray-500">Status keaktifan shift</p>
							</div>

							<!-- Error Message -->
							{#if form?.error}
								<div class="rounded-xl border-l-4 border-red-400 bg-red-50 p-6">
									<div class="flex">
										<div class="flex-shrink-0">
											<svg
												class="h-6 w-6 text-red-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
												></path>
											</svg>
										</div>
										<div class="ml-3">
											<h3 class="text-base font-medium text-red-800">Terjadi Kesalahan!</h3>
											<p class="mt-1 text-sm text-red-700">{form.error}</p>
										</div>
									</div>
								</div>
							{/if}

							<!-- Desktop Action Buttons -->
							<div class="flex flex-row gap-6 pt-6">
								<button
									type="submit"
									disabled={isSubmitting}
									class="flex-1 transform rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if isSubmitting}
										<div class="flex items-center justify-center">
											<svg
												class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
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
											Menyimpan Shift...
										</div>
									{:else}
										<div class="flex items-center justify-center">
											<svg
												class="mr-2 h-5 w-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												></path>
											</svg>
											Simpan Shift
										</div>
									{/if}
								</button>

								<a
									href="/masterdata"
									class="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-8 py-4 text-center text-base font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-200"
								>
									<div class="flex items-center justify-center">
										<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											></path>
										</svg>
										Batal
									</div>
								</a>
							</div>
						</form>
					</div>
				</div>
			</div>

			<!-- Desktop Sidebar - Takes 1/3 of desktop width -->
			<div class="space-y-6 xl:col-span-1">
				<!-- Help Section -->
				<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
					<div class="mb-4 flex items-center">
						<div class="flex-shrink-0">
							<svg
								class="h-8 w-8 text-blue-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-lg font-semibold text-gray-800">Panduan Pengisian</h3>
						</div>
					</div>
					<div class="space-y-4">
						<div class="flex items-start">
							<div
								class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
							>
								<span class="text-sm font-semibold text-blue-600">1</span>
							</div>
							<div class="ml-3">
								<p class="text-sm text-gray-700">
									<strong>Nama Shift:</strong> Gunakan nama yang jelas dan mudah dipahami seperti "Shift
									Pagi", "Shift Siang", atau "Shift Malam"
								</p>
							</div>
						</div>
						<div class="flex items-start">
							<div
								class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
							>
								<span class="text-sm font-semibold text-green-600">2</span>
							</div>
							<div class="ml-3">
								<p class="text-sm text-gray-700">
									<strong>Jam Kerja:</strong> Pastikan jam masuk dan keluar sesuai dengan kebijakan perusahaan
									dan regulasi tenaga kerja
								</p>
							</div>
						</div>
						<div class="flex items-start">
							<div
								class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100"
							>
								<span class="text-sm font-semibold text-purple-600">3</span>
							</div>
							<div class="ml-3">
								<p class="text-sm text-gray-700">
									<strong>Status:</strong> Shift yang tidak aktif tidak akan muncul sebagai pilihan saat
									presensi karyawan
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Quick Stats Card -->
				<div
					class="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg"
				>
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								></path>
							</svg>
						</div>
						<div class="ml-3">
							<h4 class="text-lg font-semibold">Shift Management</h4>
							<p class="text-sm text-blue-100">Kelola jadwal kerja karyawan dengan mudah</p>
						</div>
					</div>
					<div class="mt-4 border-t border-white/20 pt-4">
						<div class="flex items-center text-sm">
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								></path>
							</svg>
							Sistem otomatis mengatur waktu kerja
						</div>
					</div>
				</div>

				<!-- Recent Activity -->
				<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">Contoh Shift Umum</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
							<div class="flex items-center">
								<span class="mr-3 text-lg">🌅</span>
								<span class="text-sm font-medium text-gray-700">Shift Pagi</span>
							</div>
							<span class="text-sm text-gray-500">08:00 - 16:00</span>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
							<div class="flex items-center">
								<span class="mr-3 text-lg">☀️</span>
								<span class="text-sm font-medium text-gray-700">Shift Siang</span>
							</div>
							<span class="text-sm text-gray-500">16:00 - 00:00</span>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
							<div class="flex items-center">
								<span class="mr-3 text-lg">🌙</span>
								<span class="text-sm font-medium text-gray-700">Shift Malam</span>
							</div>
							<span class="text-sm text-gray-500">00:00 - 08:00</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
