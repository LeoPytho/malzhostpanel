import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <p>
          &copy; {currentYear} AkmalStore. Dibuat dengan Next.js.
        </p>
        {/* Anda bisa menambahkan link sosial media atau info lain di sini */}
      </div>
    </footer>
  );
} 
