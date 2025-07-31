<script>
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  
  // Import the date formatter utility
  import { formatDate } from '$lib/utils/dateUtils';
  
  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;
  
  // Filter state
  let showActive = true;
  let jobPostings = [];
  
  $: {
    
    // Debug applicant count untuk setiap job
    if (data.jobPostings) {
        data.jobPostings.forEach(job => {
            console.log(`Client - Job ${job.id} (${job.title}): ${job.applicantCount} applicants`);
        });
    }
    
    // Update job postings based on filter
    if (showActive) {
        jobPostings = data.activeJobPostings;
    } else {
        jobPostings = data.inactiveJobPostings;
    }
  }
  
  // Modal states
  let showDeleteConfirmModal = false;
  let selectedJobId = null;
  
  // Show delete confirmation modal
  function confirmDelete(id) {
    selectedJobId = id;
    showDeleteConfirmModal = true;
  }
  
  // Check if job is expired by deadline
  function isExpiredByDeadline(deadline) {
    return new Date(deadline) <= new Date();
  }
  
  // Get effective status berdasarkan status field dan deadline
  function getEffectiveStatus(job) {
    // Sekarang status dalam database sudah terupdate otomatis untuk job yang expired
    // Jadi kita hanya perlu mengecek field status dari database
    if (job.status === 'inactive') {
      return 'inactive';
    }
    
    // Untuk job yang masih active, cek deadline sebagai backup
    if (isExpiredByDeadline(job.deadline)) {
      return 'expired';
    }
    
    // Default ke active
    return 'active';
  }
  
  // Format requirements for display
  function formatRequirements(requirements) {
    if (typeof requirements === 'string') {
        return requirements
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }
    if (Array.isArray(requirements)) {
        return requirements.filter(item => item && item.trim().length > 0);
    }
    return [];
  }
  
  // Count applicants
  function getApplicantCount(applications) {
    if (Array.isArray(applications)) {
      return applications.length;
    }
    return 0;
  }

  // Handle status toggle
  async function handleStatusToggle(jobId, currentStatus) {
    // Buat form dan submit
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '?/toggleStatus';
    
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.name = 'id';
    idInput.value = jobId;
    
    const statusInput = document.createElement('input');
    statusInput.type = 'hidden';
    statusInput.name = 'currentStatus';
    statusInput.value = currentStatus;
    
    form.appendChild(idInput);
    form.appendChild(statusInput);
    document.body.appendChild(form);
    
    form.submit();
  }
</script>

<svelte:head>
  <title>Daftar Lowongan Pekerjaan</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Lowongan </h1>
    
    <div class="flex items-center space-x-4">
      <!-- Filter Toggle -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">Show:</span>
        <div class="relative inline-block w-10 mr-2 align-middle select-none">
          <input 
            type="checkbox" 
            id="toggle" 
            bind:checked={showActive}
            class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
          />
          <label 
            for="toggle" 
            class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
          ></label>
        </div>
        <span class="text-sm font-medium {showActive ? 'text-green-600' : 'text-gray-500'}">
          {showActive ? 'Active' : 'Expired'} Jobs
        </span>
      </div>
      
      <!-- Add New Button -->
      <a 
        href="/recruitment/add"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Lowongan Baru
      </a>
    </div>
  </div>
  
  <!-- Status Message -->
  {#if data.status === 'error'}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
      <p class="font-bold">Error</p>
      <p>{data.error || 'Failed to load job postings.'}</p>
    </div>
  {/if}

  <!-- Error Message -->
  {#if form?.status === 'error'}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
      <p class="font-bold">Error</p>
      <p>{form.message}</p>
    </div>
  {/if}
  
  <!-- Job Postings Table -->
  <div class="bg-white shadow-md rounded-lg overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Title
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Department
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Deadline
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#if jobPostings && jobPostings.length > 0}
          {#each jobPostings as job}
            {@const effectiveStatus = getEffectiveStatus(job)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{job.title}</div>
                <div class="text-sm text-gray-500">{job.salary || 'Salary not specified'}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{job.department}</div>
                <div class="text-sm text-gray-400">{job.location || 'Location not specified'}</div>
                <!-- Tampilkan jumlah pelamar -->
                <div class="text-xs text-blue-600 font-medium mt-1">
                  {job.applicantCount || 0} pelamar
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {#if effectiveStatus === 'expired'}
                  <!-- Status expired (deadline lewat) - tidak bisa diubah -->
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Expired
                  </span>
                {:else}
                  <!-- Toggle button untuk status active/inactive -->
                  <form method="POST" action="?/toggleStatus" use:enhance class="inline">
                    <input type="hidden" name="id" value={job.id} />
                    <input type="hidden" name="currentStatus" value={job.status || 'active'} />
                    
                    <button 
                      type="submit"
                      class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 hover:shadow-md
                        {(job.status || 'active') === 'active' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'}"
                      title="Klik untuk mengubah status"
                    >
                      <span class="w-2 h-2 rounded-full mr-2 
                        {(job.status || 'active') === 'active' ? 'bg-green-500' : 'bg-red-500'}">
                      </span>
                      {(job.status || 'active') === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </button>
                  </form>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{formatDate(job.deadline)}</div>
                {#if isExpiredByDeadline(job.deadline)}
                  <div class="text-xs text-red-500">Deadline passed</div>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <a 
                    href={`/recruitment/applications?jobId=${job.id}`} 
                    class="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View
                  </a>
                  <button 
                    class="text-red-600 hover:text-red-900 font-medium" 
                    on:click={() => confirmDelete(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
              <p class="text-lg">No job postings found.</p>
              <p class="text-sm mt-1">
                {#if showActive}
                  All current job postings have expired. <button class="text-blue-600 underline" on:click={() => showActive = false}>View expired jobs</button>
                {:else}
                  There are no expired job postings. <button class="text-blue-600 underline" on:click={() => showActive = true}>View active jobs</button>
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
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p class="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this job posting? This action cannot be undone and will remove all associated applications.
          </p>
          
          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="id" value={selectedJobId} />
            
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                on:click={() => showDeleteConfirmModal = false} 
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .toggle-checkbox:checked {
    right: 0;
    border-color: #68D391;
  }
  .toggle-checkbox:checked + .toggle-label {
    background-color: #68D391;
  }
  .toggle-label {
    transition: background-color 0.3s ease;
  }
  .toggle-checkbox {
    transition: all 0.3s ease;
    right: 4px;
    z-index: 1;
  }
</style>
