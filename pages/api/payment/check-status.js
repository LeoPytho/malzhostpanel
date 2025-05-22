import fetch from 'node-fetch';
import { getPterodactylConfig, actuallyCreatePterodactylServer } from '../../../utils/pterodactylAdmin';
import { connectToDatabase } from '../../../utils/mongodb';
// Import fungsi untuk cek status pembayaran
import { checkQRISStatus } from '../../../function/orkut';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { transactionId, pendingServerDetails } = req.body;

  console.log("[API Check Status] Received for checking:", { transactionId, pendingServerDetails });

  if (!transactionId || !pendingServerDetails) {
    return res.status(400).json({ error: true, message: 'Parameter tidak lengkap: transactionId dan detail server diperlukan.' });
  }

  if (!pendingServerDetails.amount || 
      !pendingServerDetails.serverName || 
      !pendingServerDetails.pteroUsername || 
      pendingServerDetails.ram === undefined || 
      pendingServerDetails.disk === undefined || 
      pendingServerDetails.cpu === undefined) {
    return res.status(400).json({ error: true, message: 'Detail server yang tertunda tidak lengkap.' });
  }

  const merchantId = process.env.PAYMENT_MERCHANT_ID;
  const orderkuotaKey = process.env.PAYMENT_ORDERKUOTA_KEY;

  if (!merchantId || !orderkuotaKey) {
    console.error("[API Check Status] Missing payment gateway environment variables (PAYMENT_MERCHANT_ID or PAYMENT_ORDERKUOTA_KEY).");
    return res.status(500).json({ error: true, message: 'Konfigurasi payment gateway di server tidak lengkap untuk cek status.' });
  }

  console.log("[API Check Status] Checking payment status with merchantId:", merchantId, "and keyorkut:", orderkuotaKey);

  try {
    // Gunakan API lokal alih-alih API eksternal
    const paymentStatusData = await checkQRISStatus(merchantId, orderkuotaKey);
    
    console.log("[API Check Status] Payment Status Data:", JSON.stringify(paymentStatusData, null, 2));

    if (!paymentStatusData) {
      console.warn("[API Check Status] Payment Gateway check status returned empty data.");
      return res.status(200).json({ 
        paymentSuccess: false, 
        message: 'Gagal memeriksa status pembayaran atau pembayaran belum selesai.', 
        details: paymentStatusData,
        serverCreated: false
      });
    }

    // Asumsi dari outch.json: data.type === "CR" dan amount cocok menandakan sukses
    const paymentSucceeded = paymentStatusData.type === "CR" && 
                           parseFloat(paymentStatusData.amount) === parseFloat(pendingServerDetails.amount);

    if (paymentSucceeded) {
      console.log("[API Check Status] Payment confirmed! Proceeding to create Pterodactyl server.");
      
      const pteroConfig = getPterodactylConfig();
      if (!pteroConfig) {
        console.error("[API Check Status] Failed to load Pterodactyl config for server creation.");
        // Pembayaran berhasil, tapi server gagal dibuat karena config. Ini situasi yang perlu ditangani.
        return res.status(500).json({ paymentSuccess: true, serverCreated: false, message: 'Pembayaran berhasil, tetapi gagal memuat konfigurasi Pterodactyl untuk membuat server.'});
      }

      const creationResult = await actuallyCreatePterodactylServer(pendingServerDetails, pteroConfig);
      console.log("[API Check Status] Pterodactyl Server Creation Result:", JSON.stringify(creationResult, null, 2));

      if (creationResult.error) {
        // Pembayaran berhasil, tapi server gagal dibuat karena error dari Pterodactyl/wrapper.
        // Kita mungkin ingin mencatat upaya ini juga, tapi dengan status berbeda
        try {
          const { db } = await connectToDatabase();
          const transactionRecord = {
            transactionId: transactionId, // dari req.body
            amount: pendingServerDetails.amount,
            status: "PAYMENT_SUCCESS_SERVER_CREATION_FAILED",
            reason: creationResult.message,
            serverDetailsAttempted: pendingServerDetails,
            pterodactylApiResponse: creationResult,
            paymentGatewayResponse: paymentStatusData, 
            createdAt: new Date(),
          };
          await db.collection('transactions').insertOne(transactionRecord);
          console.log("[API Check Status] Logged failed server creation after successful payment to MongoDB.");
        } catch (dbError) {
          console.error("[API Check Status] MongoDB Error (logging failed creation):", dbError);
          // Jangan sampai error DB menghentikan respons utama ke user jika ini hanya logging tambahan
        }

        return res.status(creationResult.status || 500).json({ 
          paymentSuccess: true, 
          serverCreated: false, 
          message: `Pembayaran berhasil, tetapi gagal membuat server Pterodactyl: ${creationResult.message}`,
          details: creationResult.details
        });
      }

      // Semua berhasil: Pembayaran dan Pembuatan Server
      // Simpan transaksi sukses ke MongoDB
      try {
        const { db } = await connectToDatabase();
        const successfulTransactionRecord = {
          transactionId: transactionId, // dari req.body
          amount: pendingServerDetails.amount,
          status: "SUCCESS",
          serverDetailsCreated: creationResult.data, // Berisi username, password, panelAccessUrl, etc.
          paymentGatewayResponse: paymentStatusData, // Respons dari payment gateway
          createdAt: new Date(),
          // Anda bisa menambahkan pterodactylServerId jika itu bagian dari creationResult.data
          // pterodactylServerId: creationResult.data.id_server, // Contoh jika ada
        };
        await db.collection('transactions').insertOne(successfulTransactionRecord);
        console.log("[API Check Status] Successfully logged successful transaction to MongoDB.");
      } catch (dbError) {
        console.error("[API Check Status] MongoDB Error (logging successful transaction):", dbError);
        // Jika penyimpanan ke DB gagal, server tetap sudah dibuat. Ini adalah error yg perlu dimonitor.
        // Kita bisa memutuskan apakah ingin memberitahu user atau hanya log internal.
        // Untuk saat ini, kita hanya log errornya dan lanjutkan.
      }

      return res.status(200).json({
        paymentSuccess: true,
        serverCreated: true,
        message: "Pembayaran berhasil dan server telah dibuat!",
        serverDetails: creationResult.data // Ini berisi detail server termasuk panelAccessUrl, username, password, dll.
      });

    } else {
      console.log("[API Check Status] Payment not yet confirmed or details mismatch. Type:", paymentStatusData.type, "Paid Amount:", paymentStatusData.amount, "Expected Amount:", pendingServerDetails.amount);
      return res.status(200).json({ 
        paymentSuccess: false, 
        message: 'Pembayaran belum dikonfirmasi atau detail tidak cocok.',
        serverCreated: false 
      });
    }

  } catch (error) {
    console.error("[API Check Status] Error checking payment status:", error);
    res.status(500).json({ paymentSuccess: false, serverCreated: false, message: 'Terjadi kesalahan internal saat memeriksa status pembayaran.', details: error.message });
  }
} 