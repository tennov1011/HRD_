import { roleDefinitions } from '$lib/services/firebaseConfig.js';

export async function load({ cookies }) {
	// Ambil session dari cookies
	const session = cookies.get('session');

	if (session) {
		try {
			const userData = JSON.parse(session);
			console.log('Layout server: Session data found:', userData);

			// Cari role definition berdasarkan email
			const userDefinition = roleDefinitions.find(
				(def) => def.email.toLowerCase() === userData.email.toLowerCase()
			);

			console.log('Layout server: User definition found:', userDefinition);

			// Gabungkan data session dengan role definition
			const enrichedUser = {
				...userData,
				role: userDefinition?.role || 'user',
				department: userDefinition?.department || userData.divisi || 'General',
				displayName: userDefinition?.name || userData.nama || 'User'
			};

			console.log('Layout server: Enriched user data:', enrichedUser);

			return {
				user: enrichedUser,
				isAuthenticated: true
			};
		} catch (error) {
			console.error('Error parsing session:', error);
			// Hapus session yang rusak
			cookies.delete('session', { path: '/' });
		}
	}

	return {
		user: null,
		isAuthenticated: false
	};
}
