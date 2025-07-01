import axios from 'axios';

const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz'; // ganti jika perlu

export async function fetchEmployees() {
    try {
        const res = await axios.get(`${DIRECTUS_URL}/items/karyawan`, {
            headers: {
                Authorization: `Bearer ${DIRECTUS_TOKEN}`
            }
        });
        return res.data.data; // array data karyawan
    } catch (e) {
        console.error('Gagal mengambil data karyawan:', e);
        return [];
    }
}