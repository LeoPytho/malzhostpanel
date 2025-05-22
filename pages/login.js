import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect ke halaman admin jika login berhasil
        router.push('/admin');
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login Admin</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid #ff0000',
          color: '#ff0000',
          padding: '1rem',
          borderRadius: '5px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '5px',
              border: '1px solid #1e3a5f',
              backgroundColor: '#172a45',
              color: '#ccd6f6'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '5px',
              border: '1px solid #1e3a5f',
              backgroundColor: '#172a45',
              color: '#ccd6f6'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#64ffda',
            color: '#0a192f',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

LoginPage.getLayout = function getLayout(page) {
  return (
    <Layout title="Login Admin" description="Halaman login admin">
      {page}
    </Layout>
  );
}; 