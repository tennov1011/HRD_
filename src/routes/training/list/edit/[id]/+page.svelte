<script>
    import { enhance } from '$app/forms';

    /** @type {import('./$types').PageData} */
    export let data;
    /** @type {import('./$types').ActionData} */
    export let form;

    // Data from server
    const training = data.training;
    const employees = data.employees || [];

    // Reactive form values initialised with existing training data
    let training_title = training?.training_title || '';
    let training_type = training?.training_type || 'Internal';
    let description = training?.description || '';
    let date_started = training?.date_started || '';
    let date_finished = training?.date_finished || '';
    let time_started = training?.time_started || '08:00';
    let time_finished = training?.time_finished || '17:00';
    let location = training?.location || '';
    let status = training?.status || 'Dijadwalkan';
    let note = training?.note || '';

    // Trainer & participant arrays (string[])
    /** @type {string[]} */
    let selectedTrainers = Array.isArray(training?.trainer) ? [...training.trainer] : (training?.trainer ? [training.trainer] : []);
    /** @type {string[]} */
    let selectedParticipants = Array.isArray(training?.participant) ? [...training.participant] : (training?.participant ? [training.participant] : []);

    // Options
    const trainingTypes = ['Internal','External','Online','Workshop','Seminar','Certification'];
    const statusOptions = ['Dijadwalkan','Berlangsung','Selesai','Dibatalkan'];

    // Notification states
    let showNotif = false;
    let notifMsg = '';
    let notifType = 'success';

    // Handle server action feedback
    /** @type {any} */ const actionRes = form;
    $: if (actionRes?.success) {
        notifMsg = actionRes.success;
        notifType = 'success';
        showNotif = true;
        setTimeout(()=> showNotif=false, 3000);
    } else if (actionRes?.error) {
        notifMsg = actionRes.message || 'Terjadi kesalahan';
        notifType = 'error';
        showNotif = true;
        setTimeout(()=> showNotif=false, 3000);
    }

    let showTrainerDropdown = false;
    let showParticipantDropdown = false;

    /** @type {import('./$types').SubmitFunction} */
    const enhanceForm = () => {
        return async ({ result, update }) => {
            await update();
        };
    };
</script>

<div class="container mx-auto max-w-8xl px-4 py-8">
    {#if showNotif}
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg font-medium text-center"
            class:bg-green-600={notifType==='success'}
            class:bg-red-600={notifType==='error'}
            class:text-white={true}> {notifMsg} </div>
    {/if}

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Edit Training</h1>
        <a href="/training/list" class="text-gray-600 hover:text-gray-900">Kembali ke Daftar</a>
    </div>

    <form method="POST" use:enhance={enhanceForm} class="space-y-8 bg-white rounded-lg shadow-sm p-8">
        <!-- Row 1 -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
                <label for="training_title" class="block text-sm font-medium text-gray-700 mb-2">Judul Training *</label>
                <input id="training_title" name="training_title" bind:value={training_title} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="training_type" class="block text-sm font-medium text-gray-700 mb-2">Tipe Training *</label>
                <select id="training_type" name="training_type" bind:value={training_type} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500">
                    {#each trainingTypes as type}
                        <option value={type}>{type}</option>
                    {/each}
                </select>
            </div>
            <div>
                <label for="location" class="block text-sm font-medium text-gray-700 mb-2">Lokasi *</label>
                <input id="location" name="location" bind:value={location} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
        </div>

        <!-- Row 2: Date & Time -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div>
                <label for="date_started" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai *</label>
                <input id="date_started" type="date" name="date_started" bind:value={date_started} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="time_started" class="block text-sm font-medium text-gray-700 mb-2">Jam Mulai *</label>
                <input id="time_started" type="time" name="time_started" bind:value={time_started} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="date_finished" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai *</label>
                <input id="date_finished" type="date" name="date_finished" bind:value={date_finished} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="time_finished" class="block text-sm font-medium text-gray-700 mb-2">Jam Selesai *</label>
                <input id="time_finished" type="time" name="time_finished" bind:value={time_finished} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
        </div>

        <!-- Row 3: Status -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
                <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select id="status" name="status" bind:value={status} required class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500">
                    {#each statusOptions as st}
                        <option value={st}>{st}</option>
                    {/each}
                </select>
            </div>
            <div>
                <label for="note" class="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea id="note" name="note" rows="2" bind:value={note} class="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
        </div>

        <!-- Description -->
        <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Deskripsi *</label>
            <textarea id="description" name="description" rows="4" bind:value={description} required class="w-full rounded border border-gray-300 px-4 py-4 text-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>

        <!-- Trainer & Participant dropdown multiselect -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Trainer dropdown -->
            <div>
                <label for="trainer-dropdown" class="block text-sm font-medium text-gray-700 mb-2">Trainer *</label>
                <div class="relative">
                    <button type="button" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-left bg-white flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" on:click={() => showTrainerDropdown = !showTrainerDropdown}>
                        <span class="text-gray-500">{selectedTrainers.length > 0 ? `${selectedTrainers.length} trainer dipilih` : 'Pilih trainer'}</span>
                        <svg class="h-5 w-5 text-gray-400 {showTrainerDropdown ? 'transform rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {#if showTrainerDropdown}
                        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {#each employees as employee}
                                <label class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" value={employee.nama_lengkap} bind:group={selectedTrainers} class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
                                    <span class="text-sm font-medium text-gray-900">{employee.nama_lengkap} - {employee.jabatan} ({employee.no_karyawan})</span>
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>

                {#if selectedTrainers.length > 0}
                    <div class="mt-2 flex flex-wrap gap-1">
                        {#each selectedTrainers as trName}
                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {trName}
                                <button type="button" class="ml-1 text-blue-600 hover:text-blue-800" on:click={() => selectedTrainers = selectedTrainers.filter(n => n !== trName)}>×</button>
                            </span>
                        {/each}
                    </div>
                {/if}

                {#each selectedTrainers as trName}
                    <input type="hidden" name="trainer" value={trName} />
                {/each}
            </div>

            <!-- Participant dropdown -->
            <div>
                <label for="participant-dropdown" class="block text-sm font-medium text-gray-700 mb-2">Peserta *</label>
                <div class="relative">
                    <button type="button" class="w-full rounded-lg border border-gray-300 px-4 py-3 text-left bg-white flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" on:click={() => showParticipantDropdown = !showParticipantDropdown}>
                        <span class="text-gray-500">{selectedParticipants.length > 0 ? `${selectedParticipants.length} peserta dipilih` : 'Pilih peserta'}</span>
                        <svg class="h-5 w-5 text-gray-400 {showParticipantDropdown ? 'transform rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {#if showParticipantDropdown}
                        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {#each employees as employee}
                                <label class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" value={employee.nama_lengkap} bind:group={selectedParticipants} class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
                                    <span class="text-sm font-medium text-gray-900">{employee.nama_lengkap} - {employee.jabatan} ({employee.no_karyawan})</span>
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>

                {#if selectedParticipants.length > 0}
                    <div class="mt-2 flex flex-wrap gap-1">
                        {#each selectedParticipants as pName}
                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {pName}
                                <button type="button" class="ml-1 text-green-600 hover:text-green-800" on:click={() => selectedParticipants = selectedParticipants.filter(n => n !== pName)}>×</button>
                            </span>
                        {/each}
                    </div>
                {/if}

                {#each selectedParticipants as pName}
                    <input type="hidden" name="participant" value={pName} />
                {/each}
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-200">
            <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm">
                Simpan Perubahan
            </button>
            <a href="/training/list" class="text-gray-600 hover:text-gray-900">Batal</a>
        </div>
    </form>
</div>

<style>
    /* Custom scrollbar */
    .max-h-60::-webkit-scrollbar {
        width: 6px;
    }
    .max-h-60::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
    }
    .max-h-60::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
    }
    .max-h-60::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
</style>
