<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Form values (pre-fill if form data exists from a failed submit)
	let title = form?.data?.title || '';
	let status = form?.data?.status || 'Active';
	let description = form?.data?.description || '';
	let created_by = form?.data?.created_by || '';
	let department = form?.data?.department || '';
	let category = form?.data?.category || '';
	/** @type {FileList | null} */
	let file = null;

	// List of document categories
	const categories = [
		{ value: 'SOP Departemen', label: 'SOP Departemen' },
		{ value: 'SOP General', label: 'SOP General' },
		{ value: 'PP', label: 'PP (Peraturan Perusahaan)' },
		{ value: 'Kebijakan', label: 'Kebijakan' },
		{ value: 'Work Instruction', label: 'Work Instruction' }
	];

	// Allowed file extensions
	const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
</script>

<svelte:head>
	<title>Tambah Dokumen</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center">
		<h1 class="text-2xl font-bold">Tambah Dokumen</h1>
	</div>

	<!-- Status Message -->
	{#if form?.error}
		<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
			<p class="font-bold">Error</p>
			<p>{form.error}</p>
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg bg-white shadow-md">
		<form method="POST" action="?/create" use:enhance enctype="multipart/form-data" class="space-y-6 p-6">
			<!-- Row 1: Basic Info -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div>
					<label for="title" class="mb-1 block text-sm font-medium text-gray-700">Judul Dokumen *</label>
					<input
						type="text"
						id="title"
						name="title"
						bind:value={title}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>

				<div>
					<label for="status" class="mb-1 block text-sm font-medium text-gray-700">Status *</label>
					<select
						id="status"
						name="status"
						bind:value={status}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					>
						<option value="Active" class="bg-green-100 text-green-800">Active</option>
						<option value="Inactive" class="bg-red-100 text-red-800">Inactive</option>
					</select>
				</div>

				<div>
					<label for="created_by" class="mb-1 block text-sm font-medium text-gray-700">Pembuat Dokumen *</label>
					<input
						type="text"
						id="created_by"
						name="created_by"
						bind:value={created_by}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>

			<!-- Row 2: Document Details -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<label for="department" class="mb-1 block text-sm font-medium text-gray-700">Departemen *</label>
					<select
						id="department"
						name="department"
						bind:value={department}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					>
						<option value="" disabled selected>Pilih departemen</option>
						{#each data.departments ?? [] as dept}
							<option value={dept.value}>{dept.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="category" class="mb-1 block text-sm font-medium text-gray-700">Kategori Dokumen *</label>
					<select
						id="category"
						name="category"
						bind:value={category}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					>
						<option value="" disabled selected>Pilih kategori</option>
						{#each categories as cat}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="mb-1 block text-sm font-medium text-gray-700">Deskripsi Dokumen *</label>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="4"
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
				></textarea>
			</div>

			<!-- File Upload -->
			<div>
				<label for="file" class="mb-1 block text-sm font-medium text-gray-700">Upload Dokumen *</label>
				<input
					type="file"
					id="file"
					name="file"
					bind:files={file}
					required
					accept={allowedExtensions.join(',')}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
				/>
				<p class="mt-1 text-xs text-gray-500">
					Format yang didukung: {allowedExtensions.join(', ')}
				</p>
			</div>

			<!-- Code Preview -->
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-700">Kode Dokumen</label>
				<div class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm">
					Kode akan di-generate otomatis setelah dokumen disimpan (format: DOC-{category || '[KATEGORI]'}-[ID])
				</div>
			</div>

			<div class="flex justify-end space-x-3">
				<a
					href="/documents"
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
				>
					Batal
				</a>
				<button
					type="submit"
					class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Simpan Dokumen
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="ml-2 inline-block h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</button>
			</div>
		</form>
	</div>
</div>
