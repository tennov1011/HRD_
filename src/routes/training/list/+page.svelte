<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Import utility untuk format tanggal
	import { formatDate } from '$lib/utils/dateUtils';

	/** @type {import('./$types').PageData} */
	export let data;
	/** @type {import('./$types').ActionData} */
	export let form;

	// Filter state
	let activeTab = 'scheduled';
	let displayTrainings = [];

	$: {
		// Update training list berdasarkan filter
		if (activeTab === 'scheduled') {
			displayTrainings = data.scheduledTrainings || [];
		} else if (activeTab === 'ongoing') {
			displayTrainings = data.ongoingTrainings || [];
		} else if (activeTab === 'completed') {
			displayTrainings = data.completedTrainings || [];
		} else if (activeTab === 'cancelled') {
			displayTrainings = data.cancelledTrainings || [];
		} else {
			displayTrainings = data.trainings || [];
		}
	}

	// Modal states
	let showDeleteConfirmModal = false;
	let selectedTrainingId = null;
	let selectedTrainingTitle = '';

	// Show delete confirmation modal
	function confirmDelete(id, title) {
		selectedTrainingId = id;
		selectedTrainingTitle = title;
		showDeleteConfirmModal = true;
	}

	// Format date time
	function formatDateTime(date, time) {
		if (!date) return '-';

		try {
			const dateObj = time ? new Date(`${date}T${time}`) : new Date(date);
			return dateObj.toLocaleString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (error) {
			console.error('Error formatting date time:', error);
			return date;
		}
	}

	// Format status badge
	function getStatusBadgeClass(status) {
		switch (status) {
			case 'Dijadwalkan':
				return 'bg-blue-100 text-blue-800';
			case 'Berlangsung':
				return 'bg-green-100 text-green-800';
			case 'Selesai':
				return 'bg-purple-100 text-purple-800';
			case 'Dibatalkan':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Get participant count
	function getParticipantCount(/** @type {any} */ training) {
		// If participant is an array, return its length
		if (Array.isArray(training.participant)) {
			return training.participant.length;
		}

		// If participant is a string that looks like a number, parse it
		if (typeof training.participant === 'string') {
			if (training.participant.includes(',')) {
				return training.participant.split(',').length;
			}
		}
		// Default: return 0 if none of the above
		return 0;
	}

	// Handle notification
	let showNotification = false;
	let notificationMessage = '';
	let notificationType = 'success';

	function showNotif(message, type = 'success') {
		notificationMessage = message;
		notificationType = type;
		showNotification = true;
		setTimeout(() => (showNotification = false), 1500);
	}

	// Check for form result
	$: if (form?.success) {
		showNotif(form.message || 'Operasi berhasil!', 'success');
	} else if (form?.error) {
		showNotif(form.message || 'Terjadi kesalahan!', 'error');
	}

	// Delete form enhance handler
	/** @type {import('$app/forms').SubmitFunction} */
	function handleDeleteEnhance() {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				showDeleteConfirmModal = false;
				await update();
				// Refresh list by navigating
				goto('/training/list');
			}
		};
	}
</script>

<svelte:head>
	<title>Daftar Training - HRD System</title>
</svelte:head>

<div class="mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-8">
	<!-- Notification -->
	{#if showNotification}
		<div
			class="animate-fadeIn fixed top-1/2 left-1/2 z-50 min-w-[320px] -translate-x-1/2 -translate-y-1/2 transform rounded-xl px-8 py-6 text-center shadow-2xl"
			class:bg-green-500={notificationType === 'success'}
			class:bg-red-500={notificationType === 'error'}
			class:text-white={true}
		>
			<div class="flex flex-col items-center justify-center">
				{#if notificationType === 'success'}
					<svg class="mb-3 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{:else}
					<svg class="mb-3 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{/if}
				<span class="text-xl font-medium">{notificationMessage}</span>
			</div>
		</div>
		<div class="bg-opacity-50 fixed inset-0 z-40 bg-black"></div>
	{/if}

	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Daftar Training</h1>

		<div class="flex items-center space-x-4">
			<!-- Add New Button -->
			<a
				href="/training/add"
				class="flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-1 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Tambah Training Baru
			</a>
		</div>
	</div>

	<!-- Status Message -->
	{#if data.error}
		<div class="mb-6 border-l-4 border-red-500 bg-red-100 p-4 text-red-700" role="alert">
			<p class="font-bold">Error</p>
			<p>{data.error}</p>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="mb-6 border-b border-gray-200">
		<ul class="-mb-px flex flex-wrap text-center text-sm font-medium">
			<li>
				<button
					on:click={() => (activeTab = 'all')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4"
					class:border-gray-600={activeTab === 'all'}
					class:text-gray-600={activeTab === 'all'}
					class:border-transparent={activeTab !== 'all'}
					class:hover:text-gray-600={activeTab !== 'all'}
					class:hover:border-gray-300={activeTab !== 'all'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						></path>
					</svg>
					Semua ({data.trainings?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'scheduled')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4"
					class:border-blue-600={activeTab === 'scheduled'}
					class:text-blue-600={activeTab === 'scheduled'}
					class:border-transparent={activeTab !== 'scheduled'}
					class:hover:text-gray-600={activeTab !== 'scheduled'}
					class:hover:border-gray-300={activeTab !== 'scheduled'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					Dijadwalkan ({data.scheduledTrainings?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'ongoing')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4"
					class:border-green-600={activeTab === 'ongoing'}
					class:text-green-600={activeTab === 'ongoing'}
					class:border-transparent={activeTab !== 'ongoing'}
					class:hover:text-gray-600={activeTab !== 'ongoing'}
					class:hover:border-gray-300={activeTab !== 'ongoing'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					Berlangsung ({data.ongoingTrainings?.length || 0})
				</button>
			</li>
			<li class="mr-2">
				<button
					on:click={() => (activeTab = 'completed')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4"
					class:border-purple-600={activeTab === 'completed'}
					class:text-purple-600={activeTab === 'completed'}
					class:border-transparent={activeTab !== 'completed'}
					class:hover:text-gray-600={activeTab !== 'completed'}
					class:hover:border-gray-300={activeTab !== 'completed'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
					Selesai ({data.completedTrainings?.length || 0})
				</button>
			</li>
			<li>
				<button
					on:click={() => (activeTab = 'cancelled')}
					class="group inline-flex items-center rounded-t-lg border-b-2 p-4"
					class:border-red-600={activeTab === 'cancelled'}
					class:text-red-600={activeTab === 'cancelled'}
					class:border-transparent={activeTab !== 'cancelled'}
					class:hover:text-gray-600={activeTab !== 'cancelled'}
					class:hover:border-gray-300={activeTab !== 'cancelled'}
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
					Dibatalkan ({data.cancelledTrainings?.length || 0})
				</button>
			</li>
		</ul>
	</div>

	<!-- Training List Table -->
	<div class="overflow-hidden rounded-lg bg-white shadow-md">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Judul Training
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Tanggal & Waktu
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Lokasi
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Status
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Aksi
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if displayTrainings && displayTrainings.length > 0}
					{#each displayTrainings as training}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">{training.training_title}</div>
								<div class="text-sm text-gray-500">{training.training_type}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									Tanggal: {formatDateTime(training.date_started) +
										' - ' +
										formatDateTime(training.date_finished)}
								</div>
								<div class="text-sm text-gray-700">
									Jam: {training.time_started + ' - ' + training.time_finished}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{training.location || '-'}</div>
								<div class="mt-1 text-xs font-medium text-blue-600">
									{getParticipantCount(training)} peserta
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusBadgeClass(
										training.status
									)}"
								>
									{training.status}
								</span>
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
								<div class="flex space-x-2">
									<a
										href={`/training/list/${training.id}`}
										class="font-medium text-indigo-600 hover:text-indigo-900"
									>
										View
									</a>
									<a
										href={`/training/list/edit/${training.id}`}
										class="font-medium text-blue-600 hover:text-blue-900"
									>
										Edit
									</a>
									<button
										class="font-medium text-red-600 hover:text-red-900"
										on:click={() => confirmDelete(training.id, training.training_title)}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="px-6 py-8 text-center text-gray-500">
							<p class="text-lg">Tidak ada data training ditemukan.</p>
							<p class="mt-1 text-sm">
								{#if activeTab !== 'all'}
									Tidak ada training dengan status ini. <button
										class="text-blue-600 underline"
										on:click={() => (activeTab = 'all')}>Lihat semua training</button
									>
								{:else}
									Belum ada training yang ditambahkan. <a
										href="/training/add"
										class="text-blue-600 underline">Tambah training baru</a
									>
								{/if}
							</p>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirmModal}
		<div class="bg-opacity-50 fixed inset-0 z-40 flex items-center justify-center bg-black p-4">
			<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
				<div class="p-6">
					<h3 class="mb-4 text-lg font-medium text-gray-900">Konfirmasi Hapus</h3>
					<p class="mb-6 text-sm text-gray-600">
						Apakah Anda yakin ingin menghapus training "{selectedTrainingTitle}"? Tindakan ini tidak
						dapat dibatalkan dan akan menghapus semua data terkait.
					</p>

					<form method="POST" action="?/deleteTraining" use:enhance={handleDeleteEnhance}>
						<input type="hidden" name="id" value={selectedTrainingId} />

						<div class="flex justify-end space-x-3">
							<button
								type="button"
								on:click={() => (showDeleteConfirmModal = false)}
								class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
							>
								Batal
							</button>
							<button
								type="submit"
								class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
							>
								Hapus
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out forwards;
	}
</style>
