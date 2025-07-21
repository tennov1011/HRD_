import { fail } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    console.log('=== TRAINING LIST LOAD ===');
    console.log('VITE_DIRECTUS_URL:', VITE_DIRECTUS_URL ? 'SET' : 'NOT SET');
    console.log('VITE_DIRECTUS_TOKEN:', VITE_DIRECTUS_TOKEN ? 'SET' : 'NOT SET');
    
    if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
        console.error('Missing required environment variables for Directus');
        return {
            trainings: [],
            error: 'Konfigurasi server tidak lengkap. Hubungi administrator.'
        };
    }

    try {
        // Environment variables dari .env
        const directusUrl = VITE_DIRECTUS_URL;
        const directusToken = VITE_DIRECTUS_TOKEN;
        
        // Fetch training data
        const requestUrl = `${directusUrl}/items/training?sort=-date_started`;
        
        console.log('=== DEBUGGING DIRECTUS FETCH ===');
        console.log('Request URL:', requestUrl);
        
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('=== DIRECTUS RESPONSE ===');
        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch trainings:', errorText);
            throw new Error(`Failed to fetch trainings: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Training data loaded:', data.data?.length || 0, 'records');
        
        // Group trainings by status
        const allTrainings = data.data || [];
        
        /**
         * Filter training berdasarkan status
         * @param {any} training - Data training
         * @param {string} status - Status yang dicari
         * @returns {boolean} - True jika status sesuai
         */
        const filterByStatus = (training, status) => training.status === status;
        
        const scheduledTrainings = allTrainings.filter((/** @type {any} */ training) => filterByStatus(training, 'Dijadwalkan'));
        const ongoingTrainings = allTrainings.filter((/** @type {any} */ training) => filterByStatus(training, 'Berlangsung'));
        const completedTrainings = allTrainings.filter((/** @type {any} */ training) => filterByStatus(training, 'Selesai'));
        const cancelledTrainings = allTrainings.filter((/** @type {any} */ training) => filterByStatus(training, 'Dibatalkan'));

        return {
            trainings: allTrainings,
            scheduledTrainings,
            ongoingTrainings,
            completedTrainings,
            cancelledTrainings,
            error: null
        };
    } catch (err) {
        console.error('Error loading training list data:', err);
        const error = /** @type {Error} */ (err);
        
        return {
            trainings: [],
            scheduledTrainings: [],
            ongoingTrainings: [],
            completedTrainings: [],
            cancelledTrainings: [],
            error: `Gagal memuat data training: ${error.message}`
        };
    }
}

export const actions = {
    deleteTraining: async ({ request }) => {
        const data = await request.formData();
        const trainingId = data.get('id');

        if (!trainingId) {
            return fail(400, {
                error: true,
                message: 'ID training tidak ditemukan'
            });
        }

        try {
            // Environment variables dari .env
            const directusUrl = VITE_DIRECTUS_URL;
            const directusToken = VITE_DIRECTUS_TOKEN;

            // Delete training from Directus
            const response = await fetch(`${directusUrl}/items/training/${trainingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${directusToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Directus API Error Response:', response.status, response.statusText);
                console.error('Directus API Error Body:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    // Ignore parse error and use default message
                    errorData = { message: errorText };
                }
                
                // Extract more specific error message
                let specificError = 'Unknown error';
                if (errorData.errors && errorData.errors[0]) {
                    specificError = errorData.errors[0].message;
                } else if (errorData.message) {
                    specificError = errorData.message;
                }
                
                throw new Error(`HTTP error ${response.status}: ${specificError}`);
            }

            console.log('Training deleted successfully:', trainingId);

            return {
                success: true,
                message: 'Training berhasil dihapus!'
            };

        } catch (err) {
            console.error('Error deleting training:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal menghapus training: ${errorMessage}`
            });
        }
    }
};
