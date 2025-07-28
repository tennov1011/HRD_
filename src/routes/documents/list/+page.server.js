import { fail } from '@sveltejs/kit';
import { 
  VITE_DIRECTUS_URL, 
  VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    console.log('=== DOCUMENTS LIST LOAD ===');
    console.log('VITE_DIRECTUS_URL:', VITE_DIRECTUS_URL ? 'SET' : 'NOT SET');
    console.log('VITE_DIRECTUS_TOKEN:', VITE_DIRECTUS_TOKEN ? 'SET' : 'NOT SET');
    console.log('Current URL:', url.pathname);
    
    if (!VITE_DIRECTUS_URL || !VITE_DIRECTUS_TOKEN) {
        console.error('Missing required environment variables for Directus');
        return {
            documents: [],
            error: 'Konfigurasi server tidak lengkap. Hubungi administrator.'
        };
    }

    try {
        // Environment variables dari .env
        const directusUrl = VITE_DIRECTUS_URL;
        const directusToken = VITE_DIRECTUS_TOKEN;
        
        // Get search query parameter
        const searchQuery = url.searchParams.get('search') || '';

        // Build base request URL (include file relation to get file information)
        let requestUrl = `${directusUrl}/items/document?sort=-date_created&fields=*,file.*`;

        if (searchQuery) {
            // Search in title or description
            requestUrl += `&filter[_or][0][title][_contains]=${encodeURIComponent(searchQuery)}`;
            requestUrl += `&filter[_or][1][description][_contains]=${encodeURIComponent(searchQuery)}`;
        }
        
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
            console.error('Failed to fetch documents:', errorText);
            throw new Error(`Failed to fetch documents: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Documents data loaded:', data.data?.length || 0, 'records');
        
        // Process documents to add download URLs
        const allDocuments = data.data || [];
        
        // Add download URLs to each document
        allDocuments.forEach((/** @type {any} */ doc) => {
            if (doc.file && doc.file.id) {
                // Create download URL for the file
                doc.downloadUrl = `${directusUrl}/assets/${doc.file.id}?download`;
                doc.fileName = doc.file.filename_download || 'document';
                doc.fileType = doc.file.type || 'application/octet-stream';
            }
        });
        
        /**
         * Filter documents by category
         * @param {any} document - Document data
         * @param {string} category - Category to filter by
         * @returns {boolean} - True if category matches
         */
        const filterByCategory = (document, category) => document.category === category;
        
        const sopDocuments = allDocuments.filter((/** @type {any} */ document) => 
            filterByCategory(document, 'SOP Departemen'));
        const sopGeneralDocuments = allDocuments.filter((/** @type {any} */ document) => 
            filterByCategory(document, 'SOP General'));
        const workInstructionDocuments = allDocuments.filter((/** @type {any} */ document) => 
            filterByCategory(document, 'Work Instruction'));
        const ppDocuments = allDocuments.filter((/** @type {any} */ document) => 
            filterByCategory(document, 'PP'));
        const kebijakanDocuments = allDocuments.filter((/** @type {any} */ document) => 
            filterByCategory(document, 'Kebijakan'));
        const activeDocuments = allDocuments.filter((/** @type {any} */ document) => 
            document.status === 'Active');
        const inactiveDocuments = allDocuments.filter((/** @type {any} */ document) => 
            document.status === 'Inactive');

        return {
            documents: allDocuments,
            sopDocuments,
            sopGeneralDocuments,
            workInstructionDocuments,
            ppDocuments,
            kebijakanDocuments,
            activeDocuments,
            inactiveDocuments,
            searchQuery,
            error: null
        };
    } catch (err) {
        console.error('Error loading document list data:', err);
        const error = /** @type {Error} */ (err);
        
        return {
            documents: [],
            sopDocuments: [],
            sopGeneralDocuments: [],
            workInstructionDocuments: [],
            ppDocuments: [],
            kebijakanDocuments: [],
            activeDocuments: [],
            inactiveDocuments: [],
            searchQuery: '',
            error: `Gagal memuat data dokumen: ${error.message}`
        };
    }
}

export const actions = {
    deleteDocument: async ({ request }) => {
        const data = await request.formData();
        const documentId = data.get('id');

        if (!documentId) {
            return fail(400, {
                error: true,
                message: 'ID dokumen tidak ditemukan'
            });
        }

        try {
            // Environment variables dari .env
            const directusUrl = VITE_DIRECTUS_URL;
            const directusToken = VITE_DIRECTUS_TOKEN;

            // Delete document from Directus
            const response = await fetch(`${directusUrl}/items/document/${documentId}`, {
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

            console.log('Document deleted successfully:', documentId);

            return {
                success: true,
                message: 'Dokumen berhasil dihapus!'
            };

        } catch (err) {
            console.error('Error deleting document:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal menghapus dokumen: ${errorMessage}`
            });
        }
    }
};
