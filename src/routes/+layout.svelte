<script>
  import { page } from '$app/stores';
  import Header from '$lib/component/Header.svelte';
  import Sidebar from '$lib/component/Sidebar.svelte';
  
  $: isLoginPage = $page.route.id === '/login';
</script>

{#if isLoginPage}
  <!-- Login page without layout -->
  <slot />
{:else}
  <!-- Dashboard layout for other pages -->
  <div class="dashboard-layout">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="page-content">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
.dashboard-layout {
  display: flex;
  height: 100vh;
  font-family: sans-serif;
  background-color: #F9FFF9;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #F9FFF9;
}

.page-content {
  padding: 1rem;
  overflow-y: auto;
  height: calc(100vh - 64px); /* assuming header is 64px */
  background-color: #F9FFF9;
}
</style>