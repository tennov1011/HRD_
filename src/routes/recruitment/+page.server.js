// src/routes/recruitment/+page.server.js
import { fail } from '@sveltejs/kit';
import { recruitmentService } from '$lib/services/recruitmentService';
import { applicantService } from '$lib/services/applicantService';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        // Get all job postings 
        const jobPostings = await recruitmentService.getAllJobPostings();
        
        // Get active job postings (status = 'active' AND deadline > current date)
        const activeJobPostings = await recruitmentService.getActiveJobPostings();
        
        // Get inactive job postings (status = 'inactive' OR deadline <= current date)
        const inactiveJobPostings = await recruitmentService.getInactiveJobPostings();
        
        // Ambil semua pelamar untuk menghitung jumlah pelamar per lowongan
        const allApplicantsResponse = await applicantService.request('/items/job_applications');
        const allApplicants = allApplicantsResponse?.data || [];
        
        // Fungsi untuk menghitung jumlah pelamar dan menambahkannya ke objek lowongan
        const addApplicantCount = (jobs) => {
            if (!jobs || !Array.isArray(jobs)) return [];
            
            return jobs.map(job => {
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
        };
        
        // Tambahkan jumlah pelamar ke semua lowongan
        const jobPostingsWithCount = addApplicantCount(jobPostings?.data || []);
        const activeJobPostingsWithCount = addApplicantCount(activeJobPostings?.data || []);
        const inactiveJobPostingsWithCount = addApplicantCount(inactiveJobPostings?.data || []);
        
        return {
            jobPostings: jobPostingsWithCount,
            activeJobPostings: activeJobPostingsWithCount,
            inactiveJobPostings: inactiveJobPostingsWithCount,
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
    // Toggle job posting status
    toggleStatus: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            const currentStatus = formData.get('currentStatus');
            
            if (!id || !currentStatus) {
                return fail(400, { 
                    status: 'error',
                    message: 'ID lowongan dan status saat ini diperlukan' 
                });
            }
            
            // Toggle status
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            await recruitmentService.toggleJobStatus(String(id), newStatus);
            
            return {
                status: 'success'
            };
        } catch (error) {
            console.error('Error toggling job status:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal mengubah status lowongan'
            });
        }
    },

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
            const salary = formData.get('salary');
            const employment_type = formData.get('employment_type');
            const min_education = formData.get('min_education');
            const experience = formData.get('experience');
            
            // Validate required fields
            if (!title || !department || !description || !requirementsText || !deadlineStr || !location || !salary || !employment_type || !min_education || !experience) {
                return fail(400, {
                    error: 'Semua field diperlukan',
                    data: Object.fromEntries(formData)
                });
            }
            
            // Parse requirements (split by new line)
            const requirements = requirementsText
                .toString()
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            // Create job posting object dengan field status default 'active'
            const jobPostingData = {
                title,
                department,
                description,
                requirements: requirements.join('\n'),
                deadline: new Date(String(deadlineStr)).toISOString(),
                date_created: new Date().toISOString(),
                location,
                salary,
                employment_type,
                min_education,
                experience,
                status: 'active' // Default status
            };
            
            // Save to database
            const response = await recruitmentService.createJobPosting(jobPostingData);
            
            return {
                status: 'success',
                message: 'Lowongan pekerjaan berhasil dibuat',
                job: response?.data
            };
        } catch (error) {
            console.error('Error creating job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal membuat lowongan pekerjaan'
            });
        }
    },
    
    // Delete job posting
    delete: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = formData.get('id');
            
            if (!id) {
                return fail(400, { error: 'ID lowongan pekerjaan diperlukan' });
            }
            
            await recruitmentService.deleteJobPosting(String(id));
            
            return {
                status: 'success',
                message: 'Lowongan pekerjaan berhasil dihapus'
            };
        } catch (error) {
            console.error('Error deleting job posting:', error);
            return fail(500, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Gagal menghapus lowongan pekerjaan'
            });
        }
    }
};
