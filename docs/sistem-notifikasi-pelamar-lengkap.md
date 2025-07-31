# Sistem Notifikasi Pelamar Masuk - Dokumentasi Lengkap

## Overview

Sistem notifikasi pelamar masuk telah dikonsolidasi dan diperbaiki untuk meningkatkan maintainability dan konsistensi. Semua logika server-side telah dipindahkan ke satu service utama dengan API endpoint yang disederhanakan.

## Arsitektur Sistem

### 1. Database (Directus)
- **Table**: `hrd_notifications`
- **Fields**:
  - `id` - Primary key
  - `type` - Jenis notifikasi (new_application)
  - `message` - Pesan notifikasi
  - `job_id` - ID lowongan pekerjaan
  - `applicant_id` - ID pelamar
  - `redirect_url` - URL untuk navigasi
  - `is_read` - Status baca (boolean)
  - `created_at` - Timestamp dibuat

- **Table**: `job_applications`
- **Fields**:
  - `id` - Primary key
  - `fullName` - Nama lengkap pelamar
  - `appliedJobId` - ID pekerjaan yang dilamar
  - `date_created` - Tanggal aplikasi

- **Table**: `job_postings`
- **Fields**:
  - `id` - Primary key
  - `title/position/name` - Nama posisi

## File Structure & Fungsi

### Backend (Server-Side)

#### 1. `src/lib/services/notificationService.js` ⭐ **CORE SERVICE**
**Fungsi**: Pusat semua logika notifikasi server-side

**Methods**:
```javascript
// Basic CRUD Operations
async request(endpoint, options)           // HTTP client untuk Directus
async createNewApplicationNotification()   // Buat notifikasi pelamar baru
async getUnreadNotifications(limit)        // Ambil notifikasi belum dibaca
async getUnreadCount()                    // Hitung notifikasi belum dibaca
async markAsRead(notificationId)          // Tandai sebagai dibaca
async markAllAsRead()                     // Tandai semua sebagai dibaca

// Advanced Operations
async syncNotifications()                 // Sinkronisasi notifikasi batch
async handleGetNotifications(searchParams) // Handle GET requests
async handleMarkAsRead(notificationId)    // Handle mark as read
async handleWebhook(webhookData)          // Handle webhook dari luar
```

**Configuration**:
```javascript
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
```

#### 2. `src/routes/api/notifications/+server.js` 🌐 **MAIN API ENDPOINT**
**Fungsi**: Single endpoint untuk semua operasi notifikasi

**GET Endpoints**:
```
GET /api/notifications                    // Default: semua notifikasi belum dibaca
GET /api/notifications?unread=true        // Notifikasi belum dibaca
GET /api/notifications?count=true         // Jumlah notifikasi belum dibaca
```

**POST Endpoints** (menggunakan field `action`):
```javascript
// Sinkronisasi notifikasi
POST /api/notifications
{
  "action": "sync"
}

// Tandai sebagai dibaca
POST /api/notifications  
{
  "action": "mark_read",
  "id": "notification_id"
}

// Tandai semua sebagai dibaca
POST /api/notifications
{
  "action": "mark_all_read"
}

// Webhook pelamar baru
POST /api/notifications
{
  "action": "webhook",
  "applicantId": "123",
  "jobId": "456",
  "applicantName": "John Doe", 
  "jobTitle": "Software Engineer"
}
```

#### 3. `src/routes/api/applications/webhook/+server.js` 🔗 **LEGACY WEBHOOK**
**Fungsi**: Endpoint kompatibilitas untuk sistem lama
```javascript
POST /api/applications/webhook
{
  "applicantId": "123",
  "jobId": "456", 
  "applicantName": "John Doe",
  "jobTitle": "Software Engineer"
}
```

### Frontend (Client-Side)

#### 1. `src/lib/component/NotificationBell.svelte` 🔔 **UI KOMPONEN UTAMA**
**Fungsi**: Ikon lonceng, badge count, dropdown notifikasi

**Key Features**:
- Real-time badge count update
- Dropdown dengan daftar notifikasi
- Auto-refresh setiap 30 detik
- Auto-sync setiap ~5 menit
- Click to mark as read + navigate

**API Calls**:
```javascript
// Ambil notifikasi belum dibaca
fetch('/api/notifications?unread=true')

// Ambil jumlah notifikasi
fetch('/api/notifications?count=true') 

// Sinkronisasi
fetch('/api/notifications', {
  method: 'POST',
  body: JSON.stringify({ action: 'sync' })
})

// Mark as read
fetch('/api/notifications', {
  method: 'POST', 
  body: JSON.stringify({ 
    action: 'mark_read',
    id: notification.id 
  })
})
```

#### 2. `src/lib/component/NotificationContainer.svelte` 📦 **TOAST CONTAINER**
**Fungsi**: Container untuk toast notifications di pojok layar
```svelte
{#each notificationList as notification (notification.id)}
  <Notification {...notification} />
{/each}
```

#### 3. `src/lib/component/Notification.svelte` 📢 **INDIVIDUAL TOAST**
**Fungsi**: Komponen satu toast notification
- Support 4 tipe: success, error, warning, info
- Auto-hide dengan timer
- Progress bar animasi
- Manual close button

#### 4. `src/lib/stores/notificationStore.js` 📊 **STATE MANAGEMENT**
**Fungsi**: Svelte store untuk toast notifications
```javascript
export const notifications = createNotificationStore();

// Usage
notifications.add({
  type: 'success',
  title: 'Berhasil!',
  message: 'Pelamar baru telah ditambahkan'
});
```

## Flow Sistem Notifikasi

### 1. Pelamar Baru Mendaftar
```
1. Pelamar submit form → job_applications table
2. Webhook/trigger → POST /api/applications/webhook
3. notificationService.handleWebhook()
4. notificationService.createNewApplicationNotification()
5. Insert ke hrd_notifications table
```

### 2. Admin Melihat Notifikasi
```
1. NotificationBell.svelte mount
2. fetchUnreadCount() → GET /api/notifications?count=true
3. Tampilkan badge dengan angka
4. User klik bell → fetchNotifications()
5. GET /api/notifications?unread=true
6. Tampilkan dropdown dengan list
```

### 3. Admin Klik Notifikasi
```
1. handleNotificationClick()
2. POST /api/notifications (action: mark_read)
3. notificationService.handleMarkAsRead()
4. Update is_read = true di database
5. Remove dari local state
6. goto(notification.redirect_url)
```

### 4. Auto-Sync Background
```
1. setInterval(30s) → fetchUnreadCount()
2. Random 10% chance → syncNotifications()
3. POST /api/notifications (action: sync)
4. notificationService.syncNotifications()
5. Cek job_applications tanpa notifikasi
6. Buat notifikasi untuk yang missing
```

## Perubahan Terakhir (Konsolidasi)

### Files Dihapus ❌
```
src/routes/api/notifications/sync/+server.js
src/routes/api/notifications/[id]/read/+server.js
src/routes/api/notifications/[id]/
src/routes/api/notifications/sync/
```

### Files Dimodifikasi ✅
```
src/lib/services/notificationService.js      // Tambah semua server functions
src/routes/api/notifications/+server.js      // Single endpoint semua operasi  
src/routes/api/applications/webhook/+server.js // Gunakan notificationService
src/lib/component/NotificationBell.svelte    // Update API calls
```

### Benefits Konsolidasi
1. **Single Source of Truth** - Semua logik di notificationService.js
2. **Easier Maintenance** - Edit satu file untuk perubahan backend
3. **Consistent Error Handling** - Error handling terpusat
4. **Better Reusability** - Functions bisa dipanggil dari mana saja
5. **Simplified API** - Satu endpoint untuk multiple actions
6. **Reduced File Count** - Dari 5 server files → 2 server files

## Environment Variables

```env
VITE_DIRECTUS_URL=https://directus.eltamaprimaindo.com
VITE_DIRECTUS_TOKEN=JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz
```

## Testing Endpoints

### Cek Status Notifikasi
```bash
curl "http://localhost:5173/api/notifications?count=true"
```

### Sync Manual
```bash
curl -X POST "http://localhost:5173/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{"action": "sync"}'
```

### Webhook Test
```bash
curl -X POST "http://localhost:5173/api/applications/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantId": "123",
    "jobId": "456", 
    "applicantName": "Test User",
    "jobTitle": "Developer"
  }'
```

## Error Handling

### Server-Side
- Try-catch di setiap function
- Graceful error untuk notification creation (tidak throw)
- Detailed error logging
- Proper HTTP status codes

### Client-Side  
- Network error handling
- Loading states
- Fallback UI untuk offline
- Console error logging

## Performance Optimizations

1. **Efficient Polling**: 30s interval, tidak terlalu sering
2. **Batch Operations**: markAllAsRead() dalam satu request
3. **Conditional Refresh**: Hanya refresh jika dropdown terbuka
4. **Random Sync**: Tidak semua client sync bersamaan
5. **Limit Queries**: Default limit 20 notifications

## Monitoring & Debugging

### Logs untuk Monitor
```javascript
console.log('📩 Notification sync:', result.stats);
console.log('✅ Created notification for', applicantName);
console.log('❌ Error processing application', appId);
```

### Browser DevTools
- Network tab untuk API calls
- Console untuk error messages  
- Application tab untuk local state

Sistem ini sekarang lebih terorganisir, mudah dimaintain, dan scalable untuk pengembangan fitur notifikasi selanjutnya.

## Analisis Function Duplikasi

### 🔍 **Mengapa Ada Function Duplikasi?**

Ada beberapa function yang sepertinya duplikat, namun sebenarnya memiliki layer dan tujuan yang berbeda:

#### 1. **markAsRead Functions**

**Server-Side (`notificationService.js`)**:
```javascript
// Layer 1: Core Database Operation
async markAsRead(notificationId) {
  // Direct database operation ke Directus
  // PATCH /items/hrd_notifications/{id}
}

// Layer 2: API Handler 
async handleMarkAsRead(notificationId) {
  // Wrapper untuk validasi + error handling
  // Dipanggil dari API endpoint
  if (!notificationId) throw new Error('Required');
  await this.markAsRead(notificationId);
}
```

**Client-Side (`NotificationBell.svelte`)**:
```javascript
// Layer 3: UI Handler
async function handleNotificationClick(notification) {
  // UI logic + API call
  // Update local state + call API
  const response = await fetch('/api/notifications', {
    body: JSON.stringify({ action: 'mark_read', id: notification.id })
  });
}
```

#### 2. **getNotifications Functions**

**Server-Side (`notificationService.js`)**:
```javascript
// Layer 1: Core Database Query
async getUnreadNotifications(limit = 20) {
  // Direct query ke Directus
}

// Layer 2: API Handler
async handleGetNotifications(searchParams) {
  // Parse URL params + route ke function yang tepat
  if (countOnly) return { count: await this.getUnreadCount() };
  if (unreadOnly) return { data: await this.getUnreadNotifications() };
}
```

**Client-Side (`NotificationBell.svelte`)**:
```javascript
// Layer 3: UI Fetch Functions
async function fetchNotifications() {
  // Fetch untuk dropdown list
  const response = await fetch('/api/notifications?unread=true');
}

async function fetchUnreadCount() {
  // Fetch untuk badge count
  const response = await fetch('/api/notifications?count=true');
}
```

### 🎯 **Function Mana Yang Digunakan?**

#### **Actual Flow Sistem:**

```
📱 CLIENT SIDE                    🌐 API LAYER                   💾 SERVICE LAYER
┌─────────────────────┐          ┌─────────────────────┐        ┌─────────────────────┐
│ NotificationBell    │          │ +server.js          │        │ notificationService │
│                     │          │                     │        │                     │
│ handleNotification  │ ─────→   │ POST({ request })   │ ─────→ │ handleMarkAsRead()  │
│ Click()             │          │ switch(action)      │        │ ↓                   │
│                     │          │                     │        │ markAsRead()        │
└─────────────────────┘          └─────────────────────┘        └─────────────────────┘
```

#### **Function Yang Benar-Benar Dipakai:**

**1. Mark as Read Flow:**
```javascript
// ✅ DIGUNAKAN
NotificationBell.handleNotificationClick() 
  → API POST /api/notifications (action: mark_read)
    → notificationService.handleMarkAsRead() 
      → notificationService.markAsRead() 
        → Database PATCH
```

**2. Fetch Notifications Flow:**
```javascript
// ✅ DIGUNAKAN  
NotificationBell.fetchNotifications()
  → API GET /api/notifications?unread=true
    → notificationService.handleGetNotifications()
      → notificationService.getUnreadNotifications()
        → Database GET
```

**3. Sync Flow:**
```javascript
// ✅ DIGUNAKAN
NotificationBell.syncNotifications()
  → API POST /api/notifications (action: sync)
    → notificationService.syncNotifications()
      → Database operations
```

### 🏗️ **Arsitektur Layer Explanation**

#### **Layer 1: Database Operations (Core)**
```javascript
// Pure database operations - NO business logic
markAsRead(id)
getUnreadNotifications() 
getUnreadCount()
createNewApplicationNotification()
```

#### **Layer 2: API Handlers (Business Logic)**
```javascript
// Validation + routing + error handling
handleMarkAsRead()      // Validates ID, calls markAsRead()
handleGetNotifications() // Routes berdasarkan params
handleWebhook()         // Validates webhook data
```

#### **Layer 3: UI Handlers (User Interaction)**
```javascript
// UI state management + API calls
handleNotificationClick() // UI state + call API
fetchNotifications()      // UI refresh + call API
syncNotifications()       // Background sync + call API
```

### ❌ **Functions Yang TIDAK Digunakan**

Karena konsolidasi, beberapa function legacy mungkin masih ada tapi tidak terpakai:

```javascript
// ❌ DEPRECATED - File sudah dihapus
/api/notifications/sync/+server.js
/api/notifications/[id]/read/+server.js

// ❌ TIDAK DIGUNAKAN - Diganti dengan handleMarkAsRead()
// Direct calls ke markAsRead() dari API endpoint

// ❌ TIDAK DIGUNAKAN - Diganti dengan satu endpoint
// Multiple endpoint terpisah untuk setiap operasi
```

### 🔧 **Rekomendasi Cleanup**

Untuk menghilangkan kebingungan duplikasi:

1. **Rename Functions untuk Clarity:**
```javascript
// Server-side (Core operations)
markAsRead()           → _markAsReadInDatabase()
getUnreadNotifications() → _queryUnreadFromDB()

// Server-side (API handlers) 
handleMarkAsRead()     → markNotificationAsRead()
handleGetNotifications() → getNotificationsForAPI()

// Client-side (UI handlers)
handleNotificationClick() → onNotificationClick()
fetchNotifications()   → loadNotificationsUI()
```

2. **Add JSDoc Comments:**
```javascript
/**
 * 🎯 UI LAYER: Handle user click on notification
 * Updates local state + calls API
 */
async function onNotificationClick(notification) { }

/**
 * 🌐 API LAYER: Handle mark as read request
 * Validates input + calls database operation  
 */
async markNotificationAsRead(id) { }

/**
 * 💾 DATABASE LAYER: Mark notification as read in database
 * Pure database operation, no business logic
 */
async _markAsReadInDatabase(id) { }
```

### 📋 **Summary**

**Tidak ada duplikasi yang bermasalah** - setiap function memiliki layer dan tanggung jawab berbeda:

- **Client functions**: UI state management
- **API handler functions**: Business logic & validation  
- **Core service functions**: Database operations

Sistem menggunakan **separation of concerns** yang baik, hanya perlu penamaan yang lebih jelas untuk menghindari kebingungan.
