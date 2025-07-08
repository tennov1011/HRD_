<script>
  import { page } from '$app/stores';
  
  const navItems = [
    { href: '/masterdata', label: 'Semua Data', exact: true },
    { href: '/masterdata/divisi', label: 'Tambah Divisi' },
    { href: '/masterdata/jabatan', label: 'Tambah Jabatan' },
    { href: '/masterdata/lokasi-absen', label: 'Tambah Lokasi' },
    { href: '/masterdata/shift', label: 'Tambah Shift' }
  ];
  
  /**
   * Function untuk check active state
   * @param {string} currentPath - Current page path
   * @param {string} href - Target href to check
   * @param {boolean} exact - Whether to use exact matching
   * @returns {boolean} Whether the path is active
   */
  function isActiveTab(currentPath, href, exact = false) {
    if (!currentPath || !href) return false;
    
    // Normalize paths
    const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
    
    const isActive = exact 
      ? normalizedCurrentPath === normalizedHref
      : normalizedCurrentPath === normalizedHref;
    
    // Debug log
    console.log(`Checking ${href} against ${currentPath}: ${isActive}`);
    
    return isActive;
  }
  
  // Debug: reactive statement untuk track perubahan
  $: {
    console.log('Current path changed:', $page.url.pathname);
  }
</script>

<style>
  /* Hide scrollbar untuk nav yang overflow */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Smooth scroll untuk nav */
  nav {
    scroll-behavior: smooth;
  }
</style>

<div class="bg-gray-50 min-h-screen">
  <!-- Navigation Tabs -->
  <!-- <div class="bg-white shadow-sm border-b sticky top-0 z-10">
    <div class="container mx-auto px-4">
      <nav class="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
        {#key $page.url.pathname}
          {#each navItems as item}
            <a
              href={item.href}
              data-sveltekit-preload-data="hover"
              class="py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-150 flex-shrink-0 {
                isActiveTab($page.url.pathname, item.href, item.exact)
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
              }"
            >
              {item.label}
            </a>
          {/each}
        {/key}
      </nav>
    </div>
  </div> -->

  <!-- Page Content -->
  <main>
    <slot />
  </main>
</div>
