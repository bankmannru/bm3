import React from 'react';
import { Link } from 'react-router-dom';
import { FaCreditCard, FaShoppingCart, FaMoneyBillWave, FaHome, FaMobileAlt } from 'react-icons/fa';

const features = [
  {
    icon: <FaCreditCard />,
    title: 'Банковские карты',
    description: 'Широкий выбор карт для всех ваших потребностей'
  },
  {
    icon: <FaShoppingCart />,
    title: 'Маркет',
    description: 'Покупайте и продавайте товары за маннрубли',
    link: '/market'
  },
  {
    icon: <FaMoneyBillWave />,
    title: 'Вклады',
    description: 'Выгодные условия для сбережений и инвестиций'
  },
  {
    icon: <FaHome />,
    title: 'Ипотека',
    description: 'Доступные ипотечные программы для вашего жилья'
  },
  {
    icon: <FaMobileAlt />,
    title: 'Онлайн банкинг',
    description: 'Управляйте финансами через удобное мобильное приложение'
  }
];

function Features() {
  return (
    <section className="features">
      <h2 className="features-title">Наши услуги</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
            {feature.link && (
              <Link to={feature.link} className="feature-link">
                Перейти
              </Link>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .features {
          padding: 4rem 2rem;
          background-color: #f5f7fa;
        }

        .features-title {
          text-align: center;
          font-size: 2.5rem;
          color: #1a237e;
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background-color: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.3s;
          display: flex;
          flex-direction: column;
        }

        .feature-card:hover {
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #1a237e;
        }

        .feature-title {
          color: #1a237e;
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .feature-description {
          color: #616161;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }
        
        .feature-link {
          margin-top: auto;
          display: inline-block;
          background-color: #1a237e;
          color: white;
          text-decoration: none;
          padding: 0.5rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        
        .feature-link:hover {
          background-color: #3f51b5;
        }

        @media (max-width: 768px) {
          .features {
            padding: 3rem 1rem;
          }

          .features-title {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

export default Features; 