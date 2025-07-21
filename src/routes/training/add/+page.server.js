import { fail } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    // Validasi environment variables
    console.log('=== TRAINING ADD LOAD ===');
    console.log('VITE_DIRECTUS_URL:', VITE_DIRECTUS_URL ? 'SET' : 'NOT SET');
    console.log('VITE_DIRECTUS_TOKEN:', VITE_DIRECTUS_TOKEN ? 'SET' : 'NOT SET');
    
    if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
        console.error('Missing required environment variables for Directus');
        return {
            employees: [],
            error: 'Konfigurasi server tidak lengkap. Hubungi administrator.'
        };
    }

    try {
        // Environment variables dari .env
        const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
        const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
        
        // Fetch hanya field yang diperlukan untuk trainer dan participant selection
        // Menggunakan collection 'register' seperti di employees
        const fields = [
            'id',
            'nama_lengkap',
            'no_karyawan',
            'divisi',
            'jabatan',
            'email'
        ].join(',');
        
        const requestUrl = `${directusUrl}/items/register?fields=${fields}&limit=1000&sort=nama_lengkap`;
        
        // Log request untuk debugging
        console.log('=== DEBUGGING DIRECTUS FETCH ===');
        console.log('Request URL:', requestUrl);
        
        // Fetch employees dari collection 'register' untuk trainer dan participant selection
        const employeesResponse = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Log response untuk debugging
        console.log('=== DIRECTUS RESPONSE ===');
        console.log('Response Status:', employeesResponse.status);
        console.log('Response OK:', employeesResponse.ok);

        if (!employeesResponse.ok) {
            const errorText = await employeesResponse.text();
            console.error('Failed to fetch employees:', errorText);
            throw new Error(`Failed to fetch employees: ${employeesResponse.status}`);
        }

        const employeesData = await employeesResponse.json();
        console.log('✅ Employees data loaded:', employeesData.data?.length || 0, 'records');
        const employees = employeesData.data || [];

        // Format employees untuk select options
        const formattedEmployees = employees.map((emp) => ({
            id: emp.id,
            name: emp.nama_lengkap || '-',
            no_karyawan: emp.no_karyawan || '-',
            email: emp.email || '-',
            divisi: emp.divisi || '-',
            jabatan: emp.jabatan || '-'
        }));

        return {
            employees: formattedEmployees,
            error: null
        };
    } catch (err) {
        console.error('Error loading training page data:', err);
        const error = /** @type {Error} */ (err);
        
        return {
            employees: [],
            error: `Gagal memuat data karyawan: ${error.message}`
        };
    }
}

export const actions = {
    createTraining: async ({ request }) => {
        const data = await request.formData();

        try {
            // Environment variables dari .env
            const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
            const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

            /**
             * Function to format time properly
             * @param {string | null | FormDataEntryValue} timeString - The time string to format
             * @returns {string | null} Formatted time string
             */
            function formatTime(timeString) {
                if (!timeString) return null;
                const [hours, minutes] = timeString.split(':');
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

            console.log('Training data to be saved:', trainingData);

            // Post to Directus
            const response = await fetch(`${directusUrl}/items/training`, {
                method: 'POST',
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
            console.log('Training created successfully:', responseData);
            console.log('Returning success response with data:', {
                success: true,
                message: 'Training berhasil dijadwalkan!',
                trainingId: responseData.data?.id
            });

            return {
                success: true,
                message: 'Training berhasil dijadwalkan!',
                trainingId: responseData.data?.id
            };

        } catch (err) {
            console.error('Error creating training:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal menjadwalkan training: ${errorMessage}`
            });
        }
    }
};