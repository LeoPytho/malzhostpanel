import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import FallingStars from './FallingStars';

export default function Layout({ children, title, description }) {
  return (
    <>
      <FallingStars />
      <Header />
      <main style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
      <Footer />
    </>
  );
} 