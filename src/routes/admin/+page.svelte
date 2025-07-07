<!-- This page should never be reached as it redirects to dashboard -->
<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('/dashboard');
  });
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full border-b-2 border-blue-600 h-8 w-8 mx-auto"></div>
    <p class="mt-4 text-gray-600">Redirecting to dashboard...</p>
  </div>
</div>
