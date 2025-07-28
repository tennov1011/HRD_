// src/routes/documents/add/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import {
    VITE_DIRECTUS_URL,
    VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
        const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

        // Fetch all master_data from Directus
        const response = await fetch(`${directusUrl}/items/master_data?limit=-1`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch master_data:', response.status, response.statusText);
            return {
                departments: []
            };
        }

        const result = await response.json();
        const allMasterData = result.data || [];

        // Filter for departments (using divisi category)
        const departments = allMasterData
            // @ts-ignore - Ignoring type checking for the filter callback
            .filter(item => item.category === 'divisi' && item.status === 'aktif')
            // @ts-ignore - Ignoring type checking for the map callback
            .map(item => ({
                value: item.nama || '',
                label: item.nama || '',
                id: item.id || ''
            }));

        console.log('Departments loaded:', departments.length);

        return {
            departments
        };

    } catch (error) {
        console.error('Error loading departments:', error);
        return {
            departments: []
        };
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Create new document
    create: async ({ request }) => {
        let title, status, description, created_by, department, category, file;
        try {
            const formData = await request.formData();
            title = formData.get('title');
            status = formData.get('status');
            description = formData.get('description');
            created_by = formData.get('created_by');
            department = formData.get('department');
            category = formData.get('category');
            file = formData.get('file');

            console.log('Form data received:', {
                title, status, description, created_by, department, category
            });

            // Validate required fields
            if (!title || !status || !description || !created_by || !department || !category || !file) {
                return fail(400, {
                    error: 'All fields are required',
                    data: Object.fromEntries(formData)
                });
            }

            // Check if file is uploaded
            if (!(file instanceof File) || file.size === 0) {
                return fail(400, {
                    error: 'Please upload a valid document file',
                    data: Object.fromEntries(formData)
                });
            }

            const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
            const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

            // 1. First upload the file to Directus
            const fileFormData = new FormData();
            fileFormData.append('file', file);

            const fileUploadResponse = await fetch(`${directusUrl}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${directusToken}`
                },
                body: fileFormData
            });

            if (!fileUploadResponse.ok) {
                console.error('Failed to upload file:', fileUploadResponse.status, fileUploadResponse.statusText);
                return fail(500, {
                    error: 'Failed to upload document file',
                    data: Object.fromEntries(formData)
                });
            }

            const fileData = await fileUploadResponse.json();
            const fileId = fileData.data.id;

            // 2. Create document record
            const documentData = {
                title: String(title),
                status: String(status).charAt(0).toUpperCase() + String(status).slice(1), // Capitalize status
                date_created: new Date().toISOString(),
                description: String(description),
                created_by: String(created_by),
                department: String(department),
                category: String(category),
                file: fileId
            };

            console.log('Sending document data:', documentData);

            // Save document to database
            const documentResponse = await fetch(`${directusUrl}/items/document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${directusToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(documentData)
            });

            if (!documentResponse.ok) {
                console.error('Failed to create document:', documentResponse.status, documentResponse.statusText);
                return fail(500, {
                    error: 'Failed to create document record',
                    data: Object.fromEntries(formData)
                });
            }

            const documentResult = await documentResponse.json();
            const documentId = documentResult.data.id;

            // 3. Update the document with the generated code based on category mapping
            const categoryStr = String(category);

            // Mapping kategori ke kode prefix
            const categoryCodeMap = {
                'SOP Departemen': 'SOPD',
                'SOP General': 'SOPG',
                'Kebijakan': 'KK',
                'PP': 'PP', // shorthand already
                'PP (Peraturan Perusahaan)': 'PP',
                'Work Instruction': 'WK'
            };

            const prefix = categoryCodeMap[categoryStr] || categoryStr.replace(/\s+/g, '-').toUpperCase();

            const code = prefix + '-' + documentId;
            
            const updateResponse = await fetch(`${directusUrl}/items/document/${documentId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${directusToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code
                })
            });

            if (!updateResponse.ok) {
                console.error('Failed to update document code:', updateResponse.status, updateResponse.statusText);
                // We don't fail here since the document is already created
            }

            console.log('Document created successfully with code:', code);

            // Redirect back to documents page
            throw redirect(303, '/documents/list');

        } catch (error) {
            // Check if this is a redirect error (has status property)
            if (typeof error === 'object' && error !== null && 'status' in error && error.status === 303) {
                // This is our redirect, so pass it along
                throw error;
            }

            console.error('Error creating document:', error);

            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to create document',
                data: {
                    title: title?.toString() || '',
                    status: status?.toString() || '',
                    description: description?.toString() || '',
                    created_by: created_by?.toString() || '',
                    department: department?.toString() || '',
                    category: category?.toString() || ''
                }
            });
        }
    }
};
