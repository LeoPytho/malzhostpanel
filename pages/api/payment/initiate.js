import fetch from 'node-fetch'; // Pastikan node-fetch terinstal jika belum
// Tambahkan import untuk menggunakan API lokal
import { createQRIS } from '../../../function/orkut';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { 
    amount, 
    // Detail server yang mungkin perlu disimpan atau diteruskan
    // Untuk saat ini, kita tidak menyimpannya di backend pada langkah initiate
    // serverName, 
    // pteroUsername, 
    // ram, 
    // disk, 
    // cpu 
  } = req.body;

  console.log("[API Initiate Payment] Received amount:", amount);

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: true, message: 'Jumlah pembayaran tidak valid.' });
  }

  const codeqr = process.env.PAYMENT_CODEQR; // Ini adalah parameter 'codeqr' dari api.txt Anda

  if (!codeqr) {
    console.error("[API Initiate Payment] Missing payment gateway environment variables (PAYMENT_CODEQR).");
    return res.status(500).json({ error: true, message: 'Konfigurasi payment gateway di server tidak lengkap.' });
  }

  console.log("[API Initiate Payment] Generating payment with amount:", amount);

  try {
    // Gunakan API lokal alih-alih API eksternal
    const result = await createQRIS(amount, codeqr);
    
    console.log("[API Initiate Payment] Generated Payment Result:", JSON.stringify(result, null, 2));

    if (!result || !result.qrImageUrl || !result.transactionId) {
      console.error("[API Initiate Payment] Failed to create QRIS payment.");
      return res.status(500).json({ 
        error: true, 
        message: 'Gagal membuat transaksi pembayaran.', 
        details: result 
      });
    }

    // Kirim data yang relevan ke frontend
    res.status(200).json({
      qrImageUrl: result.qrImageUrl,
      transactionId: result.transactionId,
      amount: result.amount, // Sebaiknya ambil amount dari respons untuk konfirmasi
      expirationTime: result.expirationTime, // Jika ada di respons
      message: "Transaksi pembayaran berhasil diinisiasi."
    });

  } catch (error) {
    console.error("[API Initiate Payment] Error generating payment:", error);
    res.status(500).json({ error: true, message: 'Terjadi kesalahan internal saat membuat QRIS.', details: error.message });
  }
} 