import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItemStyle = (path) => ({
    color: router.pathname === path ? '#64ffda' : '#a8b2d1',
    textDecoration: 'none',
    fontSize: '1.2rem',
    padding: '0.5rem',
    borderRadius: '5px',
    transition: 'all 0.3s ease',
    textShadow: router.pathname === path ? '0 0 10px rgba(100, 255, 218, 0.5)' : 'none',
    '&:hover': {
      backgroundColor: 'rgba(100, 255, 218, 0.1)',
      color: '#64ffda',
    }
  });

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(17, 34, 68, 0.95)',
        borderBottom: '1px solid #64ffda',
        boxShadow: '0 2px 10px rgba(100, 255, 218, 0.2)',
        backdropFilter: 'blur(10px)',
        padding: '1rem',
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <Link href="/landing" style={{
            color: '#64ffda',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(100, 255, 218, 0.5)',
          }}>
            Panel Akmal Store
          </Link>

          <button 
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{
              display: 'block',
              width: '25px',
              height: '2px',
              backgroundColor: '#64ffda',
              transition: '0.3s',
              transform: isSidebarOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }}></span>
            <span style={{
              display: 'block',
              width: '25px',
              height: '2px',
              backgroundColor: '#64ffda',
              transition: '0.3s',
              opacity: isSidebarOpen ? '0' : '1',
            }}></span>
            <span style={{
              display: 'block',
              width: '25px',
              height: '2px',
              backgroundColor: '#64ffda',
              transition: '0.3s',
              transform: isSidebarOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }}></span>
          </button>
        </nav>
      </header>

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isSidebarOpen ? '0' : '-300px',
        width: '300px',
        height: '100vh',
        backgroundColor: 'rgba(17, 34, 68, 0.95)',
        boxShadow: '-2px 0 10px rgba(100, 255, 218, 0.2)',
        transition: 'right 0.3s ease-in-out',
        zIndex: 1001,
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid #64ffda',
        padding: '2rem 1rem',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          <Link href="/landing" 
            onClick={() => setIsSidebarOpen(false)}
            style={menuItemStyle('/landing')}
          >
            Beranda
          </Link>
          <Link href="/create-server" 
            onClick={() => setIsSidebarOpen(false)}
            style={menuItemStyle('/create-server')}
          >
            Buat Server
          </Link>
          <Link href="/admin" 
            onClick={() => setIsSidebarOpen(false)}
            style={menuItemStyle('/admin')}
          >
            Admin
          </Link>
          <Link href="/api-docs" 
            onClick={() => setIsSidebarOpen(false)}
            style={menuItemStyle('/api-docs')}
          >
            API Docs
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        />
      )}
    </>
  );
} 
