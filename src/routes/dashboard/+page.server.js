import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
  // Check if user is logged in
  const session = cookies.get('session');
  
  if (!session) {
    // If not logged in, redirect to login
    throw redirect(302, '/login');
  }
  
  try {
    const userData = JSON.parse(session);
    
    // Return user data to the page
    return {
      user: userData
    };
  } catch {
    // Invalid session cookie, clear it and redirect to login
    cookies.delete('session', { path: '/' });
    throw redirect(302, '/login');
  }
}