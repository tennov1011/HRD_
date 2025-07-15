// src/routes/recruitment/add/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';
import {
    VITE_DIRECTUS_URL,
    VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    try {
        const directusUrl = VITE_DIRECTUS_URL;
        const directusToken = VITE_DIRECTUS_TOKEN;

        // 1. Fetch job posting data
        const jobPosting = await recruitmentService.getJobPostingById(params.id);
        
        if (!jobPosting?.data) {
            throw new Error('Job posting not found');
        }

        // 2. Fetch master data
        const response = await fetch(`${directusUrl}/items/master_data?limit=-1`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch master data');
        }

        const result = await response.json();
        const allMasterData = result.data || [];

        // Filter dan format data lokasi_absen
        const masterData = {
            lokasi_absen: allMasterData
                .filter(item => item.category === 'lokasi_absen' && item.status === 'aktif')
                .map(item => ({
                    value: item.alamat,
                    label: item.alamat,
                    id: item.id,
                    alamat: item.alamat || ''
                }))
        };

        return {
            jobPosting: jobPosting.data,
            masterData,
            error: null
        };

    } catch (error) {
        console.error('Error loading data:', error);
        return {
            error: error.message,
            jobPosting: null,
            masterData: {
                lokasi_absen: []
            }
        };
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, params }) => {
        try {
            const formData = await request.formData();
            
            // Log formData untuk debugging
            console.log('Form data received:', Object.fromEntries(formData));
            
            const jobPostingData = {
                title: formData.get('title'),
                department: formData.get('department'),
                description: formData.get('description'),
                requirements: formData.get('requirements'),
                deadline: new Date(formData.get('deadline')).toISOString(),
                location: formData.get('location'),
                salary: formData.get('salary'),
                employment_type: formData.get('employment_type'),
                min_education: formData.get('min_education'),
                experience: formData.get('experience')
            };

            // Validate required fields
            for (const [key, value] of Object.entries(jobPostingData)) {
                if (!value) {
                    return fail(400, {
                        error: `${key} is required`,
                        data: Object.fromEntries(formData)
                    });
                }
            }

            // Update job posting
            const result = await recruitmentService.updateJobPosting(params.id, jobPostingData);
            
            console.log('Update result:', result);
            
            // Jika sampai di sini, berarti update berhasil
            throw redirect(303, '/recruitment');

        } catch (error) {
            // Jika error adalah redirect, lempar kembali
            if (error?.status === 303) {
                throw error;
            }
            
            console.error('Error updating job posting:', error);
            return fail(500, {
                error: error.message || 'Failed to update job posting'
            });
        }
    }
};
