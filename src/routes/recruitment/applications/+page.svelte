<script>
	import { formatDate } from '$lib/utils/dateUtils';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	$: selectedJob = data.selectedJob;
	$: applications = data.applications || [];
	$: jobPostings = data.jobPostings || [];
	$: applicant = data.applicant;

	// Function to map database fields to expected format
	function mapApplicantData(dbData) {
		if (!dbData) return null;

		return {
			id: dbData.id,
			jobId: dbData.appliedJobId
		};
	}

	// Map applications array
	$: mappedApplications = applications.map(mapApplicantData);
	$: mappedApplicant = mapApplicantData(applicant);

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
</script>

<svelte:head>
	<title>Job Applications</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	{#if !selectedJob}
		<!-- Job Selection Screen -->
		<div>
			<h1 class="mb-6 text-2xl font-bold">Select a Job Posting</h1>

			{#if jobPostings.length === 0}
				<div class="rounded-lg bg-gray-50 p-6 text-center shadow-sm">
					<p class="text-gray-500">No job postings found.</p>
					<a href="/recruitment" class="mt-2 inline-block text-blue-600 hover:underline">
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
							<h3 class="mb-2 text-lg font-medium text-gray-900">{job.title}</h3>
							<p class="mb-2 text-sm text-gray-500">Department: {job.department}</p>
							<p class="mb-4 text-sm text-gray-500">Deadline: {formatDate(job.deadline)}</p>

							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-blue-600">
									{job.applications?.length || 0} applicants
								</span>
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
								>
									View Applications
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{:else if mappedApplicant}
		<!-- Single Applicant View -->
		<div>
			<!-- Header with navigation -->
			<div class="mb-8 flex items-center">
				<a
					href={`/recruitment/applications?jobId=${selectedJob.id}`}
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
				<h1 class="text-2xl font-bold">{mappedApplicant.fullName} - {selectedJob.title}</h1>
			</div>
		</div>
	{:else}
		<!-- Job Applications View -->
		<div>
			<!-- Header with navigation -->
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
				<h1 class="text-2xl font-bold">Applications: {selectedJob.title}</h1>
			</div>

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
					<dl class="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
						<div>
							<dt class="text-sm font-medium text-gray-500">Title</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.title}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Department</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.department}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Job Location</dt>
							<dd class="mt-1 text-sm text-gray-900">{selectedJob.location || 'Not specified'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Application Deadline</dt>
							<dd class="mt-1 text-sm text-gray-900">{formatDate(selectedJob.deadline, 'long')}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-gray-500">Date Posted</dt>
							<dd class="mt-1 text-sm text-gray-900">
								{formatDate(selectedJob.date_created, 'long')}
							</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-sm font-medium text-gray-500">Description</dt>
							<dd class="mt-1 text-sm whitespace-pre-wrap text-gray-900">
								{selectedJob.description}
							</dd>
						</div>
						<div class="md:col-span-2">
							<dt class="text-sm font-medium text-gray-500">Requirements</dt>
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
					</dl>
				</div>
			</div>
		</div>
	{/if}
</div>
