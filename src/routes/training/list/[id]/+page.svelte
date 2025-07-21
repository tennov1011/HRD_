<script>
  import { formatDate } from '$lib/utils/dateUtils';
  import { onMount } from 'svelte';
  // We'll need to dynamically import jsPDF to avoid SSR issues
  let jsPDF;

  /** @type {import('./$types').PageData} */
  export let data;

  const training = data.training;

  // Format date time
  /**
   * @param {string} date
   */
  function formatDateTime(date) {
    if (!date) return '-';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date time:', error);
      return date;
    }
  }
  
  // Format status badge
  /**
   * @param {string} status
   */
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

  // Utility to count array or CSV/string values (similar to list page)
  /**
   * @param {unknown} value
   */
  function getArrayCount(value) {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      if (trimmed.includes(',')) return trimmed.split(',').length;
      return 1;
    }
    return 0;
  }

  // PDF export functionality
  let isExporting = false;

  /**
   * Exports the training details to PDF
   */
  async function exportToPDF() {
    if (isExporting) return;
    isExporting = true;

    try {
      // Dynamically import jsPDF only when needed
      if (!jsPDF) {
        const module = await import('jspdf');
        jsPDF = module.default;
      }

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font size and styles
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      
      // Add title
      doc.text('DETAIL TRAINING', 105, 15, { align: 'center' });
      doc.setFontSize(18);
      doc.text(training.training_title, 105, 25, { align: 'center' });
      
      // Add status
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${training.status}`, 105, 35, { align: 'center' });
      
      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);
      
      // Set font for content
      doc.setFontSize(11);
      
      // Training details
      let y = 50;
      
      // Training type
      doc.setFont('helvetica', 'bold');
      doc.text('Jenis Training:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(training.training_type || '-', 70, y);
      y += 10;
      
      // Schedule
      doc.setFont('helvetica', 'bold');
      doc.text('Jadwal:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatDateTime(training.date_started)} - ${formatDateTime(training.date_finished)}`, 70, y);
      y += 7;
      
      doc.text(`Jam: ${training.time_started || '-'} - ${training.time_finished || '-'}`, 70, y);
      y += 10;
      
      // Location
      doc.setFont('helvetica', 'bold');
      doc.text('Lokasi:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(training.location || '-', 70, y);
      y += 15;
      
      // Description
      doc.setFont('helvetica', 'bold');
      doc.text('Deskripsi:', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      
      // Split long description into multiple lines
      const splitDesc = doc.splitTextToSize(training.description || '-', 170);
      doc.text(splitDesc, 20, y);
      y += splitDesc.length * 7 + 10;
      
      // Trainers
      doc.setFont('helvetica', 'bold');
      doc.text(`Trainer (${getArrayCount(training.trainer)})`, 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      
      if (Array.isArray(training.trainer) && training.trainer.length > 0) {
        training.trainer.forEach(trainer => {
          doc.text(`• ${trainer}`, 25, y);
          y += 7;
          
          // Add new page if needed
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      } else if (typeof training.trainer === 'string' && training.trainer.trim() !== '') {
        doc.text(`• ${training.trainer}`, 25, y);
        y += 7;
      } else {
        doc.text('Tidak ada trainer', 25, y);
        y += 7;
      }
      
      y += 5;
      
      // Participants
      doc.setFont('helvetica', 'bold');
      doc.text(`Peserta (${getArrayCount(training.participant)})`, 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      
      if (Array.isArray(training.participant) && training.participant.length > 0) {
        training.participant.forEach(participant => {
          doc.text(`• ${participant}`, 25, y);
          y += 7;
          
          // Add new page if needed
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      } else if (typeof training.participant === 'string' && training.participant.trim() !== '') {
        doc.text(`• ${training.participant}`, 25, y);
        y += 7;
      } else {
        doc.text('Tidak ada peserta', 25, y);
        y += 7;
      }
      
      y += 5;
      
      // Notes
      if (training.note) {
        // Add new page if there's not enough space
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Catatan:', 20, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        
        const splitNotes = doc.splitTextToSize(training.note, 170);
        doc.text(splitNotes, 20, y);
      }
      
      // Add footer with date
      const currentDate = new Date().toLocaleDateString('id-ID');
      doc.setFontSize(8);
      doc.text(`Dicetak pada: ${currentDate}`, 20, 285);
      
      // Save the PDF
      doc.save(`Training_${training.training_title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      isExporting = false;
    }
  }

  onMount(async () => {
    // Preload jsPDF for faster response when user clicks export
    try {
      const module = await import('jspdf');
      jsPDF = module.default;
    } catch (error) {
      console.error('Failed to preload jsPDF:', error);
    }
  });
</script>

<svelte:head>
  <title>Detail Training - {training?.training_title || 'HRD System'}</title>
</svelte:head>

<div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Detail Training</h1>
    <div class="flex space-x-2">
      <a href="/training/list" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
        Kembali ke Daftar
      </a>
      <button
        on:click={exportToPDF}
        disabled={isExporting}
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
      >
        {#if isExporting}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memproses...
        {:else}
          <svg class="-ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        {/if}
      </button>
      <a href={`/training/list/edit/${training.id}`} class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
        Edit Training
      </a>
    </div>
  </div>

  {#if training}
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <!-- Header Section -->
      <div class="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold text-gray-800">{training.training_title}</h2>
            <p class="text-sm text-gray-600 mt-1">{training.training_type}</p>
          </div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusBadgeClass(training.status)}">
            {training.status}
          </span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="px-6 py-5">
        <!-- Schedule & Location Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-gray-50 rounded-lg p-5">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Jadwal</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Tanggal Mulai</p>
                <p class="text-base font-medium">{formatDateTime(training.date_started) + ' - ' + formatDateTime(training.date_finished)}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Jam Mulai</p>
                <p class="text-base font-medium">{(training.time_started + ' - ' + training.time_finished)}</p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-5">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Lokasi</h3>
            <p class="text-base">{training.location || '-'}</p>
          </div>
        </div>

        <!-- Description Section -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Deskripsi</h3>
          <div class="bg-gray-50 rounded-lg p-5">
            <p class="text-base whitespace-pre-wrap">{training.description}</p>
          </div>
        </div>

        <!-- Trainers & Participants Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Trainer ({getArrayCount(training.trainer)})</h3>
            <div class="bg-gray-50 rounded-lg p-5 h-60 overflow-y-auto">
              {#if Array.isArray(training.trainer) && training.trainer.length > 0}
                <ul class="space-y-2">
                  {#each training.trainer as trainerName}
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span>{trainerName}</span>
                    </li>
                  {/each}
                </ul>
              {:else if typeof training.trainer === 'string' && training.trainer.trim() !== ''}
                <span>{training.trainer}</span>
              {:else}
                <p class="text-gray-500">Tidak ada trainer</p>
              {/if}
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Peserta ({getArrayCount(training.participant)})</h3>
            <div class="bg-gray-50 rounded-lg p-5 h-60 overflow-y-auto">
              {#if Array.isArray(training.participant) && training.participant.length > 0}
                <ul class="space-y-2">
                  {#each training.participant as participantName}
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>{participantName}</span>
                    </li>
                  {/each}
                </ul>
              {:else if typeof training.participant === 'string' && training.participant.trim() !== ''}
                <span>{training.participant}</span>
              {:else}
                <p class="text-gray-500">Tidak ada peserta</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        {#if training.note}
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Catatan</h3>
            <div class="bg-gray-50 rounded-lg p-5">
              <p class="text-base whitespace-pre-wrap">{training.note}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="bg-white shadow-md rounded-lg p-8 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">Data tidak ditemukan</h3>
      <p class="mt-1 text-sm text-gray-500">
        Training yang Anda cari tidak dapat ditemukan.
      </p>
      <div class="mt-6">
        <a href="/training/list" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Kembali ke Daftar Training
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for lists */
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