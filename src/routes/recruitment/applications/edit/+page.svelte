<script>
    export let data;
    let job = data.jobPosting;

    let title = job.title;
    let department = job.department;
    let requirements = Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '';
    let deadline = job.deadline?.slice(0, 16) || '';
    let description = job.description;
    let location = job.location;

    let error = data.form?.error;
    let success = data.form?.success;
</script>

<div class="container mx-auto max-w-xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold">Edit Job Posting</h1>

    {#if error}
        <div class="mb-4 rounded bg-red-100 px-4 py-2 text-red-700">{error}</div>
    {/if}
    {#if success}
        <div class="mb-4 rounded bg-green-100 px-4 py-2 text-green-700">{success}</div>
    {/if}

    <form method="POST" class="space-y-6">
        <div>
            <label class="block text-sm font-medium text-gray-700">Title</label>
            <input name="title" bind:value={title} class="mt-1 w-full rounded border px-3 py-2" required />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Department</label>
            <input name="department" bind:value={department} class="mt-1 w-full rounded border px-3 py-2" required />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Requirements</label>
            <textarea name="requirements" bind:value={requirements} rows="4" class="mt-1 w-full rounded border px-3 py-2"></textarea>
            <small class="text-gray-500">Pisahkan setiap requirement dengan baris baru.</small>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Deadline</label>
            <input type="datetime-local" name="deadline" bind:value={deadline} class="mt-1 w-full rounded border px-3 py-2" required />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" bind:value={description} rows="3" class="mt-1 w-full rounded border px-3 py-2"></textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Location</label>
            <input name="location" bind:value={location} class="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div class="flex items-center justify-between">
            <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition">
                Save Changes
            </button>
            <a href="/recruitment/applications?jobId={job.id}" class="text-sm text-gray-600 hover:underline">
                Cancel
            </a>
        </div>
    </form>
</div>