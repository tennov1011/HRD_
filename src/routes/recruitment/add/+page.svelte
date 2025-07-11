<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Form values (pre-fill if form data exists from a failed submit)
	let title = form?.data?.title || '';
	let department = form?.data?.department || '';
	let description = form?.data?.description || '';
	let requirements = form?.data?.requirements || '';
	let deadline = form?.data?.deadline || '';
	let location = form?.data?.location || '';

	// Set minimum date for deadline to today
	let minDate;

	onMount(() => {
		// Set minimum date to today
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		minDate = `${year}-${month}-${day}`;

		if (!deadline) {
			deadline = minDate;
		}
	});
</script>

<svelte:head>
	<title>Add Job Posting</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center">
		<a href="/recruitment" class="mr-4 text-gray-500 hover:text-gray-700">
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
		<h1 class="text-2xl font-bold">Add New Job Posting</h1>
	</div>

	<!-- Status Message -->
	{#if form?.error}
		<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
			<p class="font-bold">Error</p>
			<p>{form.error}</p>
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg bg-white shadow-md">
		<form method="POST" action="?/create" use:enhance class="space-y-6 p-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div>
					<label for="title" class="mb-1 block text-sm font-medium text-gray-700">Job Title</label>
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
					<label for="department" class="mb-1 block text-sm font-medium text-gray-700"
						>Department</label
					>
					<input
						type="text"
						id="department"
						name="department"
						bind:value={department}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>

				<div>
					<label for="location" class="mb-1 block text-sm font-medium text-gray-700"
						>Job Location</label
					>
					<input
						type="text"
						id="location"
						name="location"
						bind:value={location}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<label for="description" class="mb-1 block text-sm font-medium text-gray-700"
					>Job Description</label
				>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="4"
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
				></textarea>
			</div>

			<div>
				<label for="requirements" class="mb-1 block text-sm font-medium text-gray-700"
					>Requirements (one per line)</label
				>
				<textarea
					id="requirements"
					name="requirements"
					bind:value={requirements}
					rows="5"
					required
					placeholder="- Bachelor's degree in relevant field&#10;- 2+ years experience in...&#10;- Strong communication skills"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
				></textarea>
			</div>

			<div>
				<label for="deadline" class="mb-1 block text-sm font-medium text-gray-700"
					>Application Deadline</label
				>
				<input
					type="date"
					id="deadline"
					name="deadline"
					bind:value={deadline}
					min={minDate}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
				/>
			</div>

			<div class="flex justify-end space-x-3">
				<a
					href="/recruitment"
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Create Job Posting
				</button>
			</div>
		</form>
	</div>
</div>
