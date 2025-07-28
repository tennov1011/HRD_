// Simple test for kasbon service exports
import {
	recordKasbonPayment,
	getKasbonPaymentHistory
} from './src/lib/services/kasbonPaymentService.js';

console.log('recordKasbonPayment:', typeof recordKasbonPayment);
console.log('getKasbonPaymentHistory:', typeof getKasbonPaymentHistory);

// Try to call one function
if (typeof recordKasbonPayment === 'function') {
	console.log('Function call test...');
	recordKasbonPayment({
		kasbon_id: 1,
		amount: 1000000,
		payment_date: '2025-01-20'
	})
		.then((result) => {
			console.log('Test result:', result.success ? 'SUCCESS' : 'FAILED');
		})
		.catch((err) => {
			console.error('Test error:', err.message);
		});
} else {
	console.error('recordKasbonPayment is not a function!');
}
