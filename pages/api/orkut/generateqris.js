import { generateQRIS } from '../../../function/orkut';

export default async function handler(req, res) {
  // Menerima method GET atau POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      statusCode: 405,
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    // Parameter dari query (GET) atau body (POST)
    const params = req.method === 'GET' ? req.query : req.body;
    
    // Validasi parameter yang diperlukan
    const { apikey, amount } = params;
    
    // Cek apikey (ganti dengan apikey yang Anda gunakan dari env)
    const validApiKey = process.env.PAYMENT_API_KEY;
    
    if (!apikey || apikey !== validApiKey) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: 'Invalid API Key'
      });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: 'Invalid amount parameter'
      });
    }

    // Generate QRIS
    const result = await generateQRIS(amount);

    // Kembalikan respons sukses dalam format yang sama dengan apiku-niki
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: 'QRIS generated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in generateqris API:', error);
    
    // Kembalikan respons error dalam format yang sama dengan apiku-niki
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || 'Internal Server Error',
      error: error.toString()
    });
  }
} 