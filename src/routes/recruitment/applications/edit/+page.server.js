import { recruitmentService } from '../../../lib/services/recruitmentService';

export async function load({ params }) {
    const jobId = params.id; // Ambil dari URL parameter
    try {
        const response = await recruitmentService.getJobPostingById(jobId);
        return {
            jobPosting: response.data
        };
    } catch (error) {
        return {
            error: 'Failed to get job posting'
        };
    }
}

export async function POST({ request, params }) {
    const jobId = params.id;
    const formData = await request.formData();
    const title = formData.get('title');
    const department = formData.get('department');
    const requirements = formData.get('requirements');
    const deadline = formData.get('deadline');
    const description = formData.get('description');
    const location = formData.get('location');

    const patchData = {
        title,
        department,
        requirements: requirements.split('\n').filter(req => req !== ''),
        deadline,
        description,
        location,
    };

    try {
        await recruitmentService.updateJobPosting(jobId, patchData);
        return {
            success: 'Job posting updated successfully'
        };
    } catch (error) {
        return {
            error: 'Failed to update job posting'
        };
    }
}