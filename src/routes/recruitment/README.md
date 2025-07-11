# Recruitment Module

This module handles the job posting and application management process.

## Features

### Job Postings
- Display all job postings
- Filter active/inactive job postings
- Add new job postings
- Delete job postings
- View details of each job posting with applicant count

### Job Applications
- View all applications for a specific job posting
- Update applicant status (baru, diproses, wawancara, tes, diterima, ditolak)
- Upload and manage supporting documents
- View detailed applicant information

## Data Structure

### Job Posting
```typescript
{
  id: number,
  title: string,
  department: string,
  description: string,
  requirements: string[],
  deadline: Date (Timestamp),
  date_created: Date (Timestamp)
}
```

### Job Application
```typescript
{
  id: number,
  jobId: number,
  fullName: string,
  email: string,
  phone: string,
  resumeUrl: string,
  coverLetter: string,
  appliedAt: Date,
  status: "baru" | "diproses" | "wawancara" | "tes" | "diterima" | "ditolak"
}
```

### Supporting Document
```typescript
{
  id: number,
  application_id: number,
  document_id: number,
  document_type: string,
  uploaded_at: Date
}
```

## Files Structure

- `/recruitment`
  - `+page.svelte` - Main job postings list page
  - `+page.server.js` - Server logic for job postings
  - `/add`
    - `+page.svelte` - Form for adding new job postings
    - `+page.server.js` - Server logic for adding job postings
  - `/applications`
    - `+page.svelte` - View for listing and managing job applications
    - `+page.server.js` - Server logic for job applications

## Services

- `recruitmentService.js` - Service for job posting operations
- `applicantService.js` - Service for job application operations

## Usage Guide

### Managing Job Postings

1. Navigate to `/recruitment` to view all job postings
2. Toggle between active and inactive job postings using the switch
3. Click "Add Job Posting" to create a new job posting
4. Fill in the required details and submit
5. To delete a job posting, click the "Delete" button and confirm

### Managing Applications

1. From the recruitment page, click "View" on any job posting to see applications
2. The applications page shows all applicants for that job posting
3. Click "Details" to view detailed information about an applicant
4. Use "Update Status" to change an applicant's status
5. Use "Upload Doc" to upload supporting documents for an applicant

### Applicant Statuses

- **Baru** - New application
- **Diproses** - Application is being processed
- **Wawancara** - Applicant is scheduled for an interview
- **Tes** - Applicant is in the testing phase
- **Diterima** - Applicant is accepted
- **Ditolak** - Applicant is rejected
