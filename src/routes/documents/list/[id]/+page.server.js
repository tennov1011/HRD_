import { error } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    try {
        const documentId = params.id;
        
        if (!documentId) {
            throw error(400, 'Document ID is required');
        }
        
        const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
        const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
        
        // Fetch document by ID
        const response = await fetch(`${directusUrl}/items/document/${documentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${directusToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, 'Document not found');
            }
            throw error(response.status, `Failed to fetch document: ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('Document fetched successfully:', result.data);
        
        return {
            document: result.data,
            error: null
        };
    } catch (err) {
        console.error('Error loading document:', err);
        
        return {
            document: null,
            error: err instanceof Error ? err.message : 'Failed to load document'
        };
    }
}
