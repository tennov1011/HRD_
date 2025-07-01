<script>
  const menuItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Dashboard Detail", href: "/admin/dashboard" },
    { label: "Kelola Pegawai", href: "/admin/employees" },
    { label: "Departemen", href: "/admin/departments" },
    { label: "Laporan", href: "/admin/reports" },
    { label: "Pengaturan", href: "/admin/settings" },
  ];
</script>

<aside class="text-white w-64 min-h-screen p-4 shadow-xl animate-fade-in" style="background-color: #81C784;">
  <h2 class="text-xl font-bold mb-6 ml-4 text-white drop-shadow">Admin Panel</h2>
  <nav>
    <ul class="space-y-2">
      {#each menuItems as item}
        <li>
          <a href={item.href} class="block py-2 px-4 rounded-lg hover:bg-green-600 hover:text-white transition font-semibold tracking-wide">
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</aside>

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
  }
</style>