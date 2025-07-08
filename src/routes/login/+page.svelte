<!-- src/routes/login/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import Footer from '$lib/component/Footer.svelte';

	export let form;

	let loading = false;
	let showPassword = false;
</script>

<svelte:head>
	<title>Login - HRD Management System</title>
	<meta name="description" content="Sistem Manajemen HRD Eltama Prima Indo" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Animated Background -->
<div class="login-container">
	<!-- Background Animation -->
	<div class="animated-bg">
		<div class="floating-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
			<div class="shape shape-4"></div>
			<div class="shape shape-5"></div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="content-wrapper">
		<!-- Company Logo & Title -->
		<div class="header-section">
			<div class="logo-container">
				<div class="logo-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
				</div>
			</div>
			<h1 class="company-title">Eltama Prima Indo</h1>
			<p class="company-subtitle">HRD Management System</p>
		</div>

		<!-- Login Form Card -->
		<div class="form-card">
			<div class="form-header">
				<h2>Selamat Datang</h2>
				<p>Silakan masuk ke akun Anda</p>
			</div>

			<form
				method="POST"
				class="login-form"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<!-- Error Message -->
				{#if form?.error}
					<div class="error-message">
						<div class="error-icon">
							<svg viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span>{form.error}</span>
					</div>
				{/if}

				<!-- Email Field -->
				<div class="input-group">
					<label for="email" class="input-label">Email Address</label>
					<div class="input-wrapper">
						<div class="input-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path
									d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
								></path>
								<polyline points="22,6 12,13 2,6"></polyline>
							</svg>
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							value={form?.email || ''}
							disabled={loading}
							class="form-input"
							placeholder="nama@eltama.com"
						/>
					</div>
				</div>

				<!-- Password Field -->
				<div class="input-group">
					<label for="password" class="input-label">Password</label>
					<div class="input-wrapper">
						<div class="input-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
								<circle cx="12" cy="16" r="1"></circle>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
							</svg>
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							disabled={loading}
							class="form-input"
							placeholder="Masukkan password"
						/>
						<button
							type="button"
							class="password-toggle"
							on:click={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
									></path>
									<line x1="1" y1="1" x2="23" y2="23"></line>
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Login Button -->
				<button type="submit" disabled={loading} class="submit-button">
					{#if loading}
						<div class="loading-spinner"></div>
						<span>Memproses...</span>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
							<polyline points="10,17 15,12 10,7"></polyline>
							<line x1="15" y1="12" x2="3" y2="12"></line>
						</svg>
						<span>Masuk ke Sistem</span>
					{/if}
				</button>

				<!-- Demo Credentials -->
				<div class="demo-credentials">
					<div class="demo-header">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 6v6l4 2"></path>
						</svg>
						<span>Demo Accounts</span>
					</div>
					<div class="demo-list">
						<div class="demo-item">
							<strong>Admin:</strong>
							<span>admin@eltama.com / admin123</span>
						</div>
						<div class="demo-item">
							<strong>HRD:</strong>
							<span>michael@eltama.com / michael123</span>
						</div>
						<div class="demo-item">
							<strong>Finance:</strong>
							<span>sarah@eltama.com / sarah123</span>
						</div>
					</div>
				</div>
			</form>
		</div>

		<!-- Footer -->
		<div class="footer-wrapper">
			<Footer />
		</div>
	</div>
</div>

<style>
	/* Reset and Global Styles */
	* {
		box-sizing: border-box;
	}

	:global(body) {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		margin: 0;
		padding: 0;
		background: #0f0f23;
		overflow-x: hidden;
	}

	/* Main Container */
	.login-container {
		min-height: 100vh;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		background-attachment: fixed;
	}

	/* Animated Background */
	.animated-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: 1;
	}

	.animated-bg::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background:
			radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
			radial-gradient(circle at 75% 75%, rgba(255, 118, 117, 0.3) 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(162, 155, 254, 0.2) 0%, transparent 50%);
		animation: gradientShift 20s ease infinite;
	}

	@keyframes gradientShift {
		0%,
		100% {
			transform: scale(1) rotate(0deg);
		}
		50% {
			transform: scale(1.1) rotate(180deg);
		}
	}

	/* Floating Shapes */
	.floating-shapes {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.shape {
		position: absolute;
		border-radius: 50%;
		opacity: 0.1;
		animation: float 20s infinite ease-in-out;
	}

	.shape-1 {
		width: 80px;
		height: 80px;
		background: linear-gradient(45deg, #ff6b6b, #ee5a24);
		top: 10%;
		left: 10%;
		animation-delay: 0s;
	}

	.shape-2 {
		width: 120px;
		height: 120px;
		background: linear-gradient(45deg, #74b9ff, #0984e3);
		top: 20%;
		right: 10%;
		animation-delay: -5s;
	}

	.shape-3 {
		width: 60px;
		height: 60px;
		background: linear-gradient(45deg, #fd79a8, #e84393);
		bottom: 30%;
		left: 20%;
		animation-delay: -10s;
	}

	.shape-4 {
		width: 100px;
		height: 100px;
		background: linear-gradient(45deg, #fdcb6e, #e17055);
		bottom: 10%;
		right: 20%;
		animation-delay: -15s;
	}

	.shape-5 {
		width: 90px;
		height: 90px;
		background: linear-gradient(45deg, #a29bfe, #6c5ce7);
		top: 50%;
		left: 50%;
		animation-delay: -8s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		33% {
			transform: translateY(-30px) rotate(120deg);
		}
		66% {
			transform: translateY(30px) rotate(240deg);
		}
	}

	/* Content Wrapper */
	.content-wrapper {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 440px;
		animation: slideInUp 0.8s ease-out;
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(50px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Header Section */
	.header-section {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.logo-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		animation: logoFloat 3s ease-in-out infinite;
	}

	.logo-icon svg {
		width: 40px;
		height: 40px;
		color: white;
	}

	@keyframes logoFloat {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.company-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		margin: 0;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		letter-spacing: -0.02em;
	}

	.company-subtitle {
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0.5rem 0 0 0;
		font-weight: 400;
	}

	/* Form Card */
	.form-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 24px;
		padding: 2.5rem;
		box-shadow:
			0 20px 50px rgba(0, 0, 0, 0.1),
			0 1px 0 rgba(255, 255, 255, 0.8) inset;
		border: 1px solid rgba(255, 255, 255, 0.3);
		animation: cardAppear 0.8s ease-out 0.3s both;
	}

	@keyframes cardAppear {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.form-header h2 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.form-header p {
		color: #666;
		font-size: 1rem;
		margin: 0;
	}

	/* Form Styles */
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.25rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		z-index: 2;
		color: #9ca3af;
		width: 20px;
		height: 20px;
	}

	.input-icon svg {
		width: 100%;
		height: 100%;
	}

	.form-input {
		width: 100%;
		padding: 1rem 1rem 1rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		outline: none;
	}

	.form-input:focus {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		background: rgba(255, 255, 255, 0.95);
	}

	.form-input::placeholder {
		color: #9ca3af;
	}

	.form-input:disabled {
		background: rgba(249, 250, 251, 0.8);
		color: #9ca3af;
		cursor: not-allowed;
	}

	.password-toggle {
		position: absolute;
		right: 1rem;
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 6px;
		transition: color 0.3s ease;
		width: 20px;
		height: 20px;
	}

	.password-toggle:hover {
		color: #667eea;
	}

	.password-toggle svg {
		width: 100%;
		height: 100%;
	}

	/* Submit Button */
	.submit-button {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
		position: relative;
		overflow: hidden;
	}

	.submit-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.submit-button:hover::before {
		left: 100%;
	}

	.submit-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.submit-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
	}

	.submit-button:disabled {
		background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.submit-button svg {
		width: 20px;
		height: 20px;
	}

	/* Loading Spinner */
	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Error Message */
	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(254, 226, 226, 0.9);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 12px;
		color: #dc2626;
		font-size: 0.875rem;
		animation: errorAppear 0.3s ease-out;
	}

	@keyframes errorAppear {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.error-icon {
		width: 20px;
		height: 20px;
		color: #dc2626;
	}

	/* Demo Credentials */
	.demo-credentials {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: rgba(240, 253, 244, 0.9);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: 16px;
		backdrop-filter: blur(10px);
	}

	.demo-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: #065f46;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.demo-header svg {
		width: 16px;
		height: 16px;
	}

	.demo-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.demo-item {
		font-size: 0.8rem;
		color: #047857;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(34, 197, 94, 0.1);
	}

	.demo-item:last-child {
		border-bottom: none;
	}

	.demo-item strong {
		min-width: 60px;
		color: #065f46;
	}

	.demo-item span {
		font-family: 'Monaco', 'Menlo', monospace;
		background: rgba(255, 255, 255, 0.6);
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
	}

	/* Footer */
	.footer-wrapper {
		margin-top: 2rem;
		animation: fadeIn 0.8s ease-out 0.6s both;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.content-wrapper {
			max-width: 100%;
			padding: 0 1rem;
		}

		.form-card {
			padding: 1.5rem;
		}

		.company-title {
			font-size: 2rem;
		}

		.form-header h2 {
			font-size: 1.5rem;
		}

		.demo-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.demo-item strong {
			min-width: auto;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.form-card {
			background: rgba(30, 30, 30, 0.95);
			color: white;
		}

		.form-header h2 {
			color: white;
		}

		.form-header p {
			color: #d1d5db;
		}

		.input-label {
			color: #d1d5db;
		}

		.form-input {
			background: rgba(55, 55, 55, 0.8);
			border-color: #4b5563;
			color: white;
		}

		.form-input::placeholder {
			color: #9ca3af;
		}

		.demo-credentials {
			background: rgba(6, 95, 70, 0.2);
			border-color: rgba(34, 197, 94, 0.3);
		}
	}
</style>