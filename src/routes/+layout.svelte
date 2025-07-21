<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { setUserFromSession, clearSession } from '$lib/services/firebaseConfig.js';
	import Header from '$lib/component/Header.svelte';
	import Sidebar from '$lib/component/Sidebar.svelte';

	export let data;

	$: isLoginPage = $page.route.id === '/login';
	$: user = data?.user || null;
	$: isAuthenticated = data?.isAuthenticated || false;

	// Set user stores from session data
	onMount(() => {
		if (user && isAuthenticated) {
			console.log('Layout: Setting user from session data:', user);
			setUserFromSession(user);
		} else {
			console.log('Layout: No authenticated user, clearing session');
			clearSession();
		}
	});
</script>

{#if isLoginPage}
	<!-- Login page without layout -->
	<slot />
{:else}
	<!-- Dashboard layout for other pages -->
	<div class="dashboard-layout">
		<Sidebar />
		<div class="main-content">
			<Header {user} {isAuthenticated} />
			<div class="page-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.dashboard-layout {
		display: flex;
		height: 100vh;
		font-family: sans-serif;
		background-color: #f9fff9;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #f9fff9;
	}

	.page-content {
		padding: 1rem;
		overflow-y: auto;
		height: calc(100vh - 64px); /* assuming header is 64px */
		background-color: #f9fff9;
	}
</style>
