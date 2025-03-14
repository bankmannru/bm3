import React from 'react';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Добро пожаловать в Банк Маннру
        </h1>
        <p className="hero-subtitle">
          Ваш надежный финансовый партнер для всех банковских решений
        </p>
        <div className="hero-buttons">
          <button className="primary-button">
            Открыть счёт
          </button>
          <button className="secondary-button">
            Узнать больше
          </button>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);
          color: white;
          padding: 4rem 2rem;
          text-align: center;
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .primary-button {
          background-color: white;
          color: #1a237e;
          border: none;
          padding: 1rem 2rem;
          border-radius: 28px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .secondary-button {
          background-color: transparent;
          color: white;
          border: 2px solid white;
          padding: 1rem 2rem;
          border-radius: 28px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .secondary-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 3rem 1rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

export default Hero; 