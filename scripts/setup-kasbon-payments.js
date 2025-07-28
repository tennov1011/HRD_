/**
 * Script untuk setup koleksi kasbon_payments di Directus
 * Jalankan script ini di Directus Admin Panel -> Settings -> Flows -> Scripts
 * atau melalui Directus API
 */

// 1. Buat koleksi kasbon_payments
const createKasbonPaymentsCollection = {
	collection: 'kasbon_payments',
	meta: {
		collection: 'kasbon_payments',
		icon: 'payment',
		note: 'Koleksi untuk mencatat pembayaran cicilan kasbon',
		display_template: '{{kasbon_id}} - {{amount}} - {{payment_date}}',
		hidden: false,
		singleton: false,
		translations: [
			{
				language: 'id-ID',
				translation: 'Pembayaran Kasbon'
			}
		]
	},
	schema: {
		name: 'kasbon_payments'
	}
};

// 2. Fields untuk kasbon_payments
const kasbonPaymentsFields = [
	{
		field: 'id',
		type: 'integer',
		meta: {
			hidden: true,
			readonly: true,
			interface: 'input',
			special: ['auto-increment']
		},
		schema: {
			is_primary_key: true,
			has_auto_increment: true,
			is_nullable: false
		}
	},
	{
		field: 'kasbon_id',
		type: 'integer',
		meta: {
			interface: 'select-dropdown-m2o',
			display: 'related-values',
			display_options: {
				template: '{{employee_name}} - {{amount}}'
			},
			required: true,
			translations: [
				{
					language: 'id-ID',
					translation: 'Kasbon'
				}
			]
		},
		schema: {
			is_nullable: false
		}
	},
	{
		field: 'amount',
		type: 'decimal',
		meta: {
			interface: 'input',
			display: 'formatted-value',
			display_options: {
				format: 'currency',
				currency: 'IDR'
			},
			required: true,
			note: 'Jumlah pembayaran dalam Rupiah',
			translations: [
				{
					language: 'id-ID',
					translation: 'Jumlah Pembayaran'
				}
			]
		},
		schema: {
			is_nullable: false,
			numeric_precision: 15,
			numeric_scale: 2
		}
	},
	{
		field: 'payment_date',
		type: 'date',
		meta: {
			interface: 'datetime',
			display: 'datetime',
			display_options: {
				relative: false
			},
			required: true,
			translations: [
				{
					language: 'id-ID',
					translation: 'Tanggal Pembayaran'
				}
			]
		},
		schema: {
			is_nullable: false
		}
	},
	{
		field: 'notes',
		type: 'text',
		meta: {
			interface: 'input-multiline',
			display: 'formatted-value',
			note: 'Catatan tambahan untuk pembayaran',
			translations: [
				{
					language: 'id-ID',
					translation: 'Catatan'
				}
			]
		},
		schema: {
			is_nullable: true
		}
	},
	{
		field: 'payment_method',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'Tunai', value: 'cash' },
					{ text: 'Transfer Bank', value: 'bank_transfer' },
					{ text: 'Potong Gaji', value: 'salary_deduction' },
					{ text: 'Lainnya', value: 'other' }
				]
			},
			default_value: 'salary_deduction',
			translations: [
				{
					language: 'id-ID',
					translation: 'Metode Pembayaran'
				}
			]
		},
		schema: {
			is_nullable: true,
			default_value: 'salary_deduction'
		}
	},
	{
		field: 'receipt_number',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'Nomor bukti pembayaran',
			translations: [
				{
					language: 'id-ID',
					translation: 'Nomor Bukti'
				}
			]
		},
		schema: {
			is_nullable: true
		}
	},
	{
		field: 'recorded_by',
		type: 'string',
		meta: {
			interface: 'input',
			display: 'user',
			readonly: true,
			default_value: '$CURRENT_USER',
			translations: [
				{
					language: 'id-ID',
					translation: 'Dicatat Oleh'
				}
			]
		},
		schema: {
			is_nullable: false
		}
	},
	{
		field: 'recorded_at',
		type: 'timestamp',
		meta: {
			interface: 'datetime',
			display: 'datetime',
			readonly: true,
			default_value: '$NOW',
			translations: [
				{
					language: 'id-ID',
					translation: 'Waktu Pencatatan'
				}
			]
		},
		schema: {
			is_nullable: false,
			default_value: 'CURRENT_TIMESTAMP'
		}
	}
];

// 3. Buat relasi Many-to-One dari kasbon_payments ke kasbon
const createRelation = {
	collection: 'kasbon_payments',
	field: 'kasbon_id',
	related_collection: 'kasbon',
	meta: {
		many_collection: 'kasbon_payments',
		many_field: 'kasbon_id',
		one_collection: 'kasbon',
		one_field: 'payments',
		one_collection_field: null,
		one_allowed_collections: null,
		junction_field: null,
		sort_field: null,
		one_deselect_action: 'nullify'
	},
	schema: {
		on_delete: 'SET NULL'
	}
};

// 4. Field tambahan untuk koleksi kasbon (existing)
const additionalKasbonFields = [
	{
		field: 'total_paid',
		type: 'decimal',
		meta: {
			interface: 'input',
			display: 'formatted-value',
			display_options: {
				format: 'currency',
				currency: 'IDR'
			},
			readonly: true,
			default_value: 0,
			note: 'Total yang sudah dibayar (auto-calculated)',
			translations: [
				{
					language: 'id-ID',
					translation: 'Total Dibayar'
				}
			]
		},
		schema: {
			is_nullable: true,
			numeric_precision: 15,
			numeric_scale: 2,
			default_value: 0
		}
	},
	{
		field: 'payment_status',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			display: 'labels',
			display_options: {
				choices: [
					{ text: 'Belum Mulai', value: 'pending', color: '#FCD34D' },
					{ text: 'Cicilan Berjalan', value: 'partial', color: '#60A5FA' },
					{ text: 'Lunas', value: 'completed', color: '#34D399' },
					{ text: 'Terlambat', value: 'overdue', color: '#F87171' }
				]
			},
			default_value: 'pending',
			translations: [
				{
					language: 'id-ID',
					translation: 'Status Pembayaran'
				}
			]
		},
		schema: {
			is_nullable: true,
			default_value: 'pending'
		}
	},
	{
		field: 'last_payment_date',
		type: 'date',
		meta: {
			interface: 'datetime',
			display: 'datetime',
			readonly: true,
			note: 'Tanggal pembayaran terakhir (auto-updated)',
			translations: [
				{
					language: 'id-ID',
					translation: 'Pembayaran Terakhir'
				}
			]
		},
		schema: {
			is_nullable: true
		}
	}
];

// Export untuk digunakan dalam setup
module.exports = {
	createKasbonPaymentsCollection,
	kasbonPaymentsFields,
	createRelation,
	additionalKasbonFields
};

// Contoh penggunaan dengan Directus SDK
/*
import { createDirectus, rest, createCollection, createField, createRelation } from '@directus/sdk';

const client = createDirectus('YOUR_DIRECTUS_URL').with(rest());

async function setupKasbonPayments() {
  try {
    // 1. Buat koleksi
    await client.request(createCollection(createKasbonPaymentsCollection));
    
    // 2. Tambahkan fields
    for (const field of kasbonPaymentsFields) {
      await client.request(createField('kasbon_payments', field));
    }
    
    // 3. Buat relasi
    await client.request(createRelation(createRelation));
    
    // 4. Tambahkan field ke koleksi kasbon yang existing
    for (const field of additionalKasbonFields) {
      await client.request(createField('kasbon', field));
    }
    
    console.log('✅ Kasbon payments setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}
*/
