// Test script untuk approval kasbon sebagai Manager HRD
import fs from 'fs';

// Read environment variables from .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach((line) => {
	const [key, value] = line.split('=');
	if (key && value) {
		envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
	}
});

const DIRECTUS_URL = envVars.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = envVars.VITE_DIRECTUS_TOKEN;

async function directusApi(endpoint, options = {}) {
	const url = `${DIRECTUS_URL}/${endpoint}`;
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${DIRECTUS_TOKEN}`,
		...options.headers
	};

	const response = await fetch(url, {
		...options,
		headers
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API Error: ${response.status} - ${errorData}`);
	}

	return response.json();
}

async function testApproval() {
	try {
		console.log('🔍 Testing kasbon approval process...');

		// Get a pending kasbon to test approval
		const kasbonList = await directusApi(
			'items/kasbon?filter[approval_stage][_eq]=pending&limit=1'
		);

		if (kasbonList.data.length === 0) {
			console.log('⚠️ No pending kasbon found. Creating a test one...');

			// Create a test kasbon for approval
			const testKasbon = {
				user_id: '1',
				email: 'test@eltama.com',
				nama: 'Test User',
				tanggal: '2025-01-21',
				nominal: 2000000,
				status: 'pending',
				tanggal_pengajuan: new Date().toISOString(),
				tenor: 2,
				keterangan: 'Test kasbon for approval',
				divisi: 'IT',
				approval_stage: 'pending',
				overall_status: 'pending',
				manager_hrd_approved: false
			};

			const createResult = await directusApi('items/kasbon', {
				method: 'POST',
				body: JSON.stringify(testKasbon)
			});

			console.log('✅ Created test kasbon:', createResult.data.id);
			return createResult.data.id;
		} else {
			const kasbon = kasbonList.data[0];
			console.log('📋 Found pending kasbon:', kasbon.id, kasbon.nama);
			return kasbon.id;
		}
	} catch (error) {
		console.error('❌ Error:', error);
		return null;
	}
}

async function approveKasbon(kasbonId) {
	try {
		console.log(`✅ Approving kasbon ${kasbonId}...`);

		const updates = {
			manager_hrd_approved: true,
			manager_hrd_approved_by: 'Manager HRD',
			manager_hrd_approved_date: new Date().toISOString().split('T')[0],
			approval_stage: 'approved',
			overall_status: 'approved',
			final_approved_by: 'Manager HRD',
			final_approved_date: new Date().toISOString().split('T')[0],
			status: 'approved'
		};

		const result = await directusApi(`items/kasbon/${kasbonId}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		console.log('✅ Kasbon approved successfully!');
		console.log('📄 Updated data:', result.data);
	} catch (error) {
		console.error('❌ Error approving kasbon:', error);
	}
}

async function rejectKasbon(kasbonId, reason = 'Test rejection') {
	try {
		console.log(`❌ Rejecting kasbon ${kasbonId}...`);

		const updates = {
			manager_hrd_rejection_reason: reason,
			approval_stage: 'rejected',
			overall_status: 'rejected',
			final_rejection_reason: reason,
			status: 'rejected'
		};

		const result = await directusApi(`items/kasbon/${kasbonId}`, {
			method: 'PATCH',
			body: JSON.stringify(updates)
		});

		console.log('❌ Kasbon rejected successfully!');
		console.log('📄 Updated data:', result.data);
	} catch (error) {
		console.error('❌ Error rejecting kasbon:', error);
	}
}

// Run the test
console.log('🚀 Starting kasbon approval test...');
testApproval()
	.then(async (kasbonId) => {
		if (kasbonId) {
			// Ask user what to do
			console.log('\n🤔 What would you like to test?');
			console.log('1. Approve kasbon');
			console.log('2. Reject kasbon');
			console.log('Enter your choice (1 or 2):');

			// For this test, let's approve the kasbon
			await approveKasbon(kasbonId);
		}

		console.log('✨ Test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Test failed:', error);
		process.exit(1);
	});
