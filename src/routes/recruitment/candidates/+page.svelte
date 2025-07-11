<script>
    /** @type {import('./$types').PageData} */
    export let data;
    
    // Destructure the data
    const { applicants, jobPostings, error } = data;
    
    // Search and filter functionality
    let searchQuery = '';
    let selectedJobId = '';
    let selectedStatus = '';
    let selectedSource = ''; // New filter for howDidYouHear
    let filteredApplicants = [];
    
    // Create a mapping of job IDs to job titles
    const jobTitleMap = new Map();
    if (jobPostings && jobPostings.length > 0) {
        jobPostings.forEach(job => {
            // Store with string ID for consistent comparison
            jobTitleMap.set(String(job.id), job.title);
        });
    }
    
    // Get unique sources (howDidYouHear) and count applicants per source
    $: sources = applicants && applicants.length > 0 
        ? [...new Set(applicants
            .filter(app => app.howDidYouHear)
            .map(app => app.howDidYouHear))]
        : [];
        
    // Count applicants per source
    $: sourceCounts = applicants && applicants.length > 0 
        ? applicants.reduce((acc, app) => {
            const source = app.howDidYouHear || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {})
        : {};
    
    // Function to get job title from job ID
    function getJobTitle(jobId) {
        if (!jobId) return 'Tidak ada posisi';
        
        // Convert jobId to string for consistent comparison
        const stringJobId = String(jobId);
        
        // Get title directly from Map - more efficient
        const title = jobTitleMap.get(stringJobId);
        
        // Return title if found, otherwise provide a better fallback
        return title || `Posisi tidak ditemukan (ID: ${jobId})`;
    }
    
    // Initialize filteredApplicants based on search query, selected job and status
    $: {
        if (applicants && applicants.length > 0) {
            // Filter by selected job if one is selected
            let filtered = applicants;
            if (selectedJobId) {
                filtered = filtered.filter(applicant => String(applicant.appliedJobId) === String(selectedJobId));
            }
            
            // Filter by status if one is selected
            if (selectedStatus) {
                filtered = filtered.filter(applicant => applicant.applicationStatus === selectedStatus);
            }
            
            // Filter by source if one is selected (new filter)
            if (selectedSource) {
                filtered = filtered.filter(applicant => applicant.howDidYouHear === selectedSource);
            }
            
            // Filter by search query
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(applicant => 
                    applicant.fullName && applicant.fullName.toLowerCase().includes(query)
                );
            }
            
            filteredApplicants = filtered;
        } else {
            filteredApplicants = [];
        }
    }
    
    // Handle search input change
    function handleSearchInput(event) {
        searchQuery = event.target.value;
    }
    
    // Handle job filter change
    function handleJobFilterChange(event) {
        selectedJobId = event.target.value;
    }
    
    // Handle status filter change
    function handleStatusFilterChange(event) {
        selectedStatus = event.target.value;
    }
    
    // Handle source filter change (new handler)
    function handleSourceFilterChange(event) {
        selectedSource = event.target.value;
    }
    
    // Function to format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Function to get status badge color
    function getStatusClass(status) {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'reviewed':
                return 'bg-blue-100 text-blue-800';
            case 'interview':
                return 'bg-purple-100 text-purple-800';
            case 'test':
                return 'bg-indigo-100 text-indigo-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
</script>

<div class="px-6 py-8 bg-white">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Daftar Pelamar</h1>
    
    {#if error}
        <div class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            <p>Terjadi kesalahan: {error}</p>
        </div>
    {/if}
    
    <!-- Search and Filters -->
    <div class="mb-6 flex flex-wrap gap-3">
        <div class="relative w-64">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
            </div>
            <input 
                type="text" 
                value={searchQuery}
                on:input={handleSearchInput}
                placeholder="Cari pelamar berdasarkan nama..." 
                class="pl-10 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
            {#if searchQuery}
                <button 
                    on:click={() => searchQuery = ''} 
                    class="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label="Hapus pencarian"
                >
                    <svg class="w-4 h-4 text-gray-500 hover:text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 12 12M1 13 13 1"/>
                    </svg>
                </button>
            {/if}
        </div>
        
        <select 
            class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedJobId}
            on:change={handleJobFilterChange}
        >
            <option value="">Lowongan</option>
            {#if jobPostings && jobPostings.length > 0}
                {#each jobPostings as job}
                    <option value={job.id}>{job.title}</option>
                {/each}
            {/if}
        </select>
        
        <select 
            class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedStatus}
            on:change={handleStatusFilterChange}
        >
            <option value="">Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="interview">Interview</option>
            <option value="test">Test</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
        </select>
        
        <!-- New source filter -->
        <select 
            class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedSource}
            on:change={handleSourceFilterChange}
        >
            <option value="">Platform</option>
            {#each sources as source}
                <option value={source}>{source} ({sourceCounts[source] || 0})</option>
            {/each}
        </select>
    </div>
    
    <!-- Display active filters and counts -->
    <div class="mb-4 flex items-center">
        <span class="text-sm text-gray-500">
            {filteredApplicants.length} pelamar 
            {#if selectedJobId || selectedStatus || selectedSource || searchQuery}
                ditemukan
                {#if selectedSource}
                    dari sumber "{selectedSource}"
                {/if}
            {/if}
        </span>
        
        <!-- Reset filters button when any filter is active -->
        {#if selectedJobId || selectedStatus || selectedSource || searchQuery}
            <button 
                on:click={() => {
                    selectedJobId = '';
                    selectedStatus = '';
                    selectedSource = '';
                    searchQuery = '';
                }} 
                class="ml-3 text-sm text-blue-600 hover:text-blue-800"
            >
                Reset Filter
            </button>
        {/if}
    </div>
    
    <!-- Applicants Table -->
    {#if filteredApplicants.length > 0}
        <div class="overflow-x-auto shadow-sm rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengalaman</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Melamar</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each filteredApplicants as applicant (applicant.id)}
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">{applicant.fullName}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-500">{applicant.email}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">
                                    {#if applicant.appliedJobId}
                                        {jobTitleMap.get(String(applicant.appliedJobId)) || 'Posisi tidak tersedia'}
                                    {:else}
                                        -
                                    {/if}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-500">
                                    {#if applicant.workExperienceYears}
                                        {applicant.workExperienceYears} tahun
                                    {:else}
                                        -
                                    {/if}
                                </div>
                            </td>
                            <!-- New column for Source -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-500">
                                    {applicant.howDidYouHear || '-'}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusClass(applicant.applicationStatus)}">
                                    {applicant.applicationStatus || 'pending'}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(applicant.date_created)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                {#if applicant.resumeFileUrl}
                                    <a href={applicant.resumeFileUrl} target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">
                                        Lihat CV
                                    </a>
                                {:else}
                                    <span class="text-gray-400">-</span>
                                {/if}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <a href="/recruitment/candidates/{applicant.id}" class="text-indigo-600 hover:text-indigo-900 mr-3">Detail</a>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div class="bg-white p-6 text-center border rounded-lg">
            {#if (searchQuery || selectedJobId || selectedStatus || selectedSource) && applicants && applicants.length > 0}
                <p class="text-gray-500">
                    Tidak ada pelamar ditemukan dengan filter yang dipilih.
                    {#if selectedSource}
                        <br>Sumber: "{selectedSource}"
                    {/if}
                    {#if selectedJobId}
                        <br>Posisi: "{jobPostings.find(j => j.id === selectedJobId)?.title || 'Tidak diketahui'}"
                    {/if}
                    {#if selectedStatus}
                        <br>Status: {selectedStatus}
                    {/if}
                    {#if searchQuery}
                        <br>Nama: "{searchQuery}"
                    {/if}
                </p>
            {:else}
                <p class="text-gray-500">Tidak ada data pelamar yang tersedia.</p>
            {/if}
        </div>
    {/if}
</div>
