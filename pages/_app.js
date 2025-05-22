import { useEffect, useState } from 'react';
import Router from 'next/router';
import PageLoadingPopup from '../components/PageLoadingPopup';
import Layout from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const [isNavigatingToCreateServer, setIsNavigatingToCreateServer] = useState(false);

  useEffect(() => {
    const handleRouteChangeStart = (url) => {
      if (url === '/create-server' || url.startsWith('/create-server?')) {
        setIsNavigatingToCreateServer(true);
      }
    };

    const handleRouteChangeComplete = () => {
      setIsNavigatingToCreateServer(false);
    };

    const handleRouteChangeError = () => {
      setIsNavigatingToCreateServer(false);
    };

    Router.events.on('routeChangeStart', handleRouteChangeStart);
    Router.events.on('routeChangeComplete', handleRouteChangeComplete);
    Router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup function
    return () => {
      Router.events.off('routeChangeStart', handleRouteChangeStart);
      Router.events.off('routeChangeComplete', handleRouteChangeComplete);
      Router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <Layout>
      <PageLoadingPopup isLoading={isNavigatingToCreateServer} />
      <Component {...pageProps} />
    </Layout>
  );
} 