import { error } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    console.log('=== TRAINING DETAIL LOAD ===');
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

        const trainingData = data.data;

        // Normalisasi nilai trainer & participant menjadi array jika diperlukan
        /**
         * @param {unknown} value
         * @returns {string[]}
         */
        function normalizeToArray(value) {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                let str = value.trim();
                if (!str) return [];

                // Jika string terlihat seperti array JSON, coba parse
                if (str.startsWith('[') && str.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(str);
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    } catch {
                        // fallback to manual processing
                    }
                }

                // Hilangkan tanda kurung siku jika masih ada
                str = str.replace(/^\[/, '').replace(/\]$/, '');

                // Bagi dengan koma, hilangkan kutip ganda/single dan spasi
                return str.split(',')
                    .map((s) => s.replace(/^["']|["']$/g, '').trim())
                    .filter(Boolean);
            }
            return [];
        }

        trainingData.trainer = normalizeToArray(trainingData.trainer);
        trainingData.participant = normalizeToArray(trainingData.participant);

        return {
            training: trainingData,
            error: null
        };
    } catch (err) {
        console.error('Error loading training detail:', err);
        
        if (err && typeof err === 'object' && 'status' in err) {
            throw err; // Throw error yang sudah ada status-nya
        }
        
        throw error(500, err instanceof Error ? err.message : 'An unknown error occurred');
    }
} 