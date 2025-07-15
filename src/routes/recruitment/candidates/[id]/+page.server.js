import { applicantService } from '$lib/services/applicantService.js';
import { recruitmentService } from '$lib/services/recruitmentService.js';
import { error, fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
    try {
        const { id } = params;
        
        if (!id) {
            throw error(400, 'ID pelamar diperlukan');
        }
        
        // Create a function to get applicant detail with more comprehensive fields
        /** @param {string} applicantId - The ID of the applicant */
        async function getApplicantDetail(applicantId) {
            try {
                // Try using the service method first
                const endpoint = `/items/job_applications/${applicantId}`;
                console.log('Using applicantService.request for:', endpoint);
                const response = await applicantService.request(endpoint);
                return response.data;
            } catch (err) {
                console.error('Error with service method, trying direct fetch:', err);
                
                // Fallback to direct fetch with minimal fields
                const endpoint = `/items/job_applications/${applicantId}`;
                const url = `${applicantService.baseURL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${applicantService.token}`
                    }
                };

                console.log('Fetching applicant with URL:', url);
                console.log('Token being used:', applicantService.token ? 'Token exists' : 'No token');
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Error fetching applicant (${response.status}):`, errorText);
                    
                    if (response.status === 404) {
                        throw error(404, 'Data pelamar tidak ditemukan');
                    } else if (response.status === 403) {
                        throw error(403, 'Tidak memiliki akses untuk melihat data pelamar ini');
                    }
                    throw new Error(`HTTP error ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                return data.data;
            }
        }
        
        // Function to get all job postings (just id and title)
        async function getAllJobPostings() {
            const endpoint = '/items/job_postings?fields=id,title';
            
            const url = `${recruitmentService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${recruitmentService.token}`
                }
            };
            
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    console.error(`Error fetching job postings: HTTP error ${response.status}`);
                    return [];
                }
                
                const data = await response.json();
                return data.data || [];
            } catch (err) {
                console.error('Error fetching job postings:', err);
                return [];
            }
        }
        
        // Fetch the applicant details and job postings in parallel
        const [applicant, jobPostings] = await Promise.all([
            getApplicantDetail(id),
            getAllJobPostings()
        ]);
        
        if (!applicant) {
            throw error(404, 'Data pelamar tidak ditemukan');
        }
          // Find the matching job posting
        let jobTitle = null;
        if (applicant.appliedJobId && jobPostings && jobPostings.length > 0) {
            // @ts-ignore - Ignore TypeScript checking for this line
            const matchingJob = jobPostings.find(job => String(job.id) === String(applicant.appliedJobId));
            if (matchingJob) {
                jobTitle = matchingJob.title;
            }
        }

        // Process file URLs untuk foto profil dan dokumen
        if (applicant.profilePhoto) {
            if (typeof applicant.profilePhoto === 'object' && applicant.profilePhoto.id) {
                applicant.profilePhotoUrl = `${applicantService.baseURL}/assets/${applicant.profilePhoto.id}`;
            } else if (typeof applicant.profilePhoto === 'string') {
                applicant.profilePhotoUrl = `${applicantService.baseURL}/assets/${applicant.profilePhoto}`;
            }
        }

        // Process URLs untuk dokumen - handle both direct URLs and Directus file objects
        // For resumeFileUrl
        if (applicant.resumeFileUrl) {
            if (typeof applicant.resumeFileUrl === 'object' && applicant.resumeFileUrl.id) {
                applicant.resumeFileUrl = `${applicantService.baseURL}/assets/${applicant.resumeFileUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }
        
        // For degreeCertificateUrl
        if (applicant.degreeCertificateUrl) {
            if (typeof applicant.degreeCertificateUrl === 'object' && applicant.degreeCertificateUrl.id) {
                applicant.degreeCertificateUrl = `${applicantService.baseURL}/assets/${applicant.degreeCertificateUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }
        
        // For transcriptUrl
        if (applicant.transcriptUrl) {
            if (typeof applicant.transcriptUrl === 'object' && applicant.transcriptUrl.id) {
                applicant.transcriptUrl = `${applicantService.baseURL}/assets/${applicant.transcriptUrl.id}`;
            }
            // If it's already a string URL (like Google Drive), keep it as is
        }

        return {
            applicant,
            jobTitle
        };
    } catch (err) {
        // Check if it's an SvelteKit error (status code available)
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }
        
        console.error('Error loading applicant data:', err);
        throw error(500, 'Gagal memuat data pelamar');
    }
}

export const actions = {
    updateStatus: async ({ request, params }) => {
        const data = await request.formData();
        const status = data.get('status');
        const note = data.get('note');
        
        console.log('Form data received:', { status, note });
        
        try {
            const applicantId = params.id;
            
            // Prepare update data with explicit typing
            /** @type {Record<string, any>} */
            const updateData = {};
            
            if (status) {
                updateData.applicationStatus = status;
            }
            
            // Add note field - try the correct field name
            if (note && typeof note === 'string' && note.trim()) {
                const noteValue = note.trim();
                // Just use one field name at a time to see which one works
                updateData.note = noteValue; // Most common field name
            }
            
            console.log('Update data being sent:', JSON.stringify(updateData, null, 2));
            
            // Use the service method instead of direct fetch
            try {
                const endpoint = `/items/job_applications/${applicantId}`;
                const response = await applicantService.request(endpoint, {
                    method: 'PATCH',
                    body: JSON.stringify(updateData)
                });
                
                console.log('Service response:', response);
                
                return {
                    success: true,
                    message: 'Status kandidat berhasil diperbarui',
                    updatedStatus: status,
                    updatedNote: note
                };
            } catch (serviceError) {
                console.error('Service error, trying direct fetch:', serviceError);
                
                // Fallback to direct fetch
                const endpoint = `/items/job_applications/${applicantId}`;
                const url = `${applicantService.baseURL}${endpoint}`;
                const config = {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${applicantService.token}`
                    },
                    body: JSON.stringify(updateData)
                };

                const response = await fetch(url, config);
                
                console.log('Direct fetch response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error response:', errorText);
                    throw new Error(`HTTP error ${response.status}: ${errorText}`);
                }
                
                const responseData = await response.json();
                console.log('API Response data:', responseData);
                
                return {
                    success: true,
                    message: 'Status kandidat berhasil diperbarui',
                    updatedStatus: status,
                    updatedNote: note
                };
            }
        } catch (err) {
            console.error('Error updating applicant status:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return fail(400, {
                error: true,
                message: `Gagal memperbarui status kandidat: ${errorMessage}`
            });
        }
    }
};
