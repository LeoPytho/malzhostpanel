// import styles from './ServerCard.module.css'; // Tidak digunakan lagi

export default function ServerCard({ title, description, price, specs, ctaLink, ctaText }) {
  const cardStyle = {
    backgroundColor: 'rgba(23, 42, 69, 0.8)', // Latar belakang transparan
    border: '1px solid #64ffda',
    borderRadius: '10px',
    padding: '1.5rem',
    color: '#ccd6f6',
    boxShadow: '0 0 12px rgba(100, 255, 218, 0.3), 0 0 20px rgba(100, 255, 218, 0.2)',
    transition: 'transform 0.3s ease, boxShadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%', // Memastikan kartu dalam grid memiliki tinggi yang sama jika diperlukan
  };

  const titleStyle = {
    color: '#64ffda',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    textShadow: '0 0 5px rgba(100, 255, 218, 0.7)',
  };

  const descriptionStyle = {
    fontSize: '0.95rem',
    marginBottom: '1rem',
    flexGrow: 1, // Agar deskripsi mengisi ruang yang tersedia
  };

  const specsListStyle = {
    listStyle: 'none',
    padding: 0,
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  };

  const specItemStyle = {
    marginBottom: '0.5rem',
    paddingLeft: '1.2rem',
    position: 'relative',
  };

  // Custom bullet dengan CSS pseudo-element (tidak bisa inline, jadi kita pakai karakter atau SVG)
  // Untuk kesederhanaan, kita pakai karakter unicode
  const specBullet = '\u2727'; // Bintang kecil atau bisa diganti dengan karakter lain

  const priceStyle = {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#64ffda',
    marginBottom: '1.5rem',
    textShadow: '0 0 4px rgba(100, 255, 218, 0.6)',
  };

  const ctaButtonStyle = {
    display: 'inline-block',
    backgroundColor: 'rgba(100, 255, 218, 0.15)',
    color: '#64ffda',
    padding: '0.8rem 1.5rem',
    border: '1px solid #64ffda',
    borderRadius: '5px',
    textDecoration: 'none',
    textAlign: 'center',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, color 0.3s ease, boxShadow 0.3s ease',
    boxShadow: '0 0 8px rgba(100, 255, 218, 0.3)',
  };

  // Hover effect for button cannot be done purely with inline styles without JS listeners.
  // We rely on global CSS for :hover on <a> if defined, or accept this limitation for now.

  return (
    <div style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 0 18px rgba(100, 255, 218, 0.5), 0 0 30px rgba(100, 255, 218, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = '0 0 12px rgba(100, 255, 218, 0.3), 0 0 20px rgba(100, 255, 218, 0.2)';
      }}
    >
      <div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
        {specs && specs.length > 0 && (
          <ul style={specsListStyle}>
            {specs.map((spec, index) => (
              <li key={index} style={specItemStyle}>
                <span style={{ color: '#64ffda', marginRight: '0.5rem' }}>{specBullet}</span>{spec}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        {price && <div style={priceStyle}>{price}</div>}
        {ctaLink && ctaText && (
          <a href={ctaLink} style={ctaButtonStyle} target="_blank" rel="noopener noreferrer">
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
} 