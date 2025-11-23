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

  const { transactionId, expectedAmount, pendingServerDetails } = req.body;

  console.log("[API Check Status] Received for checking:", { transactionId, expectedAmount, pendingServerDetails });

  if (!transactionId || !expectedAmount || !pendingServerDetails) {
    return res.status(400).json({ error: true, message: 'Parameter tidak lengkap: transactionId, expectedAmount, dan detail server diperlukan.' });
  }

  if (!pendingServerDetails.amount || 
      !pendingServerDetails.serverName || 
      !pendingServerDetails.pteroUsername || 
      pendingServerDetails.ram === undefined || 
      pendingServerDetails.disk === undefined || 
      pendingServerDetails.cpu === undefined) {
    return res.status(400).json({ error: true, message: 'Detail server yang tertunda tidak lengkap.' });
  }

  const apiKey = process.env.PAYMENT_API_KEY;
  const username = process.env.PAYMENT_USERNAME;
  const token = process.env.PAYMENT_TOKEN;

  if (!apiKey || !username || !token) {
    console.error("[API Check Status] Missing payment gateway environment variables (PAYMENT_API_KEY, PAYMENT_USERNAME, or PAYMENT_TOKEN).");
    return res.status(500).json({ error: true, message: 'Konfigurasi payment gateway di server tidak lengkap untuk cek status.' });
  }

  console.log("[API Check Status] Checking payment status with apiKey:", apiKey, "username:", username);

  try {
    // Gunakan fungsi checkQRISStatus dengan parameter baru
    const paymentStatusData = await checkQRISStatus(apiKey, username, token);
    
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

    // Validasi pembayaran:
    // 1. type harus "CR" (credit/incoming)
    // 2. amount harus cocok dengan expectedAmount
    // 3. amount tidak boleh "0" (tidak ada transaksi)
    const paidAmount = parseFloat(paymentStatusData.amount);
    const expected = parseFloat(expectedAmount);
    
    const paymentSucceeded = paymentStatusData.type === "CR" && 
                           paidAmount > 0 &&
                           paidAmount === expected &&
                           paymentStatusData.brand_name !== "No Transaction";

    console.log("[API Check Status] Payment validation:", {
      type: paymentStatusData.type,
      paidAmount,
      expectedAmount: expected,
      brandName: paymentStatusData.brand_name,
      paymentSucceeded
    });

    if (paymentSucceeded) {
      console.log("[API Check Status] Payment confirmed! Proceeding to create Pterodactyl server.");
      
      const pteroConfig = getPterodactylConfig();
      if (!pteroConfig) {
        console.error("[API Check Status] Failed to load Pterodactyl config for server creation.");
        // Pembayaran berhasil, tapi server gagal dibuat karena config
        return res.status(500).json({ 
          paymentSuccess: true, 
          serverCreated: false, 
          message: 'Pembayaran berhasil, tetapi gagal memuat konfigurasi Pterodactyl untuk membuat server.'
        });
      }

      const creationResult = await actuallyCreatePterodactylServer(pendingServerDetails, pteroConfig);
      console.log("[API Check Status] Pterodactyl Server Creation Result:", JSON.stringify(creationResult, null, 2));

      if (creationResult.error) {
        // Pembayaran berhasil, tapi server gagal dibuat
        try {
          const { db } = await connectToDatabase();
          const transactionRecord = {
            transactionId: transactionId,
            amount: pendingServerDetails.amount,
            paidAmount: paidAmount,
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
          transactionId: transactionId,
          amount: pendingServerDetails.amount,
          paidAmount: paidAmount,
          status: "SUCCESS",
          serverDetailsCreated: creationResult.data,
          paymentGatewayResponse: paymentStatusData,
          paymentDate: paymentStatusData.date,
          paymentBrand: paymentStatusData.brand_name,
          paymentReference: paymentStatusData.issuer_reff,
          buyerReference: paymentStatusData.buyer_reff,
          createdAt: new Date(),
        };
        await db.collection('transactions').insertOne(successfulTransactionRecord);
        console.log("[API Check Status] Successfully logged successful transaction to MongoDB.");
      } catch (dbError) {
        console.error("[API Check Status] MongoDB Error (logging successful transaction):", dbError);
      }

      return res.status(200).json({
        paymentSuccess: true,
        serverCreated: true,
        message: "Pembayaran berhasil dan server telah dibuat!",
        serverDetails: creationResult.data
      });

    } else {
      // Log alasan pembayaran tidak valid
      let failureReason = 'Pembayaran belum dikonfirmasi.';
      if (paymentStatusData.brand_name === "No Transaction") {
        failureReason = 'Belum ada transaksi masuk.';
      } else if (paymentStatusData.type !== "CR") {
        failureReason = 'Transaksi bukan tipe incoming (CR).';
      } else if (paidAmount === 0) {
        failureReason = 'Jumlah pembayaran masih 0.';
      } else if (paidAmount !== expected) {
        failureReason = `Jumlah pembayaran tidak sesuai. Dibayar: ${paidAmount}, Diharapkan: ${expected}`;
      }

      console.log("[API Check Status] Payment not confirmed:", {
        reason: failureReason,
        type: paymentStatusData.type,
        paidAmount,
        expectedAmount: expected,
        brandName: paymentStatusData.brand_name
      });

      return res.status(200).json({ 
        paymentSuccess: false, 
        message: failureReason,
        serverCreated: false,
        details: {
          paidAmount: paymentStatusData.amount,
          expectedAmount: expectedAmount,
          paymentType: paymentStatusData.type,
          brandName: paymentStatusData.brand_name
        }
      });
    }

  } catch (error) {
    console.error("[API Check Status] Error checking payment status:", error);
    res.status(500).json({ 
      paymentSuccess: false, 
      serverCreated: false, 
      message: 'Terjadi kesalahan internal saat memeriksa status pembayaran.', 
      details: error.message 
    });
  }
}
