import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Redirect /admin to /dashboard
  throw redirect(301, '/dashboard');
}
