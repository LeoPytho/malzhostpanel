import React from 'react';

const PageLoadingPopup = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-popup-box">
        <h3>
          MEMUAT HALAMAN
        </h3>
        <p>
          Mohon tunggu sebentar, kami sedang menyiapkan halaman untuk Anda.
        </p>
        <div className="progress-bar-container">
          <div className="progress-bar-shimmer"></div>
        </div>
      </div>
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: #fff;
          text-align: center;
          flex-direction: column;
          backdrop-filter: blur(3px);
        }
        .loading-popup-box {
          padding: 35px 45px;
          background: rgba(17, 34, 68, 0.97);
          border-radius: 15px;
          border: 1px solid #64ffda;
          box-shadow: 0 0 15px rgba(100, 255, 218, 0.2);
          animation: pulsateShadow 2s infinite ease-in-out;
          width: 90%; /* Default width */
          max-width: 500px; /* Maximum width for larger screens */
        }
        .loading-popup-box h3 {
          color: #64ffda;
          margin-bottom: 25px;
          font-size: 2rem;
          text-shadow: 0 0 8px #64ffda, 0 0 12px #64ffda;
          letter-spacing: 1px;
        }
        .loading-popup-box p {
          color: #a8b2d1;
          font-size: 1.15rem;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .progress-bar-container {
          width: 90%;
          height: 10px;
          background-color: rgba(10, 25, 47, 0.8);
          border-radius: 5px;
          overflow: hidden;
          margin: 0 auto;
          position: relative;
          border: 1px solid rgba(100, 255, 218, 0.2);
        }
        .progress-bar-shimmer {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(100, 255, 218, 0.7), transparent);
          animation: shimmerAnimation 2s infinite linear;
        }

        @keyframes pulsateShadow {
          0% {
            box-shadow: 0 0 15px rgba(100, 255, 218, 0.2), 0 0 25px rgba(100, 255, 218, 0.1);
          }
          50% {
            box-shadow: 0 0 25px rgba(100, 255, 218, 0.4), 0 0 40px rgba(100, 255, 218, 0.3);
          }
          100% {
            box-shadow: 0 0 15px rgba(100, 255, 218, 0.2), 0 0 25px rgba(100, 255, 218, 0.1);
          }
        }
        @keyframes shimmerAnimation {
          0% {
            transform: translateX(-100%) skewX(-20deg);
          }
          100% {
            transform: translateX(100%) skewX(-20deg);
          }
        }

        /* Responsive adjustments for smaller screens */
        @media (max-width: 600px) {
          .loading-popup-box {
            padding: 20px 25px; /* Reduced padding */
            width: 85%; /* Adjust width for smaller screens */
          }
          .loading-popup-box h3 {
            font-size: 1.5rem; /* Reduced font size */
            margin-bottom: 15px; /* Reduced margin */
          }
          .loading-popup-box p {
            font-size: 0.9rem; /* Reduced font size */
            margin-bottom: 20px; /* Reduced margin */
          }
          .progress-bar-container {
            height: 8px; /* Slightly thinner progress bar */
          }
        }
      `}</style>
    </div>
  );
};

export default PageLoadingPopup; 