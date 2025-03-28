import React from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Банк Маннру</h3>
          <p className="footer-description">
            Ваш надежный финансовый партнер с инновационными решениями для всех ваших банковских потребностей.
          </p>
          <div className="alpha-notice">
            <FaExclamationTriangle className="alpha-icon" />
            <p>Альфа-версия.</p>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Услуги</h4>
          <ul className="footer-list">
            <li><a href="/cards">Банковские карты</a></li>
            <li><a href="/deposits">Вклады</a></li>
            <li><a href="/credits">Кредиты</a></li>
            <li><a href="/mortgage">Ипотека</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Информация</h4>
          <ul className="footer-list">
            <li><a href="/about">О банке</a></li>
            <li><a href="/careers">Карьера</a></li>
            <li><a href="/news">Новости</a></li>
            <li><a href="/contacts">Контакты</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Контакты</h4>
          <ul className="footer-list">
            <li><FaPhone className="contact-icon" /> 8-800-100-1000</li>
            <li><FaEnvelope className="contact-icon" /> support@mannru.ru</li>
            <li><FaMapMarkerAlt className="contact-icon" /> г. Москва, ул. Банковская, 1</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">
          © 2025 Банк Маннру. Никакие права не защищены.
        </p>
        <p className="alpha-version">
          <FaExclamationTriangle className="alpha-icon-small" /> Альфа-версия. Ограничения можно отключить через Firestore.
        </p>
      </div>

      <style jsx>{`
        .footer {
          background-color: #1a237e;
          color: white;
          padding-top: 4rem;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .footer-section {
          margin-bottom: 2rem;
        }

        .footer-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .footer-description {
          opacity: 0.8;
          line-height: 1.6;
        }

        .footer-subtitle {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-list li {
          margin-bottom: 0.5rem;
        }

        .footer-list a {
          color: white;
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.3s;
        }

        .footer-list a:hover {
          opacity: 1;
        }

        .footer-bottom {
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background-color: rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .copyright {
          opacity: 0.8;
          margin: 0;
        }
        
        .alpha-version {
          opacity: 0.8;
          margin: 0.5rem 0 0;
          font-size: 0.8rem;
          color: #ff9800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .alpha-icon-small {
          font-size: 0.8rem;
        }

        .contact-icon {
          margin-right: 8px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .alpha-notice {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(255, 152, 0, 0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .alpha-notice p {
          margin: 0;
          font-size: 0.9rem;
          color: #ffcc80;
        }
        
        .alpha-icon {
          color: #ff9800;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .footer {
            padding-top: 3rem;
          }

          .footer-content {
            grid-template-columns: 1fr;
          }

          .footer-section {
            text-align: center;
          }
          
          .alpha-notice {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer; 