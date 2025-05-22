export default function handler(req, res) {
  // Menentukan host dinamis dari request
  const host = req.headers.host || 'yourdomain.com';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${host}`;

  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'QRIS API Service is running',
    documentation: `${baseUrl}/api-docs`,
    version: '1.0.0',
    endpoints: [
      {
        path: '/api/orkut/createpayment',
        method: 'GET/POST',
        parameters: ['apikey', 'amount', 'codeqr'],
        description: 'Create a payment QRIS code with a specific amount',
        example: `${baseUrl}/api/orkut/createpayment?apikey=YOUR_API_KEY&amount=10000&codeqr=YOUR_QRIS_CODE`
      },
      {
        path: '/api/orkut/cekstatus',
        method: 'GET/POST',
        parameters: ['apikey', 'merchant', 'keyorkut'],
        description: 'Check the status of a QRIS payment',
        example: `${baseUrl}/api/orkut/cekstatus?apikey=YOUR_API_KEY&merchant=MERCHANT_ID&keyorkut=YOUR_KEY`
      },
      {
        path: '/api/orkut/generateqris',
        method: 'GET/POST',
        parameters: ['apikey', 'amount'],
        description: 'Generate a QRIS code with a specific amount',
        example: `${baseUrl}/api/orkut/generateqris?apikey=YOUR_API_KEY&amount=10000`
      }
    ]
  });
} 