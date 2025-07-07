import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies, request }) {
    try {
        // Clear all cookies
        cookies.delete('session', { path: '/' });
        cookies.delete('auth_token', { path: '/' });
        cookies.delete('directus_token', { path: '/' });
        cookies.delete('user_session', { path: '/' });
        
        // Clear any other auth-related cookies
        const cookieNames = [
            'session',
            'auth_token', 
            'directus_token',
            'user_session',
            'employee_data',
            'admin_session'
        ];
        
        cookieNames.forEach(name => {
            cookies.delete(name, { path: '/' });
        });
        
        console.log('Server logout: All cookies cleared');
        
        return json({ 
            success: true, 
            message: 'Logout successful' 
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        return json({ 
            success: false, 
            error: 'Logout failed' 
        }, { status: 500 });
    }
}