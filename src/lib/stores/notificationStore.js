import { writable } from 'svelte/store';

/**
 * @typedef {Object} NotificationData
 * @property {number} id - Unique ID
 * @property {string} type - Type: success, error, warning, info
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {number} duration - Auto hide duration (0 = no auto hide)
 * @property {boolean} showIcon - Show icon
 * @property {boolean} closable - Allow manual close
 */

/**
 * Notification store untuk mengelola notifikasi global
 */
function createNotificationStore() {
	/** @type {import('svelte/store').Writable<NotificationData[]>} */
	const { subscribe, update } = writable([]);

	const store = {
		subscribe,
		
		/**
		 * Tambah notifikasi baru
		 * @param {Partial<NotificationData>} notification - Notification object
		 */
		add: (notification) => {
			const id = Date.now() + Math.random();
			/** @type {NotificationData} */
			const newNotification = {
				id,
				type: 'info',
				title: '',
				message: '',
				duration: 5000,
				showIcon: true,
				closable: true,
				...notification
			};

			update(notifications => [...notifications, newNotification]);

			// Auto remove jika ada duration
			if (newNotification.duration > 0) {
				setTimeout(() => {
					update(notifications => notifications.filter(n => n.id !== id));
				}, newNotification.duration);
			}

			return id;
		},

		/**
		 * Hapus notifikasi berdasarkan ID
		 * @param {number} id - Notification ID
		 */
		remove: (id) => {
			update(notifications => notifications.filter(n => n.id !== id));
		},

		/**
		 * Hapus semua notifikasi
		 */
		clear: () => {
			update(() => []);
		},

		/**
		 * Shorthand untuk notifikasi sukses
		 * @param {string} title - Title
		 * @param {string} message - Message
		 * @param {Partial<NotificationData>} options - Additional options
		 */
		success: (title, message, options = {}) => {
			return store.add({
				type: 'success',
				title,
				message,
				...options
			});
		},

		/**
		 * Shorthand untuk notifikasi error
		 * @param {string} title - Title
		 * @param {string} message - Message
		 * @param {Partial<NotificationData>} options - Additional options
		 */
		error: (title, message, options = {}) => {
			return store.add({
				type: 'error',
				title,
				message,
				duration: 7000, // Error notifications show longer
				...options
			});
		},

		/**
		 * Shorthand untuk notifikasi warning
		 * @param {string} title - Title
		 * @param {string} message - Message
		 * @param {Partial<NotificationData>} options - Additional options
		 */
		warning: (title, message, options = {}) => {
			return store.add({
				type: 'warning',
				title,
				message,
				...options
			});
		},

		/**
		 * Shorthand untuk notifikasi info
		 * @param {string} title - Title
		 * @param {string} message - Message
		 * @param {Partial<NotificationData>} options - Additional options
		 */
		info: (title, message, options = {}) => {
			return store.add({
				type: 'info',
				title,
				message,
				...options
			});
		}
	};

	return store;
}

export const notifications = createNotificationStore();

/**
 * Helper functions untuk notifikasi kasbon
 */
export const kasbonNotifications = {
	/**
	 * Notifikasi kasbon disetujui
	 * @param {any} kasbon - Kasbon object
	 */
	approved: (kasbon) => {
		const employeeName = kasbon.employee_name || kasbon.nama || 'Karyawan';
		const amount = kasbon.formatted_amount || `Rp ${(kasbon.amount || kasbon.nominal || 0).toLocaleString('id-ID')}`;
		
		notifications.success(
			'Kasbon Disetujui ✅',
			`Pengajuan kasbon ${employeeName} sebesar ${amount} telah disetujui oleh Manager HRD.`,
			{ duration: 6000 }
		);
	},

	/**
	 * Notifikasi kasbon ditolak
	 * @param {any} kasbon - Kasbon object
	 * @param {string} reason - Rejection reason
	 */
	rejected: (kasbon, reason) => {
		const employeeName = kasbon.employee_name || kasbon.nama || 'Karyawan';
		const amount = kasbon.formatted_amount || `Rp ${(kasbon.amount || kasbon.nominal || 0).toLocaleString('id-ID')}`;
		
		notifications.error(
			'Kasbon Ditolak ❌',
			`Pengajuan kasbon ${employeeName} sebesar ${amount} ditolak. ${reason ? `Alasan: ${reason}` : ''}`,
			{ duration: 8000 }
		);
	},

	/**
	 * Notifikasi kasbon berhasil diajukan
	 * @param {any} kasbon - Kasbon object
	 */
	submitted: (kasbon) => {
		const employeeName = kasbon.employee_name || kasbon.nama || 'Karyawan';
		const amount = kasbon.formatted_amount || `Rp ${(kasbon.amount || kasbon.nominal || 0).toLocaleString('id-ID')}`;
		
		notifications.info(
			'Kasbon Diajukan 📋',
			`Pengajuan kasbon ${employeeName} sebesar ${amount} telah berhasil diajukan dan menunggu persetujuan Manager HRD.`,
			{ duration: 5000 }
		);
	},

	/**
	 * Notifikasi pembayaran kasbon dicatat
	 * @param {any} payment - Payment object
	 */
	paymentRecorded: (payment) => {
		const amount = payment.formatted_amount || `Rp ${(payment.amount || 0).toLocaleString('id-ID')}`;
		
		notifications.success(
			'Pembayaran Dicatat 💰',
			`Pembayaran kasbon sebesar ${amount} telah berhasil dicatat.`,
			{ duration: 4000 }
		);
	}
};
