// src/routes/recruitment/applications/+page.server.js
import { error, fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';
import { applicantService } from '$lib/services/applicantService';
import {
    VITE_DIRECTUS_URL,
    VITE_DIRECTUS_TOKEN
} from '$env/static/private';

/**
 * Helper function to fetch master data
 */
async function fetchMasterData() {
    try {
        const directusUrl = VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
        const directusToken = VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

        const response = await fetch(`${directusUrl}/items/master_data?limit=-1`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch master_data:', response.status, response.statusText);
            return {
                lokasi_absen: []
            };
        }

        const result = await response.json();
        const allMasterData = result.data || [];

        // Filter dan format data lokasi_absen
        const masterData = {
            lokasi_absen: allMasterData
                .filter(/** @param {{category: string, status: string}} item */ item => item.category === 'lokasi_absen' && item.status === 'aktif')
                .map(/** @param {{nama: string, id: string, alamat?: string}} item */ item => ({
                    value: item.nama,
                    label: item.nama,
                    id: item.id,
                    alamat: item.alamat || ''
                }))
        };

        return masterData;
    } catch (err) {
        console.error('Error fetching master data:', err);
        return {
            lokasi_absen: []
        };
    }
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    try {
        // First, update any expired jobs to inactive status
        await recruitmentService.updateExpiredJobsToInactive();
        
        // Get job ID from query parameter
        const jobId = url.searchParams.get('jobId');
        
        // Get applicant ID if we're viewing a single applicant
        const applicantId = url.searchParams.get('applicantId');
        
        if (!jobId) {
            // If no job ID, return list of all job postings with status field
            const jobPostings = await recruitmentService.getAllJobPostings();
            
            // Fetch master data
            const masterData = await fetchMasterData();
            
            // Jika ada job postings, ambil jumlah pelamar untuk masing-masing lowongan
            if (jobPostings?.data && jobPostings.data.length > 0) {
                // Ambil semua pelamar
                const allApplicantsResponse = await applicantService.request('/items/job_applications');
                const allApplicants = allApplicantsResponse?.data || [];
                
                // Hitung jumlah pelamar untuk setiap lowongan
                jobPostings.data = jobPostings.data.map(job => {
                    // Hitung pelamar yang melamar untuk lowongan ini
                    const applicantCount = allApplicants.filter(
                        applicant => String(applicant.appliedJobId) === String(job.id)
                    ).length;
                    
                    // Tambahkan jumlah pelamar ke objek lowongan
                    return {
                        ...job,
                        applicantCount
                    };
                });
            }
            
            return {
                jobPostings: jobPostings?.data || [],
                selectedJob: null,
                applications: [],
                applicant: null,
                supportingDocuments: null,
                masterData
            };
        }
        
        // Get specific job posting
        const jobResponse = await recruitmentService.getJobPostingById(jobId);
        
        if (!jobResponse?.data) {
            throw error(404, 'Job posting not found');
        }
        
        // Fetch master data
        const masterData = await fetchMasterData();
        
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
        
        // Tambahkan jumlah pelamar ke objek lowongan yang dipilih
        const selectedJob = jobResponse.data;
        selectedJob.applicantCount = (applicationsResponse?.data || []).length;
        
        return {
            selectedJob,
            applications: applicationsResponse?.data || [],
            applicant,
            supportingDocuments,
            masterData
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
            
            // @ts-ignore - Mengabaikan TypeScript error untuk addSupportingDocument
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
