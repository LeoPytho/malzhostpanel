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
    console.error("Error preparing Pterodactyl config from environment variables:", error);
    return null; // Kembalikan null jika gagal
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const config = getPterodactylConfig();
  console.log("[API Route - List Servers] Loaded Ptero Config:", JSON.stringify(config, null, 2)); // Log konfigurasi yang dimuat

  if (!config) { // Pemeriksaan awal jika config null
    console.error("[API Route - List Servers] Failed to load Pterodactyl configuration entirely.");
    return res.status(500).json({ error: true, message: 'Gagal memuat konfigurasi Pterodactyl sepenuhnya.' });
  }

  if (!config.apiWrapperUrl || !config.pterodactylDomain || !config.pterodactylApiKeyPTLA || !config.pterodactylApiKeyPTLC) {
    console.error("[API Route - List Servers] Missing critical Pterodactyl configuration. Current config:", JSON.stringify(config, null, 2));
    return res.status(500).json({ error: true, message: 'Konfigurasi Pterodactyl (URL Wrapper, Domain, PTLA, atau PTLC) tidak lengkap atau tidak ditemukan.' });
  }

  const params = new URLSearchParams({
    domain: config.pterodactylDomain,
    ptla: config.pterodactylApiKeyPTLA,
    ptlc: config.pterodactylApiKeyPTLC,
  });

  // Hanya tambahkan parameter opsional jika ada nilainya di konfigurasi
  if (config.defaultLocationId) {
    params.append('loc', config.defaultLocationId);
  }
  if (config.defaultEggId) {
    params.append('eggid', config.defaultEggId);
  }
  if (config.defaultNestId) {
    params.append('nestid', config.defaultNestId);
  }

  const listPanelUrl = `${config.apiWrapperUrl}/api/pterodactyl/listpanel?${params.toString()}`;
  console.log("[API Route - List Servers] Calling API Wrapper URL:", listPanelUrl); // Untuk debugging

  try {
    const apiRes = await fetch(listPanelUrl);
    // Tambahkan log untuk status response
    console.log("[API Route - List Servers] API Wrapper Response Status:", apiRes.status);
    
    const textResponse = await apiRes.text(); // Baca sebagai teks dulu untuk inspeksi
    console.log("[API Route - List Servers] API Wrapper Raw Response Text:", textResponse);

    let data;
    try {
      data = JSON.parse(textResponse); // Coba parse sebagai JSON
    } catch (parseError) {
      console.error("[API Route - List Servers] Failed to parse API Wrapper response as JSON:", parseError);
      console.error("[API Route - List Servers] Raw text was:", textResponse);
      return res.status(500).json({ error: true, message: 'Gagal memproses respons dari API wrapper (bukan JSON valid).', details: textResponse });
    }

    // Pengecekan error yang lebih ketat
    if (!apiRes.ok || data.error || (data.hasOwnProperty('status') && !data.status)) {
      console.error('[API Route - List Servers] Pterodactyl API Wrapper Error. Status:', apiRes.status, 'Parsed Response Data:', JSON.stringify(data, null, 2));
      return res.status(apiRes.status || 500).json({ 
        error: true, 
        message: data.message || 'Gagal mengambil daftar server dari API wrapper.', 
        details: data 
      });
    }

    res.status(200).json(data); 

  } catch (error) {
    console.error('[API Route - List Servers] Error fetching Pterodactyl server list (Outer Catch Block):', error);
    res.status(500).json({ error: true, message: 'Terjadi kesalahan internal saat menghubungi API Pterodactyl.', details: error.message });
  }
} 