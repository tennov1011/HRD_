<script>
	import { onMount } from 'svelte';
	import { HolidayService } from '$lib/services/holidayService.js';

	let holidayData = [];
	let loading = true;
	let error = null;
	let searchTerm = '';
	let selectedYear = new Date().getFullYear();
	let typeFilter = 'all';
	let showCalendar = false;
	let calendarDate = new Date();
	let importLoading = false;

	// Debug Indonesian holidays
	let showDebugHolidays = false;

	// Form state
	let showForm = false;
	let editingHoliday = null;
	let holidayForm = {
		name: '',
		date: '',
		description: '',
		type: 'public'
	};
	let saveLoading = false;

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 10;

	$: availableYears = getAvailableYears();
	$: filteredData = filterHolidayData(holidayData, searchTerm, typeFilter);
	$: paginatedData = paginateData(filteredData, currentPage, itemsPerPage);
	$: totalPages = Math.ceil(filteredData.length / itemsPerPage);
	$: holidayDates = holidayData.map((h) => h.date);
	$: calendarMonth = calendarDate.getMonth();
	$: calendarYear = calendarDate.getFullYear();

	onMount(() => {
		loadHolidayData();
	});

	function getAvailableYears() {
		const currentYear = new Date().getFullYear();
		const years = [];
		for (let i = currentYear - 2; i <= currentYear + 2; i++) {
			years.push(i);
		}
		return years;
	}

	async function loadHolidayData() {
		try {
			loading = true;
			error = null;

			const response = await HolidayService.getHolidaysByYear(selectedYear);

			if (response && response.data) {
				holidayData = response.data;
				console.log('Loaded holidays:', holidayData);
			} else {
				holidayData = [];
			}
		} catch (err) {
			error = err.message;
			console.error('Error loading holiday data:', err);
		} finally {
			loading = false;
		}
	}

	function filterHolidayData(data, search, type) {
		let filtered = data;

		// Filter by search term
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(
				(item) =>
					item.name?.toLowerCase().includes(searchLower) ||
					item.description?.toLowerCase().includes(searchLower)
			);
		}

		// Filter by type
		if (type !== 'all') {
			filtered = filtered.filter((item) => item.type === type);
		}

		return filtered;
	}

	function paginateData(data, page, perPage) {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return data.slice(start, end);
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getHolidayTypeLabel(type) {
		return HolidayService.getHolidayTypeLabel(type);
	}

	function getHolidayTypeColor(type) {
		return HolidayService.getHolidayTypeColor(type);
	}

	function openForm() {
		editingHoliday = null;
		holidayForm = {
			name: '',
			date: '',
			description: '',
			type: 'public'
		};
		showForm = true;
	}

	function openEditForm(holiday) {
		editingHoliday = holiday;
		holidayForm = {
			name: holiday.name,
			date: holiday.date,
			description: holiday.description || '',
			type: holiday.type
		};
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingHoliday = null;
		holidayForm = {
			name: '',
			date: '',
			description: '',
			type: 'public'
		};
	}

	async function saveHoliday() {
		if (!holidayForm.name || !holidayForm.date) {
			alert('Nama dan tanggal libur harus diisi!');
			return;
		}

		try {
			saveLoading = true;

			// Check if date already exists (except when editing)
			const existingHoliday = holidayData.find((h) => h.date === holidayForm.date);
			if (existingHoliday && (!editingHoliday || existingHoliday.id !== editingHoliday.id)) {
				alert('Tanggal libur sudah ada!');
				return;
			}

			let response;
			if (editingHoliday) {
				// Update existing holiday
				response = await HolidayService.updateHoliday(editingHoliday.id, holidayForm);
			} else {
				// Add new holiday
				response = await HolidayService.createHoliday(holidayForm);
			}

			closeForm();
			alert('✅ Data libur berhasil disimpan!');

			// Reload data
			await loadHolidayData();
		} catch (error) {
			console.error('Error saving holiday:', error);
			alert('❌ Terjadi kesalahan saat menyimpan data libur');
		} finally {
			saveLoading = false;
		}
	}

	async function deleteHoliday(holiday) {
		if (confirm(`Apakah Anda yakin ingin menghapus libur "${holiday.name}"?`)) {
			try {
				await HolidayService.deleteHoliday(holiday.id);
				alert('✅ Data libur berhasil dihapus!');
				await loadHolidayData();
			} catch (error) {
				console.error('Error deleting holiday:', error);
				alert('❌ Terjadi kesalahan saat menghapus data libur');
			}
		}
	}

	function refreshData() {
		currentPage = 1;
		loadHolidayData();
	}

	// Watch for year changes
	$: if (selectedYear) {
		refreshData();
	}

	// Calendar functions
	function toggleCalendar() {
		showCalendar = !showCalendar;
	}

	function getDaysInMonth(year, month) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(year, month) {
		return new Date(year, month, 1).getDay();
	}

	function isHolidayDate(date) {
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		return holidayDates.includes(dateStr);
	}

	function getHolidayForDate(date) {
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		return holidayData.find((h) => h.date === dateStr);
	}

	function previousMonth() {
		calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
	}

	function goToToday() {
		calendarDate = new Date();
	}

	// Debug function to check holidays from library
	function debugIndonesianHolidays() {
		const holidays = HolidayService.getIndonesianHolidays(selectedYear);
		console.log(`Debug: Indonesian holidays for ${selectedYear}:`, holidays);
		console.log(`Total unique holidays found: ${holidays.length}`);
		
		// Show alert with summary
		const holidayList = holidays.map((h, index) => `${index + 1}. ${h.date}: ${h.name}`).join('\n');
		alert(`Found ${holidays.length} unique Indonesian holidays for ${selectedYear}:\n\n${holidayList}`);
		
		showDebugHolidays = true;
	}

	async function importIndonesianHolidays() {
		if (
			confirm(
				`Apakah Anda yakin ingin mengimpor hari libur nasional Indonesia untuk tahun ${selectedYear}?`
			)
		) {
			try {
				importLoading = true;
				const result = await HolidayService.importIndonesianHolidays(selectedYear);

				if (result.success) {
					console.log('Import result details:', result);
					alert(
						`✅ Berhasil mengimpor ${result.imported} hari libur nasional. ${result.skipped} libur sudah ada sebelumnya.\n\nTotal dari library: ${result.total} (sudah dihilangkan duplikasi)\n\nDetail hasil import tersedia di console.`
					);
					await loadHolidayData();
				} else {
					alert(`❌ Gagal mengimpor hari libur: ${result.error}`);
				}
			} catch (error) {
				console.error('Error importing holidays:', error);
				alert('❌ Terjadi kesalahan saat mengimpor hari libur nasional');
			} finally {
				importLoading = false;
			}
		}
	}
</script>

<svelte:head>
	<title>Daftar Libur - HRD System</title>
</svelte:head>

<div class="holidays-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<h1>🏖️ Daftar Libur</h1>
			<p>Kelola dan monitor hari libur perusahaan</p>
		</div>
		<div class="header-actions">
			<button class="btn btn-success" on:click={importIndonesianHolidays} disabled={importLoading}>
				{#if importLoading}
					<span class="loading-spinner-small"></span>
					Mengimpor...
				{:else}
					🇮🇩 Impor Libur Nasional
				{/if}
			</button>
			<button class="btn btn-warning" on:click={debugIndonesianHolidays}>
				🔍 Debug Libur Nasional
			</button>
			<button class="btn btn-info" on:click={toggleCalendar}>
				{#if showCalendar}
					📋 Tampilkan Daftar
				{:else}
					📅 Tampilkan Kalender
				{/if}
			</button>
			<button class="btn btn-primary" on:click={openForm}> ➕ Tambah Libur </button>
			<button class="btn btn-secondary" on:click={refreshData}> 🔄 Refresh </button>
		</div>
	</div>

	<!-- Filters -->
	<div class="filters-section">
		<div class="filters-grid">
			<!-- Year Filter -->
			<div class="filter-group">
				<label for="year-filter">Tahun:</label>
				<select id="year-filter" bind:value={selectedYear} class="filter-select">
					{#each availableYears as year}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>

			<!-- Search -->
			<div class="filter-group">
				<label for="search">Cari Libur:</label>
				<input
					id="search"
					type="text"
					placeholder="Nama atau deskripsi..."
					bind:value={searchTerm}
					class="filter-input"
				/>
			</div>

			<!-- Type Filter -->
			<div class="filter-group">
				<label for="type-filter">Jenis Libur:</label>
				<select id="type-filter" bind:value={typeFilter} class="filter-select">
					<option value="all">Semua Jenis</option>
					<option value="public">Hari Libur Nasional</option>
					<option value="company">Libur Perusahaan</option>
					<option value="special">Libur Khusus</option>
				</select>
			</div>

			<!-- Results Count -->
			<div class="results-info">
				<span class="results-count">
					Menampilkan {paginatedData.length} dari {filteredData.length} data
				</span>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="content-section">
		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Memuat data libur...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<div class="error-icon">⚠️</div>
				<h3>Terjadi Kesalahan</h3>
				<p>{error}</p>
				<button class="btn btn-primary" on:click={refreshData}> Coba Lagi </button>
			</div>
		{:else if holidayData.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🏖️</div>
				<h3>Belum Ada Data Libur</h3>
				<p>Belum ada hari libur yang ditambahkan untuk tahun {selectedYear}.</p>
				<button class="btn btn-primary" on:click={openForm}> ➕ Tambah Libur Pertama </button>
				<button
					class="btn btn-success"
					on:click={importIndonesianHolidays}
					disabled={importLoading}
				>
					🇮🇩 Impor Libur Nasional {selectedYear}
				</button>
			</div>
		{:else if showCalendar}
			<!-- Calendar View -->
			<div class="calendar-section">
				<div class="calendar-header">
					<button class="btn-calendar" on:click={previousMonth}>‹</button>
					<h3 class="calendar-title">
						{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
							calendarDate
						)}
					</h3>
					<button class="btn-calendar" on:click={nextMonth}>›</button>
					<button class="btn btn-secondary btn-small" on:click={goToToday}>Hari Ini</button>
				</div>

				<div class="calendar-grid">
					<div class="calendar-weekdays">
						<div class="weekday">Min</div>
						<div class="weekday">Sen</div>
						<div class="weekday">Sel</div>
						<div class="weekday">Rab</div>
						<div class="weekday">Kam</div>
						<div class="weekday">Jum</div>
						<div class="weekday">Sab</div>
					</div>

					<div class="calendar-days">
						{#each Array(getFirstDayOfMonth(calendarYear, calendarMonth)) as _}
							<div class="calendar-day empty"></div>
						{/each}

						{#each Array(getDaysInMonth(calendarYear, calendarMonth)) as _, dayIndex}
							{@const day = dayIndex + 1}
							{@const currentDate = new Date(calendarYear, calendarMonth, day)}
							{@const isHoliday = isHolidayDate(currentDate)}
							{@const holiday = isHoliday ? getHolidayForDate(currentDate) : null}
							{@const isToday = currentDate.toDateString() === new Date().toDateString()}

							<div
								class="calendar-day {isHoliday ? 'holiday' : ''} {isToday ? 'today' : ''} {holiday
									? getHolidayTypeColor(holiday.type)
									: ''}"
								title={holiday ? `${holiday.name} - ${getHolidayTypeLabel(holiday.type)}` : ''}
							>
								<span class="day-number">{day}</span>
								{#if isHoliday && holiday}
									<div class="holiday-indicator">
										<span class="holiday-name">{holiday.name}</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="calendar-legend">
					<div class="legend-item">
						<div class="legend-color holiday-public"></div>
						<span>Libur Nasional</span>
					</div>
					<div class="legend-item">
						<div class="legend-color holiday-company"></div>
						<span>Libur Perusahaan</span>
					</div>
					<div class="legend-item">
						<div class="legend-color holiday-special"></div>
						<span>Libur Khusus</span>
					</div>
				</div>
			</div>
		{:else}
			<!-- Holiday Cards -->
			<div class="holiday-grid">
				{#each paginatedData as holiday}
					<div class="holiday-card {getHolidayTypeColor(holiday.type)}">
						<div class="holiday-header">
							<div class="holiday-date">
								{formatDate(holiday.date)}
							</div>
							<div class="holiday-actions">
								<button
									class="btn-action btn-edit"
									title="Edit Libur"
									on:click={() => openEditForm(holiday)}
								>
									✏️
								</button>
								<button
									class="btn-action btn-delete"
									title="Hapus Libur"
									on:click={() => deleteHoliday(holiday)}
								>
									🗑️
								</button>
							</div>
						</div>

						<div class="holiday-body">
							<h3 class="holiday-name">{holiday.name}</h3>
							<div class="holiday-type-badge">
								{getHolidayTypeLabel(holiday.type)}
							</div>
							{#if holiday.description}
								<p class="holiday-description">{holiday.description}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						class="btn-page"
						disabled={currentPage === 1}
						on:click={() => (currentPage = currentPage - 1)}
					>
						← Sebelumnya
					</button>

					<div class="page-numbers">
						{#each Array(totalPages) as _, i}
							<button
								class="btn-page {currentPage === i + 1 ? 'active' : ''}"
								on:click={() => (currentPage = i + 1)}
							>
								{i + 1}
							</button>
						{/each}
					</div>

					<button
						class="btn-page"
						disabled={currentPage === totalPages}
						on:click={() => (currentPage = currentPage + 1)}
					>
						Selanjutnya →
					</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Form Modal -->
	{#if showForm}
		<div
			class="modal-overlay"
			role="dialog"
			aria-modal="true"
			tabindex="0"
			on:click={closeForm}
			on:keydown={(e) => e.key === 'Escape' && closeForm()}
		>
			<div
				class="modal-content"
				role="document"
				on:click|stopPropagation
				on:keydown|stopPropagation
			>
				<div class="modal-header">
					<h3>
						{#if editingHoliday}
							✏️ Edit Hari Libur
						{:else}
							➕ Tambah Hari Libur
						{/if}
					</h3>
					<button class="modal-close" on:click={closeForm}>×</button>
				</div>

				<div class="modal-body">
					<div class="form-grid">
						<div class="form-group">
							<label for="holiday-name">Nama Libur <span class="required">*</span></label>
							<input
								id="holiday-name"
								type="text"
								bind:value={holidayForm.name}
								placeholder="Contoh: Hari Raya Idul Fitri"
								class="form-input"
								required
							/>
						</div>

						<div class="form-group">
							<label for="holiday-date">Tanggal <span class="required">*</span></label>
							<input
								id="holiday-date"
								type="date"
								bind:value={holidayForm.date}
								class="form-input"
								required
							/>
						</div>

						<div class="form-group">
							<label for="holiday-type">Jenis Libur</label>
							<select id="holiday-type" bind:value={holidayForm.type} class="form-select">
								<option value="public">Hari Libur Nasional</option>
								<option value="company">Libur Perusahaan</option>
								<option value="special">Libur Khusus</option>
							</select>
						</div>

						<div class="form-group full-width">
							<label for="holiday-description">Deskripsi</label>
							<textarea
								id="holiday-description"
								bind:value={holidayForm.description}
								placeholder="Deskripsi hari libur..."
								class="form-textarea"
								rows="3"
							></textarea>
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<button
						type="button"
						class="btn btn-secondary"
						on:click={closeForm}
						disabled={saveLoading}
					>
						Batalkan
					</button>
					<button
						type="button"
						class="btn btn-primary"
						on:click={saveHoliday}
						disabled={saveLoading}
					>
						{#if saveLoading}
							<span class="loading-spinner-small"></span>
							Menyimpan...
						{:else if editingHoliday}
							💾 Update Libur
						{:else}
							➕ Tambah Libur
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<style>
		.holidays-page {
			padding: 24px;
			background: #f8fafc;
			min-height: 100vh;
		}

		.page-header {
			background: white;
			padding: 24px;
			border-radius: 16px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			margin-bottom: 24px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
			gap: 16px;
		}

		.header-content h1 {
			margin: 0 0 8px 0;
			font-size: 24px;
			font-weight: 700;
			color: #1e293b;
		}

		.header-content p {
			margin: 0;
			color: #64748b;
			font-size: 14px;
		}

		.header-actions {
			display: flex;
			gap: 12px;
		}

		.btn {
			padding: 8px 16px;
			border-radius: 8px;
			font-size: 14px;
			font-weight: 500;
			border: none;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.btn-primary {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
		}

		.btn-secondary {
			background: #f1f5f9;
			color: #475569;
			border: 1px solid #e2e8f0;
		}

		.btn-success {
			background: linear-gradient(135deg, #10b981, #059669);
			color: white;
		}

		.btn-info {
			background: linear-gradient(135deg, #0ea5e9, #0284c7);
			color: white;
		}

		.btn-warning {
			background: linear-gradient(135deg, #f59e0b, #d97706);
			color: white;
		}

		.btn-small {
			padding: 6px 12px;
			font-size: 12px;
		}

		.btn:hover {
			opacity: 0.9;
			transform: translateY(-1px);
		}

		.filters-section {
			background: white;
			padding: 20px;
			border-radius: 16px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			margin-bottom: 24px;
		}

		.filters-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 16px;
			align-items: end;
		}

		.filter-group {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.filter-group label {
			font-size: 14px;
			font-weight: 500;
			color: #374151;
		}

		.filter-input,
		.filter-select {
			padding: 8px 12px;
			border: 1px solid #d1d5db;
			border-radius: 8px;
			font-size: 14px;
			background: white;
			transition: border-color 0.2s ease;
		}

		.filter-input:focus,
		.filter-select:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		.results-info {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.results-count {
			font-size: 12px;
			color: #64748b;
			font-weight: 500;
		}

		.content-section {
			background: white;
			border-radius: 16px;
			padding: 24px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		}

		.holiday-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			gap: 20px;
			margin-bottom: 24px;
		}

		.holiday-card {
			border-radius: 12px;
			padding: 20px;
			border: 1px solid #e2e8f0;
			transition: all 0.2s ease;
			background: white;
		}

		.holiday-card:hover {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
			transform: translateY(-2px);
		}

		.holiday-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 16px;
		}

		.holiday-date {
			font-size: 12px;
			color: #64748b;
			font-weight: 500;
		}

		.holiday-actions {
			display: flex;
			gap: 4px;
		}

		.btn-action {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			border: none;
			border-radius: 6px;
			font-size: 12px;
			cursor: pointer;
			transition: all 0.2s ease;
			background: #f8fafc;
			border: 1px solid #e2e8f0;
		}

		.btn-action:hover {
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		}

		.btn-action.btn-edit {
			background: #dbeafe;
			color: #1d4ed8;
			border-color: #bfdbfe;
		}

		.btn-action.btn-edit:hover {
			background: #bfdbfe;
			border-color: #93c5fd;
		}

		.btn-action.btn-delete {
			background: #fee2e2;
			color: #dc2626;
			border-color: #fecaca;
		}

		.btn-action.btn-delete:hover {
			background: #fecaca;
			border-color: #f87171;
		}

		.holiday-body {
			/* Holiday card body styles */
		}

		.holiday-name {
			margin: 0 0 8px 0;
			font-size: 16px;
			font-weight: 600;
			color: #1e293b;
		}

		.holiday-type-badge {
			display: inline-block;
			padding: 2px 8px;
			border-radius: 12px;
			font-size: 11px;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.025em;
			margin-bottom: 8px;
		}

		.holiday-description {
			margin: 0;
			font-size: 14px;
			color: #64748b;
			line-height: 1.4;
		}

		/* Holiday Type Colors */
		.holiday-public {
            background: #fee2e2;
            border-color: #f87171;
		}

		.holiday-public .holiday-type-badge {
            background: #f87171;
            color: #dc2626;
		}

		.holiday-company {
			background: #dbeafe;
			border-color: #60a5fa;
		}

		.holiday-company .holiday-type-badge {
			background: #60a5fa;
			color: #1e40af;
		}

		.holiday-special {
			background: #f3e8ff;
			border-color: #a855f7;
		}

		.holiday-special .holiday-type-badge {
			background: #a855f7;
			color: #7c3aed;
		}

		.holiday-default {
			background: #f8fafc;
			border-color: #e2e8f0;
		}

		.holiday-default .holiday-type-badge {
			background: #e2e8f0;
			color: #64748b;
		}

		/* Loading & Error States */
		.loading-state,
		.error-state,
		.empty-state {
			text-align: center;
			padding: 60px 20px;
			color: #64748b;
		}

		.loading-spinner {
			width: 40px;
			height: 40px;
			border: 3px solid #f3f4f6;
			border-top: 3px solid #3b82f6;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin: 0 auto 20px;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		.error-icon,
		.empty-icon {
			font-size: 48px;
			margin-bottom: 16px;
		}

		.error-state h3,
		.empty-state h3 {
			margin: 0 0 8px 0;
			font-size: 18px;
			color: #1e293b;
		}

		.error-state p,
		.empty-state p {
			margin: 0 0 20px 0;
			font-size: 14px;
		}

		/* Pagination */
		.pagination {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 8px;
			margin-top: 32px;
		}

		.btn-page {
			padding: 8px 12px;
			border: 1px solid #d1d5db;
			background: white;
			color: #374151;
			border-radius: 6px;
			cursor: pointer;
			font-size: 14px;
			transition: all 0.2s ease;
		}

		.btn-page:hover:not(:disabled) {
			background: #f3f4f6;
			border-color: #9ca3af;
		}

		.btn-page:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.btn-page.active {
			background: #3b82f6;
			color: white;
			border-color: #3b82f6;
		}

		.page-numbers {
			display: flex;
			gap: 4px;
		}

		/* Modal Styles */
		.modal-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
			backdrop-filter: blur(4px);
		}

		.modal-content {
			background: white;
			border-radius: 16px;
			box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
			max-width: 600px;
			width: 90%;
			max-height: 90vh;
			overflow-y: auto;
		}

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20px 24px;
			border-bottom: 1px solid #e2e8f0;
		}

		.modal-header h3 {
			margin: 0;
			font-size: 18px;
			font-weight: 600;
			color: #1e293b;
		}

		.modal-close {
			background: none;
			border: none;
			font-size: 24px;
			color: #64748b;
			cursor: pointer;
			padding: 4px;
			border-radius: 4px;
			transition: background 0.2s ease;
		}

		.modal-close:hover {
			background: #f1f5f9;
		}

		.modal-body {
			padding: 24px;
		}

		.form-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 16px;
			margin-bottom: 24px;
		}

		.form-group {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.form-group.full-width {
			grid-column: 1 / -1;
		}

		.form-group label {
			font-size: 14px;
			font-weight: 500;
			color: #374151;
		}

		.required {
			color: #dc2626;
			font-weight: 600;
		}

		.form-input,
		.form-select,
		.form-textarea {
			padding: 10px 12px;
			border: 1px solid #d1d5db;
			border-radius: 8px;
			font-size: 14px;
			background: white;
			transition: border-color 0.2s ease;
		}

		.form-input:focus,
		.form-select:focus,
		.form-textarea:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		.form-textarea {
			resize: vertical;
			min-height: 80px;
		}

		.modal-actions {
			display: flex;
			justify-content: flex-end;
			gap: 12px;
			border-top: 1px solid #e2e8f0;
			padding: 20px 24px;
		}

		.loading-spinner-small {
			width: 16px;
			height: 16px;
			border: 2px solid #f3f4f6;
			border-top: 2px solid #3b82f6;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			display: inline-block;
			margin-right: 8px;
		}

		/* Calendar Styles */
		.calendar-section {
			margin-bottom: 24px;
		}

		.calendar-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 24px;
			flex-wrap: wrap;
			gap: 12px;
		}

		.calendar-title {
			margin: 0;
			font-size: 20px;
			font-weight: 600;
			color: #1e293b;
			text-align: center;
			flex: 1;
		}

		.btn-calendar {
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 8px;
			padding: 8px 12px;
			font-size: 18px;
			cursor: pointer;
			transition: all 0.2s ease;
			color: #64748b;
		}

		.btn-calendar:hover {
			background: #f1f5f9;
			color: #475569;
			transform: translateY(-1px);
		}

		.calendar-grid {
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			overflow: hidden;
			background: white;
		}

		.calendar-weekdays {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			background: #f8fafc;
			border-bottom: 1px solid #e2e8f0;
		}

		.weekday {
			padding: 12px 8px;
			text-align: center;
			font-size: 12px;
			font-weight: 600;
			color: #64748b;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.calendar-days {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
		}

		.calendar-day {
			min-height: 80px;
			padding: 8px;
			border-right: 1px solid #f1f5f9;
			border-bottom: 1px solid #f1f5f9;
			position: relative;
			cursor: pointer;
			transition: all 0.2s ease;
			background: white;
		}

		.calendar-day:hover {
			background: #f8fafc;
		}

		.calendar-day.empty {
			background: #fafbfc;
			cursor: default;
		}

		.calendar-day.today {
			background: #dbeafe;
			border: 2px solid #3b82f6;
		}

		.calendar-day.holiday {
			font-weight: 600;
		}

        .calendar-day.holiday-public {
            background: #fee2e2;
            border-color: #f87171;
        }

		.calendar-day.holiday-company {
			background: #dbeafe;
			border-color: #60a5fa;
		}

		.calendar-day.holiday-special {
			background: #f3e8ff;
			border-color: #a855f7;
		}

		.day-number {
			font-size: 14px;
			font-weight: 500;
			color: #1e293b;
			display: block;
			margin-bottom: 4px;
		}

		.holiday-indicator {
			position: absolute;
			bottom: 4px;
			left: 4px;
			right: 4px;
		}

		.holiday-name {
			font-size: 10px;
			color: #64748b;
			background: rgba(255, 255, 255, 0.9);
			padding: 2px 4px;
			border-radius: 4px;
			display: block;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
			line-height: 1.2;
		}

		.calendar-legend {
			display: flex;
			justify-content: center;
			gap: 24px;
			margin-top: 16px;
			flex-wrap: wrap;
		}

		.legend-item {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 12px;
			color: #64748b;
		}

		.legend-color {
			width: 16px;
			height: 16px;
			border-radius: 4px;
			border: 1px solid #e2e8f0;
		}

		/* Responsive */
		@media (max-width: 768px) {
			.holidays-page {
				padding: 16px;
			}

			.page-header {
				flex-direction: column;
				align-items: stretch;
			}

			.header-actions {
				justify-content: center;
			}

			.filters-grid {
				grid-template-columns: 1fr;
			}

			.holiday-grid {
				grid-template-columns: 1fr;
			}

			.modal-content {
				width: 95%;
			}
		}
	</style>
</div>
