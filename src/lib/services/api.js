// src/lib/services/api.js

import axios from 'axios';
import { roleDefinitions } from './firebaseConfig';
import { writable } from 'svelte/store';

// Konfigurasi dasar axios untuk Directus API
const api = axios.create({
  baseURL: 'https://directus.eltamaprimaindo.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
  }
});
// Interceptor untuk menangani error
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);


/**
 * Dapatkan role dan division berdasarkan email dari roleDefinitions
 * @param {string} email
 * @returns {{role: string, division: string}|null}
 */
export function getRoleAndDivisionByEmail(email) {
  if (!email) return null;
  const def = roleDefinitions.find(
    d => d.email.toLowerCase() === email.trim().toLowerCase()
  );
  return def
    ? { role: def.role, division: def.division }
    : null;
}

/**
 * Cek apakah user adalah admin berdasarkan email
 * @param {string} email
 * @returns {boolean}
 */
export function isAdmin(email) {
  const roleDiv = getRoleAndDivisionByEmail(email);
  return roleDiv && roleDiv.role === 'admin';
}

/**
 * Cek apakah user adalah user biasa berdasarkan email
 * @param {string} email
 * @returns {boolean}
 */
export function isUser(email) {
  const roleDiv = getRoleAndDivisionByEmail(email);
  return roleDiv && roleDiv.role === 'user';
}

export default api;