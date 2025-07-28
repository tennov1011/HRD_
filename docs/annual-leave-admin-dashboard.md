# Dashboard Admin - Cuti Tahunan

## Overview
Dashboard admin untuk monitoring dan analisis penggunaan cuti tahunan karyawan dengan fitur lengkap meliputi summary statistik, filter data, dan detail per karyawan.

## Fitur Utama

### 📊 Summary Dashboard
- **Total Karyawan**: Jumlah karyawan aktif
- **Total Alokasi**: Total alokasi cuti tahunan (karyawan × 12 hari)  
- **Cuti Terpakai**: Total hari cuti yang sudah digunakan
- **Rata-rata Penggunaan**: Rata-rata cuti per karyawan

### 🚦 Status Summary
- **Cuti Cukup**: Karyawan dengan sisa > 3 hari (hijau)
- **Perlu Perhatian**: Karyawan dengan sisa ≤ 3 hari (kuning)
- **Cuti Habis**: Karyawan dengan sisa 0 hari (merah)

### 🔍 Filter & Pencarian
- **Filter Tahun**: Pilih tahun untuk analisis (current ± 2 tahun)
- **Filter Departemen**: Filter berdasarkan divisi/departemen  
- **Filter Status**: Filter berdasarkan status cuti (cukup/perhatian/habis)
- **Pencarian**: Cari berdasarkan nama, email, atau jabatan
- **Sorting**: Urutkan berdasarkan nama, jabatan, divisi, penggunaan cuti, dll

### 📋 Tabel Karyawan
- **Informasi Karyawan**: Nama, email, jabatan, divisi
- **Data Cuti**: Alokasi, terpakai, sisa, persentase penggunaan
- **Progress Bar**: Visualisasi penggunaan cuti dengan warna status
- **Status Badge**: Label status dengan warna indikator
- **Detail Action**: Tombol untuk melihat detail lengkap

### 👤 Detail Modal Karyawan
- **Info Karyawan**: Email, jabatan, divisi, tanggal mulai kerja
- **Summary Cuti**: Kartu ringkasan alokasi, terpakai, sisa, persentase
- **Riwayat Cuti**: Tabel riwayat pengajuan cuti tahunan tahun tersebut

### 📥 Export Data
- **Export CSV**: Unduh data dashboard dalam format CSV
- **Nama File**: `annual-leave-dashboard-{tahun}.csv`

### 📱 Responsive Design
- Layout responsif untuk desktop dan mobile
- Tabel horizontal scroll pada layar kecil
- Modal adaptif dengan max-height

## Struktur File

### Service Layer
```
src/lib/services/annualLeaveDashboardService.js
```
- `getAnnualLeaveDashboardSummary(year)`: Data summary dashboard
- `getFilteredEmployeeLeaveData(filters)`: Data karyawan dengan filter
- `getDepartmentList()`: List departemen untuk filter

### UI Component
```
src/routes/admin/annual-leave-dashboard/+page.svelte
```
- Dashboard lengkap dengan semua fitur
- State management untuk filter dan pagination
- Modal detail karyawan
- Export functionality

### Navigation
```
src/lib/component/Sidebar.svelte
```
Menu "Dashboard Admin" → "Dashboard Cuti Tahunan"

## API Dependencies

### Collections Directus:
- **karyawan**: Data karyawan (id, nama_lengkap, jabatan, divisi, email, status)
- **izin_hari**: Data pengajuan cuti (tanggal_mulai, tanggal_selesai, user_id, status)
- **kategori_izin**: Kategori cuti dengan nama "Cuti Tahunan"

### API Endpoints:
- `GET /items/karyawan` - Daftar karyawan aktif
- `GET /items/izin_hari` - Data pengajuan cuti dengan filter tanggal dan status approved

## Business Logic

### Alokasi Cuti Tahunan
- **Kuota**: 12 hari per karyawan per tahun kalender
- **Periode**: 1 Januari - 31 Desember 
- **Reset**: Otomatis setiap tahun baru

### Perhitungan Status
- **Cuti Cukup**: Sisa > 3 hari (warna hijau #10b981)
- **Perlu Perhatian**: Sisa 1-3 hari (warna kuning #f59e0b)  
- **Cuti Habis**: Sisa 0 hari (warna merah #ef4444)

### Filter Logic
- **Tahun**: Filter berdasarkan tanggal_mulai pengajuan cuti
- **Departemen**: Filter berdasarkan divisi karyawan
- **Status**: Filter berdasarkan perhitungan sisa cuti
- **Pencarian**: Search pada nama_lengkap, email, jabatan
- **Sorting**: ASC/DESC pada field yang dipilih

## Teknologi

- **Frontend**: SvelteKit with TypeScript support
- **Backend API**: Directus CMS
- **HTTP Client**: Axios
- **Styling**: Custom CSS with CSS Grid/Flexbox
- **Icons**: Unicode Emoji
- **State Management**: Svelte Reactive Statements

## URL Access
```
/admin/annual-leave-dashboard
```

## Permissions
Dashboard ini memerlukan akses admin/manager untuk melihat data semua karyawan. Pastikan user memiliki permission yang sesuai untuk mengakses collection karyawan dan izin_hari.
