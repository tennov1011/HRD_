<script>
  export let form;
</script>

<svelte:head>
  <title>Tambah Shift - Master Data</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-lg mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Tambah Shift</h1>
      <a href="/masterdata" class="text-blue-500 hover:text-blue-600 text-sm">
        ← Kembali ke Master Data
      </a>
    </div>

    <div class="bg-orange-50 rounded-lg shadow-lg p-6 border border-orange-100">
      <form method="POST" action="/masterdata?/addShift" class="space-y-6">
        <div>
          <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
            Nama Shift <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nama"
            name="nama"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Masukkan nama shift (contoh: Shift Pagi)"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="jam_masuk" class="block text-sm font-medium text-gray-700 mb-2">
              Jam Masuk <span class="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="jam_masuk"
              name="jam_masuk"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label for="jam_keluar" class="block text-sm font-medium text-gray-700 mb-2">
              Jam Keluar <span class="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="jam_keluar"
              name="jam_keluar"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
          </select>
        </div>

        {#if form?.error}
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-red-800 text-sm">{form.error}</p>
          </div>
        {/if}

        <div class="flex gap-4">
          <button
            type="submit"
            class="flex-1 bg-yellow-700 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Simpan Shift
          </button>
          <a
            href="/masterdata"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
          >
            Batal
          </a>
        </div>
      </form>
    </div>
  </div>
</div>
