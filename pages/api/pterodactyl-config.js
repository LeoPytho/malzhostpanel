import fs from 'fs';
import path from 'path';

// const filePath = path.resolve('.', 'data/pterodactyl-config.json'); // Tidak digunakan lagi untuk membaca/menyimpan

function getPterodactylConfig() {
  // Membaca dari environment variables
  // Pastikan nama variabel environment di Vercel sesuai dengan yang digunakan di sini (PTERO_PANEL_URL, dll.)
  return {
    pterodactylDomain: process.env.PTERO_PANEL_URL || "",
    pterodactylApiKeyPTLA: process.env.PTLA_API_KEY ? "********" : "", // Samarkan API key
    pterodactylApiKeyPTLC: process.env.PTLC_API_KEY ? "********" : "", // Samarkan API key
    defaultLocationId: process.env.DEFAULT_LOCATION_ID || "",
    defaultEggId: process.env.DEFAULT_EGG_ID || "",
    defaultNestId: process.env.DEFAULT_NEST_ID || "",
    apiWrapperUrl: process.env.WRAPPER_API_URL || ""
  };
}

// function savePterodactylConfig(data) { // Fungsi ini tidak lagi digunakan untuk menulis ke file di Vercel
//   try {
//     const jsonData = JSON.stringify(data, null, 2);
//     // fs.writeFileSync(filePath, jsonData, 'utf-8'); // Penulisan file dinonaktifkan
//     console.log("Simulasi penyimpanan Pterodactyl config (Vercel):", jsonData);
//   } catch (error) {
//     console.error("Error (simulasi) saving Pterodactyl config:", error);
//     throw new Error("Gagal menyimpan konfigurasi Pterodactyl (simulasi).");
//   }
// }

export default function handler(req, res) {
  if (req.method === 'GET') {
    const config = getPterodactylConfig();
    res.status(200).json(config);
  } else if (req.method === 'POST') {
    // Menulis konfigurasi melalui API tidak didukung di Vercel dengan cara ini.
    // Konfigurasi harus diatur melalui Environment Variables di Vercel Dashboard.
    // const { pterodactylDomain, pterodactylApiKeyPTLA, pterodactylApiKeyPTLC, defaultLocationId, defaultEggId, defaultNestId, apiWrapperUrl } = req.body;
    // const newConfig = { pterodactylDomain, pterodactylApiKeyPTLA, pterodactylApiKeyPTLC, defaultLocationId, defaultEggId, defaultNestId, apiWrapperUrl };
    // savePterodactylConfig(newConfig); // Panggilan ke fungsi simpan dinonaktifkan
    
    res.status(405).json({ 
        message: 'Metode tidak diizinkan. Konfigurasi Pterodactyl harus diatur melalui Environment Variables di Vercel Dashboard.',
        // Anda bisa tetap mengirimkan kembali data yang diterima jika perlu untuk debugging, tetapi jangan menyimpannya.
        // receivedData: req.body 
    });
  } else {
    res.setHeader('Allow', ['GET']); // Hanya GET yang diizinkan setelah perubahan
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 