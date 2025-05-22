import { useEffect, useState } from 'react';

export default function FallingStars() {
  const [stars, setStars] = useState([]);

  const createStar = () => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 3 + 1}px`,
    duration: `${Math.random() * 3 + 2}s`,
    delay: `${Math.random() * 2}s`,
    color: Math.random() > 0.5 ? '#64ffda' : '#7dd3fc' // 50% chance for each color
  });

  useEffect(() => {
    // Create initial stars
    setStars(Array.from({ length: 50 }, createStar)); // Increased from 20 to 50 stars

    // Update stars periodically
    const interval = setInterval(() => {
      setStars(prevStars => {
        const newStars = prevStars.filter(star => {
          const duration = parseFloat(star.duration);
          const delay = parseFloat(star.delay);
          return duration + delay > 2;
        });
        
        // Add new stars if needed
        while (newStars.length < 50) { // Increased from 20 to 50 stars
          newStars.push(createStar());
        }
        
        return newStars;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {stars.map((star, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: '-10px',
            left: star.left,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${star.color}, 0 0 20px ${star.color}`,
            animation: `fall ${star.duration} linear ${star.delay} infinite`,
            opacity: 0
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 