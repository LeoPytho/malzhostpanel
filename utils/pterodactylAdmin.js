import fetch from 'node-fetch';

// Fungsi untuk membaca konfigurasi Pterodactyl dari environment variables
export function getPterodactylConfig() {
  try {
    return {
      pterodactylDomain: process.env.PTERO_PANEL_URL || "",
      pterodactylApiKeyPTLA: process.env.PTLA_API_KEY || "",
      pterodactylApiKeyPTLC: process.env.PTLC_API_KEY || "",
      defaultLocationId: process.env.DEFAULT_LOCATION_ID || "",
      defaultEggId: process.env.DEFAULT_EGG_ID || "",
      defaultNestId: process.env.DEFAULT_NEST_ID || "",
      apiWrapperUrl: process.env.WRAPPER_API_URL || ""
    };
  } catch (error) {
    console.error("[Util Ptero Admin] Error preparing Pterodactyl config:", error);
    return null;
  }
}

// Fungsi inti untuk membuat server Pterodactyl melalui API Wrapper
export async function actuallyCreatePterodactylServer(serverDetails, config) {
  const { serverName, pteroUsername, ram, disk, cpu } = serverDetails;

  // Validasi dasar input
  if (!serverName || ram === undefined || disk === undefined || cpu === undefined || !pteroUsername) {
    console.error("[Util Ptero Admin] Missing required parameters for server creation:", serverDetails);
    return { error: true, message: 'Parameter internal tidak lengkap untuk pembuatan server.', status: 400 };
  }

  if (!config || !config.apiWrapperUrl || !config.pterodactylDomain || 
      !config.pterodactylApiKeyPTLA || !config.pterodactylApiKeyPTLC || 
      !config.defaultEggId || !config.defaultNestId) {
    console.error("[Util Ptero Admin] Pterodactyl config is incomplete for server creation:", config);
    return { error: true, message: 'Konfigurasi Pterodactyl tidak lengkap di server.', status: 500 };
  }

  const params = new URLSearchParams({
    domain: config.pterodactylDomain,
    ptla: config.pterodactylApiKeyPTLA,
    ptlc: config.pterodactylApiKeyPTLC,
    loc: config.defaultLocationId || '1',
    eggid: config.defaultEggId,
    nestid: config.defaultNestId,
    ram: ram.toString(),
    disk: disk.toString(),
    cpu: cpu.toString(),
    username: pteroUsername,
    // Jika API wrapper Anda memerlukan 'name' sebagai parameter terpisah untuk nama deskriptif server
    // Anda bisa menambahkannya di sini, misal: name: serverName
  });

  const createServerUrl = `${config.apiWrapperUrl}/api/pterodactyl/create?${params.toString()}`;
  console.log("[Util Ptero Admin] Attempting to create server with URL:", createServerUrl);

  try {
    const apiRes = await fetch(createServerUrl);
    const responseStatus = apiRes.status;
    const textResponse = await apiRes.text();
    console.log("[Util Ptero Admin] Create Server API Wrapper Raw Response Text:", textResponse, "Status:", responseStatus);

    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("[Util Ptero Admin] Failed to parse Create Server API Wrapper response as JSON:", parseError, "Raw text was:", textResponse);
      return { error: true, message: 'Gagal memproses respons dari API wrapper pembuatan server (bukan JSON valid).', status: 500, details: textResponse };
    }

    if (!apiRes.ok || data.error || (data.hasOwnProperty('status') && !data.status)) {
      console.error('[Util Ptero Admin] Create Server Pterodactyl API Wrapper Error. Status:', responseStatus, 'Parsed Data:', data);
      return { 
        error: true, 
        message: data.message || 'Gagal membuat server melalui API wrapper Pterodactyl.', 
        status: responseStatus || 500,
        details: data 
      };
    }
    
    // Tambahkan panelAccessUrl ke data yang berhasil
    const panelAccessUrl = `https://${config.pterodactylDomain}`;
    return {
      error: false,
      status: 200,
      message: data.message || "Server berhasil dibuat.",
      data: {
        ...(data.result || data), // API wrapper mungkin memiliki data.result atau data langsung
        panelAccessUrl: panelAccessUrl
      }
    };

  } catch (error) {
    console.error('[Util Ptero Admin] Error during fetch to Create Server API Wrapper:', error);
    return { error: true, message: 'Kesalahan jaringan saat menghubungi API wrapper pembuatan server.', status: 500, details: error.message };
  }
} 