<script>
	export let data;

	const { masterData } = data;

	// Kolom untuk setiap kategori
	const columns = {
		divisi: ['Nama', 'Status', 'Aksi'],
		jabatan: ['Nama', 'Status', 'Aksi'],
		lokasi_absen: ['Nama', 'Alamat', 'Status', 'Aksi'],
		shift: ['Nama', 'Jam Masuk', 'Jam Keluar', 'Status', 'Aksi']
	};

	// Configuration untuk setiap kategori
	const categoryConfig = {
		divisi: {
			title: 'Data Divisi',
			icon: '🏢',
			color: 'blue',
			description: 'Kelola pembagian divisi perusahaan'
		},
		jabatan: {
			title: 'Data Jabatan',
			icon: '👔',
			color: 'emerald',
			description: 'Kelola posisi jabatan karyawan'
		},
		lokasi_absen: {
			title: 'Lokasi Absensi',
			icon: '📍',
			color: 'purple',
			description: 'Kelola titik lokasi presensi'
		},
		shift: {
			title: 'Shift Kerja',
			icon: '⏰',
			color: 'rose',
			description: 'Kelola jadwal shift karyawan'
		}
	};

	// State untuk search dan filter
	let searchTerm = '';
	let activeCategory = 'all';
	let showDeleteModal = false;
	let itemToDelete = null;

	// State untuk edit modal
	let showEditModal = false;
	let itemToEdit = null;
	let editCategory = null;
	let editForm = {
		nama: '',
		status: 'aktif',
		alamat: '',
		jam_masuk: '',
		jam_keluar: ''
	};

	// State untuk add shift modal
	let showAddShiftModal = false;
	let isSubmittingShift = false;
	let addShiftForm = {
		nama: '',
		jam_masuk: '',
		jam_keluar: '',
		status: 'aktif'
	};

	// State untuk add lokasi absen modal
	let showAddLokasiModal = false;
	let isSubmittingLokasi = false;
	let addLokasiForm = {
		nama: '',
		alamat: '',
		status: 'aktif'
	};

	// State untuk add jabatan modal
	let showAddJabatanModal = false;
	let isSubmittingJabatan = false;
	let addJabatanForm = {
		nama: '',
		status: 'aktif'
	};

	// State untuk add divisi modal
	let showAddDivisiModal = false;
	let isSubmittingDivisi = false;
	let addDivisiForm = {
		nama: '',
		status: 'aktif'
	};

	// Fungsi untuk mengambil nilai berdasarkan field
	function getFieldValue(item, field) {
		switch (field) {
			case 'Nama':
				return item.nama || '-';
			case 'Status':
				const status = item.status || '-';
				return status === 'aktif' ? 'Aktif' : status === 'tidak_aktif' ? 'Tidak Aktif' : status;
			case 'Alamat':
				return item.alamat || '-';
			case 'Jam Masuk':
				return formatTimeDisplay(item.jam_masuk);
			case 'Jam Keluar':
				return formatTimeDisplay(item.jam_keluar);
			default:
				return '-';
		}
	}

	// Fungsi untuk format tampilan jam
	function formatTimeDisplay(timestamp) {
		if (!timestamp) return '-';

		try {
			if (typeof timestamp === 'string') {
				const cleanTimestamp = timestamp.replace(/\+\d{2}:\d{2}$/, '');

				if (cleanTimestamp.includes(' ')) {
					const timePart = cleanTimestamp.split(' ')[1];
					if (timePart) {
						const timeFormatted = timePart.substring(0, 5);
						return `${timeFormatted} WIB`;
					}
				}
			}

			const date = new Date(timestamp);
			if (!isNaN(date.getTime())) {
				const timeFormatted = date.toLocaleTimeString('id-ID', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false,
					timeZone: 'Asia/Jakarta'
				});
				return `${timeFormatted} WIB`;
			}

			return timestamp;
		} catch (error) {
			return timestamp || '-';
		}
	}

	// Fungsi untuk konfirmasi delete
	function handleDelete(item, category, action) {
		itemToDelete = { item, category, action };
		showDeleteModal = true;
	}

	function confirmDelete() {
		if (itemToDelete) {
			// Submit form programmatically
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = `?/${itemToDelete.action}`;

			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'id';
			input.value = itemToDelete.item.id;

			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();
		}
		showDeleteModal = false;
		itemToDelete = null;
	}

	function cancelDelete() {
		showDeleteModal = false;
		itemToDelete = null;
	}

	// Fungsi untuk edit
	function handleEdit(item, category) {
		itemToEdit = item;
		editCategory = category;

		// Reset form dan isi dengan data item
		editForm = {
			nama: item.nama || '',
			status: item.status || 'aktif',
			alamat: item.alamat || '',
			jam_masuk: formatTimeForInput(item.jam_masuk),
			jam_keluar: formatTimeForInput(item.jam_keluar)
		};

		showEditModal = true;
	}

	function formatTimeForInput(timestamp) {
		if (!timestamp) return '';

		try {
			if (typeof timestamp === 'string') {
				const cleanTimestamp = timestamp.replace(/\+\d{2}:\d{2}$/, '');

				if (cleanTimestamp.includes(' ')) {
					const timePart = cleanTimestamp.split(' ')[1];
					if (timePart) {
						return timePart.substring(0, 5); // HH:MM format
					}
				}
			}

			const date = new Date(timestamp);
			if (!isNaN(date.getTime())) {
				return date.toLocaleTimeString('id-ID', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				});
			}

			return '';
		} catch (error) {
			return '';
		}
	}

	function confirmEdit() {
		if (itemToEdit && editCategory) {
			// Submit form programmatically
			const form = document.createElement('form');
			form.method = 'POST';

			// Determine action based on category
			let action = '';
			switch (editCategory) {
				case 'divisi':
					action = 'updateDivisi';
					break;
				case 'jabatan':
					action = 'updateJabatan';
					break;
				case 'lokasi_absen':
					action = 'updateLokasiAbsen';
					break;
				case 'shift':
					action = 'updateShift';
					break;
			}

			form.action = `?/${action}`;

			// Add form fields
			const fields = [
				{ name: 'id', value: itemToEdit.id },
				{ name: 'nama', value: editForm.nama },
				{ name: 'status', value: editForm.status }
			];

			// Add category-specific fields
			if (editCategory === 'lokasi_absen') {
				fields.push({ name: 'alamat', value: editForm.alamat });
			} else if (editCategory === 'shift') {
				fields.push(
					{ name: 'jam_masuk', value: editForm.jam_masuk },
					{ name: 'jam_keluar', value: editForm.jam_keluar }
				);
			}

			fields.forEach((field) => {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = field.name;
				input.value = field.value;
				form.appendChild(input);
			});

			document.body.appendChild(form);
			form.submit();
		}

		showEditModal = false;
		itemToEdit = null;
		editCategory = null;
	}

	function cancelEdit() {
		showEditModal = false;
		itemToEdit = null;
		editCategory = null;
	}

	// Fungsi untuk add shift modal
	function openAddShiftModal() {
		showAddShiftModal = true;
		// Reset form
		addShiftForm = {
			nama: '',
			jam_masuk: '',
			jam_keluar: '',
			status: 'aktif'
		};
		isSubmittingShift = false;
	}

	function closeAddShiftModal() {
		showAddShiftModal = false;
		addShiftForm = {
			nama: '',
			jam_masuk: '',
			jam_keluar: '',
			status: 'aktif'
		};
		isSubmittingShift = false;
	}

	function confirmAddShift() {
		if (!addShiftForm.nama || !addShiftForm.jam_masuk || !addShiftForm.jam_keluar) {
			alert('Harap isi semua field yang wajib!');
			return;
		}

		isSubmittingShift = true;

		// Submit form programmatically
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/addShift';

		const fields = [
			{ name: 'nama', value: addShiftForm.nama },
			{ name: 'jam_masuk', value: addShiftForm.jam_masuk },
			{ name: 'jam_keluar', value: addShiftForm.jam_keluar },
			{ name: 'status', value: addShiftForm.status }
		];

		fields.forEach((field) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = field.name;
			input.value = field.value;
			form.appendChild(input);
		});

		document.body.appendChild(form);
		form.submit();
	}

	// Fungsi untuk mendapatkan statistik
	function getStats() {
		return {
			total: Object.values(masterData).reduce((sum, arr) => sum + arr.length, 0),
			divisi: masterData.divisi.length,
			jabatan: masterData.jabatan.length,
			lokasi_absen: masterData.lokasi_absen.length,
			shift: masterData.shift.length
		};
	}

	// Fungsi untuk lokasi absen modal
	function openAddLokasiModal() {
		showAddLokasiModal = true;
		// Reset form
		addLokasiForm = {
			nama: '',
			alamat: '',
			status: 'aktif'
		};
		isSubmittingLokasi = false;
	}

	function closeAddLokasiModal() {
		showAddLokasiModal = false;
		addLokasiForm = {
			nama: '',
			alamat: '',
			status: 'aktif'
		};
		isSubmittingLokasi = false;
	}

	function confirmAddLokasi() {
		if (!addLokasiForm.nama || !addLokasiForm.alamat) {
			alert('Harap isi semua field yang wajib!');
			return;
		}

		isSubmittingLokasi = true;

		// Submit form programmatically
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/addLokasiAbsen';

		const fields = [
			{ name: 'nama', value: addLokasiForm.nama },
			{ name: 'alamat', value: addLokasiForm.alamat },
			{ name: 'status', value: addLokasiForm.status }
		];

		fields.forEach((field) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = field.name;
			input.value = field.value;
			form.appendChild(input);
		});

		document.body.appendChild(form);
		form.submit();
	}

	// Fungsi untuk jabatan modal
	function openAddJabatanModal() {
		showAddJabatanModal = true;
		// Reset form
		addJabatanForm = {
			nama: '',
			status: 'aktif'
		};
		isSubmittingJabatan = false;
	}

	function closeAddJabatanModal() {
		showAddJabatanModal = false;
		addJabatanForm = {
			nama: '',
			status: 'aktif'
		};
		isSubmittingJabatan = false;
	}

	function confirmAddJabatan() {
		if (!addJabatanForm.nama) {
			alert('Harap isi nama jabatan!');
			return;
		}

		isSubmittingJabatan = true;

		// Submit form programmatically
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/addJabatan';

		const fields = [
			{ name: 'nama', value: addJabatanForm.nama },
			{ name: 'status', value: addJabatanForm.status }
		];

		fields.forEach((field) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = field.name;
			input.value = field.value;
			form.appendChild(input);
		});

		document.body.appendChild(form);
		form.submit();
	}

	// Fungsi untuk divisi modal
	function openAddDivisiModal() {
		showAddDivisiModal = true;
		// Reset form
		addDivisiForm = {
			nama: '',
			status: 'aktif'
		};
		isSubmittingDivisi = false;
	}

	function closeAddDivisiModal() {
		showAddDivisiModal = false;
		addDivisiForm = {
			nama: '',
			status: 'aktif'
		};
		isSubmittingDivisi = false;
	}

	function confirmAddDivisi() {
		if (!addDivisiForm.nama) {
			alert('Harap isi nama divisi!');
			return;
		}

		isSubmittingDivisi = true;

		// Submit form programmatically
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '?/addDivisi';

		const fields = [
			{ name: 'nama', value: addDivisiForm.nama },
			{ name: 'status', value: addDivisiForm.status }
		];

		fields.forEach((field) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = field.name;
			input.value = field.value;
			form.appendChild(input);
		});

		document.body.appendChild(form);
		form.submit();
	}

	$: stats = getStats();
</script>

<svelte:head>
	<title>Master Data - HRD Management System</title>
	<meta name="description" content="Kelola data master sistem HRD perusahaan" />
</svelte:head>

<!-- Main Container -->
<div class="master-data-container">
	<!-- Header Section -->
	<div class="page-header">
		<div class="header-content">
			<div class="header-text">
				<h1>📊 Master Data</h1>
				<p>Kelola data master sistem HRD perusahaan</p>
			</div>

			<!-- Statistics Cards -->
			<div class="stats-grid">
				<div class="stat-card total">
					<div class="stat-icon">📋</div>
					<div class="stat-info">
						<div class="stat-number">{stats.total}</div>
						<div class="stat-label">Total Data</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">🏢</div>
					<div class="stat-info">
						<div class="stat-number">{stats.divisi}</div>
						<div class="stat-label">Divisi</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">👔</div>
					<div class="stat-info">
						<div class="stat-number">{stats.jabatan}</div>
						<div class="stat-label">Jabatan</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon">📍</div>
					<div class="stat-info">
						<div class="stat-number">{stats.lokasi_absen}</div>
						<div class="stat-label">Lokasi</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Search and Filter Section -->
	<div class="controls-section">
		<div class="search-box">
			<div class="search-icon">🔍</div>
			<input
				type="text"
				placeholder="Cari data master..."
				bind:value={searchTerm}
				class="search-input"
			/>
		</div>

		<div class="filter-tabs">
			<button
				class="filter-tab {activeCategory === 'all' ? 'active' : ''}"
				on:click={() => (activeCategory = 'all')}
			>
				Semua Data
			</button>
			{#each Object.entries(categoryConfig) as [key, config]}
				<button
					class="filter-tab {activeCategory === key ? 'active' : ''}"
					on:click={() => (activeCategory = key)}
				>
					{config.icon}
					{config.title}
				</button>
			{/each}
		</div>
	</div>

	<!-- Data Tables Section -->
	<div class="tables-grid">
		{#each Object.entries(categoryConfig) as [category, config]}
			{#if (activeCategory === 'all' || activeCategory === category) && masterData[category].length > 0}
				<div class="data-card {config.color}">
					<!-- Card Header -->
					<div class="card-header">
						<div class="card-title">
							<div class="title-icon">{config.icon}</div>
							<div class="title-text">
								<h3>{config.title}</h3>
								<p>{config.description}</p>
							</div>
						</div>
						<div class="card-header-actions">
							{#if category === 'shift'}
								<button class="add-btn" on:click={openAddShiftModal} title="Tambah Shift Baru">
									<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										></path>
									</svg>
									Tambah Shift
								</button>
							{/if}
							{#if category === 'lokasi_absen'}
								<button
									class="add-btn"
									on:click={openAddLokasiModal}
									title="Tambah Lokasi Absen Baru"
								>
									<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										></path>
									</svg>
									Tambah Lokasi Absen
								</button>
							{/if}
							{#if category === 'jabatan'}
								<button class="add-btn" on:click={openAddJabatanModal} title="Tambah Jabatan Baru">
									<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										></path>
									</svg>
									Tambah Jabatan
								</button>
							{/if}
							{#if category === 'divisi'}
								<button class="add-btn" on:click={openAddDivisiModal} title="Tambah Divisi Baru">
									<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										></path>
									</svg>
									Tambah Divisi
								</button>
							{/if}
							<div class="card-badge">
								{masterData[category].length} item
							</div>
						</div>
					</div>

					<!-- Card Content -->
					<div class="card-content">
						<div class="table-container">
							<table class="data-table">
								<thead>
									<tr>
										{#each columns[category] as column}
											<th>{column}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each masterData[category] as item, index}
										<tr class="table-row">
											{#each columns[category] as column}
												<td>
													{#if column === 'Aksi'}
														<div class="action-buttons">
															<button
																class="action-btn edit"
																title="Edit {item.nama}"
																on:click={() => handleEdit(item, category)}
															>
																✏️
															</button>
															<button
																class="action-btn delete"
																title="Hapus {item.nama}"
																on:click={() => {
																	let deleteAction = '';
																	switch (category) {
																		case 'divisi':
																			deleteAction = 'deleteDivisi';
																			break;
																		case 'jabatan':
																			deleteAction = 'deleteJabatan';
																			break;
																		case 'lokasi_absen':
																			deleteAction = 'deleteLokasiAbsen';
																			break;
																		case 'shift':
																			deleteAction = 'deleteShift';
																			break;
																		default:
																			deleteAction = 'delete';
																	}
																	handleDelete(item, config.title.toLowerCase(), deleteAction);
																}}
															>
																🗑️
															</button>
														</div>
													{:else if column === 'Status'}
														<div class="status-badge {item.status}">
															{getFieldValue(item, column)}
														</div>
													{:else}
														<div class="cell-content">
															{getFieldValue(item, column)}
														</div>
													{/if}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Empty State -->
	{#if stats.total === 0}
		<div class="empty-state">
			<div class="empty-icon">📁</div>
			<h3>Belum Ada Data</h3>
			<p>Belum ada data master yang tersedia. Silakan tambahkan data baru.</p>
			<button class="btn btn-primary"> ➕ Tambah Data </button>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-overlay" on:click={cancelDelete}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<div class="modal-icon">⚠️</div>
				<h3>Konfirmasi Penghapusan</h3>
			</div>

			<div class="modal-body">
				<p>
					Apakah Anda yakin ingin menghapus <strong>{itemToDelete?.category}</strong> "<strong
						>{itemToDelete?.item.nama}</strong
					>"?
				</p>
				<p class="warning-text">Tindakan ini tidak dapat dibatalkan.</p>
			</div>

			<div class="modal-actions">
				<button class="btn btn-secondary" on:click={cancelDelete}> Batal </button>
				<button class="btn btn-danger" on:click={confirmDelete}> 🗑️ Hapus </button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal}
	<div class="modal-overlay" on:click={cancelEdit}>
		<div class="modal-content edit-modal" on:click|stopPropagation>
			<div class="modal-header">
				<div class="modal-icon">✏️</div>
				<h3>Edit {categoryConfig[editCategory]?.title || 'Data'}</h3>
			</div>

			<div class="modal-body">
				<form class="edit-form" on:submit|preventDefault={confirmEdit}>
					<!-- Nama Field (Required for all categories) -->
					<div class="form-group">
						<label for="edit-nama" class="form-label">Nama:</label>
						<input
							id="edit-nama"
							type="text"
							class="form-input"
							bind:value={editForm.nama}
							placeholder="Masukkan nama"
							required
						/>
					</div>

					<!-- Status Field (Required for all categories) -->
					<div class="form-group">
						<label for="edit-status" class="form-label">Status:</label>
						<select id="edit-status" class="form-select" bind:value={editForm.status}>
							<option value="aktif">Aktif</option>
							<option value="tidak_aktif">Tidak Aktif</option>
						</select>
					</div>

					<!-- Alamat Field (Only for lokasi_absen) -->
					{#if editCategory === 'lokasi_absen'}
						<div class="form-group">
							<label for="edit-alamat" class="form-label">Alamat:</label>
							<textarea
								id="edit-alamat"
								class="form-textarea"
								bind:value={editForm.alamat}
								placeholder="Masukkan alamat lokasi"
								rows="3"
							></textarea>
						</div>
					{/if}

					<!-- Time Fields (Only for shift) -->
					{#if editCategory === 'shift'}
						<div class="form-row">
							<div class="form-group">
								<label for="edit-jam-masuk" class="form-label">Jam Masuk:</label>
								<input
									id="edit-jam-masuk"
									type="time"
									class="form-input"
									bind:value={editForm.jam_masuk}
									required
								/>
							</div>
							<div class="form-group">
								<label for="edit-jam-keluar" class="form-label">Jam Keluar:</label>
								<input
									id="edit-jam-keluar"
									type="time"
									class="form-input"
									bind:value={editForm.jam_keluar}
									required
								/>
							</div>
						</div>
					{/if}
				</form>
			</div>

			<div class="modal-actions">
				<button class="btn btn-secondary" on:click={cancelEdit}> Batal </button>
				<button class="btn btn-primary" on:click={confirmEdit}> ✏️ Simpan Perubahan </button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Shift Modal -->
{#if showAddShiftModal}
	<div class="modal-overlay" on:click={closeAddShiftModal}>
		<div class="modal-content add-shift-modal" on:click|stopPropagation>
			<div class="modal-header">
				<div class="modal-icon">⏰</div>
				<h3>Tambah Shift Baru</h3>
			</div>

			<div class="modal-body">
				<form class="add-shift-form" on:submit|preventDefault={confirmAddShift}>
					<!-- Nama Shift -->
					<div class="form-group">
						<label for="add-nama" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								></path>
							</svg>
							Nama Shift
							<span class="required">*</span>
						</label>
						<input
							id="add-nama"
							type="text"
							class="form-input"
							bind:value={addShiftForm.nama}
							placeholder="Contoh: Shift Pagi, Shift Siang, Shift Malam"
							required
						/>
					</div>

					<!-- Time Fields -->
					<div class="form-row">
						<div class="form-group">
							<label for="add-jam-masuk" class="form-label">
								<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								Jam Masuk
								<span class="required">*</span>
							</label>
							<input
								id="add-jam-masuk"
								type="time"
								class="form-input"
								bind:value={addShiftForm.jam_masuk}
								required
							/>
						</div>

						<div class="form-group">
							<label for="add-jam-keluar" class="form-label">
								<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									></path>
								</svg>
								Jam Keluar
								<span class="required">*</span>
							</label>
							<input
								id="add-jam-keluar"
								type="time"
								class="form-input"
								bind:value={addShiftForm.jam_keluar}
								required
							/>
						</div>
					</div>

					<!-- Status -->
					<div class="form-group">
						<label for="add-status" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							Status
						</label>
						<select id="add-status" class="form-select" bind:value={addShiftForm.status}>
							<option value="aktif">✅ Aktif</option>
							<option value="tidak_aktif">❌ Tidak Aktif</option>
						</select>
					</div>

					<!-- Help Text -->
					<!-- <div class="help-box">
						<div class="help-icon">💡</div>
						<div class="help-content">
							<p><strong>Tips:</strong></p>
							<ul>
								<li>Gunakan nama shift yang jelas dan mudah dipahami</li>
								<li>Pastikan jam masuk dan keluar sesuai kebijakan perusahaan</li>
								<li>Shift yang tidak aktif tidak akan muncul dalam pilihan presensi</li>
							</ul>
						</div>
					</div> -->
				</form>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={closeAddShiftModal}
					disabled={isSubmittingShift}
				>
					Batal
				</button>
				<button class="btn btn-primary" on:click={confirmAddShift} disabled={isSubmittingShift}>
					{#if isSubmittingShift}
						<svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Menyimpan...
					{:else}
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						Simpan Shift
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Lokasi Absen Modal -->
{#if showAddLokasiModal}
	<div
		class="modal-overlay"
		on:click={closeAddLokasiModal}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	>
		<div
			class="modal-content add-lokasi-modal"
			on:click|stopPropagation
			role="dialog"
			tabindex="0"
			aria-label="Add location form"
		>
			<div class="modal-header">
				<div class="modal-icon">📍</div>
				<h3>Tambah Lokasi Absen Baru</h3>
			</div>

			<div class="modal-body">
				<form on:submit|preventDefault={confirmAddLokasi}>
					<!-- Nama Lokasi -->
					<div class="form-group">
						<label for="add-nama-lokasi" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								></path>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								></path>
							</svg>
							Nama Lokasi <span class="required">*</span>
						</label>
						<input
							id="add-nama-lokasi"
							type="text"
							class="form-input"
							bind:value={addLokasiForm.nama}
							placeholder="Contoh: Kantor Pusat, Cabang Jakarta"
							required
						/>
					</div>

					<!-- Alamat -->
					<div class="form-group">
						<label for="add-alamat" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 21v-4a4 4 0 014-4h5a4 4 0 014 4v4M16 7a4 4 0 11-8 0 4 4 0 018 0z"
								></path>
							</svg>
							Alamat <span class="required">*</span>
						</label>
						<textarea
							id="add-alamat"
							class="form-textarea"
							bind:value={addLokasiForm.alamat}
							placeholder="Masukkan alamat lengkap lokasi absen"
							rows="3"
							required
						></textarea>
					</div>

					<!-- Status -->
					<div class="form-group">
						<label for="add-status-lokasi" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							Status
						</label>
						<select id="add-status-lokasi" class="form-select" bind:value={addLokasiForm.status}>
							<option value="aktif">✅ Aktif</option>
							<option value="tidak_aktif">❌ Tidak Aktif</option>
						</select>
					</div>
				</form>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={closeAddLokasiModal}
					disabled={isSubmittingLokasi}
				>
					Batal
				</button>
				<button class="btn btn-primary" on:click={confirmAddLokasi} disabled={isSubmittingLokasi}>
					{#if isSubmittingLokasi}
						<svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Menyimpan...
					{:else}
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						Simpan Lokasi
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Jabatan Modal -->
{#if showAddJabatanModal}
	<div
		class="modal-overlay"
		on:click={closeAddJabatanModal}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	>
		<div
			class="modal-content add-jabatan-modal"
			on:click|stopPropagation
			role="dialog"
			tabindex="0"
			aria-label="Add position form"
		>
			<div class="modal-header">
				<div class="modal-icon">👔</div>
				<h3>Tambah Jabatan Baru</h3>
			</div>

			<div class="modal-body">
				<form on:submit|preventDefault={confirmAddJabatan}>
					<!-- Nama Jabatan -->
					<div class="form-group">
						<label for="add-nama-jabatan" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								></path>
							</svg>
							Nama Jabatan <span class="required">*</span>
						</label>
						<input
							id="add-nama-jabatan"
							type="text"
							class="form-input"
							bind:value={addJabatanForm.nama}
							placeholder="Contoh: Manager, Supervisor, Staff"
							required
						/>
					</div>

					<!-- Status -->
					<div class="form-group">
						<label for="add-status-jabatan" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							Status
						</label>
						<select id="add-status-jabatan" class="form-select" bind:value={addJabatanForm.status}>
							<option value="aktif">✅ Aktif</option>
							<option value="tidak_aktif">❌ Tidak Aktif</option>
						</select>
					</div>
				</form>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={closeAddJabatanModal}
					disabled={isSubmittingJabatan}
				>
					Batal
				</button>
				<button class="btn btn-primary" on:click={confirmAddJabatan} disabled={isSubmittingJabatan}>
					{#if isSubmittingJabatan}
						<svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Menyimpan...
					{:else}
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						Simpan Jabatan
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Divisi Modal -->
{#if showAddDivisiModal}
	<div
		class="modal-overlay"
		on:click={closeAddDivisiModal}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	>
		<div
			class="modal-content add-divisi-modal"
			on:click|stopPropagation
			role="dialog"
			tabindex="0"
			aria-label="Add division form"
		>
			<div class="modal-header">
				<div class="modal-icon">🏢</div>
				<h3>Tambah Divisi Baru</h3>
			</div>

			<div class="modal-body">
				<form on:submit|preventDefault={confirmAddDivisi}>
					<!-- Nama Divisi -->
					<div class="form-group">
						<label for="add-nama-divisi" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 8h10M7 12h10m-5 4h5"
								></path>
							</svg>
							Nama Divisi <span class="required">*</span>
						</label>
						<input
							id="add-nama-divisi"
							type="text"
							class="form-input"
							bind:value={addDivisiForm.nama}
							placeholder="Contoh: HRD, Keuangan, IT"
							required
						/>
					</div>

					<!-- Status -->
					<div class="form-group">
						<label for="add-status-divisi" class="form-label">
							<svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							Status
						</label>
						<select id="add-status-divisi" class="form-select" bind:value={addDivisiForm.status}>
							<option value="aktif">✅ Aktif</option>
							<option value="tidak_aktif">❌ Tidak Aktif</option>
						</select>
					</div>
				</form>
			</div>

			<div class="modal-actions">
				<button
					class="btn btn-secondary"
					on:click={closeAddDivisiModal}
					disabled={isSubmittingDivisi}
				>
					Batal
				</button>
				<button class="btn btn-primary" on:click={confirmAddDivisi} disabled={isSubmittingDivisi}>
					{#if isSubmittingDivisi}
						<svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Menyimpan...
					{:else}
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						Simpan Divisi
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Global Styles */
	:global(body) {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}

	/* Main Container */
	.master-data-container {
		min-height: 100vh;
		padding: 1rem 2rem;
		max-width: 1400px;
		margin: 0 auto;
		animation: fadeInUp 0.6s ease-out;
		width: 100%;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Page Header */
	.page-header {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow:
			0 10px 25px rgba(0, 0, 0, 0.05),
			0 1px 0 rgba(255, 255, 255, 0.8) inset;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.header-text h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
		letter-spacing: -0.02em;
	}

	.header-text p {
		color: #666;
		font-size: 0.9rem;
		margin: 0;
	}

	/* Statistics Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
		max-width: 600px;
		width: 100%;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.5);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		transition: left 0.5s ease;
	}

	.stat-card:hover::before {
		left: 100%;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
	}

	.stat-card.total {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.stat-icon {
		font-size: 1.5rem;
		opacity: 0.9;
	}

	.stat-info {
		flex: 1;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.125rem;
	}

	.stat-label {
		font-size: 0.75rem;
		opacity: 0.8;
		font-weight: 500;
	}

	/* Controls Section */
	.controls-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 10px;
		padding: 0 0.75rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.3);
		min-width: 300px;
		flex: 1;
		max-width: 400px;
	}

	.search-icon {
		color: #9ca3af;
		margin-right: 0.5rem;
		font-size: 1rem;
	}

	.search-input {
		border: none;
		background: transparent;
		padding: 0.75rem 0;
		font-size: 0.9rem;
		width: 100%;
		outline: none;
		color: #374151;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	/* Filter Tabs */
	.filter-tabs {
		display: flex;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 10px;
		padding: 0.25rem;
		gap: 0.125rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.3);
		flex-wrap: wrap;
	}

	.filter-tab {
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.filter-tab:hover {
		background: rgba(102, 126, 234, 0.1);
		color: #667eea;
	}

	.filter-tab.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	/* Tables Grid */
	.tables-grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
	}

	/* Data Card */
	.data-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.3);
		transition: all 0.3s ease;
		animation: cardAppear 0.6s ease-out;
	}

	@keyframes cardAppear {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.data-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
	}

	/* Card Header */
	.card-header {
		padding: 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card-header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		background: linear-gradient(135deg, #10b981, #059669);
		color: white;
		border: none;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
	}

	.add-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		background: linear-gradient(135deg, #059669, #047857);
	}

	.btn-icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.title-icon {
		font-size: 1.5rem;
		opacity: 0.9;
	}

	.title-text h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.125rem 0;
	}

	.title-text p {
		color: #666;
		font-size: 0.8rem;
		margin: 0;
	}

	.card-badge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 16px;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
	}

	/* Card Content */
	.card-content {
		padding: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	/* Data Table */
	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table thead {
		background: rgba(102, 126, 234, 0.05);
	}

	.data-table th {
		padding: 1rem 1.25rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.data-table tbody tr {
		transition: all 0.2s ease;
	}

	.data-table tbody tr:hover {
		background: rgba(102, 126, 234, 0.03);
	}

	.data-table td {
		padding: 0.875rem 1.25rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		vertical-align: middle;
	}

	.cell-content {
		font-size: 0.875rem;
		color: #374151;
		font-weight: 500;
	}

	/* Status Badge */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		border-radius: 16px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.status-badge.aktif {
		background: rgba(34, 197, 94, 0.1);
		color: #059669;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.status-badge.tidak_aktif {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: 0.375rem;
		justify-content: center;
	}

	.action-btn {
		padding: 0.375rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.action-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.action-btn.edit:hover {
		background: rgba(59, 130, 246, 0.1);
		border-color: #3b82f6;
	}

	.action-btn.delete:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: modalFadeIn 0.3s ease-out;
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: white;
		border-radius: 20px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
		animation: modalSlideIn 0.3s ease-out;
	}

	.edit-modal {
		max-width: 500px;
	}

	.add-shift-modal {
		max-width: 550px;
	}

	.add-lokasi-modal {
		max-width: 550px;
	}

	.add-jabatan-modal {
		max-width: 550px;
	}

	.add-divisi-modal {
		max-width: 550px;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.modal-icon {
		font-size: 2.5rem;
	}

	.modal-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
	}

	.modal-body {
		margin-bottom: 2rem;
	}

	.modal-body p {
		color: #374151;
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.warning-text {
		color: #ef4444;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	/* Buttons */
	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: rgba(156, 163, 175, 0.1);
		color: #6b7280;
		border: 1px solid rgba(156, 163, 175, 0.3);
	}

	.btn-secondary:hover {
		background: rgba(156, 163, 175, 0.2);
		transform: translateY(-2px);
	}

	.btn-danger {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
	}

	.btn-danger:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 20px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
		opacity: 0.7;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #666;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	/* Form Styles */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.25rem;
	}

	.form-input,
	.form-select,
	.form-textarea {
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.9);
		outline: none;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: white;
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.form-select {
		cursor: pointer;
	}

	.form-input::placeholder,
	.form-textarea::placeholder {
		color: #9ca3af;
	}

	/* Add Shift Form Styles */
	.add-shift-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.label-icon {
		width: 1rem;
		height: 1rem;
		margin-right: 0.5rem;
		opacity: 0.7;
	}

	.form-label {
		display: flex;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
		margin-left: 0.25rem;
		font-weight: 700;
	}

	.help-box {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border: 1px solid #0ea5e9;
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.help-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.help-content p {
		margin: 0 0 0.5rem 0;
		font-weight: 600;
		color: #075985;
		font-size: 0.875rem;
	}

	.help-content ul {
		margin: 0;
		padding-left: 1rem;
		color: #0369a1;
	}

	.help-content li {
		margin-bottom: 0.25rem;
		font-size: 0.8rem;
		line-height: 1.4;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		margin-right: 0.5rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
