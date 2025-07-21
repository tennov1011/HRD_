/**
 * Firebase User Setup Configuration
 *
 * This file contains the configuration for creating Firebase users
 * for the HRD system. Use this to set up users in Firebase Authentication.
 *
 * NOTE: This file should only be used for initial setup or user management.
 * Do not expose passwords in production code.
 */

// User configurations as requested
export const firebaseUsers = [
	{
		email: 'hrd@eltama.com',
		password: 'isi_password_HRD_Admin', // Replace with actual password
		displayName: 'HRD Admin',
		role: 'admin',
		department: 'HRD',
		description: 'HRD Administrator with full access to HRD functions'
	},
	{
		email: 'manager.hrd@eltama.com',
		password: 'isi_password_Manager_HRD', // Replace with actual password
		displayName: 'Manager HRD',
		role: 'manager',
		department: 'HRD',
		description: 'HRD Manager with approval and management capabilities'
	},
	{
		email: 'direktur@eltama.com',
		password: 'isi_password_Direktur', // Replace with actual password
		displayName: 'Direktur Utama',
		role: 'direktur',
		department: 'Direktur',
		description: 'Director with highest level access and approval authority'
	}
];

/**
 * Function to create users in Firebase Authentication
 * This should be run manually or through a setup script
 */
export async function createFirebaseUsers() {
	const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
	const { auth } = await import('./firebaseConfig.js');

	if (!auth) {
		throw new Error('Firebase auth not initialized');
	}

	console.log('Starting Firebase user creation...');

	for (const user of firebaseUsers) {
		try {
			console.log(`Creating user: ${user.email}`);

			// Create user with email and password
			const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);

			// Update display name
			await updateProfile(userCredential.user, {
				displayName: user.displayName
			});

			console.log(`✅ Successfully created user: ${user.email} (${user.displayName})`);
		} catch (error) {
			if (error.code === 'auth/email-already-in-use') {
				console.log(`⚠️  User ${user.email} already exists`);
			} else {
				console.error(`❌ Error creating user ${user.email}:`, error.message);
			}
		}
	}

	console.log('Firebase user creation completed');
}

/**
 * Instructions for manual setup:
 *
 * 1. Open the Firebase Console (https://console.firebase.google.com)
 * 2. Go to your project > Authentication > Users
 * 3. Click "Add user" and create the following accounts:
 *
 *    - Email: hrd@eltama.com
 *      Password: [isi_password_HRD_Admin]
 *
 *    - Email: manager.hrd@eltama.com
 *      Password: [isi_password_Manager_HRD]
 *
 *    - Email: direktur@eltama.com
 *      Password: [isi_password_Direktur]
 *
 * 4. The role and department will be automatically assigned based on
 *    the roleDefinitions in firebaseConfig.js
 */

export default firebaseUsers;
