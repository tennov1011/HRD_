// src/lib/utils/simpleRouteGuard.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

/**
 * Simple route guard that redirects unauthenticated users to login
 * Call this from any page that requires authentication
 */
export async function requireAuth() {
  if (!browser) return true; // Skip on server-side
  
  try {
    // Dynamic import to avoid SSR issues
    const { isAuthenticated } = await import('$lib/services/firebaseConfig');
    
    return new Promise((resolve) => {
      // Subscribe to auth state
      const unsubscribe = isAuthenticated.subscribe((authenticated) => {
        if (!authenticated) {
          console.log('User not authenticated, redirecting to login');
          goto('/login').catch(() => {
            // Fallback redirect
            window.location.href = '/login';
          });
          resolve(false);
        } else {
          resolve(true);
        }
        
        // Unsubscribe after first check
        unsubscribe();
      });
      
      // Timeout fallback - redirect to login if no response after 3 seconds
      setTimeout(() => {
        console.log('Auth check timeout, redirecting to login');
        goto('/login').catch(() => {
          window.location.href = '/login';
        });
        resolve(false);
        unsubscribe();
      }, 3000);
    });
  } catch (error) {
    console.error('Auth check failed:', error);
    // Redirect to login on error
    goto('/login').catch(() => {
      window.location.href = '/login';
    });
    return false;
  }
}

/**
 * Force redirect to login (emergency function)
 */
export function forceLoginRedirect() {
  if (browser) {
    console.log('Force redirecting to login page');
    window.location.href = '/login';
  }
}