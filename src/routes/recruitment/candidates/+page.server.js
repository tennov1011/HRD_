import { applicantService } from '$lib/services/applicantService.js';
import { recruitmentService } from '$lib/services/recruitmentService.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    try {
        // Create a new function in the applicantService to get all applicants
        async function getAllApplicants() {
            // Add server-side fetch logic for all job applications
            // Adding howDidYouHear field to the fetch request
            const endpoint = '/items/job_applications?fields=id,fullName,email,appliedJobId,resumeFileUrl,highestEducation,workExperienceYears,applicationStatus,date_created,howDidYouHear&sort=-date_created';
            
            // Using the existing request method in the applicantService
            // But ensuring it works server-side (not using browser check)
            const url = `${applicantService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${applicantService.token}`
                }
            };

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        }
        
        // Function to get all job postings (for filter dropdown)
        async function getAllJobPostings() {
            const endpoint = '/items/job_postings?fields=id,title&sort=-date_created';
            
            const url = `${recruitmentService.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${recruitmentService.token}`
                }
            };
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            return data.data;
        }

        // Fetch all applicants and job postings in parallel
        const [applicants, jobPostings] = await Promise.all([
            getAllApplicants(),
            getAllJobPostings()
        ]);
        
        return {
            applicants,
            jobPostings
        };
    } catch (error) {
        console.error('Error loading candidates data:', error);
        return {
            applicants: [],
            jobPostings: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
