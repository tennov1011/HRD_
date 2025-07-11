// src/routes/recruitment/add/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    // This page will just show the add form
    return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Create new job posting
    create: async ({ request }) => {
        try {
            const formData = await request.formData();
            
            // Extract form data
            const title = formData.get('title');
            const department = formData.get('department');
            const description = formData.get('description');
            const requirementsText = formData.get('requirements');
            const deadlineStr = formData.get('deadline');
            const location = formData.get('location');
            
            console.log('Form data received:', {
                title, department, description, requirementsText, deadlineStr, location
            });
            
            // Validate required fields
            if (!title || !department || !description || !requirementsText || !deadlineStr || !location) {
                return fail(400, {
                    error: 'All fields are required',
                    data: Object.fromEntries(formData)
                });
            }
            
            // Parse requirements (split by new line)
            const requirements = String(requirementsText)
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            // Create job posting object - pastikan field names sesuai dengan schema Directus
            const jobPostingData = {
                title: String(title),
                department: String(department),
                description: String(description),
                requirements: requirements.join('\n'), // Simpan sebagai string dengan newline sebagai separator
                deadline: new Date(String(deadlineStr)).toISOString(),
                date_created: new Date().toISOString(),
                location: String(location)
            };
            
            console.log('Sending job posting data:', jobPostingData);
            
            // Save to database
            const result = await recruitmentService.createJobPosting(jobPostingData);
            
            console.log('Job posting created successfully:', result);
            
            // Redirect back to recruitment page
            throw redirect(303, '/recruitment');
            
        } catch (error) {
            // Check if this is a redirect error (has status property)
            if (typeof error === 'object' && error !== null && 'status' in error && error.status === 303) {
                // This is our redirect, so pass it along
                throw error;
            }
            
            console.error('Error creating job posting:', error);
            
            // Return detailed error for debugging
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to create job posting',
                data: {
                    title: title?.toString() || '',
                    department: department?.toString() || '',
                    description: description?.toString() || '',
                    requirements: requirementsText?.toString() || '',
                    deadline: deadlineStr?.toString() || '',
                    location: location?.toString() || ''
                }
            });
        }
    }
};
