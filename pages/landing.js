import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Landing.module.css'; // Kita akan buat file CSS Module ini nanti

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Panel Akmal Store - Server Pterodactyl Berkualitas</title>
        <meta name="description" content="Pesan server Pterodactyl berkualitas dengan mudah, cepat, dan konfigurasi kustom. Dukungan 24/7 dan harga terjangkau." />
      </Head>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Server Pterodactyl Berkualitas
          </h1>
          <p className={styles.heroSubtitle}>
            Pesan server Pterodactyl dengan mudah, cepat, dan konfigurasi kustom sesuai kebutuhan Anda.
          </p>
          <Link href="/create-server" className={styles.ctaButton}>
            Pesan Server Sekarang
          </Link>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Mengapa Memilih Kami?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3>Konfigurasi Kustom</h3>
              <p>Pilih spesifikasi server sesuai kebutuhan Anda - RAM, CPU, dan Disk yang fleksibel.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Pembayaran Mudah</h3>
              <p>Pembayaran melalui QRIS yang aman dan cepat. Proses otomatis setelah pembayaran.</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Dukungan 24/7</h3>
              <p>Tim support kami siap membantu Anda kapan saja. Respon cepat dan solusi tepat.</p>
            </div>
            {/* Tambahkan fitur lain di sini */}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2>Siap Memulai?</h2>
          <p>Buat server Pterodactyl Anda sekarang dan nikmati layanan berkualitas dengan harga terjangkau.</p>
          <Link href="/create-server" className={styles.ctaButton}>
            Buat Server Sekarang
          </Link>
        </section>
      </main>
    </>
  );
} 
