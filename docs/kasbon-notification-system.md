# Sistem Notifikasi Kasbon

Dokumentasi sistem notifikasi untuk pengajuan kasbon yang telah diimplementasikan.

## 🎯 Fitur Utama

### 1. **Notifikasi Kasbon Disetujui**

- **Trigger**: Ketika Manager HRD menyetujui pengajuan kasbon
- **Tampilan**: Notifikasi hijau dengan icon ✅
- **Konten**: Nama karyawan, jumlah kasbon, status approval
- **Durasi**: 6 detik

### 2. **Notifikasi Kasbon Ditolak**

- **Trigger**: Ketika Manager HRD menolak pengajuan kasbon
- **Tampilan**: Notifikasi merah dengan icon ❌
- **Konten**: Nama karyawan, jumlah kasbon, alasan penolakan
- **Durasi**: 8 detik (lebih lama untuk informasi penting)

### 3. **Notifikasi Kasbon Diajukan**

- **Trigger**: Ketika karyawan berhasil mengajukan kasbon baru
- **Tampilan**: Notifikasi biru dengan icon 📋
- **Konten**: Nama karyawan, jumlah kasbon, status pending
- **Durasi**: 5 detik

### 4. **Notifikasi Pembayaran Dicatat**

- **Trigger**: Ketika HRD mencatat pembayaran cicilan kasbon
- **Tampilan**: Notifikasi hijau dengan icon 💰
- **Konten**: Jumlah pembayaran yang dicatat
- **Durasi**: 4 detik

## 🛠️ Komponen Teknis

### **1. Notification.svelte**

Komponen individual untuk menampilkan satu notifikasi dengan:

- Animasi masuk dan keluar (fly transition)
- Progress bar untuk countdown duration
- Support untuk berbagai tipe: success, error, warning, info
- Auto-hide dan manual close functionality
- Responsive design

### **2. NotificationContainer.svelte**

Container untuk mengelola multiple notifikasi:

- Positioning fixed di kanan atas layar
- Stack notifikasi secara vertikal
- Responsive untuk mobile devices
- Z-index tinggi untuk overlay

### **3. notificationStore.js**

State management untuk notifikasi global:

- Svelte store untuk reactive notifications
- Helper functions untuk berbagai tipe notifikasi
- Specialized kasbon notification helpers
- Auto-cleanup untuk expired notifications

## 🎨 Design System

### **Visual Hierarchy**

- **Success**: Hijau (#10b981) untuk approval dan pembayaran
- **Error**: Merah (#ef4444) untuk rejection dan error
- **Warning**: Kuning (#f59e0b) untuk peringatan
- **Info**: Biru (#3b82f6) untuk informasi umum

### **Animation & UX**

- **Slide-in**: Animasi dari kanan dengan fly effect
- **Progress Bar**: Visual countdown untuk auto-hide
- **Hover Effects**: Interactive states untuk close button
- **Backdrop Blur**: Modern glassmorphism effect

### **Typography**

- **Title**: Bold 14px untuk judul notifikasi
- **Message**: Regular 13px untuk konten pesan
- **Icon**: 18px emoji icons untuk visual clarity

## 🧪 Testing

### **Test Button**

Tombol "🔔 Test Notifikasi" di header untuk demonstrasi:

- Menampilkan semua jenis notifikasi secara berurutan
- Delay antar notifikasi untuk pengalaman yang baik
- Sample data untuk testing

### **Test Script**

File `test-kasbon-notifications.js` untuk testing otomatis:

- Membuat kasbon baru (status pending)
- Approve kasbon (status approved)
- Reject kasbon dengan alasan (status rejected)
- Record pembayaran kasbon
- Verifikasi notifikasi untuk setiap scenario

## 📱 Responsive Design

### **Desktop**

- Notifikasi di kanan atas (20px margin)
- Lebar maksimal 500px, minimal 320px
- Stack vertikal dengan gap 8px

### **Mobile**

- Full width dengan margin 10px kiri-kanan
- Minimal width 280px
- Tetap di posisi top untuk visibility

## 🔧 Implementasi

### **Menambahkan Notifikasi Baru**

```javascript
// Import store
import { notifications, kasbonNotifications } from '$lib/stores/notificationStore.js';

// Notifikasi manual
notifications.success('Title', 'Message');
notifications.error('Title', 'Message');
notifications.warning('Title', 'Message');
notifications.info('Title', 'Message');

// Notifikasi kasbon (otomatis)
kasbonNotifications.approved(kasbonObject);
kasbonNotifications.rejected(kasbonObject, reason);
kasbonNotifications.submitted(kasbonObject);
kasbonNotifications.paymentRecorded(paymentObject);
```

### **Menambahkan Container**

```svelte
<!-- Di layout atau page utama -->
<script>
	import NotificationContainer from '$lib/component/NotificationContainer.svelte';
</script>

<!-- Di akhir template -->
<NotificationContainer />
```

## 🎉 Hasil Implementasi

1. **User Experience**: Feedback real-time yang jelas untuk setiap aksi
2. **Professional Look**: Design modern dengan animations yang smooth
3. **Accessibility**: Proper ARIA labels dan keyboard navigation
4. **Performance**: Lightweight dengan auto-cleanup memory
5. **Maintainability**: Modular components yang mudah di-extend

Sistem notifikasi sekarang fully functional dan siap untuk production use!
