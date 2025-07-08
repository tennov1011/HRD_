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
						<div class="card-badge">
							{masterData[category].length} item
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
																on:click={() =>
																	handleDelete(
																		item,
																		config.title.toLowerCase(),
																		`delete${category.charAt(0).toUpperCase() + category.slice(1).replace('_', '')}`
																	)}
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
		padding: 1.5rem 3rem;
		max-width: 1600px;
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
		border-radius: 24px;
		padding: 2.5rem;
		margin-bottom: 2rem;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.08),
			0 1px 0 rgba(255, 255, 255, 0.8) inset;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.header-text h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.header-text p {
		color: #666;
		font-size: 1.1rem;
		margin: 0;
	}

	/* Statistics Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		max-width: 700px;
		width: 100%;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
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
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
	}

	.stat-card.total {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.stat-icon {
		font-size: 2rem;
		opacity: 0.9;
	}

	.stat-info {
		flex: 1;
	}

	.stat-number {
		font-size: 1.8rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		opacity: 0.8;
		font-weight: 500;
	}

	/* Controls Section */
	.controls-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 12px;
		padding: 0 1rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.3);
		min-width: 350px;
		flex: 1;
		max-width: 500px;
	}

	.search-icon {
		color: #9ca3af;
		margin-right: 0.75rem;
		font-size: 1.2rem;
	}

	.search-input {
		border: none;
		background: transparent;
		padding: 1rem 0;
		font-size: 1rem;
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
		border-radius: 12px;
		padding: 0.5rem;
		gap: 0.25rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.3);
		flex-wrap: wrap;
	}

	.filter-tab {
		padding: 0.75rem 1.25rem;
		border: none;
		background: transparent;
		border-radius: 8px;
		font-size: 0.875rem;
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
		gap: 2rem;
		grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
	}

	/* Data Card */
	.data-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
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
		transform: translateY(-5px);
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
	}

	/* Card Header */
	.card-header {
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.title-icon {
		font-size: 2rem;
		opacity: 0.9;
	}

	.title-text h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.25rem 0;
	}

	.title-text p {
		color: #666;
		font-size: 0.9rem;
		margin: 0;
	}

	.card-badge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
		padding: 1.25rem 1.5rem;
		text-align: left;
		font-size: 0.875rem;
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
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		vertical-align: middle;
	}

	.cell-content {
		font-size: 0.95rem;
		color: #374151;
		font-weight: 500;
	}

	/* Status Badge */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
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
		gap: 0.5rem;
		justify-content: center;
	}

	.action-btn {
		padding: 0.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.action-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
</style>
