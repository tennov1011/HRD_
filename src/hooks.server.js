import { redirect } from '@sveltejs/kit';

const protectedRoutes = [
    '/dashboard',
    '/employees',
    '/profile',
    '/settings'
];

const publicRoutes = [
    '/login',
    '/register',
    '/api',
    '/'
];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const { url, cookies } = event;
    
    // Redirect /admin to /dashboard
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
        throw redirect(301, '/dashboard');
    }
    
    // Check if route needs protection
    const isProtectedRoute = protectedRoutes.some(route => 
        url.pathname.startsWith(route)
    );
    
    const isPublicRoute = publicRoutes.some(route => 
        url.pathname.startsWith(route)
    );
    
    // Check authentication
    const authToken = cookies.get('directus_token') || 
                      cookies.get('auth_token') || 
                      cookies.get('session');
    
    if (isProtectedRoute && !authToken) {
        // Redirect to login if accessing protected route without auth
        throw redirect(302, '/login');
    }
    
    // Add security headers
    const response = await resolve(event);
    
    // Prevent caching for protected routes
    if (isProtectedRoute) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Surrogate-Control', 'no-store');
    }
    
    return response;
}