<script>
  import Header from '../lib/component/Header.svelte';
  import Footer from '../lib/component/Footer.svelte';
</script>

<div class="flex h-screen overflow-hidden">

  <!-- Main Content -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <Header />
    <main class="p-6 bg-gray-100 overflow-auto">
      <slot />
    </main>
    <Footer />
  </div>
</div>