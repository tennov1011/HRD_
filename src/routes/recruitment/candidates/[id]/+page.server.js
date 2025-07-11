import { applicantService } from '$lib/services/applicantService.js';
import { recruitmentService } from '$lib/services/recruitmentService.js';
import { error } from '@sveltejs/kit';

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
            // Use the existing request method in the applicantService but with more fields
            // Include all the fields based on the defined variables in the UI
            const endpoint = `/items/job_applications/${applicantId}?fields=id,fullName,gender,placeOfBirth,dateOfBirth,email,phoneNumber,currentAddress,highestEducation,institutionName,finalScore,studyProgram,workExperienceYears,previousCompany,lastPosition,jobDescription,resumeFileUrl.*,coverLetter,degreeCertificateUrl.*,transcriptUrl.*,profilePhoto.*,appliedJobId,howDidYouHear,expectedSalary,applicationStatus,date_created`;
            
            const url = `${applicantService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${applicantService.token}`
                }
            };

            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw error(404, 'Data pelamar tidak ditemukan');
                }
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
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
