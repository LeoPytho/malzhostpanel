import fs from 'fs';
import path from 'path';

// Fungsi untuk membaca konfigurasi Pterodactyl dari environment variables
function getPterodactylConfig() {
  // const filePath = path.resolve('.', 'data/pterodactyl-config.json'); // Tidak digunakan lagi
  try {
    // const jsonData = fs.readFileSync(filePath, 'utf-8'); // Tidak digunakan lagi
    // return JSON.parse(jsonData); // Tidak digunakan lagi
    return {
      pterodactylDomain: process.env.PTERO_PANEL_URL || "",
      pterodactylApiKeyPTLA: process.env.PTLA_API_KEY || "", // Gunakan API key asli
      pterodactylApiKeyPTLC: process.env.PTLC_API_KEY || "", // Gunakan API key asli
      defaultLocationId: process.env.DEFAULT_LOCATION_ID || "",
      defaultEggId: process.env.DEFAULT_EGG_ID || "",
      defaultNestId: process.env.DEFAULT_NEST_ID || "",
      apiWrapperUrl: process.env.WRAPPER_API_URL || ""
    };
  } catch (error) {
    console.error("[API Route - Create Server] Error preparing Pterodactyl config from environment variables:", error);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Allow', []); // Tidak ada method yang diizinkan
  res.status(405).json({ 
    error: true, 
    message: 'Endpoint ini tidak lagi digunakan secara langsung. Pembuatan server dilakukan setelah pembayaran berhasil melalui alur yang ditentukan.' 
  });
} 