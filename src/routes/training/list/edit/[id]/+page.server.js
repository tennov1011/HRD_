import { error, fail, redirect } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load(/** @type {{ params: any }} */ { params }) {
    console.log('=== TRAINING EDIT LOAD ===');
    console.log('Training ID:', params.id);
    
    if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
        console.error('Missing required environment variables for Directus');
        throw error(500, 'Konfigurasi server tidak lengkap. Hubungi administrator.');
    }

    try {
        // Environment variables dari .env
        const directusUrl = VITE_DIRECTUS_URL;
        const directusToken = VITE_DIRECTUS_TOKEN;
        
        // Fetch training data by ID
        const requestUrl = `${directusUrl}/items/training/${params.id}`;
        
        console.log('Request URL:', requestUrl);
        
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch training detail:', errorText);
            throw error(response.status, `Failed to fetch training detail: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Training detail loaded');
        
        if (!data.data) {
            throw error(404, 'Training tidak ditemukan');
        }

        // Fetch employees data untuk trainer dan participant
        const employeesResponse = await fetch(`${directusUrl}/items/register?fields=id,nama_lengkap,no_karyawan,divisi,jabatan,email&limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!employeesResponse.ok) {
            console.error('Failed to fetch employees:', employeesResponse.statusText);
        }

        const employeesData = await employeesResponse.json();
        const employees = employeesData.data || [];

        return {
            training: data.data,
            employees,
            error: null
        };
    } catch (err) {
        console.error('Error loading training detail:', err);
        
        if (err.status) {
            throw err; // Throw error yang sudah ada status-nya
        }
        
        throw error(500, err instanceof Error ? err.message : 'An unknown error occurred');
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    default: async (/** @type {{ request: any, params: any }} */ { request, params }) => {
        const data = await request.formData();
        
        try {
            // Environment variables dari .env
            const directusUrl = VITE_DIRECTUS_URL;
            const directusToken = VITE_DIRECTUS_TOKEN;
            
            // Function to format time properly
            /** @param {string} timeString */
            function formatTime(timeString) {
                if (!timeString) return null;
                // Convert to string in case it's a FormDataEntryValue
                const timeStr = String(timeString);
                const [hours, minutes] = timeStr.split(':');
                return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }

            // Extract and format form data
            const trainingData = {
                training_title: data.get('training_title'),
                training_type: data.get('training_type'),
                description: data.get('description'),
                date_started: data.get('date_started'),
                date_finished: data.get('date_finished'),
                time_started: formatTime(data.get('time_started')),
                time_finished: formatTime(data.get('time_finished')),
                location: data.get('location'),
                status: data.get('status') || 'Dijadwalkan',
                note: data.get('note') || null,
                trainer: data.getAll('trainer'),
                participant: data.getAll('participant')
            };

            console.log('Training data to be updated:', trainingData);

            // Update training in Directus
            const response = await fetch(`${directusUrl}/items/training/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${directusToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(trainingData)
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

            const responseData = await response.json();
            console.log('Training updated successfully:', responseData);

            // Redirect to training list after successful update
            throw redirect(303, '/training/list');

        } catch (err) {
            console.error('Error updating training:', err);
            
            // If it's a redirect, throw it again
            if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
                throw err;
            }
            
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal mengupdate training: ${errorMessage}`
            });
        }
    }
}; 