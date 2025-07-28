# Implementasi Backend Kasbon Payment System

## Overview

Dokumen ini menjelaskan cara mengimplementasikan sistem pembayaran kasbon menggunakan **koleksi terpisah** di Directus untuk mencatat cicilan yang telah dibayarkan.

## 🏗️ Struktur Database

### 1. Koleksi `kasbon` (Existing - Perlu Update)

Tambahkan field-field berikut ke koleksi kasbon yang sudah ada:

```sql
-- Field tambahan untuk koleksi kasbon
ALTER TABLE kasbon ADD COLUMN total_paid DECIMAL(15,2) DEFAULT 0;
ALTER TABLE kasbon ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE kasbon ADD COLUMN last_payment_date DATE NULL;
```

#### Field Definitions:

- `total_paid`: Total jumlah yang sudah dibayar (auto-calculated)
- `payment_status`: Status pembayaran (`pending`, `partial`, `completed`, `overdue`)
- `last_payment_date`: Tanggal pembayaran terakhir

### 2. Koleksi `kasbon_payments` (Baru)

Koleksi baru untuk mencatat setiap pembayaran cicilan:

```sql
CREATE TABLE kasbon_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kasbon_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT NULL,
    payment_method VARCHAR(50) DEFAULT 'salary_deduction',
    receipt_number VARCHAR(100) NULL,
    recorded_by VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (kasbon_id) REFERENCES kasbon(id) ON DELETE CASCADE,
    INDEX idx_kasbon_id (kasbon_id),
    INDEX idx_payment_date (payment_date)
);
```

## 🚀 Setup di Directus

### Step 1: Jalankan Setup Script

```bash
# Copy script setup ke server Directus
cp scripts/setup-kasbon-payments.js /path/to/directus/

# Atau gunakan Directus API
node setup-kasbon-payments.js
```

### Step 2: Konfigurasi Permissions

Set permissions untuk role yang sesuai di Directus Admin:

**Koleksi `kasbon_payments`:**

- HRD: Create, Read, Update, Delete
- HR Manager: Read only
- Employee: Read own records only

**Koleksi `kasbon` (update permissions):**

- HRD: Read, Update (untuk field payment)
- HR Manager: Read, Update (untuk approval)

### Step 3: Setup Relations

```javascript
// Many-to-One relation: kasbon_payments -> kasbon
{
  "collection": "kasbon_payments",
  "field": "kasbon_id",
  "related_collection": "kasbon",
  "meta": {
    "one_field": "payments" // Virtual field di kasbon
  }
}
```

## 📡 API Endpoints

### 1. Record Payment

```http
POST /items/kasbon_payments
Content-Type: application/json

{
  "kasbon_id": 123,
  "amount": 500000,
  "payment_date": "2025-01-21",
  "notes": "Pembayaran cicilan pertama",
  "payment_method": "salary_deduction",
  "receipt_number": "PAY001"
}
```

### 2. Get Payment History

```http
GET /items/kasbon_payments?filter[kasbon_id][_eq]=123&sort=-payment_date
```

### 3. Get Kasbon with Payments

```http
GET /items/kasbon/123?fields=*,payments.*
```

### 4. Update Payment

```http
PATCH /items/kasbon_payments/456
Content-Type: application/json

{
  "amount": 600000,
  "notes": "Updated payment amount"
}
```

### 5. Delete Payment

```http
DELETE /items/kasbon_payments/456
```

## 🔧 Backend Logic

### Auto-calculation Triggers

Implementasikan trigger atau hook untuk auto-update:

```sql
-- Trigger untuk update total_paid ketika ada perubahan di kasbon_payments
DELIMITER //
CREATE TRIGGER update_kasbon_total AFTER INSERT ON kasbon_payments
FOR EACH ROW
BEGIN
    UPDATE kasbon
    SET
        total_paid = (
            SELECT COALESCE(SUM(amount), 0)
            FROM kasbon_payments
            WHERE kasbon_id = NEW.kasbon_id
        ),
        last_payment_date = NEW.payment_date,
        payment_status = CASE
            WHEN total_paid >= amount THEN 'completed'
            WHEN total_paid > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = NEW.kasbon_id;
END//
DELIMITER ;
```

### Directus Hook (Recommended)

```javascript
// hooks/update-kasbon-totals.js
export default ({ action }, { services, database }) => {
	action('kasbon_payments.items.create', async (meta, context) => {
		const { ItemsService } = services;
		const kasbonService = new ItemsService('kasbon', context);
		const paymentsService = new ItemsService('kasbon_payments', context);

		// Recalculate totals
		const payments = await paymentsService.readByQuery({
			filter: { kasbon_id: { _eq: meta.kasbon_id } }
		});

		const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

		await kasbonService.updateOne(meta.kasbon_id, {
			total_paid: totalPaid,
			last_payment_date: meta.payment_date,
			payment_status: calculateStatus(totalPaid, kasbon.amount)
		});
	});
};
```

## 🎯 Integration dengan Frontend

### Service Integration

File `kasbonPaymentService.js` sudah siap digunakan dengan functions:

- `recordKasbonPayment(paymentData)`
- `getKasbonPaymentHistory(kasbonId)`
- `updateKasbonPayment(paymentId, updateData)`
- `deleteKasbonPayment(paymentId)`
- `getKasbonPaymentStatistics()`

### UI Integration

- Modal payment sudah terintegrasi
- Progress bar menampilkan status real-time
- Filter berdasarkan status pembayaran
- Auto-refresh setelah record payment

## 📊 Reporting & Analytics

### Payment Statistics Query

```sql
SELECT
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial,
    COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) as overdue,
    SUM(amount) as total_kasbon,
    SUM(total_paid) as total_collected,
    (SUM(total_paid) / SUM(amount) * 100) as collection_rate
FROM kasbon
WHERE status = 'approved';
```

### Overdue Detection

```sql
SELECT k.*,
    DATEDIFF(CURDATE(), k.approved_date) / 30 as months_passed,
    (DATEDIFF(CURDATE(), k.approved_date) / 30 * k.monthly_payment) as expected_paid,
    (k.total_paid < (DATEDIFF(CURDATE(), k.approved_date) / 30 * k.monthly_payment)) as is_overdue
FROM kasbon k
WHERE k.status = 'approved'
AND k.payment_status != 'completed';
```

## 🛡️ Security Considerations

### 1. Data Validation

- Validate payment amount doesn't exceed remaining balance
- Ensure payment date is not future date
- Validate kasbon exists and is approved

### 2. Audit Trail

- Record who made the payment entry
- Log all changes to payment records
- Maintain timestamp for all operations

### 3. Permissions

- Restrict payment recording to finance team
- Employees can only view their own payment history
- Managers can view team payment history

## 🧪 Testing

### Test Cases

1. **Record valid payment** - Should update kasbon totals
2. **Record payment exceeding balance** - Should return error
3. **Update payment amount** - Should recalculate totals
4. **Delete payment** - Should recalculate totals
5. **Payment for non-existent kasbon** - Should return error

### Sample Test Data

```javascript
// Test payment data
const testPayment = {
	kasbon_id: 1,
	amount: 500000,
	payment_date: '2025-01-21',
	notes: 'Test payment',
	payment_method: 'salary_deduction'
};
```

## 📋 Migration Plan

### Phase 1: Database Setup

1. Backup existing kasbon data
2. Add new fields to kasbon table
3. Create kasbon_payments table
4. Setup relations in Directus

### Phase 2: Backend Implementation

1. Deploy payment service
2. Setup hooks/triggers
3. Configure permissions
4. Test API endpoints

### Phase 3: Frontend Integration

1. Deploy updated UI
2. Test payment recording
3. Verify statistics display
4. User acceptance testing

### Phase 4: Data Migration (if needed)

1. Migrate existing payment data (if any)
2. Verify data integrity
3. Update payment statuses

## 🔍 Monitoring & Maintenance

### Key Metrics to Monitor

- Payment success rate
- Data consistency between kasbon and kasbon_payments
- API response times
- Error rates in payment recording

### Regular Maintenance

- Monthly reconciliation of payment totals
- Quarterly review of overdue accounts
- Annual audit of payment records
- Performance optimization of queries

---

**Next Steps:**

1. Setup database tables dan relations di Directus
2. Configure permissions sesuai role
3. Test API endpoints
4. Deploy ke production environment
5. Monitor dan maintain system
