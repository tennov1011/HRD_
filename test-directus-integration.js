// Test Directus API dengan field baru
import {
	recordKasbonPayment,
	getKasbonPaymentHistory,
	getKasbonWithPayments
} from './src/lib/services/kasbonPaymentServiceNew.js';
import { getAdvanceRequests } from './src/lib/services/advanceService.js';

console.log('🧪 Testing Directus API dengan field baru...\n');

async function testDirectusIntegration() {
	try {
		// Test 1: Ambil data kasbon
		console.log('1️⃣ Testing getAdvanceRequests...');
		const kasbonResult = await getAdvanceRequests();

		if (kasbonResult.success) {
			console.log('✅ Kasbon data loaded successfully');
			console.log(`📊 Found ${kasbonResult.data.length} kasbon records`);

			if (kasbonResult.data.length > 0) {
				const firstKasbon = kasbonResult.data[0];
				console.log('📋 Sample kasbon fields:');
				console.log(`  - ID: ${firstKasbon.id}`);
				console.log(`  - User ID: ${firstKasbon.user_id}`);
				console.log(`  - Email: ${firstKasbon.email}`);
				console.log(`  - Nama: ${firstKasbon.nama}`);
				console.log(`  - Nominal: ${firstKasbon.nominal}`);
				console.log(`  - Status: ${firstKasbon.status}`);
				console.log(`  - Total Paid: ${firstKasbon.total_paid || 0}`);
				console.log(`  - Payment Status: ${firstKasbon.payment_status || 'pending'}`);
				console.log(`  - Last Payment Date: ${firstKasbon.last_payment_date || 'N/A'}`);

				// Test 2: Coba catat pembayaran ke kasbon pertama
				if (firstKasbon.status === 'approved') {
					console.log('\n2️⃣ Testing recordKasbonPayment...');
					const paymentResult = await recordKasbonPayment({
						kasbon_id: firstKasbon.id,
						amount: 100000,
						payment_date: '2025-07-21',
						notes: 'Test payment from script',
						payment_method: 'salary_deduction'
					});

					if (paymentResult.success) {
						console.log('✅ Payment recorded successfully');
						console.log(`📝 Payment ID: ${paymentResult.data.payment.id}`);
						console.log(`💰 Amount: ${paymentResult.data.payment.amount}`);
						console.log(`📊 New total paid: ${paymentResult.data.kasbon.total_paid}`);
						console.log(`🔄 Payment status: ${paymentResult.data.kasbon.payment_status}`);

						// Test 3: Ambil riwayat pembayaran
						console.log('\n3️⃣ Testing getKasbonPaymentHistory...');
						const historyResult = await getKasbonPaymentHistory(firstKasbon.id);

						if (historyResult.success) {
							console.log('✅ Payment history loaded successfully');
							console.log(`📋 Found ${historyResult.count} payment records`);

							if (historyResult.data.length > 0) {
								console.log('📝 Latest payment:');
								const latest = historyResult.data[0];
								console.log(`  - Amount: ${latest.amount}`);
								console.log(`  - Date: ${latest.payment_date}`);
								console.log(`  - Method: ${latest.payment_method}`);
								console.log(`  - Recorded by: ${latest.recorded_by}`);
							}
						} else {
							console.log('⚠️ Payment history failed:', historyResult.error);
						}
					} else {
						console.log('⚠️ Payment recording failed:', paymentResult.error);
						if (paymentResult.fallback) {
							console.log('🔄 Using fallback simulation mode');
						}
					}
				} else {
					console.log('\n2️⃣ Skipping payment test (kasbon not approved)');
				}
			}
		} else {
			console.log('❌ Failed to load kasbon data:', kasbonResult.error);
		}
	} catch (error) {
		console.error('🚨 Test failed with error:', error.message);
	}
}

testDirectusIntegration()
	.then(() => {
		console.log('\n🧪 Test completed!');
	})
	.catch((err) => {
		console.error('🚨 Test execution failed:', err.message);
	});
