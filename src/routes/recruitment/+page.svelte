<script>
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  
  // Import the date formatter utility
  import { formatDate } from '$lib/utils/dateUtils';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  // Filter state
  let showActive = true;
  let jobPostings = [];
  
  $: {
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
  
  // Format requirements for display
  function formatRequirements(requirements) {
    if (typeof requirements === 'string') {
        // Jika requirements adalah string, split berdasarkan newline
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
  <title>Recruitment - Job Postings</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Job Postings</h1>
    
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
          {showActive ? 'Active' : 'Inactive'} Jobs
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
        Add Job Posting
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
            Deadline
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Applicants
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#if jobPostings && jobPostings.length > 0}
          {#each jobPostings as job}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{job.title}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{job.department}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{formatDate(job.deadline)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {getApplicantCount(job.applications)} applicants
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <a href={`/recruitment/applications?jobId=${job.id}`} class="text-indigo-600 hover:text-indigo-900">
                    View
                  </a>
                  <button 
                    class="text-red-600 hover:text-red-900" 
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
                  All current job postings have expired. <button class="text-blue-600 underline" on:click={() => showActive = false}>View inactive jobs</button>
                {:else}
                  There are no inactive job postings. <button class="text-blue-600 underline" on:click={() => showActive = true}>View active jobs</button>
                {/if}
              </p>
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
  
  <!-- No modal needed as we now have a dedicated add page -->
  
  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirmModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p class="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this job posting? This action cannot be undone and will remove all associated applications.
          </p>
          
          <form method="POST" action="?/delete">
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
