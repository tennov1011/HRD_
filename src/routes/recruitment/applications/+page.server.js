// src/routes/recruitment/applications/+page.server.js
import { error, fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';
import { applicantService } from '$lib/services/applicantService';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    try {
        // Get job ID from query parameter
        const jobId = url.searchParams.get('jobId');
        
        // Get applicant ID if we're viewing a single applicant
        const applicantId = url.searchParams.get('applicantId');
        
        if (!jobId) {
            // If no job ID, return list of all job postings
            const jobPostings = await recruitmentService.getAllJobPostings();
            
            return {
                jobPostings: jobPostings?.data || [],
                selectedJob: null,
                applications: [],
                applicant: null,
                supportingDocuments: null
            };
        }
        
        // Get specific job posting
        const jobResponse = await recruitmentService.getJobPostingById(jobId);
        
        if (!jobResponse?.data) {
            throw error(404, 'Job posting not found');
        }
        
        // Get applications for this job
        const applicationsResponse = await applicantService.getApplicantsByJobId(jobId);
        
        let applicant = null;
        let supportingDocuments = null;
        
        // If viewing a specific applicant, get their details and documents
        if (applicantId) {
            const applicantResponse = await applicantService.getApplicantById(applicantId);
            applicant = applicantResponse?.data;
            
            if (applicant) {
                const documentsResponse = await applicantService.getSupportingDocuments(applicantId);
                supportingDocuments = documentsResponse?.data || [];
            }
        }
        
        return {
            selectedJob: jobResponse.data,
            applications: applicationsResponse?.data || [],
            applicant,
            supportingDocuments
        };
    } catch (err) {
        console.error('Error loading applications:', err);
        throw error(500, {
            message: err instanceof Error ? err.message : 'Failed to load applications'
        });
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    // Update applicant status
    updateStatus: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            const status = formData.get('status'); // UI status (baru, diproses, etc.)
            const jobId = formData.get('jobId');
            
            if (!id || !status || !jobId) {
                return fail(400, { 
                    error: 'Missing required fields',
                    success: false
                });
            }
            
            // Convert UI status to database status
            const statusMap = {
                'baru': 'pending',
                'diproses': 'reviewed',
                'wawancara': 'interview', 
                'tes': 'test',
                'diterima': 'accepted',
                'ditolak': 'rejected'
            };
            
            const dbStatus = statusMap[String(status)] || 'pending';
            
            await applicantService.updateApplicantStatus(String(id), dbStatus);
            
            return {
                success: true,
                message: 'Applicant status updated successfully'
            };
        } catch (err) {
            console.error('Error updating applicant status:', err);
            return fail(500, {
                error: err instanceof Error ? err.message : 'Failed to update applicant status',
                success: false
            });
        }
    },
    
    // Upload supporting document
    uploadDocument: async ({ request }) => {
        try {
            const formData = await request.formData();
            const applicantId = formData.get('applicantId');
            const documentType = formData.get('documentType');
            const file = formData.get('document');
            const jobId = formData.get('jobId');
            
            if (!applicantId || !documentType || !file || !jobId) {
                return fail(400, { 
                    error: 'Missing required fields',
                    success: false
                });
            }
            
            // Check if file is actually a file
            if (!(file instanceof File)) {
                return fail(400, { 
                    error: 'Invalid file',
                    success: false
                });
            }
            
            await applicantService.addSupportingDocument(
                String(applicantId),
                file,
                String(documentType)
            );
            
            return {
                success: true,
                message: 'Document uploaded successfully'
            };
        } catch (err) {
            console.error('Error uploading document:', err);
            return fail(500, {
                error: err instanceof Error ? err.message : 'Failed to upload document',
                success: false
            });
        }
    }
};
