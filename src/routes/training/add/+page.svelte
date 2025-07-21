<script>
    import { enhance } from '$app/forms';
    import { onMount } from 'svelte';

    /** @type {import('./$types').PageData} */
    export let data;
    
    /** @type {import('./$types').ActionData} */
    export let form;

    $: ({ employees } = data);

    // Form state
    let isSubmitting = false;
    /** @type {string[]} */
    let selectedTrainers = [];
    /** @type {string[]} */
    let selectedParticipants = [];
    let showTrainerDropdown = false;
    let showParticipantDropdown = false;
    
    // Form data
    let formData = {
        training_title: '',
        training_type: 'Internal',
        description: '',
        date_started: '',
        date_finished: '',
        time_started: '08:00',
        time_finished: '17:00',
        location: '',
        status: 'Dijadwalkan',
        note: ''
    };

    // Training types
    const trainingTypes = [
        'Internal',
        'External', 
        'Online',
        'Workshop',
        'Seminar',
        'Certification'
    ];

    // Status options
    const statusOptions = [
        'Dijadwalkan',
        'Berlangsung',
        'Selesai',
        'Dibatalkan'
    ];

    /**
     * Format date for display
     * @param {string} dateString - The date string to format
     */
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Format time for display in Indonesian locale
     * @param {string} timeString - The time string in HH:MM format
     */
    function formatTimeForDisplay(timeString) {
        if (!timeString) return '';
        try {
            // Create a date object with the time
            const today = new Date();
            const [hours, minutes] = timeString.split(':');
            const date = new Date(today.setHours(parseInt(hours), parseInt(minutes), 0, 0));
            
            // Format using Indonesian locale
            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    }

    /**
     * Format datetime for display
     * @param {string} date - The date string
     * @param {string} time - The time string
     */
    function formatDateTimeForDisplay(date, time) {
        if (!date || !time) return '';
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Validate date range
    function validateDates() {
        if (formData.date_started && formData.date_finished && formData.time_started && formData.time_finished) {
            const startDateTime = new Date(`${formData.date_started}T${formData.time_started}`);
            const endDateTime = new Date(`${formData.date_finished}T${formData.time_finished}`);
            
            if (endDateTime <= startDateTime) {
                alert('Tanggal dan jam selesai harus lebih besar dari tanggal dan jam mulai');
                return false;
            }
        }
        return true;
    }

    // Handle form submission
    function handleSubmit() {
        // Validate dates before submission
        if (!validateDates()) {
            return () => {};
        }
        
        isSubmitting = true;
        /**
         * Form submission callback
         * @param {{ result: { type: string, data?: any } }} param0 - The result object
         */
        return async ({ result }) => {
            isSubmitting = false;
            console.log('Form submission result:', result);
            
            if (result.type === 'success') {
                console.log('Form submission success!');
                // Show success notification immediately
                showSuccessNotification(result.data?.message || 'Training berhasil dijadwalkan!');
                
                // Reset form
                formData = {
                    training_title: '',
                    training_type: 'Internal',
                    description: '',
                    date_started: '',
                    date_finished: '',
                    time_started: '08:00',
                    time_finished: '17:00',
                    location: '',
                    status: 'Dijadwalkan',
                    note: ''
                };
                selectedTrainers = [];
                selectedParticipants = [];
                showTrainerDropdown = false;
                showParticipantDropdown = false;
            } else if (result.type === 'failure') {
                console.log('Form submission failed:', result.data);
                // Show error notification immediately
                showErrorNotification(result.data?.message || 'Gagal menjadwalkan training');
            }
        };
    }

    /**
     * Function to show success notification
     * @param {string} message - Message to display
     */
    function showSuccessNotification(message) {
        // Buat overlay semi-transparan
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
        document.body.appendChild(overlay);
        
        // Buat toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white px-8 py-6 rounded-xl shadow-2xl min-w-[320px] text-center animate-fadeIn';
        toast.innerHTML = `
            <div class="flex flex-col items-center justify-center">
                <svg class="h-16 w-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-xl font-medium">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Tambahkan animasi CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-out forwards;
            }
        `;
        document.head.appendChild(style);
        
        // Hapus toast dan overlay setelah beberapa detik
        setTimeout(() => {
            toast.remove();
            overlay.remove();
            style.remove();
        }, 2000);
    }

    /**
     * Function to show error notification
     * @param {string} message - Error message to display
     */
    function showErrorNotification(message) {
        // Buat overlay semi-transparan
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
        document.body.appendChild(overlay);
        
        // Buat toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white px-8 py-6 rounded-xl shadow-2xl min-w-[320px] text-center animate-fadeIn';
        toast.innerHTML = `
            <div class="flex flex-col items-center justify-center">
                <svg class="h-16 w-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span class="text-xl font-medium">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Tambahkan animasi CSS jika belum ada
        if (!document.querySelector('style.toast-animation')) {
            const style = document.createElement('style');
            style.className = 'toast-animation';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Hapus toast dan overlay setelah beberapa detik
        setTimeout(() => {
            toast.remove();
            overlay.remove();
        }, 2000);
    }

    // Handle success/error messages with reactive statements as backup
    $: if (form?.success) {
        console.log('Reactive success detected:', form);
        // Create success toast via reactive statement (as backup)
        setTimeout(() => showSuccessNotification(form.message || 'Training berhasil dijadwalkan!'), 100);
    } else if (form?.error) {
        console.log('Reactive error detected:', form);
        // Create error toast via reactive statement (as backup)
        setTimeout(() => showErrorNotification(form.message || 'Gagal menjadwalkan training'), 100);
    }

    // Debug form state
    $: if (form) {
        console.log('Form state updated:', form);
    }

    /**
     * Close dropdowns when clicking outside
     * @param {MouseEvent} event - The click event
     */
    function handleClickOutside(event) {
        // Cast event.target to HTMLElement
        const target = /** @type {HTMLElement} */ (event.target);
        if (target && !target.closest('.relative')) {
            showTrainerDropdown = false;
            showParticipantDropdown = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<svelte:head>
    <title>Penjadwalan Training - HRD System</title>
</svelte:head>

    <div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8 text-center">
            <h1 class="mb-2 text-4xl font-bold text-gray-900">Penjadwalan Training</h1>
            <p class="text-lg text-gray-600">Buat jadwal training baru untuk karyawan</p>
        </div>

        <!-- Form Card -->
        <div class="rounded-2xl bg-white shadow-xl">
            <div class="border-b border-gray-200 px-8 py-6">
                <h2 class="text-2xl font-semibold text-gray-900">Form Training Baru</h2>
                <p class="mt-1 text-sm text-gray-500">Lengkapi semua informasi training yang akan dijadwalkan</p>
            </div>

            {#if data.error}
                <!-- Error state -->
                <div class="p-8">
                    <div class="rounded-lg bg-red-50 border border-red-200 p-4">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
                        </div>
                        <p class="mt-2 text-sm text-red-700">{data.error}</p>
                    </div>
                </div>
            {:else}
                <!-- Form content -->

            <form 
                method="POST" 
                action="?/createTraining"
                use:enhance={handleSubmit}
                class="p-8"
            >
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <!-- Training Title & Training Type Container -->
                    <div class="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Training Title -->
                        <div>
                            <label for="training_title" class="block text-sm font-medium text-gray-700 mb-2">
                                Judul Training *
                            </label>
                            <input
                                type="text"
                                id="training_title"
                                name="training_title"
                                bind:value={formData.training_title}
                                required
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Masukkan judul training"
                            />
                        </div>

                        <!-- Training Type -->
                        <div>
                            <label for="training_type" class="block text-sm font-medium text-gray-700 mb-2">
                                Jenis Training *
                            </label>
                            <select
                                id="training_type"
                                name="training_type"
                                bind:value={formData.training_type}
                                required
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {#each trainingTypes as type}
                                    <option value={type}>{type}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <!-- Status & Location Container -->
                    <div class="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Status -->
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                bind:value={formData.status}
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {#each statusOptions as status}
                                    <option value={status}>{status}</option>
                                {/each}
                            </select>
                        </div>

                        <!-- Location -->
                        <div>
                            <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                                Lokasi *
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                bind:value={formData.location}
                                required
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Masukkan lokasi training"
                            />
                        </div>
                    </div>

                    <!-- Date Started -->
                    <div>
                        <label for="date_started" class="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Mulai *
                        </label>
                        <input
                            type="date"
                            id="date_started"
                            name="date_started"
                            bind:value={formData.date_started}
                            required
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {#if formData.date_started}
                            <p class="mt-1 text-xs text-gray-500">
                                {formatDateForDisplay(formData.date_started)}
                            </p>
                        {/if}
                    </div>

                    <!-- Date Finished -->
                    <div>
                        <label for="date_finished" class="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Selesai *
                        </label>
                        <input
                            type="date"
                            id="date_finished"
                            name="date_finished"
                            bind:value={formData.date_finished}
                            required
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {#if formData.date_finished}
                            <p class="mt-1 text-xs text-gray-500">
                                {formatDateForDisplay(formData.date_finished)}
                            </p>
                        {/if}
                    </div>

                    <!-- Time Started -->
                    <div>
                        <label for="time_started" class="block text-sm font-medium text-gray-700 mb-2">
                            Jam Mulai *
                        </label>
                        <input
                            type="time"
                            id="time_started"
                            name="time_started"
                            bind:value={formData.time_started}
                            required
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {#if formData.time_started}
                            <p class="mt-1 text-xs text-gray-500">
                                {formatTimeForDisplay(formData.time_started)}
                            </p>
                        {/if}
                    </div>

                    <!-- Time Finished -->
                    <div>
                        <label for="time_finished" class="block text-sm font-medium text-gray-700 mb-2">
                            Jam Selesai *
                        </label>
                        <input
                            type="time"
                            id="time_finished"
                            name="time_finished"
                            bind:value={formData.time_finished}
                            required
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {#if formData.time_finished}
                            <p class="mt-1 text-xs text-gray-500">
                                {formatTimeForDisplay(formData.time_finished)}
                            </p>
                        {/if}
                    </div>

                    <!-- Training Schedule Preview -->
                    {#if formData.date_started && formData.time_started && formData.date_finished && formData.time_finished}
                        <div class="lg:col-span-2">
                            <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <h4 class="text-sm font-medium text-blue-800 mb-2">📅 Jadwal Training</h4>
                                <div class="text-sm text-blue-700">
                                    <div class="flex items-center space-x-2 mb-1">
                                        <span class="font-medium">Mulai:</span>
                                        <span>{formatDateTimeForDisplay(formData.date_started, formData.time_started)}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium">Selesai:</span>
                                        <span>{formatDateTimeForDisplay(formData.date_finished, formData.time_finished)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Trainers Selection -->
                    <div>
                        <label for="trainer-dropdown" class="block text-sm font-medium text-gray-700 mb-2">
                            Trainer *
                        </label>
                        <div class="relative">
                            <!-- Dropdown Button -->
                            <button
                                type="button"
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 text-left focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex justify-between items-center"
                                on:click={() => showTrainerDropdown = !showTrainerDropdown}
                            >
                                <span class="text-gray-500">
                                    {selectedTrainers.length > 0 ? `${selectedTrainers.length} trainer dipilih` : 'Pilih trainer'}
                                </span>
                                <svg class="h-5 w-5 text-gray-400 transform {showTrainerDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            {#if showTrainerDropdown}
                                <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {#each employees as employee}
                                        <label class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={employee.name}
                                                bind:group={selectedTrainers}
                                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                            />
                                            <div class="flex-1">
                                                <span class="text-sm font-medium text-gray-900">
                                                    {employee.name} - {employee.jabatan} ({employee.no_karyawan})
                                                </span>
                                            </div>
                                        </label>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        
                        {#if selectedTrainers.length > 0}
                            <div class="mt-2 flex flex-wrap gap-1">
                                {#each selectedTrainers as trainerName}
                                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {trainerName}
                                        <button
                                            type="button"
                                            class="ml-1 text-blue-600 hover:text-blue-800"
                                            on:click={() => {
                                                selectedTrainers = selectedTrainers.filter(name => name !== trainerName);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                {/each}
                            </div>
                        {/if}
                        
                        <!-- Hidden inputs for form submission -->
                        {#each selectedTrainers as trainerName}
                            <input type="hidden" name="trainer" value={trainerName} />
                        {/each}
                    </div>

                    <!-- Participants Selection -->
                    <div>
                        <label for="participant-dropdown" class="block text-sm font-medium text-gray-700 mb-2">
                            Peserta *
                        </label>
                        <div class="relative">
                            <!-- Dropdown Button -->
                            <button
                                type="button"
                                class="w-full rounded-lg border border-gray-300 px-4 py-3 text-left focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex justify-between items-center"
                                on:click={() => showParticipantDropdown = !showParticipantDropdown}
                            >
                                <span class="text-gray-500">
                                    {selectedParticipants.length > 0 ? `${selectedParticipants.length} peserta dipilih` : 'Pilih peserta'}
                                </span>
                                <svg class="h-5 w-5 text-gray-400 transform {showParticipantDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            {#if showParticipantDropdown}
                                <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {#each employees as employee}
                                        <label class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={employee.name}
                                                bind:group={selectedParticipants}
                                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                            />
                                            <div class="flex-1">
                                                <span class="text-sm font-medium text-gray-900">
                                                    {employee.name} - {employee.jabatan} ({employee.no_karyawan})
                                                </span>
                                            </div>
                                        </label>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        
                        {#if selectedParticipants.length > 0}
                            <div class="mt-2 flex flex-wrap gap-1">
                                {#each selectedParticipants as participantName}
                                    <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        {participantName}
                                        <button
                                            type="button"
                                            class="ml-1 text-green-600 hover:text-green-800"
                                            on:click={() => {
                                                selectedParticipants = selectedParticipants.filter(name => name !== participantName);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                {/each}
                            </div>
                        {/if}
                        
                        <!-- Hidden inputs for form submission -->
                        {#each selectedParticipants as participantName}
                            <input type="hidden" name="participant" value={participantName} />
                        {/each}
                    </div>

                    <!-- Description -->
                    <div class="lg:col-span-2">
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            bind:value={formData.description}
                            required
                            rows="4"
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan deskripsi training, materi yang akan dibahas, tujuan, dll."
                        ></textarea>
                    </div>

                    <!-- Note -->
                    <div class="lg:col-span-2">
                        <label for="note" class="block text-sm font-medium text-gray-700 mb-2">
                            Catatan
                        </label>
                        <textarea
                            id="note"
                            name="note"
                            bind:value={formData.note}
                            rows="3"
                            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Catatan tambahan (opsional)"
                        ></textarea>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="mt-8 flex justify-end space-x-4">
                    <button
                        type="button"
                        class="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-500"
                        on:click={() => {
                            // Reset form
                            formData = {
                                training_title: '',
                                training_type: 'Internal',
                                description: '',
                                date_started: '',
                                date_finished: '',
                                time_started: '08:00',
                                time_finished: '17:00',
                                location: '',
                                status: 'Dijadwalkan',
                                note: ''
                            };
                            selectedTrainers = [];
                            selectedParticipants = [];
                            showTrainerDropdown = false;
                            showParticipantDropdown = false;
                        }}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Menjadwalkan...' : 'Jadwalkan Training'}
                    </button>
                </div>
            </form>
            {/if}
        </div>
    </div>

<style>
    /* Custom scrollbar for employee lists */
    .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
</style>