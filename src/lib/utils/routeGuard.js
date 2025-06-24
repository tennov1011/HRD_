// src/lib/utils/routeGuard.js
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

// List of public routes that don't require authentication
const publicRoutes = ['/login'];

// Check if route requires authentication
export function requiresAuth(pathname) {
  return !publicRoutes.some(route => pathname.startsWith(route));
}

// Server-side route guard for load functions
export function checkAuth(url, cookies) {
  const pathname = url.pathname;
  
  // Skip auth check for public routes
  if (!requiresAuth(pathname)) {
    return;
  }
  
  // For now, we'll rely on client-side auth checking
  // In a production app, you might want to verify Firebase tokens server-side
  // This is mainly for fallback/additional security
  
  return;
}

// Client-side route guard
export async function guardRoute(pathname) {
  if (!browser) return;
  
  // This function can be called from page components to ensure auth
  // The main auth logic is handled in hooks.client.js
  
  const { isAuthenticated } = await import('$lib/services/firebaseConfig');
  const { goto } = await import('$app/navigation');
  
  return new Promise((resolve) => {
    const unsubscribe = isAuthenticated.subscribe(authenticated => {
      if (!authenticated && requiresAuth(pathname)) {
        goto('/login');
        resolve(false);
      } else {
        resolve(true);
      }
      unsubscribe();
    });
  });
}