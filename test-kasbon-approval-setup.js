// Test script untuk melihat struktur kasbon collection dan menambah field approval

const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
// Ganti dengan token yang benar
const DIRECTUS_TOKEN = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

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

async function testKasbonStructure() {
	try {
		console.log('🔍 Testing Kasbon collection structure...');
		
		// Get collection info
		const collectionInfo = await directusApi('collections/kasbon');
		console.log('📊 Collection Info:', JSON.stringify(collectionInfo, null, 2));
		
		// Get fields info
		const fieldsInfo = await directusApi('fields/kasbon');
		console.log('🏗️ Fields Info:', JSON.stringify(fieldsInfo.data, null, 2));
		
		// Get sample data
		const sampleData = await directusApi('items/kasbon?limit=1');
		console.log('📄 Sample Data:', JSON.stringify(sampleData.data, null, 2));
		
	} catch (error) {
		console.error('❌ Error:', error);
	}
}

async function addApprovalFields() {
	try {
		console.log('➕ Adding approval fields to kasbon collection...');
		
		const fields = [
			{
				field: 'approval_stage',
				type: 'string',
				meta: {
					interface: 'select-dropdown-m2o',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'full',
					translations: null,
					note: 'Current approval stage of the kasbon request',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'approval_stage',
					table: 'kasbon',
					type: 'varchar',
					default_value: 'pending',
					max_length: 50,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'overall_status',
				type: 'string',
				meta: {
					interface: 'select-dropdown-m2o',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'full',
					translations: null,
					note: 'Overall status of the kasbon request',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'overall_status',
					table: 'kasbon',
					type: 'varchar',
					default_value: 'pending',
					max_length: 50,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'manager_hrd_approved',
				type: 'boolean',
				meta: {
					interface: 'boolean',
					display: 'boolean',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'half',
					translations: null,
					note: 'Whether approved by Manager HRD',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'manager_hrd_approved',
					table: 'kasbon',
					type: 'boolean',
					default_value: false,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'manager_hrd_approved_by',
				type: 'string',
				meta: {
					interface: 'input',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'half',
					translations: null,
					note: 'Name of Manager HRD who approved',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'manager_hrd_approved_by',
					table: 'kasbon',
					type: 'varchar',
					default_value: null,
					max_length: 255,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'manager_hrd_approved_date',
				type: 'date',
				meta: {
					interface: 'datetime',
					display: 'datetime',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'half',
					translations: null,
					note: 'Date when Manager HRD approved',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'manager_hrd_approved_date',
					table: 'kasbon',
					type: 'date',
					default_value: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'manager_hrd_rejection_reason',
				type: 'text',
				meta: {
					interface: 'input-multiline',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'full',
					translations: null,
					note: 'Reason for rejection by Manager HRD',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'manager_hrd_rejection_reason',
					table: 'kasbon',
					type: 'text',
					default_value: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'final_approved_by',
				type: 'string',
				meta: {
					interface: 'input',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'half',
					translations: null,
					note: 'Final approver name',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'final_approved_by',
					table: 'kasbon',
					type: 'varchar',
					default_value: null,
					max_length: 255,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'final_approved_date',
				type: 'date',
				meta: {
					interface: 'datetime',
					display: 'datetime',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'half',
					translations: null,
					note: 'Final approval date',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'final_approved_date',
					table: 'kasbon',
					type: 'date',
					default_value: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			},
			{
				field: 'final_rejection_reason',
				type: 'text',
				meta: {
					interface: 'input-multiline',
					display: 'raw',
					display_options: null,
					readonly: false,
					hidden: false,
					sort: null,
					width: 'full',
					translations: null,
					note: 'Final rejection reason',
					conditions: null,
					required: false,
					group: null,
					validation: null,
					validation_message: null
				},
				schema: {
					name: 'final_rejection_reason',
					table: 'kasbon',
					type: 'text',
					default_value: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null
				}
			}
		];
		
		for (const field of fields) {
			try {
				const result = await directusApi('fields/kasbon', {
					method: 'POST',
					body: JSON.stringify(field)
				});
				console.log(`✅ Added field: ${field.field}`);
			} catch (error) {
				console.log(`⚠️ Field ${field.field} might already exist:`, error.message);
			}
		}
		
		console.log('🎉 Approval fields setup completed!');
		
	} catch (error) {
		console.error('❌ Error adding approval fields:', error);
	}
}

// Run the test
console.log('🚀 Starting kasbon approval setup...');
testKasbonStructure()
	.then(() => addApprovalFields())
	.then(() => {
		console.log('✨ Setup completed successfully!');
		process.exit(0);
	})
	.catch(error => {
		console.error('💥 Setup failed:', error);
		process.exit(1);
	});
