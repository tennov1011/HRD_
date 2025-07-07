<script>
  export let data;
  
  const { masterData } = data;
  
  // Kolom untuk setiap kategori
  const columns = {
    divisi: ['Nama', 'Status', 'Aksi'],
    jabatan: ['Nama', 'Status', 'Aksi'],
    lokasi_absen: ['Nama', 'Alamat', 'Status', 'Aksi'],
    shift: ['Nama', 'Jam Masuk', 'Jam Keluar', 'Status', 'Aksi']
  };
  
  // Fungsi untuk mengambil nilai berdasarkan field
  function getFieldValue(item, field) {
    switch (field) {
      case 'Nama':
        return item.nama || '-';
      case 'Status':
        // Capitalize status: aktif -> Aktif, tidak_aktif -> Tidak Aktif
        const status = item.status || '-';
        if (status === 'aktif') return 'Aktif';
        if (status === 'tidak_aktif') return 'Tidak Aktif';
        return status;
      case 'Alamat':
        return item.alamat || '-';
      case 'Jam Masuk':
        return formatTimeDisplay(item.jam_masuk);
      case 'Jam Keluar':
        return formatTimeDisplay(item.jam_keluar);
      default:
        return '-';
    }
  }

  // Fungsi untuk format tampilan jam dari timestamp dengan WIB
  function formatTimeDisplay(timestamp) {
    if (!timestamp) return '-';
    
    try {
      // Jika timestamp dalam format YYYY-MM-DD HH:MM:SS+07:00 atau YYYY-MM-DD HH:MM:SS
      if (typeof timestamp === 'string') {
        // Hapus timezone offset jika ada (+07:00)
        const cleanTimestamp = timestamp.replace(/\+\d{2}:\d{2}$/, '');
        
        if (cleanTimestamp.includes(' ')) {
          const timePart = cleanTimestamp.split(' ')[1];
          if (timePart) {
            // Ambil HH:MM dari HH:MM:SS dan tambahkan WIB
            const timeFormatted = timePart.substring(0, 5);
            return `${timeFormatted} WIB`;
          }
        }
      }
      
      // Jika format lain, coba parse sebagai Date
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const timeFormatted = date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Jakarta'
        });
        return `${timeFormatted} WIB`;
      }
      
      return timestamp;
    } catch (error) {
      return timestamp || '-';
    }
  }

  // Fungsi untuk konfirmasi delete
  function confirmDelete(nama, kategori) {
    return confirm(`Apakah Anda yakin ingin menghapus ${kategori} "${nama}"?`);
  }
</script>

<svelte:head>
  <title>Master Data - HRD System</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Master Data</h1>

  <!-- Data Tables Section -->
  <div class="space-y-8">
    <!-- Divisi Table -->
    {#if masterData.divisi.length > 0}
      <div class="bg-blue-50 rounded-lg shadow-lg p-6 border border-blue-100">
        <div class="flex items-center mb-6">
          <div class="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-blue-800">Data Divisi</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-blue-50">
              <tr>
                {#each columns.divisi as column}
                  <th class="px-6 py-3 text-center text-xs font-medium text-blue-700 uppercase tracking-wider">
                    {column}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each masterData.divisi as item}
                <tr class="hover:bg-blue-50 transition-colors">
                  {#each columns.divisi as column}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {#if column === 'Aksi'}
                        <form method="POST" action="?/deleteDivisi" style="display: inline;">
                          <input type="hidden" name="id" value="{item.id}" />
                          <button 
                            type="submit" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            on:click={() => confirmDelete(item.nama, 'divisi')}
                          >
                            Hapus
                          </button>
                        </form>
                      {:else}
                        {getFieldValue(item, column)}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Jabatan Table -->
    {#if masterData.jabatan.length > 0}
      <div class="bg-green-50 rounded-lg shadow-lg p-6 border border-green-100">
        <div class="flex items-center mb-6">
          <div class="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-green-800">Data Jabatan</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-green-50">
              <tr>
                {#each columns.jabatan as column}
                  <th class="px-6 py-3 text-center text-xs font-medium text-green-700 uppercase tracking-wider">
                    {column}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each masterData.jabatan as item}
                <tr class="hover:bg-green-50 transition-colors">
                  {#each columns.jabatan as column}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {#if column === 'Aksi'}
                        <form method="POST" action="?/deleteJabatan" style="display: inline;">
                          <input type="hidden" name="id" value="{item.id}" />
                          <button 
                            type="submit" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            on:click={() => confirmDelete(item.nama, 'jabatan')}
                          >
                            Hapus
                          </button>
                        </form>
                      {:else}
                        {getFieldValue(item, column)}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Lokasi Absen Table -->
    {#if masterData.lokasi_absen.length > 0}
      <div class="bg-purple-50 rounded-lg shadow-lg p-6 border border-purple-100">
        <div class="flex items-center mb-6">
          <div class="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-purple-800">Data Lokasi Absen</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-purple-50">
              <tr>
                {#each columns.lokasi_absen as column}
                  <th class="px-6 py-3 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                    {column}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each masterData.lokasi_absen as item}
                <tr class="hover:bg-purple-50 transition-colors">
                  {#each columns.lokasi_absen as column}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {#if column === 'Aksi'}
                        <form method="POST" action="?/deleteLokasiAbsen" style="display: inline;">
                          <input type="hidden" name="id" value="{item.id}" />
                          <button 
                            type="submit" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            on:click={() => confirmDelete(item.nama, 'lokasi absen')}
                          >
                            Hapus
                          </button>
                        </form>
                      {:else}
                        {getFieldValue(item, column)}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Shift Kerja Table -->
    {#if masterData.shift.length > 0}
      <div class="bg-red-50 rounded-lg shadow-lg p-6 border border-red-100">
        <div class="flex items-center mb-6">
          <div class="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center mr-3">
            <svg class="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-red-800">Data Shift Kerja</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-red-50">
              <tr>
                {#each columns.shift as column}
                  <th class="px-6 py-3 text-center text-xs font-medium text-red-700 uppercase tracking-wider">
                    {column}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each masterData.shift as item}
                <tr class="hover:bg-red-50 transition-colors">
                  {#each columns.shift as column}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {#if column === 'Aksi'}
                        <form method="POST" action="?/deleteShift" style="display: inline;">
                          <input type="hidden" name="id" value="{item.id}" />
                          <button 
                            type="submit" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            on:click={() => confirmDelete(item.nama, 'shift kerja')}
                          >
                            Hapus
                          </button>
                        </form>
                      {:else}
                        {getFieldValue(item, column)}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
