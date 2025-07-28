<script>
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	// Format date for display
	function formatDate(dateString) {
		if (!dateString) return '-';

		try {
			const date = new Date(dateString);
			return date.toLocaleString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('Error formatting date:', error);
			return dateString;
		}
	}

	// Format status badge
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

	// Format category badge
	function getCategoryBadgeClass(category) {
		switch (category) {
			case 'SOP':
				return 'bg-blue-100 text-blue-800';
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

	$: document = data.document || {};
</script>

<svelte:head>
	<title>{document.title || 'Document Detail'} - HRD System</title>
</svelte:head>

<div class="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-6 flex items-center">
		<a href="/documents/list" class="mr-4 text-gray-500 hover:text-gray-700">
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
		<h1 class="text-2xl font-bold">Detail Dokumen</h1>
	</div>

	{#if data.error}
		<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
			<p class="font-bold">Error</p>
			<p>{data.error}</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg bg-white shadow-md">
			<!-- Document Header -->
			<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
				<div class="flex flex-wrap items-center justify-between">
					<div class="mb-2 md:mb-0">
						<h2 class="text-xl font-semibold text-gray-800">{document.title}</h2>
						<p class="text-sm text-gray-600">{document.description}</p>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusBadgeClass(
								document.status
							)}"
						>
							{document.status}
						</span>
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getCategoryBadgeClass(
								document.category
							)}"
						>
							{document.category}
						</span>
						<a
							href={document.file_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Buka Dokumen
						</a>
					</div>
				</div>
			</div>
			<!-- PDF Viewer -->
			<div class="p-6">
				<iframe
					src={document.file_url}
					class="w-full h-[600px] border border-gray-300 rounded-md"
					allowfullscreen
				></iframe>
			</div>

			<!-- Document Details -->
			<div class="p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Left Column -->
					<div class="space-y-6">
						<div>
							<h3 class="mb-2 text-lg font-medium text-gray-900">Informasi Dokumen</h3>
							<div class="overflow-hidden rounded-lg border border-gray-200">
								<table class="min-w-full divide-y divide-gray-200">
									<tbody class="divide-y divide-gray-200">
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Kode Dokumen
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.code || '-'}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Judul
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.title}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Deskripsi
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.description}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Kategori
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.category}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Status
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.status}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												URL Dokumen
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">
												<a
													href={document.file}
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-600 hover:underline"
												>
													{document.file_url}
												</a>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<!-- Right Column -->
					<div class="space-y-6">
						<div>
							<h3 class="mb-2 text-lg font-medium text-gray-900">Metadata</h3>
							<div class="overflow-hidden rounded-lg border border-gray-200">
								<table class="min-w-full divide-y divide-gray-200">
									<tbody class="divide-y divide-gray-200">
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Dibuat Oleh
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.created_by}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Departemen
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">{document.department}</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Tanggal Dibuat
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">
												{formatDate(document.date_created)}
											</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Tanggal Diubah
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">
												{document.date_updated ? formatDate(document.date_updated) : '-'}
											</td>
										</tr>
										<tr>
											<td class="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
												Diubah Oleh
											</td>
											<td class="px-4 py-2 text-sm text-gray-900">
												{document.user_updated || '-'}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-8 flex justify-end space-x-3">
					<a
						href="/documents/list"
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
					>
						Kembali
					</a>
					<a
						href={`/documents/list/edit/${document.id}`}
						class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					>
						Edit Dokumen
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
