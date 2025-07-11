// src/routes/recruitment/+page.server.js
import { fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        // Get all job postings 
        const jobPostings = await recruitmentService.getAllJobPostings();
        
        // Get active job postings (deadline > current date)
        const activeJobPostings = await recruitmentService.getActiveJobPostings();
        
        // Get inactive job postings (deadline <= current date)
        const inactiveJobPostings = await recruitmentService.getInactiveJobPostings();
        
        return {
            jobPostings: jobPostings?.data || [],
            activeJobPostings: activeJobPostings?.data || [],
            inactiveJobPostings: inactiveJobPostings?.data || [],
            status: 'success'
        };
    } catch (error) {
        console.error('Error loading job postings:', error);
        return {
            jobPostings: [],
            activeJobPostings: [],
            inactiveJobPostings: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
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
            
            // Validate required fields
            if (!title || !department || !description || !requirementsText || !deadlineStr) {
                return fail(400, {
                    error: 'All fields are required',
                    data: Object.fromEntries(formData)
                });
            }
            
            // Parse requirements (split by new line)
            const requirements = requirementsText
                .toString()
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            // Create job posting object
            const jobPostingData = {
                title,
                department,
                description,
                requirements,
                deadline: new Date(String(deadlineStr)).toISOString(),
                date_created: new Date().toISOString()
            };
            
            // Save to database
            const response = await recruitmentService.createJobPosting(jobPostingData);
            
            return {
                status: 'success',
                message: 'Job posting created successfully',
                job: response?.data
            };
        } catch (error) {
            console.error('Error creating job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to create job posting'
            });
        }
    },
    
    // Delete job posting
    delete: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            
            if (!id) {
                return fail(400, { error: 'Job posting ID is required' });
            }
            
            await recruitmentService.deleteJobPosting(String(id));
            
            return {
                status: 'success',
                message: 'Job posting deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to delete job posting'
            });
        }
    }
};
