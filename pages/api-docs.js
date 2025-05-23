import Head from 'next/head';
import { useState, useRef } from 'react';

export default function ApiDocs() {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);
  const timerRef = useRef(null);

  // Fungsi untuk menyalin URL ke clipboard
  const copyToClipboard = (text, endpoint) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer to clear the copied state after 3 seconds
    timerRef.current = setTimeout(() => {
      setCopiedEndpoint(null);
    }, 3000);
  };

  // Data endpoint API
  const endpoints = [
    {
      id: 'createpayment',
      name: 'Create Payment',
      path: '/api/orkut/createpayment',
      method: 'GET/POST',
      description: 'Membuat kode pembayaran QRIS dengan jumlah tertentu.',
      parameters: [
        { name: 'apikey', type: 'string', required: true, description: 'API key untuk otorisasi' },
        { name: 'amount', type: 'number', required: true, description: 'Jumlah pembayaran dalam Rupiah' },
        { name: 'codeqr', type: 'string', required: true, description: 'Kode QRIS template' }
      ],
      example: {
        request: 'https://yourdomain.com/api/orkut/createpayment?apikey=YOUR_API_KEY&amount=10000&codeqr=YOUR_QRIS_CODE',
        response: `{
  "statusCode": 200,
  "success": true,
  "message": "Payment QRIS created successfully",
  "data": {
    "qrImageUrl": "https://example.com/qr-image.png",
    "amount": "10000",
    "transactionId": "TRX123ABC456",
    "expirationTime": "2024-05-12T12:34:56.789Z"
  }
}`
      }
    },
    {
      id: 'cekstatus',
      name: 'Check Status',
      path: '/api/orkut/cekstatus',
      method: 'GET/POST',
      description: 'Memeriksa status pembayaran QRIS.',
      parameters: [
        { name: 'apikey', type: 'string', required: true, description: 'API key untuk otorisasi' },
        { name: 'merchant', type: 'string', required: true, description: 'ID merchant' },
        { name: 'keyorkut', type: 'string', required: true, description: 'Key untuk akses data QRIS' }
      ],
      example: {
        request: 'https://yourdomain.com/api/orkut/cekstatus?apikey=YOUR_API_KEY&merchant=MERCHANT_ID&keyorkut=YOUR_KEY',
        response: `{
  "statusCode": 200,
  "success": true,
  "message": "Status QRIS retrieved successfully",
  "data": {
    "date": "2024-05-12 12:34:56",
    "amount": "10000",
    "type": "CR",
    "qris": "static",
    "brand_name": "Customer Name",
    "issuer_reff": "REF123456",
    "buyer_reff": "BUYER123",
    "balance": "500000"
  }
}`
      }
    },
    {
      id: 'generateqris',
      name: 'Generate QRIS',
      path: '/api/orkut/generateqris',
      method: 'GET/POST',
      description: 'Menghasilkan kode QRIS dengan jumlah tertentu tanpa kode QRIS kustom.',
      parameters: [
        { name: 'apikey', type: 'string', required: true, description: 'API key untuk otorisasi' },
        { name: 'amount', type: 'number', required: true, description: 'Jumlah pembayaran dalam Rupiah' }
      ],
      example: {
        request: 'https://yourdomain.com/api/orkut/generateqris?apikey=YOUR_API_KEY&amount=10000',
        response: `{
  "statusCode": 200,
  "success": true,
  "message": "QRIS generated successfully",
  "data": {
    "transactionId": "ABC123456",
    "amount": "10000",
    "expirationTime": "2024-05-12T12:34:56.789Z",
    "qrImageUrl": "https://example.com/qr-image.png"
  }
}`
      }
    }
  ];

  // Style definitions
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem 1rem',
      color: '#ccd6f6',
    },
    title: {
      color: '#e6f1ff',
      textAlign: 'center',
      marginBottom: '3rem',
      textShadow: '0 0 10px rgba(100, 255, 218, 0.3)',
      fontSize: 'clamp(2rem, 5vw, 2.8rem)'
    },
    introduction: {
      backgroundColor: 'rgba(17, 34, 68, 0.8)',
      padding: '1.5rem',
      borderRadius: '10px',
      border: '1px solid #64ffda',
      marginBottom: '3rem',
      boxShadow: '0 0 15px rgba(100, 255, 218, 0.2)',
    },
    endpointContainer: {
      backgroundColor: 'rgba(17, 34, 68, 0.8)',
      padding: '1.5rem',
      borderRadius: '10px',
      border: '1px solid #64ffda',
      marginBottom: '2rem',
      boxShadow: '0 0 15px rgba(100, 255, 218, 0.2)',
    },
    endpointTitle: {
      color: '#64ffda',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
      paddingBottom: '0.8rem',
      marginBottom: '1.5rem',
      textShadow: '0 0 5px rgba(100, 255, 218, 0.3)',
    },
    method: {
      backgroundColor: 'rgba(100, 255, 218, 0.2)',
      color: '#64ffda',
      padding: '0.3rem 0.6rem',
      borderRadius: '5px',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginLeft: '1rem',
    },
    path: {
      backgroundColor: 'rgba(23, 42, 69, 0.8)',
      padding: '0.8rem 1rem',
      borderRadius: '5px',
      color: '#e6f1ff',
      fontFamily: 'monospace',
      position: 'relative',
      cursor: 'pointer',
      border: '1px solid rgba(100, 255, 218, 0.3)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    pathText: {
      margin: 0,
      overflow: 'auto',
      whiteSpace: 'nowrap',
      maxWidth: '90%',
    },
    copyButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#64ffda',
      cursor: 'pointer',
      fontSize: '0.9rem',
      padding: '0.3rem 0.5rem',
    },
    parameterTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '1.5rem',
    },
    tableHeader: {
      textAlign: 'left',
      borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
      padding: '0.7rem',
      color: '#64ffda',
      backgroundColor: 'rgba(23, 42, 69, 0.5)',
    },
    tableCell: {
      padding: '0.7rem',
      borderBottom: '1px solid rgba(100, 255, 218, 0.1)',
      verticalAlign: 'top',
    },
    required: {
      color: '#ff6b6b',
      fontSize: '0.8rem',
      marginLeft: '0.5rem',
    },
    example: {
      marginTop: '1.5rem',
    },
    exampleTitle: {
      color: '#64ffda',
      marginBottom: '1rem',
      fontWeight: '500',
    },
    codeBlock: {
      backgroundColor: 'rgba(23, 42, 69, 0.8)',
      padding: '1rem',
      borderRadius: '5px',
      fontFamily: 'monospace',
      overflowX: 'auto',
      whiteSpace: 'pre',
      borderLeft: '3px solid #64ffda',
      fontSize: '0.9rem',
      marginBottom: '1.5rem',
    },
  };

  return (
    <>
      <Head>
        <title>API Documentation - Panel Akmal</title>
        <meta name="description" content="Panel Akmal API documentation and references" />
      </Head>

      <div style={styles.container}>
        <h1 style={styles.title}>API Documentation</h1>

        <div style={styles.introduction}>
          <h2 style={{ color: '#64ffda', marginTop: 0 }}>Introduction</h2>
          <p>
            Dokumentasi ini berisi informasi detail tentang API QRIS yang tersedia di Panel Akmal. 
            API ini dapat digunakan untuk membuat kode pembayaran QRIS, memeriksa status pembayaran, 
            dan fitur lainnya terkait pembayaran QRIS.
          </p>
          <h3 style={{ color: '#64ffda', marginTop: '1.5rem' }}>Base URL</h3>
          <div style={styles.codeBlock}>https://yourdomain.com</div>
          <h3 style={{ color: '#64ffda' }}>Authentication</h3>
          <p>
            Semua endpoint API memerlukan parameter <code style={{ backgroundColor: 'rgba(100, 255, 218, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>apikey</code> untuk otorisasi.
            Jangan bagikan API key Anda kepada pihak yang tidak berwenang.
          </p>
        </div>

        {endpoints.map(endpoint => (
          <div id={endpoint.id} key={endpoint.id} style={styles.endpointContainer}>
            <div style={styles.endpointTitle}>
              <h2 style={{ margin: 0 }}>
                {endpoint.name}
                <span style={styles.method}>{endpoint.method}</span>
              </h2>
            </div>
            
            <div 
              style={styles.path}
              onClick={() => copyToClipboard(endpoint.path, endpoint.id)}
            >
              <p style={styles.pathText}>{endpoint.path}</p>
              <button style={styles.copyButton}>
                {copiedEndpoint === endpoint.id ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <p>{endpoint.description}</p>
            
            <h3 style={{ color: '#64ffda' }}>Parameters</h3>
            <table style={styles.parameterTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Name</th>
                  <th style={styles.tableHeader}>Type</th>
                  <th style={styles.tableHeader}>Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.parameters.map((param, idx) => (
                  <tr key={idx}>
                    <td style={styles.tableCell}>
                      {param.name}
                      {param.required && <span style={styles.required}>Required</span>}
                    </td>
                    <td style={styles.tableCell}>{param.type}</td>
                    <td style={styles.tableCell}>{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={styles.example}>
              <h3 style={styles.exampleTitle}>Example Request</h3>
              <div 
                style={styles.codeBlock}
                onClick={() => copyToClipboard(endpoint.example.request, `${endpoint.id}-request`)}
              >
                {endpoint.example.request}
                {copiedEndpoint === `${endpoint.id}-request` && 
                  <span style={{ color: '#64ffda', marginLeft: '10px', fontSize: '0.8rem' }}>Copied!</span>
                }
              </div>
              
              <h3 style={styles.exampleTitle}>Example Response</h3>
              <div style={styles.codeBlock}>{endpoint.example.response}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 
