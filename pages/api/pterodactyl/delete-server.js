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
      // pterodactylApiKeyPTLC: process.env.PTLC_API_KEY || "", // PTLC tidak selalu dibutuhkan untuk delete, tergantung API Wrapper
      apiWrapperUrl: process.env.WRAPPER_API_URL || ""
    };
  } catch (error) {
    console.error("Error preparing Pterodactyl config for delete server API call:", error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { // Menggunakan POST untuk operasi delete demi keamanan, meskipun wrapper GET
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const config = getPterodactylConfig();

  // Pastikan PTLC juga diperiksa jika API Wrapper delete memerlukannya.
  // Untuk saat ini, kita hanya memeriksa yang pasti digunakan berdasarkan kode yang ada.
  if (!config || !config.apiWrapperUrl || !config.pterodactylDomain || !config.pterodactylApiKeyPTLA) {
    return res.status(500).json({ error: true, message: 'Konfigurasi Pterodactyl (URL Wrapper, Domain, atau PTLA) tidak lengkap atau tidak ditemukan.' });
  }

  const { serverId } = req.body;

  if (!serverId) {
    return res.status(400).json({ error: true, message: 'Parameter serverId diperlukan.' });
  }

  const params = new URLSearchParams({
    domain: config.pterodactylDomain,
    ptla: config.pterodactylApiKeyPTLA,
    idserver: serverId,
  });

  const deleteServerUrl = `${config.apiWrapperUrl}/api/pterodactyl/delete?${params.toString()}`;
  console.log("Attempting to delete server with URL:", deleteServerUrl); // Untuk debugging

  try {
    const apiRes = await fetch(deleteServerUrl); // API wrapper Anda menggunakan GET dengan query params
    const data = await apiRes.json();

    if (!apiRes.ok || data.error || !data.status) {
      console.error('Pterodactyl API Wrapper Error (Delete Server):', data);
      return res.status(apiRes.status || 500).json({ 
        error: true, 
        message: data.message || 'Gagal menghapus server melalui API wrapper.', 
        details: data 
      });
    }
    
    // Asumsikan data sukses mirip dengan outdel.json
    res.status(200).json(data);

  } catch (error) {
    console.error('Error deleting Pterodactyl server:', error);
    res.status(500).json({ error: true, message: 'Terjadi kesalahan internal saat menghubungi API Pterodactyl.', details: error.message });
  }
} 