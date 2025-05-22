import fs from 'fs';
import path from 'path';

const filePath = path.resolve('.', 'data/store-settings.json');

function getStoreSettings() {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    // If file doesn't exist or other error, return default
    console.error("Error reading store settings:", error);
    return {
      storeName: "Toko Default",
      storeDescription: "Deskripsi default toko."
    };
  }
}

function saveStoreSettings(data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    // fs.writeFileSync(filePath, jsonData, 'utf-8'); // Modifikasi: Nonaktifkan penulisan file di Vercel
    console.log("Simulasi penyimpanan pengaturan toko (Vercel):", jsonData); // Tambahkan log untuk debugging jika perlu
  } catch (error) {
    console.error("Error (simulasi) saving store settings:", error);
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const settings = getStoreSettings();
    res.status(200).json(settings);
  } else if (req.method === 'POST') {
    const { storeName, storeDescription } = req.body;
    if (storeName && storeDescription) {
      // saveStoreSettings({ storeName, storeDescription }); // Modifikasi: Panggil fungsi yang sudah dimodifikasi
      // Pesan untuk Vercel environment
      res.status(200).json({ 
        message: 'Pengaturan diterima. Di lingkungan Vercel, perubahan permanen memerlukan update manual file data/store-settings.json dan redeploy, atau penggunaan database.',
        storeName, 
        storeDescription 
      });
    } else {
      res.status(400).json({ message: 'Nama toko dan deskripsi diperlukan.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 