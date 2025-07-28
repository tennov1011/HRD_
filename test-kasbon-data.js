// Test script untuk melihat struktur kasbon collection
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

console.log('Using URL:', DIRECTUS_URL);
console.log('Token length:', DIRECTUS_TOKEN ? DIRECTUS_TOKEN.length : 0);

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

async function testKasbonData() {
	try {
		console.log('🔍 Testing Kasbon collection data...');

		// Get sample data with current fields
		const sampleData = await directusApi('items/kasbon?limit=5');
		console.log('📄 Sample Data (First item):', JSON.stringify(sampleData.data[0], null, 2));

		// Check if approval fields exist
		if (sampleData.data.length > 0) {
			const firstItem = sampleData.data[0];
			const approvalFields = [
				'approval_stage',
				'overall_status',
				'manager_hrd_approved',
				'manager_hrd_approved_by',
				'manager_hrd_approved_date',
				'manager_hrd_rejection_reason',
				'final_approved_by',
				'final_approved_date',
				'final_rejection_reason'
			];

			console.log('🔍 Checking approval fields:');
			approvalFields.forEach((field) => {
				const exists = field in firstItem;
				console.log(`  ${field}: ${exists ? '✅ exists' : '❌ missing'}`);
			});
		}
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

// Run the test
console.log('🚀 Starting kasbon data check...');
testKasbonData()
	.then(() => {
		console.log('✨ Check completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Check failed:', error);
		process.exit(1);
	});
