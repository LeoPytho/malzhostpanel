import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
// Layout akan di-import di _app.js, kita tidak perlu import Head di sini lagi.

// Fungsi untuk memformat angka menjadi mata uang IDR (bisa dipindah ke utils jika sering dipakai)
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') amount = 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function AdminPage() {
  // Store Settings State
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeMessage, setStoreMessage] = useState('');

  // Pterodactyl Config State
  const [pteroConfig, setPteroConfig] = useState({
    pterodactylDomain: '',
    pterodactylApiKeyPTLA: '',
    pterodactylApiKeyPTLC: '',
    defaultLocationId: '1',
    defaultEggId: '',
    defaultNestId: '',
    apiWrapperUrl: ''
  });
  const [pteroMessage, setPteroMessage] = useState('');

  // Server List State for Admin Page
  const [adminServers, setAdminServers] = useState([]);
  const [adminServersLoading, setAdminServersLoading] = useState(true);
  const [adminServersError, setAdminServersError] = useState('');
  const [deleteServerMessage, setDeleteServerMessage] = useState({ type: '', text: '' });

  // State untuk Sales Dashboard
  const [salesData, setSalesData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');

  const router = useRouter();

  const fetchAdminServers = async () => {
    setAdminServersLoading(true);
    setAdminServersError('');
    setDeleteServerMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/pterodactyl/servers');
      const data = await res.json();
      if (!res.ok || data.error) {
        setAdminServersError(data.message || 'Gagal memuat daftar server.');
        setAdminServers([]);
      } else {
        setAdminServers(data.result || []);
      }
    } catch (err) {
      setAdminServersError('Terjadi kesalahan saat mengambil data server.');
      setAdminServers([]);
    }
    setAdminServersLoading(false);

    // Fetch sales dashboard data
    setSalesLoading(true);
    fetch('/api/admin/sales-dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok for sales data');
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setSalesError(data.message || 'Gagal memuat data penjualan.');
          setSalesData(null);
        } else {
          setSalesData(data);
          setSalesError('');
        }
      })
      .catch(err => {
        console.error("Failed to load sales dashboard data:", err);
        setSalesError(err.message || 'Terjadi kesalahan saat mengambil data penjualan.');
        setSalesData(null);
      })
      .finally(() => setSalesLoading(false));
  };

  useEffect(() => {
    // Fetch initial store settings
    fetch('/api/store-settings')
      .then((res) => res.json())
      .then((data) => {
        setStoreName(data.storeName || '');
        setStoreDescription(data.storeDescription || '');
      }).catch(err => console.error("Failed to load store settings", err));

    // Fetch initial Pterodactyl config
    fetch('/api/pterodactyl-config')
      .then((res) => res.json())
      .then((data) => {
        setPteroConfig(data);
      }).catch(err => console.error("Failed to load Pterodactyl config", err));

    fetchAdminServers(); // Muat daftar server saat komponen dimuat
  }, []);

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreMessage('');
    const res = await fetch('/api/store-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, storeDescription }),
    });
    const data = await res.json();
    setStoreMessage(res.ok ? `Berhasil disimpan: ${data.message}` : `Gagal menyimpan: ${data.message}`);
  };

  const handlePteroConfigChange = (e) => {
    // Sebaiknya nonaktifkan perubahan jika field read-only
    // setPteroConfig({ ...pteroConfig, [e.target.name]: e.target.value }); 
  };

  const handlePteroSubmit = async (e) => {
    e.preventDefault();
    // setPteroMessage(''); // Fungsi ini tidak lagi digunakan untuk submit
    // const res = await fetch('/api/pterodactyl-config', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(pteroConfig),
    // });
    // const data = await res.json();
    // setPteroMessage(res.ok ? `Konfigurasi Pterodactyl: ${data.message}` : `Gagal: ${data.message}`);
    setPteroMessage("Perubahan konfigurasi Pterodactyl dilakukan melalui Environment Variables di Vercel atau file .env.local.");
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteServer = async (serverId, serverName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus server "${serverName}" (ID: ${serverId})? Tindakan ini tidak dapat diurungkan.`)) {
      setDeleteServerMessage({ type: '', text: '' });
      try {
        const res = await fetch('/api/pterodactyl/delete-server', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId }),
        });
        const data = await res.json();
        if (!res.ok || data.error || !data.status) {
          setDeleteServerMessage({ type: 'error', text: data.message || `Gagal menghapus server ${serverName}.` });
        } else {
          setDeleteServerMessage({ type: 'success', text: data.result || `Server ${serverName} berhasil dihapus.` });
          fetchAdminServers(); // Refresh daftar server
        }
      } catch (err) {
        setDeleteServerMessage({ type: 'error', text: `Terjadi kesalahan saat menghapus server ${serverName}.` });
      }
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #1e3a5f', backgroundColor: 'rgba(23, 42, 69, 0.8)', color: '#ccd6f6' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#a8b2d1' };
  const subHeadingStyle = { marginTop: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid #64ffda', paddingBottom: '0.5rem', color: '#64ffda', textShadow: '0 0 5px rgba(100, 255, 218, 0.7)' };
  const tableCellStyle = { padding: '10px 15px', borderBottom: '1px solid rgba(42, 74, 117, 0.5)', textAlign: 'left' };
  const tableHeaderStyle = { ...tableCellStyle, color: '#64ffda', textShadow: '0 0 3px rgba(100, 255, 218, 0.5)', borderBottom: '2px solid #64ffda' };

  return (
    <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          color: '#e6f1ff',
          textShadow: '0 0 10px rgba(230,241,255,0.35), 0 0 15px rgba(100,255,218,0.45)'
        }}>Panel Admin</h1>
        <button onClick={handleLogout} style={{ 
          padding: '0.7rem 1.2rem', 
          backgroundColor: 'rgba(231, 76, 60, 0.8)', 
          color: 'white', 
          border: '1px solid #e74c3c', 
          borderRadius: '5px', 
          cursor: 'pointer', 
          fontWeight: 'bold', 
          boxShadow: '0 0 8px rgba(231, 76, 60, 0.7)',
          alignSelf: 'flex-start'
        }}>
          Logout
        </button>
      </div>

      {/* Sales Dashboard Section */}
      <h2 style={{
        ...subHeadingStyle,
        fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
        marginTop: '2rem'
      }}>Dashboard Penjualan</h2>
      {salesLoading && <p>Memuat data penjualan...</p>}
      {salesError && <p style={{ color: '#e74c3c' }}>Error: {salesError}</p>}
      {salesData && !salesLoading && !salesError && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', 
          gap: 'clamp(1rem, 3vw, 1.5rem)', 
          marginBottom: '2rem' 
        }}>
          <DashboardCard title="Pendapatan Hari Ini" value={formatCurrency(salesData.today.total)} count={salesData.today.count} />
          <DashboardCard title="Pendapatan 7 Hari Terakhir" value={formatCurrency(salesData.last7Days.total)} count={salesData.last7Days.count} />
          <DashboardCard title="Pendapatan 30 Hari Terakhir" value={formatCurrency(salesData.last30Days.total)} count={salesData.last30Days.count} />
        </div>
      )}

      {/* Daftar Server Admin */}
      <h2 style={{
        ...subHeadingStyle,
        fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
        marginTop: '2rem'
      }}>Daftar Server Pterodactyl</h2>
      {deleteServerMessage.text && (
        <p style={{ 
          margin: '1rem 0', 
          padding: '0.8rem', 
          borderRadius: '5px', 
          textAlign: 'center', 
          backgroundColor: deleteServerMessage.type === 'error' ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', 
          color: deleteServerMessage.type === 'error' ? '#e74c3c' : '#2ecc71',
          fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
        }}>
          {deleteServerMessage.text}
        </p>
      )}
      {adminServersLoading && <p>Memuat daftar server...</p>}
      {adminServersError && <p style={{ color: '#e74c3c' }}>Error: {adminServersError}</p>}
      {!adminServersLoading && !adminServersError && adminServers.length === 0 && (
        <p>Belum ada server yang terdaftar.</p>
      )}
      {!adminServersLoading && !adminServersError && adminServers.length > 0 && (
        <div style={{ 
          overflowX: 'auto',
          marginTop: '1rem',
          borderRadius: '8px',
          boxShadow: '0 0 15px rgba(42, 74, 117, 0.3)'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            backgroundColor: 'rgba(17, 34, 68, 0.75)',
            minWidth: '600px' // Minimum width untuk memastikan konten tidak terlalu kecil
          }}>
            <thead>
              <tr>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>ID</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>Nama Server</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>RAM (MB)</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>CPU (%)</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>Disk (MB)</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>Dibuat</th>
                <th style={{...tableHeaderStyle, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {adminServers.map((server) => (
                <tr key={server.id_server}>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{server.id_server}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{server.name}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{server.ram}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{server.cpu}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{server.disk}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>{new Date(server.created_at).toLocaleDateString()}</td>
                  <td style={{...tableCellStyle, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)'}}>
                    <button 
                      onClick={() => handleDeleteServer(server.id_server, server.name)}
                      style={{ 
                        backgroundColor: 'rgba(192, 57, 43, 0.8)', 
                        color: 'white', 
                        border: '1px solid #e74c3c', 
                        padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.6rem, 2vw, 1rem)', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        boxShadow: '0 0 5px rgba(231, 76, 60, 0.6)',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
                      }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button 
        onClick={fetchAdminServers} 
        disabled={adminServersLoading} 
        style={{ 
          marginTop: '1.5rem', 
          padding: 'clamp(0.8rem, 2.5vw, 1rem) clamp(1.2rem, 3.5vw, 1.5rem)', 
          backgroundColor: 'rgba(30, 58, 95, 0.8)', 
          color: '#64ffda', 
          border: '1px solid #64ffda', 
          borderRadius: '5px', 
          cursor: adminServersLoading ? 'not-allowed' : 'pointer', 
          boxShadow: '0 0 8px rgba(100, 255, 218, 0.5)', 
          fontWeight: 'bold',
          fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
        }}
      >
        {adminServersLoading ? 'Memuat...' : 'Refresh Daftar Server'}
      </button>
    </div>
  );
}

// Komponen kecil untuk kartu dashboard
function DashboardCard({ title, value, count }) {
  return (
    <div style={{
      backgroundColor: 'rgba(23, 42, 69, 0.85)', 
      padding: 'clamp(1rem, 3vw, 1.5rem)', 
      borderRadius: '10px', 
      border: '1px solid #64ffda',
      textAlign: 'center',
      boxShadow: '0 0 10px rgba(100, 255, 218, 0.4), 0 0 15px rgba(100, 255, 218, 0.3)',
      backdropFilter: 'blur(3px)',
    }}>
      <h3 style={{ color: '#a8b2d1', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#64ffda', fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 'bold', margin: '0.5rem 0', textShadow: '0 0 6px #64ffda, 0 0 9px #64ffda' }}>{value}</p>
      <p style={{ color: '#8892b0', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>({count} transaksi)</p>
    </div>
  );
}

AdminPage.getLayout = function getLayout(page) {
  return (
    <Layout title="Panel Admin - Panel Akmal" description="Kelola pengaturan toko Anda.">
      {page}
    </Layout>
  );
}; 
