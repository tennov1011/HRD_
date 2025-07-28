<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Filter state
	let activeTab = 'all';
	/** @type {any[]} */
	let displayDocuments = [];
	// Search query state (sync with URL param if provided by server)
	let searchQuery = data.searchQuery || '';

	$: {
		// Ambil dokumen berdasarkan tab
		let docs;
		if (activeTab === 'sop') {
			docs = data.sopDocuments || [];
		} else if (activeTab === 'sop-general') {
			docs = data.sopGeneralDocuments || [];
		} else if (activeTab === 'work-instruction') {
			docs = data.workInstructionDocuments || [];
		} else if (activeTab === 'pp') {
			docs = data.ppDocuments || [];
		} else if (activeTab === 'kebijakan') {
			docs = data.kebijakanDocuments || [];
		} else if (activeTab === 'active') {
			docs = data.activeDocuments || [];
		} else if (activeTab === 'inactive') {
			docs = data.inactiveDocuments || [];
		} else {
			docs = data.documents || [];
		}

		// Filter berdasarkan query pencarian
		if (searchQuery.trim() !== '') {
			const q = searchQuery.toLowerCase();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			docs = docs.filter((/** @type {any} */ doc) =>
				(doc.title && doc.title.toLowerCase().includes(q)) ||
				(doc.code && String(doc.code).toLowerCase().includes(q)) ||
				(doc.description && doc.description.toLowerCase().includes(q))
			);
		}

		displayDocuments = docs;
	}

	// Modal states
	let showDeleteConfirmModal = false;
	/** @type {string | null} */
	let selectedDocumentId = null;
	let selectedDocumentTitle = '';

	/**
	 * Show delete confirmation modal
	 * @param {string} id - Document ID
	 * @param {string} title - Document title
	 */
	function confirmDelete(id, title) {
		selectedDocumentId = id;
		selectedDocumentTitle = title;
		showDeleteConfirmModal = true;
	}

	/**
	 * Format date
	 * @param {string} dateString - Date string to format
	 */
	function formatDate(dateString) {
		if (!dateString) return '-';

		try {
			const date = new Date(dateString);
			return date.toLocaleString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (error) {
			console.error('Error formatting date:', error);
			return dateString;
		}
	}

	/**
	 * Format status badge
	 * @param {string} status - Status value
	 */
	function getStatusBadgeClass(status) {
		switch (status) {
			case 'Active':
				return 'bg-green-100 text-green-800';
			case 'Inactive':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	/**
	 * Format category badge
	 * @param {string} category - Category value
	 */
	function getCategoryBadgeClass(category) {
		switch (category) {
			case 'SOP Departemen':
				return 'bg-blue-100 text-blue-800';
			case 'SOP General':
				return 'bg-cyan-100 text-cyan-800';
			case 'Work Instruction':
				return 'bg-purple-100 text-purple-800';
			case 'PP':
				return 'bg-yellow-100 text-yellow-800';
			case 'Kebijakan':
				return 'bg-indigo-100 text-indigo-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Handle notification
	let showNotification = false;
	let notificationMessage = '';
	let notificationType = 'success';

	/**
	 * Show notification
	 * @param {string} message - Message to display
	 * @param {string} type - Notification type
	 */
	function showNotif(message, type = 'success') {
		notificationMessage = message;
		notificationType = type;
		showNotification = true;
		setTimeout(() => (showNotification = false), 1500);
	}

	// Check for form result
	$: if (form?.success) {
		showNotif(form.message || 'Operasi berhasil!', 'success');
	} else if (form?.error) {
		showNotif(form.message || 'Terjadi kesalahan!', 'error');
	}

	// Delete form enhance handler
	function handleDeleteEnhance() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return async (/** @type {any} */ params) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { result, update } = /** @type {any} */(params);
			if (result.type === 'success') {
				showDeleteConfirmModal = false;
				await update();
				// Refresh list by navigating
				goto('/documents/list');
			}
		};
	}

	// Search feature
	function handleSearch() {
		goto(`/documents/list?search=${encodeURIComponent(searchQuery.trim())}`);
	}
</script>

<svelte:head>
	<title>Daftar Dokumen - HRD System</title>
</svelte:head>

<div class="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
	<!-- Notification -->
	{#if showNotification}
		<div
			class="animate-fadeIn fixed top-1/2 left-1/2 z-50 min-w-[320px] -translate-x-1/2 -translate-y-1/2 transform rounded-xl px-8 py-6 text-center shadow-2xl"
			class:bg-green-500={notificationType === 'success'}
			class:bg-red-500={notificationType === 'error'}
			class:text-white={true}
		>
			<div class="flex flex-col items-center justify-center">
				{#if notificationType === 'success'}
					<svg class="mb-3 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{:else}
					<svg class="mb-3 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{/if}
				<span class="text-xl font-medium">{notificationMessage}</span>
			</div>
		</div>
		<div class="bg-opacity-50 fixed inset-0 z-40 bg-black"></div>
	{/if}

	<div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
		<h1 class="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Daftar Dokumen</h1>

		<div class="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
			<!-- Search Box -->
			<div class="flex">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari dokumen..."
					class="rounded-l-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
				/>
				<button
					on:click={handleSearch}
					class="rounded-r-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</button>
			</div>
			<!-- Add New Button -->
			<a
				href="/documents/add"
				class="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-1 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Upload Dokumen Baru
			</a>
		</div>
	</div>

	<!-- Status Message -->
	{#if data.error}
		<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
			<p class="font-bold">Error</p>
			<p>{data.error}</p>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="mb-6 border-b border-gray-200 overflow-x-auto">
		<ul class="-mb-px flex flex-nowrap text-center text-sm font-medium">
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'all')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-gray-600={activeTab === 'all'}
					class:text-gray-600={activeTab === 'all'}
					class:border-transparent={activeTab !== 'all'}
					class:hover:text-gray-600={activeTab !== 'all'}
					class:hover:border-gray-300={activeTab !== 'all'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						></path>
					</svg>
					Semua ({data.documents?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'sop')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-blue-600={activeTab === 'sop'}
					class:text-blue-600={activeTab === 'sop'}
					class:border-transparent={activeTab !== 'sop'}
					class:hover:text-gray-600={activeTab !== 'sop'}
					class:hover:border-gray-300={activeTab !== 'sop'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					SOP Departemen ({data.sopDocuments?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'sop-general')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-cyan-600={activeTab === 'sop-general'}
					class:text-cyan-600={activeTab === 'sop-general'}
					class:border-transparent={activeTab !== 'sop-general'}
					class:hover:text-gray-600={activeTab !== 'sop-general'}
					class:hover:border-gray-300={activeTab !== 'sop-general'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					SOP General ({data.sopGeneralDocuments?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'work-instruction')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-purple-600={activeTab === 'work-instruction'}
					class:text-purple-600={activeTab === 'work-instruction'}
					class:border-transparent={activeTab !== 'work-instruction'}
					class:hover:text-gray-600={activeTab !== 'work-instruction'}
					class:hover:border-gray-300={activeTab !== 'work-instruction'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
						></path>
					</svg>
					Work Instruction ({data.workInstructionDocuments?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'pp')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-yellow-600={activeTab === 'pp'}
					class:text-yellow-600={activeTab === 'pp'}
					class:border-transparent={activeTab !== 'pp'}
					class:hover:text-gray-600={activeTab !== 'pp'}
					class:hover:border-gray-300={activeTab !== 'pp'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
						></path>
					</svg>
					PP ({data.ppDocuments?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'kebijakan')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-indigo-600={activeTab === 'kebijakan'}
					class:text-indigo-600={activeTab === 'kebijakan'}
					class:border-transparent={activeTab !== 'kebijakan'}
					class:hover:text-gray-600={activeTab !== 'kebijakan'}
					class:hover:border-gray-300={activeTab !== 'kebijakan'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
						></path>
					</svg>
					Kebijakan ({data.kebijakanDocuments?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'active')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-green-600={activeTab === 'active'}
					class:text-green-600={activeTab === 'active'}
					class:border-transparent={activeTab !== 'active'}
					class:hover:text-gray-600={activeTab !== 'active'}
					class:hover:border-gray-300={activeTab !== 'active'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					Active ({data.activeDocuments?.length || 0})
				</button>
			</li>
			<li>
				<button
					on:click={() => (activeTab = 'inactive')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4 whitespace-nowrap"
					class:border-red-600={activeTab === 'inactive'}
					class:text-red-600={activeTab === 'inactive'}
					class:border-transparent={activeTab !== 'inactive'}
					class:hover:text-gray-600={activeTab !== 'inactive'}
					class:hover:border-gray-300={activeTab !== 'inactive'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					Inactive ({data.inactiveDocuments?.length || 0})
				</button>
			</li>
		</ul>
	</div>

	<!-- Document List Table -->
	<div class="overflow-hidden rounded-lg bg-white shadow-md">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Judul Dokumen
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Kategori
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Dibuat Oleh
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Download
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Aksi
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if displayDocuments && displayDocuments.length > 0}
					{#each displayDocuments as document}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium font-bold text-gray-900">{document.title}</div>
								<div class="text-sm text-gray-600 font-bold">{document.code}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getCategoryBadgeClass(
										document.category
									)}"
								>
									{document.category}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{document.created_by}</div>
								<div class="text-xs text-gray-500">{formatDate(document.date_created)}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusBadgeClass(
										document.status
									)}"
								>
									{document.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if document.downloadUrl}
									<a 
										href={document.downloadUrl} 
										download={document.fileName}
										class="inline-flex items-center text-blue-600 hover:text-blue-900"
										title="Download {document.fileName}"
									>
										<svg 
											xmlns="http://www.w3.org/2000/svg" 
											class="h-5 w-5" 
											fill="none" 
											viewBox="0 0 24 24" 
											stroke="currentColor"
										>
											<path 
												stroke-linecap="round" 
												stroke-linejoin="round" 
												stroke-width="2" 
												d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</a>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
								<div class="flex space-x-2">
									<a
										href={`/documents/list/${document.id}`}
										rel="noopener noreferrer"
										class="font-medium text-indigo-600 hover:text-indigo-900"
									>
										View
									</a>
									<button
										class="font-medium text-red-600 hover:text-red-900"
										on:click={() => confirmDelete(document.id, document.title)}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="6" class="px-6 py-8 text-center text-gray-500">
							<p class="text-lg">Tidak ada dokumen ditemukan.</p>
							<p class="mt-1 text-sm">
								{#if searchQuery}
									Tidak ada dokumen yang cocok dengan pencarian "{searchQuery}".
									<button class="text-blue-600 underline" on:click={() => { searchQuery = ''; handleSearch(); }}>Reset pencarian</button>
								{:else if activeTab !== 'all'}
									Tidak ada dokumen dengan kategori ini.
									<button
										class="text-blue-600 underline"
										on:click={() => (activeTab = 'all')}>Lihat semua dokumen</button>
								{:else}
									Belum ada dokumen yang diunggah.
									<a href="/documents/add" class="text-blue-600 underline">Upload dokumen baru</a>
								{/if}
							</p>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirmModal}
		<div class="bg-opacity-50 fixed inset-0 z-40 flex items-center justify-center bg-black p-4">
			<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
				<div class="p-6">
					<h3 class="mb-4 text-lg font-medium text-gray-900">Konfirmasi Hapus</h3>
					<p class="mb-6 text-sm text-gray-600">
						Apakah Anda yakin ingin menghapus dokumen "{selectedDocumentTitle}"? Tindakan ini tidak
						dapat dibatalkan dan akan menghapus dokumen secara permanen.
					</p>

					<form method="POST" action="?/deleteDocument" use:enhance={handleDeleteEnhance}>
						<input type="hidden" name="id" value={selectedDocumentId} />

						<div class="flex justify-end space-x-3">
							<button
								type="button"
								on:click={() => (showDeleteConfirmModal = false)}
								class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
							>
								Batal
							</button>
							<button
								type="submit"
								class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
							>
								Hapus
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out forwards;
	}
</style>
