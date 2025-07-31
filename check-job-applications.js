// check-job-applications.js
// Cek data job_applications dan buat notifikasi manual jika diperlukan

async function checkJobApplications() {
	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	try {
		console.log('=== CHECKING JOB APPLICATIONS ===');

		// 1. Cek data job_applications terbaru
		const appsResponse = await fetch(`${DIRECTUS_URL}/items/job_applications?sort=-date_created&limit=5`, {
			headers: {
				'Authorization': `Bearer ${DIRECTUS_TOKEN}`
			}
		});

		if (appsResponse.ok) {
			const appsResult = await appsResponse.json();
			console.log('\nLast 5 job applications:');
			console.log(JSON.stringify(appsResult, null, 2));

			const applications = appsResult.data || [];
			
			if (applications.length > 0) {
				console.log('\n=== DETAIL APLIKASI TERBARU ===');
				for (let i = 0; i < Math.min(3, applications.length); i++) {
					const app = applications[i];
					console.log(`\nAplikasi ${i + 1}:`);
					console.log(`- ID: ${app.id}`);
					console.log(`- Nama: ${app.fullName}`);
					console.log(`- Email: ${app.email}`);
					console.log(`- Job ID: ${app.appliedJobId}`);
					console.log(`- Tanggal: ${app.date_created}`);
				}

				// 2. Ambil data job posting untuk aplikasi terbaru
				const latestApp = applications[0];
				if (latestApp.appliedJobId) {
					console.log(`\n=== MENGAMBIL INFO LOWONGAN ID: ${latestApp.appliedJobId} ===`);
					
					const jobResponse = await fetch(`${DIRECTUS_URL}/items/job_postings/${latestApp.appliedJobId}`, {
						headers: {
							'Authorization': `Bearer ${DIRECTUS_TOKEN}`
						}
					});

					if (jobResponse.ok) {
						const jobResult = await jobResponse.json();
						console.log('Job posting info:');
						console.log(JSON.stringify(jobResult, null, 2));

						const jobData = jobResult.data;
						if (jobData) {
							console.log(`\nINFO LENGKAP:`);
							console.log(`- Pelamar: ${latestApp.fullName}`);
							console.log(`- Posisi: ${jobData.title || jobData.position || 'Unknown Position'}`);
							console.log(`- Aplikasi ID: ${latestApp.id}`);
							console.log(`- Job ID: ${latestApp.appliedJobId}`);

							// 3. Cek apakah sudah ada notifikasi untuk aplikasi ini
							console.log(`\n=== CEK NOTIFIKASI UNTUK APLIKASI ID: ${latestApp.id} ===`);
							
							const notifResponse = await fetch(`${DIRECTUS_URL}/items/hrd_notifications?filter[applicant_id][_eq]=${latestApp.id}`, {
								headers: {
									'Authorization': `Bearer ${DIRECTUS_TOKEN}`
								}
							});

							if (notifResponse.ok) {
								const notifResult = await notifResponse.json();
								console.log('Existing notifications for this applicant:');
								console.log(JSON.stringify(notifResult, null, 2));

								if (!notifResult.data || notifResult.data.length === 0) {
									console.log('\n❌ TIDAK ADA NOTIFIKASI - AKAN MEMBUAT NOTIFIKASI MANUAL');
									
									// Buat notifikasi manual
									await createManualNotification(latestApp, jobData);
								} else {
									console.log('\n✅ NOTIFIKASI SUDAH ADA');
								}
							}
						}
					} else {
						console.log('❌ Error fetching job posting:', jobResponse.status);
					}
				}
			} else {
				console.log('❌ Tidak ada data aplikasi');
			}
		} else {
			console.log('❌ Error fetching job applications:', appsResponse.status);
		}

	} catch (error) {
		console.error('Error:', error);
	}
}

async function createManualNotification(appData, jobData) {
	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	try {
		console.log('\n🔄 MEMBUAT NOTIFIKASI MANUAL...');

		const notificationData = {
			type: 'new_application',
			message: `Pelamar baru "${appData.fullName}" telah mendaftar untuk posisi "${jobData.title || jobData.position || 'Lowongan Pekerjaan'}". Silakan tinjau lamaran dan lakukan proses seleksi.`,
			job_id: String(appData.appliedJobId),
			applicant_id: String(appData.id),
			redirect_url: `/recruitment/applications?jobId=${appData.appliedJobId}`,
			is_read: false,
			created_at: new Date().toISOString()
		};

		console.log('Data notifikasi yang akan dibuat:');
		console.log(JSON.stringify(notificationData, null, 2));

		const createResponse = await fetch(`${DIRECTUS_URL}/items/hrd_notifications`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${DIRECTUS_TOKEN}`
			},
			body: JSON.stringify(notificationData)
		});

		if (createResponse.ok) {
			const createResult = await createResponse.json();
			console.log('\n✅ NOTIFIKASI BERHASIL DIBUAT:');
			console.log(JSON.stringify(createResult, null, 2));
		} else {
			const errorText = await createResponse.text();
			console.log('\n❌ GAGAL MEMBUAT NOTIFIKASI:');
			console.log('Status:', createResponse.status);
			console.log('Error:', errorText);
		}

	} catch (error) {
		console.error('❌ Error creating manual notification:', error);
	}
}

checkJobApplications();
