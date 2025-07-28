// Test untuk memverifikasi kasbon payment service berfungsi
import { recordKasbonPayment } from './src/lib/services/kasbonPaymentServiceNew.js';

console.log('🧪 Testing kasbon payment service...');

// Test data
const testPayment = {
	kasbon_id: 5,
	amount: 1000000,
	payment_date: '2025-07-21',
	notes: 'Test payment from script',
	payment_method: 'salary_deduction'
};

try {
	const result = await recordKasbonPayment(testPayment);

	if (result.success) {
		console.log('✅ Service test PASSED');
		console.log('📊 Response data structure:');
		console.log('  - Payment ID:', result.data.payment.id);
		console.log('  - Kasbon ID:', result.data.kasbon.id);
		console.log('  - Amount:', result.data.payment.amount);
		console.log('  - Status:', result.data.kasbon.payment_status);
		console.log('  - Message:', result.message);
	} else {
		console.log('❌ Service test FAILED');
		console.log('Error:', result.error);
	}
} catch (error) {
	console.log('🚨 Service test ERROR');
	console.error('Error details:', error.message);
}

console.log('🧪 Test completed.');
