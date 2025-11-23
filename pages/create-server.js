import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ServerCard from '../components/ServerCard';

const ADMIN_FEE = 2;

export async function getServerSideProps(context) {
  let storeSettings = {};
  let pterodactylServersData = { result: [], error: null, message: null, creator: null, totalserver: null };

  try {
    const storeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/store-settings`);
    if (storeRes.ok) {
      storeSettings = await storeRes.json();
    } else {
      console.error("Failed to fetch store settings, status:", storeRes.status);
      storeSettings = { storeName: "Panel Akmal", storeDescription: "Gagal memuat deskripsi default." };
    }
  } catch (error) {
    console.error("Error fetching store settings:", error);
    storeSettings = { storeName: "Panel Akmal", storeDescription: "Error koneksi saat memuat pengaturan." };
  }

  try {
    const pteroRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pterodactyl/servers`);
    const pteroData = await pteroRes.json(); 
    if (!pteroRes.ok || pteroData.error) {
      console.error("Failed to fetch Pterodactyl servers:", pteroData?.message || pteroRes.statusText);
      pterodactylServersData = {
        result: [], 
        error: true, 
        message: pteroData?.message || `Gagal mengambil data server (Status: ${pteroRes.status})`,
        creator: pteroData?.creator ?? null,
        totalserver: null
      };
    } else {
      pterodactylServersData = {
        result: pteroData.result || [],
        error: false,
        creator: pteroData.creator ?? null,
        totalserver: pteroData.totalserver ?? null
      };
    }
  } catch (error) {
    console.error("Error fetching Pterodactyl servers:", error);
    pterodactylServersData = { result: [], error: true, message: "Error koneksi ke API server Pterodactyl.", creator: null, totalserver: null };
  }
  return { props: { settings: storeSettings, serversData: pterodactylServersData }};
}

const memoryOptions = [
  { label: '1 GB', value: '1024' }, { label: '2 GB', value: '2048' }, { label: '3 GB', value: '3072' }, 
  { label: '4 GB', value: '4096' }, { label: '5 GB', value: '5120' }, { label: 'Unlimited', value: '0' },
];
const cpuOptions = [
  { label: '60%', value: '60' }, { label: '70%', value: '70' }, { label: '90%', value: '90' }, { label: '100%', value: '100' },
  { label: '150%', value: '150' },
  { label: '250%', value: '250' },
  { label: 'Unlimited', value: '0' }
];
const pricingScheme = {
  ramPerGb: 6, ramUnlimited: 4, diskPerGb: 6, diskUnlimited: 3,
  cpu: { 
    '60': 4, '70': 5, '80': 6, '90': 7, '100': 8,
    '150': 9,
    '250': 11,
    '0': 35
  },
};

function formatDate(dateString) {
  if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export default function CreateServerPage({ settings, serversData }) {
  const router = useRouter();
  const [newServerName, setNewServerName] = useState('');
  const [newServerUser, setNewServerUser] = useState('');
  const [newServerRam, setNewServerRam] = useState(memoryOptions[0].value);
  const [newServerDisk, setNewServerDisk] = useState(memoryOptions[0].value);
  const [newServerCpu, setNewServerCpu] = useState(cpuOptions[3].value); // Default to 100% CPU
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [finalAmountForPayment, setFinalAmountForPayment] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupData, setPopupData] = useState({ accessUrl: '', serverName: '', username: '', password: '' });
  const [copyMessage, setCopyMessage] = useState('');
  const [paymentStep, setPaymentStep] = useState('formInput'); // 'formInput', 'processingPayment', 'showQr', 'paymentFailed'
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentExpiration, setPaymentExpiration] = useState('');
  const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });
  const [pendingServerDetails, setPendingServerDetails] = useState(null);
  const pollingIntervalRef = useRef(null);

  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  
  const calculateTotalPrice = (ram, disk, cpu) => {
    let totalPrice = 0;
    if (ram === '0') totalPrice += pricingScheme.ramUnlimited; else totalPrice += (parseInt(ram) / 1024) * pricingScheme.ramPerGb;
    if (disk === '0') totalPrice += pricingScheme.diskUnlimited; else totalPrice += (parseInt(disk) / 1024) * pricingScheme.diskPerGb;
    if (pricingScheme.cpu[cpu]) totalPrice += pricingScheme.cpu[cpu];
    return totalPrice;
  };

  useEffect(() => {
    const price = calculateTotalPrice(newServerRam, newServerDisk, newServerCpu);
    setCalculatedPrice(price);
    const totalPriceBeforeRandomization = price + ADMIN_FEE;
    if (totalPriceBeforeRandomization < ADMIN_FEE) { // Ensure it's at least ADMIN_FEE
        setFinalAmountForPayment(ADMIN_FEE + (Math.floor(Math.random() * 90) + 10)); // Add random digits even if price is 0
        return;
    }
    const majorPart = Math.floor(totalPriceBeforeRandomization / 100);
    const randomDigits = Math.floor(Math.random() * 90) + 10; 
    setFinalAmountForPayment(majorPart * 100 + randomDigits);
  }, [newServerRam, newServerDisk, newServerCpu]);

  useEffect(() => { 
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); }; 
  }, []);

  useEffect(() => { 
    if (paymentStep !== 'showQr' && pollingIntervalRef.current) { 
      clearInterval(pollingIntervalRef.current); 
      pollingIntervalRef.current = null; 
    }
  }, [paymentStep]);

  // EFFECT TO RESTORE STATE FROM URL
  useEffect(() => {
    const { query, isReady, replace, pathname } = router;
    // Destructure specific query params for stable dependencies and direct use
    const urlTransactionId = query.transaction_id;
    const urlQrImageUrl = query.qr_image_url;
    const urlPaymentExpiration = query.payment_expiration;
    // server_details will now be read from sessionStorage

    if (!isReady) return;

    if (urlTransactionId && urlQrImageUrl && urlPaymentExpiration) { // Check for essential URL params
      try {
        const storedServerDetailsString = sessionStorage.getItem('pendingServerDetails');
        if (!storedServerDetailsString) {
          console.error("Gagal memulihkan: Detail server tidak ditemukan di sessionStorage.");
          throw new Error("pendingServerDetails tidak ada di sessionStorage");
        }
        const recoveredPendingServerDetails = JSON.parse(storedServerDetailsString);

        if (paymentStep === 'formInput' && !isLoading) {
          setTransactionId(urlTransactionId);
          setQrImageUrl(decodeURIComponent(urlQrImageUrl));
          setPaymentExpiration(urlPaymentExpiration);
          setPendingServerDetails(recoveredPendingServerDetails);
          setPaymentStep('showQr');
          setPaymentMessage({ type: 'info', text: 'Melanjutkan sesi pembayaran sebelumnya. Silakan pindai QRIS atau cek status.' });
          startPaymentPolling(urlTransactionId);
        }
      } catch (error) {
        console.error("Gagal memulihkan sesi pembayaran. Kesalahan:", error);
        // Clear all related payment state and URL params as restoration failed critically
        setTransactionId('');
        setQrImageUrl('');
        setPaymentExpiration('');
        setPendingServerDetails(null);
        sessionStorage.removeItem('pendingServerDetails'); // Clear from session storage as well
        setPaymentStep('formInput');
        setPaymentMessage({ type: 'error', text: 'Gagal memulihkan sesi pembayaran. Data mungkin korup atau sesi telah berakhir. Harap isi ulang form dan coba lagi.' });

        // Clean the corrupted query parameters from URL
        const cleanQuery = { ...query };
        delete cleanQuery.transaction_id;
        delete cleanQuery.qr_image_url;
        delete cleanQuery.payment_expiration;
        // server_details is no longer in the query to delete, but if it was there due to old code, remove it.
        if (cleanQuery.server_details) delete cleanQuery.server_details; 
        router.replace({ pathname, query: cleanQuery }, undefined, { shallow: true });
      }
    }
  // Use the actual string values from query in dependency array for stability
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.transaction_id, router.query.qr_image_url, router.query.payment_expiration]); // Removed router.query.server_details

  const handleInitiatePayment = async (e) => {
    e.preventDefault(); 
    setIsLoading(true); 
    setPaymentMessage({ type: '', text: '' }); 
    setCreateMessage({ type: '', text: '' });
    setPaymentStep('processingPayment');
    const serverDetails = { 
      serverName: newServerName, 
      pteroUsername: newServerUser, 
      ram: newServerRam, 
      disk: newServerDisk, 
      cpu: newServerCpu, 
      amount: finalAmountForPayment 
    };
    setPendingServerDetails(serverDetails);
    try {
      // Save pendingServerDetails to sessionStorage
      sessionStorage.setItem('pendingServerDetails', JSON.stringify(serverDetails));

      const res = await fetch('/api/payment/initiate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ amount: finalAmountForPayment }) 
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.qrImageUrl) { 
        setPaymentMessage({ type: 'error', text: data.message || 'Gagal menginisiasi pembayaran. Silakan coba lagi.' }); 
        setPaymentStep('paymentFailed'); 
        sessionStorage.removeItem('pendingServerDetails'); // Clear on failure
      } else { 
        setQrImageUrl(data.qrImageUrl); 
        setTransactionId(data.transactionId); 
        setPaymentExpiration(data.expirationTime || 'N/A'); 
        setPaymentMessage({ type: 'success', text: data.message || 'Silakan pindai QRIS di bawah ini untuk melanjutkan pembayaran.' }); 
        
        const { pathname, query } = router;
        const newQuery = {
          ...query,
          transaction_id: data.transactionId,
          qr_image_url: encodeURIComponent(data.qrImageUrl),
          payment_expiration: data.expirationTime || 'N/A',
          // server_details: encodeURIComponent(JSON.stringify(pendingServerDetails)) // Removed from URL
        };
        router.replace({ pathname, query: newQuery }, undefined, { shallow: true });
        
        setPaymentStep('showQr'); 
        startPaymentPolling(data.transactionId); 
      }
    } catch (err) { 
      console.error("Error initiating payment:", err); 
      setPaymentMessage({ type: 'error', text: 'Terjadi kesalahan internal saat menghubungi server pembayaran.' }); 
      setPaymentStep('paymentFailed'); 
      sessionStorage.removeItem('pendingServerDetails'); // Clear on error
    }
    setIsLoading(false);
  };

  const handleSuccessfulServerCreation = (serverDataFromBackend) => {
    setPopupData({ 
      accessUrl: serverDataFromBackend.panelAccessUrl || 'N/A', 
      serverName: serverDataFromBackend.name || pendingServerDetails?.serverName || 'N/A', 
      username: serverDataFromBackend.username || pendingServerDetails?.pteroUsername || 'N/A', 
      password: serverDataFromBackend.password || pendingServerDetails?.password || 'N/A' 
    });
    setShowSuccessPopup(true); 
    setPaymentStep('formInput'); 
    setPaymentMessage({ type: '', text: '' }); 
    setCreateMessage({ type: 'success', text: 'Server berhasil dibuat setelah pembayaran dikonfirmasi!' }); // Updated message
    
    setNewServerName(''); 
    setNewServerUser(''); 
    setNewServerRam(memoryOptions[0].value); 
    setNewServerDisk(memoryOptions[0].value); 
    setNewServerCpu(cpuOptions[3].value);
    
    setPendingServerDetails(null); 
    sessionStorage.removeItem('pendingServerDetails'); // Clear from sessionStorage
    setQrImageUrl(''); 
    setTransactionId(''); 
    setPaymentExpiration('');
    
    if (pollingIntervalRef.current) { 
      clearInterval(pollingIntervalRef.current); 
      pollingIntervalRef.current = null; 
    }

    // Clean URL params
    const { pathname, query } = router;
    const cleanQuery = { ...query };
    delete cleanQuery.transaction_id;
    delete cleanQuery.qr_image_url;
    delete cleanQuery.payment_expiration;
    // server_details is no longer in the query
    router.replace({ pathname, query: cleanQuery }, undefined, { shallow: true }).then(() => {
        console.log("URL cleaned, server list might need a manual refresh or updated fetching strategy.");
    });
  };

  const checkPaymentStatus = async (currentTransactionId, isManualCheck = false) => {
    if (!currentTransactionId || !pendingServerDetails) {
      if (isManualCheck) {
        setPaymentMessage({ type: 'error', text: 'Detail transaksi tidak lengkap untuk memeriksa status.' });
      }
      return;
    }

    if (isManualCheck) {
        setPaymentMessage({ type: 'info', text: 'Memeriksa status pembayaran Anda secara manual...' });
        setIsLoading(true); // Set loading true specifically for manual check duration
    }

    try {
      const res = await fetch('/api/payment/check-status', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ transactionId: currentTransactionId, pendingServerDetails }) 
      });
      const data = await res.json();
      if (data.paymentSuccess && data.serverCreated) { 
        setPaymentMessage({ type: 'success', text: data.message || 'Pembayaran berhasil dan server telah dibuat!' }); 
        handleSuccessfulServerCreation(data.serverDetails); 
      } else if (data.paymentSuccess && !data.serverCreated) { 
        setPaymentMessage({ type: 'error', text: data.message || 'Pembayaran berhasil, tetapi server gagal dibuat. Silakan hubungi admin.' }); 
        setPaymentStep('paymentFailed'); 
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      } else if (isManualCheck && !data.paymentSuccess) {
        // If it's a manual check and payment is not successful yet (but API call was okay)
        setPaymentMessage({ type: 'info', text: data.message || 'Status pembayaran belum berhasil atau masih tertunda. Silakan coba lagi beberapa saat.' });
      }
      // If polling and payment not yet successful, it continues silently as before.

    } catch (err) { 
      console.error("Error checking payment status:", err); 
      if (isManualCheck) {
        setPaymentMessage({ type: 'error', text: 'Terjadi kesalahan saat mencoba memeriksa status pembayaran. Silakan coba lagi.' });
      }
      // For polling, errors are logged but don't necessarily stop polling unless designed to.
    } finally {
      if (isManualCheck) {
        setIsLoading(false); // Set loading false when manual check finishes
      }
    }
  };

  const startPaymentPolling = (currentTransactionId) => { 
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); 
    pollingIntervalRef.current = setInterval(() => checkPaymentStatus(currentTransactionId, false), 7000); // Pass false for isManualCheck
  };

  const handleManualCheckPayment = () => { 
    if (!transactionId) { 
      setPaymentMessage({ type: 'error', text: 'ID Transaksi tidak ditemukan untuk dicek.'}); 
      return; 
    } 
    if (!pendingServerDetails) {
      setPaymentMessage({ type: 'error', text: 'Detail server untuk transaksi ini tidak ditemukan. Tidak dapat memeriksa status.' });
      return;
    }
    // No need for oldIsLoading, checkPaymentStatus will handle isLoading for manual checks
    checkPaymentStatus(transactionId, true); // Pass true for isManualCheck
  };

  const handleCopyDetails = () => { 
    const detailsToCopy = `URL Panel: ${popupData.accessUrl}\nNama Server: ${popupData.serverName}\nUsername: ${popupData.username}\nPassword Server: ${popupData.password}`; 
    navigator.clipboard.writeText(detailsToCopy)
      .then(() => { setCopyMessage('Informasi akun disalin ke clipboard!'); setTimeout(() => setCopyMessage(''), 3000); })
      .catch(err => { setCopyMessage('Gagal menyalin. Silakan coba lagi atau salin manual.'); setTimeout(() => setCopyMessage(''), 3000);}); 
  };

  // --- STYLES DEFINITIONS ---
  const sectionStyle = { 
    padding: 'clamp(1.5rem, 4vw, 2.5rem)',
    margin: '2rem auto', 
    backgroundColor: 'rgba(17, 34, 68, 0.88)', 
    borderRadius: '12px', 
    border: '1px solid #64ffda', 
    boxShadow: '0 0 18px rgba(100, 255, 218, 0.3), 0 0 30px rgba(100, 255, 218, 0.22)', 
    maxWidth: '800px' 
  };

  const inputStyle = { 
    width: '100%', 
    padding: '12px 15px', 
    marginBottom: '1rem', 
    borderRadius: '8px', 
    border: '1px solid #2a4a75', 
    backgroundColor: 'rgba(23, 42, 69, 0.95)', 
    color: '#ccd6f6', 
    fontSize: '1rem', 
    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.25)', 
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
  };
  // :focus styles for inputs would ideally be in globals.css for better DX:
  // input:focus, select:focus { border-color: #64ffda; box-shadow: inset 0 1px 4px rgba(0,0,0,0.25), 0 0 0 2px rgba(100, 255, 218, 0.3); outline: none; }

  const labelStyle = { 
    display: 'block', 
    marginBottom: '0.6rem', 
    fontWeight: 'bold', 
    color: '#a8b2d1', 
    textShadow: '0 0 2px rgba(168, 178, 209, 0.3)'
  };

  const subHeadingStyle = { 
    marginTop: '0', // Reset for first heading in section
    marginBottom: '2rem', 
    borderBottom: '1px solid #64ffda', 
    paddingBottom: '1rem', 
    color: '#64ffda', 
    textAlign: 'center', 
    textShadow: '0 0 7px rgba(100, 255, 218, 0.75)', 
    fontSize: 'clamp(1.6rem, 5vw, 2rem)' 
  };

  const neonButtonBase = { 
    width: '100%', 
    padding: '0.9rem 1.2rem', 
    border: '1px solid',
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: 'clamp(1rem, 2.8vw, 1.15rem)',
    transition: 'all 0.25s ease-in-out', 
    textShadow: '0 0 5px rgba(204, 214, 246, 0.3)'
  };
  const primaryNeonButton = { 
    ...neonButtonBase, 
    backgroundColor: '#64ffda', 
    color: '#0a192f', 
    borderColor: '#64ffda', 
    boxShadow: '0 0 12px rgba(100, 255, 218, 0.7), 0 0 20px rgba(100, 255, 218, 0.5), inset 0 0 5px rgba(255,255,255,0.3)'
  };
  const secondaryNeonButton = { 
    ...neonButtonBase, 
    backgroundColor: 'rgba(100, 255, 218, 0.12)', 
    color: '#64ffda', 
    borderColor: '#64ffda', 
    boxShadow: '0 0 10px rgba(100, 255, 218, 0.45)'
  };
  const dangerNeonButton = { 
    ...neonButtonBase, 
    backgroundColor: 'rgba(231, 76, 60, 0.12)', 
    color: '#e74c3c', 
    borderColor: '#e74c3c', 
    boxShadow: '0 0 10px rgba(231, 76, 60, 0.45)'
  };
  const disabledNeonButton = { 
    ...neonButtonBase, 
    backgroundColor: 'rgba(42, 74, 117, 0.7)', 
    color: '#8892b0', 
    borderColor: 'rgba(42, 74, 117, 0.9)',
    cursor: 'not-allowed', 
    boxShadow: 'none' 
  };
  // --- END STYLES DEFINITIONS ---

  return (
    <>
      <Head>
        <title>Buat Server Baru - {settings?.storeName || 'Panel Akmal Store'}</title>
        <meta name="description" content="Pesan server Pterodactyl berkualitas dengan mudah, cepat, dan konfigurasi kustom." />
      </Head>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#e6f1ff', 
        textShadow: '0 0 10px rgba(230,241,255,0.35), 0 0 15px rgba(100,255,218,0.45)', 
        margin: '1.5rem 0 1rem 0',
        fontSize: 'clamp(2.2rem, 7vw, 3rem)'
      }}>
        Buat Server Baru
      </h1>
      <p style={{ 
        textAlign: 'center', 
        marginBottom: '3rem', 
        fontSize: 'clamp(1.05rem, 3.5vw, 1.2rem)',
        color: '#a8b2d1', 
        padding: '0 1rem',
        maxWidth: '700px', marginInline: 'auto',
        lineHeight: '1.7'
      }}>
        Konfigurasi server Pterodactyl Anda dengan mudah dan cepat.
      </p>

      {paymentStep === 'formInput' && (
        <section style={sectionStyle}>
          <h2 style={subHeadingStyle}>Form Pembuatan Server</h2>
          <form onSubmit={handleInitiatePayment}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.25rem'}}
            >
              <div> 
                <label htmlFor="newServerName" style={labelStyle}>Nama Server:</label> 
                <input type="text" id="newServerName" value={newServerName} onChange={(e) => setNewServerName(e.target.value)} required style={inputStyle} placeholder="Contoh: My Awesome Server"/> 
              </div>
              <div> 
                <label htmlFor="newServerUser" style={labelStyle}>Username:</label> 
                <input type="text" id="newServerUser" value={newServerUser} onChange={(e) => setNewServerUser(e.target.value)} required style={inputStyle} placeholder="Contoh: user_unik_123"/> 
              </div>
              <div> 
                <label htmlFor="newServerRam" style={labelStyle}>RAM:</label> 
                <select id="newServerRam" value={newServerRam} onChange={(e) => setNewServerRam(e.target.value)} required style={inputStyle}> 
                  {memoryOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))} 
                </select> 
              </div>
              <div> 
                <label htmlFor="newServerDisk" style={labelStyle}>Disk:</label> 
                <select id="newServerDisk" value={newServerDisk} onChange={(e) => setNewServerDisk(e.target.value)} required style={inputStyle}> 
                  {memoryOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))} 
                </select> 
              </div>
              <div style={{ gridColumn: '1 / -1'}}>
                 <label htmlFor="newServerCpu" style={labelStyle}>CPU Limit:</label> 
                 <select id="newServerCpu" value={newServerCpu} onChange={(e) => setNewServerCpu(e.target.value)} required style={inputStyle}> 
                   {cpuOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))} 
                 </select>
              </div>
            </div>
            <div style={{ marginTop: '2.5rem', marginBottom: '2rem', textAlign: 'center', fontSize: 'clamp(1rem, 3vw, 1.1rem)', color: '#ccd6f6' }}>
              <p style={{ margin: '0.4rem 0'}}>Subtotal Server: <strong style={{color: '#64ffda'}}>{formatCurrency(calculatedPrice)}</strong></p>
              <p style={{ margin: '0.4rem 0'}}>Biaya Admin: <strong style={{color: '#64ffda'}}>{formatCurrency(ADMIN_FEE)}</strong></p>
              <p style={{ margin: '0.6rem 0', fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 'bold'}}>Total Pembayaran: <strong style={{color: '#64ffda', textShadow: '0 0 6px #64ffda'}}>{formatCurrency(finalAmountForPayment)}</strong></p>
              <p style={{ fontSize: '0.85rem', color: '#8892b0', marginTop: '0.5rem'}}>(Termasuk kode unik acak pada 2 digit terakhir)</p>
            </div>
            <button 
              type="submit" 
              disabled={isLoading || calculatedPrice < 0} // Allow 0 price if that's intended for free items before admin fee
              style={ (isLoading || calculatedPrice < 0) ? disabledNeonButton : primaryNeonButton }
            >
              {isLoading ? 'Memproses Pembayaran...' : 'Buat Sekarang'}
            </button>
            {createMessage.text && 
              <p style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                borderRadius: '8px', 
                textAlign: 'center', 
                backgroundColor: createMessage.type === 'error' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(100, 255, 218, 0.1)', 
                border: `1px solid ${createMessage.type === 'error' ? '#e74c3c' : '#64ffda'}`, 
                color: createMessage.type === 'error' ? '#e74c3c' : '#64ffda',
                fontWeight: '500'
              }}> 
                {createMessage.text} 
              </p>}
          </form>
        </section>
      )}

      {paymentStep === 'showQr' && (
        <section style={{...sectionStyle, textAlign: 'center'}}>
          <h2 style={subHeadingStyle}>Pindai QRIS untuk Pembayaran</h2>
          {paymentMessage.text && 
            <p style={{ 
              color: paymentMessage.type === 'error' ? '#e74c3c' : (paymentMessage.type === 'info' ? '#8892b0' : '#2ecc71'), 
              marginBottom: '1.5rem', 
              fontWeight: '500',
              fontSize: 'clamp(0.95rem, 2.8vw, 1.1rem)'
            }}>{paymentMessage.text}</p>}
          {qrImageUrl && 
            <img 
              src={qrImageUrl} 
              alt="Kode QRIS Pembayaran" 
              style={{ 
                maxWidth: '280px', 
                width: '100%', 
                margin: '0 auto 2rem auto', 
                display: 'block', 
                border: '3px solid #64ffda', 
                borderRadius: '10px', 
                boxShadow: '0 0 15px rgba(100,255,218,0.55)' 
              }} 
            />} 
          {transactionId && <p style={{ color: '#a8b2d1', fontSize: '0.9rem' }}>ID Transaksi: <strong style={{color: '#ccd6f6'}}>{transactionId}</strong></p>}
          {paymentExpiration && <p style={{ color: '#a8b2d1', fontSize: '0.9rem', marginBottom: '2rem' }}>Kedaluwarsa Pembayaran: <strong style={{color: '#ccd6f6'}}>{new Date(paymentExpiration).toLocaleString('id-ID', { dateStyle:'medium', timeStyle: 'short' })}</strong></p>}
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            <button onClick={handleManualCheckPayment} style={isLoading? disabledNeonButton : primaryNeonButton} disabled={isLoading}> 
              {isLoading ? 'Memeriksa...' : 'Saya Sudah Bayar / Cek Status'}
            </button>
            <button onClick={() => { 
              setPaymentStep('formInput'); 
              setPaymentMessage({type: '', text: ''}); 
              if(pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              sessionStorage.removeItem('pendingServerDetails'); // Clear from sessionStorage
              // Clean URL params on cancellation
              const { pathname, query } = router;
              const cleanQuery = { ...query };
              delete cleanQuery.transaction_id;
              delete cleanQuery.qr_image_url;
              delete cleanQuery.payment_expiration;
              router.replace({ pathname, query: cleanQuery }, undefined, { shallow: true });
            }} style={dangerNeonButton} disabled={isLoading}> 
              Batal Pembayaran
            </button>
          </div>
        </section>
      )}

      {(paymentStep === 'paymentFailed' || paymentStep === 'processingPayment') && paymentMessage.text && paymentStep !== 'showQr' && (
         <div style={{
            ...sectionStyle, 
            textAlign: 'center', 
            borderColor: paymentMessage.type === 'error' ? '#e74c3c' : '#64ffda', 
            boxShadow: `0 0 18px ${paymentMessage.type === 'error' ? 'rgba(231,76,60,0.35)' : 'rgba(100,255,218,0.35)'}` 
          }}>
           <p style={{ 
             color: paymentMessage.type === 'error' ? '#e74c3c' : '#a8b2d1', 
             fontSize: 'clamp(1.05rem, 3vw, 1.15rem)', 
             fontWeight: '500' 
            }}>{paymentMessage.text}</p>
           {paymentStep === 'paymentFailed' && ( 
            <button 
              onClick={() => { setPaymentStep('formInput'); setPaymentMessage({type: '', text: ''}); }} 
              style={{...primaryNeonButton, marginTop: '2rem', width: 'auto', padding: '0.8rem 1.8rem'}}
            > 
              Kembali ke Form 
            </button> 
           )}
         </div>
      )}

      {showSuccessPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(23, 42, 69, 0.97)', 
            padding: 'clamp(1.8rem, 5vw, 3rem)', 
            borderRadius: '15px', 
            color: '#ccd6f6', 
            maxWidth: '550px', 
            width: '100%', 
            textAlign: 'left', 
            border: '1px solid #64ffda', 
            boxShadow: '0 0 30px rgba(100,255,218,0.45), 0 0 50px rgba(100,255,218,0.35)' 
          }}>
            <h3 style={{ 
              color: '#64ffda', 
              textAlign: 'center', 
              marginBottom: '2rem', 
              fontSize: 'clamp(1.5rem, 4.5vw, 1.9rem)', 
              textShadow: '0 0 7px #64ffda' 
            }}>Server Berhasil Dikonfigurasi!</h3>
            <p style={{ marginBottom: '1rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)' }}><strong>URL Panel Akses:</strong> <a href={popupData.accessUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#64ffda', textDecoration: 'underline', wordBreak: 'break-all' }}>{popupData.accessUrl}</a></p>
            <p style={{ marginBottom: '1rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)' }}><strong>Nama Server:</strong> {popupData.serverName}</p>
            <p style={{ marginBottom: '1rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)' }}><strong>Username:</strong> {popupData.username}</p>
            <p style={{ marginBottom: '2rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)' }}><strong>Password Server:</strong> {popupData.password}</p>
            <p style={{ textAlign: 'center', fontSize: 'clamp(1.05rem, 3vw, 1.2rem)', marginBottom: '2rem', color: '#e6f1ff' }}>Terima kasih telah melakukan pemesanan!</p>
            {copyMessage && 
              <p style={{ 
                textAlign: 'center', 
                color: copyMessage.startsWith('Gagal') ? '#e74c3c' : '#64ffda', 
                marginBottom: '1.5rem', 
                fontSize: '0.95rem',
                fontWeight: '500' 
              }}>{copyMessage}</p>}
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <button onClick={handleCopyDetails} style={{...secondaryNeonButton, fontSize: 'clamp(1rem, 2.8vw, 1.1rem)'}}> Salin Informasi Akun </button>
                <button onClick={() => setShowSuccessPopup(false)} style={{...primaryNeonButton, fontSize: 'clamp(1rem, 2.8vw, 1.1rem)'}}> Tutup </button>
            </div>
          </div>
        </div>
      )}

      <h2 style={{...subHeadingStyle, marginTop: '4rem', marginBottom: '2rem'}}>Daftar Server</h2>
      {serversData.error && (
        <div style={{ ...sectionStyle, borderColor: '#e74c3c', textAlign: 'center', boxShadow: '0 0 18px rgba(231,76,60,0.35)' }}>
          <strong style={{color: '#e74c3c', fontSize: '1.1rem'}}>Error Mengambil Data Server:</strong>
          <p style={{color: '#e74c3c', marginTop: '0.5rem'}}>{serversData.message}</p>
          {serversData.creator && <p style={{fontSize: '0.85em', marginTop: '0.75em', color: '#ff8a80'}}>Detail dari API (Creator: {serversData.creator})</p>}
        </div>
      )}
      {(!serversData.error && serversData.result.length === 0) && (
         <p style={{ textAlign: 'center', margin: '3rem 0', fontSize: '1.15rem', color: '#8892b0' }}>Saat ini belum ada server yang dikonfigurasi atau tersedia untuk ditampilkan.</p>
      )}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '1.8rem',
        marginTop: '1.5rem',
        padding: '0 0.75rem'
      }}>
        {serversData.result.map((server) => (
          <ServerCard 
            key={server.id_server || server.name} // Fallback key
            title={server.name}
            description={`RAM: ${server.ram === '0' || server.ram === 0 ? 'Unlimited' : server.ram + 'MB'}, CPU: ${server.cpu === '0' || server.cpu === 0 ? 'Unlimited' : server.cpu + '%'}, Disk: ${server.disk === '0' || server.disk === 0 ? 'Unlimited' : server.disk + 'MB'}`}
            specs={[`ID Server: ${server.id_server || 'N/A'}`, `Dibuat pada: ${formatDate(server.created_at)}`]}
          />
        ))}
      </div>
    </>
  );
} 
