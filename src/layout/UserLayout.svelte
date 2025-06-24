<script>
  import UserHeader from '../lib/component/UserHeader.svelte';
  import Footer from '../lib/component/Footer.svelte';
</script>

<div class="flex flex-col min-h-screen">
  <UserHeader />

  <main class="flex-1 bg-gray-100 py-6">
    <slot />
  </main>

  <Footer />
</div>