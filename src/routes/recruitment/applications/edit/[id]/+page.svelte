<script>
    import { enhance } from '$app/forms';
    export let data;
    let job = data.jobPosting;
    let masterData = data.masterData;

    let title = job?.title ?? '';
    let department = job?.department ?? '';
    let requirements = Array.isArray(job?.requirements) 
        ? job.requirements.join('\n') 
        : job?.requirements ?? '';
    let deadline = job?.deadline 
        ? new Date(job.deadline).toISOString().slice(0, 16) 
        : '';
    let description = job?.description ?? '';
    let location = job?.location ?? '';
    let salary = job?.salary ?? '';
    let employment_type = job?.employment_type ?? '';
    let min_education = job?.min_education ?? '';
    let experience = job?.experience ?? '';

    let error = data?.form?.error || data?.error;
    let success = data?.form?.success;

    let showNotif = false;
    let notifMsg = '';
    let notifType = '';

    $: if (success) {
        notifMsg = success;
        notifType = 'success';
        showNotif = true;
        setTimeout(() => showNotif = false, 3000);
    }
    $: if (error) {
        notifMsg = error;
        notifType = 'error';
        showNotif = true;
        setTimeout(() => showNotif = false, 3000);
    }

    /** @type {import('./$types').ActionData} */
    export let form;
    
    function handleSubmit(event) {
        const formEl = event.target;
        if (!formEl.checkValidity()) {
            formEl.reportValidity();
            event.preventDefault();
            return;
        }
        
        // Log form data sebelum submit
        const formData = new FormData(formEl);
        console.log('Submitting form data:', Object.fromEntries(formData));
    }

    /** @type {import('./$types').SubmitFunction} */
    const enhanceForm = () => {
        return async ({ result, update }) => {
            console.log('Form submission result:', result);
            
            if (result.type === 'redirect') {
                // Update berhasil, akan redirect
                notifMsg = 'Job posting updated successfully';
                notifType = 'success';
                showNotif = true;
                
                // Biarkan SvelteKit handle redirect
                setTimeout(() => {
                    window.location.href = result.location || '/recruitment';
                }, 1000);
            } else if (result.type === 'failure') {
                // Show error notification
                notifMsg = result.data?.error || 'Failed to update job posting';
                notifType = 'error';
                showNotif = true;
            } else if (result.type === 'success') {
                // Backup success handler
                notifMsg = 'Job posting updated successfully';
                notifType = 'success';
                showNotif = true;
                
                setTimeout(() => {
                    window.location.href = '/recruitment';
                }, 1500);
            }
            
            await update();
        };
    };
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
    {#if showNotif}
        <div class="fixed top-6 left-1/2 z-50 -translate-x-1/2 px-6 py-3 rounded shadow-lg font-medium text-center"
            class:bg-green-600={notifType === 'success'}
            class:bg-red-600={notifType === 'error'}
            class:text-white={notifType === 'success' || notifType === 'error'}>
            {notifMsg}
        </div>
    {/if}

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Edit Job Posting</h1>
        <a href="/recruitment" class="text-gray-600 hover:text-gray-900">
            Back to List
        </a>
    </div>

    {#if error}
        <div class="mb-4 rounded bg-red-100 px-4 py-2 text-red-700">{error}</div>
    {/if}

    {#if job}
        <form 
            method="POST" 
            use:enhance={enhanceForm}
            on:submit|preventDefault={handleSubmit}
            class="space-y-8 bg-white rounded-lg shadow-sm p-8"
        >
            <!-- Row 1: Basic Info -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 mb-2">Lowongan *</label>
                    <input 
                        id="title"
                        name="title" 
                        bind:value={title} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        required 
                    />
                </div>
                <div>
                    <label for="department" class="block text-sm font-medium text-gray-700 mb-2">Departemen *</label>
                    <input 
                        id="department"
                        name="department" 
                        bind:value={department} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        required 
                    />
                </div>
                <div>
                    <label for="location" class="block text-sm font-medium text-gray-700 mb-2">Lokasi *</label>
                    <select 
                        id="location"
                        name="location" 
                        bind:value={location} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                    >
                        <option value="">Pilih Lokasi</option>
                        {#each masterData?.lokasi_absen || [] as loc}
                            <option value={loc.value}>{loc.label}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Row 2: Employment Details -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label for="salary" class="block text-sm font-medium text-gray-700 mb-2">Gaji *</label>
                    <input 
                        id="salary"
                        name="salary" 
                        bind:value={salary} 
                        placeholder="Rp 5.000.000 - 7.000.000"
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        required 
                    />
                </div>
                <div>
                    <label for="employment_type" class="block text-sm font-medium text-gray-700 mb-2">Tipe Pekerjaan *</label>
                    <select 
                        id="employment_type"
                        name="employment_type" 
                        bind:value={employment_type} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                    >
                        <option value="">Select employment type</option>
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Kontrak</option>
                        <option value="internship">Magang</option>
                        <option value="freelance">Freelance</option>
                    </select>
                </div>
                <div>
                    <label for="min_education" class="block text-sm font-medium text-gray-700 mb-2">Pendidikan Minimal *</label>
                    <select 
                        id="min_education"
                        name="min_education" 
                        bind:value={min_education} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                    >
                        <option value="">Select education</option>
                        <option value="sma">SMA/SMK</option>
                        <option value="diploma">Diploma (D3)</option>
                        <option value="sarjana">Sarjana (S1)</option>
                        <option value="magister">Magister (S2)</option>
                        <option value="doktor">Doktor (S3)</option>
                    </select>
                </div>
                <div>
                    <label for="experience" class="block text-sm font-medium text-gray-700 mb-2">Pengalaman *</label>
                    <select 
                        id="experience"
                        name="experience" 
                        bind:value={experience} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                    >
                        <option value="">Select experience</option>
                        <option value="fresh-graduate">Fresh Graduate</option>
                        <option value="1-2-years">1-2 Tahun</option>
                        <option value="3-5-years">3-5 Tahun</option>
                        <option value="5-plus-years">5+ Tahun</option>
                        <option value="10-plus-years">10+ Tahun</option>
                    </select>
                </div>
            </div>

            <!-- Row 3: Deadline -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <label for="deadline" class="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                    <input 
                        id="deadline"
                        type="datetime-local" 
                        name="deadline" 
                        bind:value={deadline} 
                        class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        required 
                    />
                </div>
                <div class="flex items-end">
                    <div class="text-sm text-gray-500">
                        <p class="font-medium">Format: YYYY-MM-DD HH:MM</p>
                        <p>Set waktu deadline dari lowongan</p>
                    </div>
                </div>
            </div>

            <!-- Requirements -->
            <div>
                <label for="requirements" class="block text-sm font-medium text-gray-700 mb-2">Kualifikasi *</label>
                <textarea 
                    id="requirements"
                    name="requirements" 
                    bind:value={requirements} 
                    rows="6"
                    class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                    required
                ></textarea>
                <small class="text-gray-500 mt-1 block">Pisahkan setiap requirement dengan baris baru</small>
            </div>

            <!-- Description -->
            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Deskripsi *</label>
                <textarea 
                    id="description"
                    name="description" 
                    bind:value={description} 
                    rows="6" 
                    class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                    required
                ></textarea>
                <small class="text-gray-500 mt-1 block">Provide detailed job description and responsibilities</small>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                <div class="flex space-x-4">
                    <button 
                        type="submit" 
                        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Save Changes
                    </button>
                    <a 
                        href="/recruitment/applications?jobId={job.id}" 
                        class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Cancel
                    </a>
                </div>
                <div class="text-sm text-gray-500">
                    <p>Last updated: {job.date_updated ? new Date(job.date_updated).toLocaleDateString() : 'Never'}</p>
                </div>
            </div>
        </form>
    {:else}
        <div class="rounded-lg bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-lg font-medium mb-2">Data job posting tidak ditemukan.</p>
            <p class="text-red-600 mb-4">Job posting dengan ID tersebut tidak dapat ditemukan atau telah dihapus.</p>
            <a 
                href="/recruitment" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Kembali ke halaman recruitment
            </a>
        </div>
    {/if}
</div>