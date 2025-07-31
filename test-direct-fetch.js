// test-direct-fetch.js
// Test langsung fetch dari Directus

async function testDirectFetch() {
	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	try {
		console.log('=== TESTING DIRECT DIRECTUS FETCH ===');

		// Test fetch all notifications
		const response = await fetch(`${DIRECTUS_URL}/items/hrd_notifications`, {
			headers: {
				'Authorization': `Bearer ${DIRECTUS_TOKEN}`
			}
		});

		if (response.ok) {
			const result = await response.json();
			console.log('All notifications:');
			console.log(JSON.stringify(result, null, 2));
			
			// Check if we have any data
			if (result.data && result.data.length > 0) {
				console.log('\nFirst notification structure:');
				console.log(JSON.stringify(result.data[0], null, 2));
			}
		} else {
			console.log('Error response:', response.status, await response.text());
		}

	} catch (error) {
		console.error('Error:', error);
	}
}

testDirectFetch();
