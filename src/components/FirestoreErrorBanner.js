import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaFileAlt } from 'react-icons/fa';

function FirestoreErrorBanner({ onClose }) {
  // Функция для открытия инструкции в новом окне
  const openInstructions = () => {
    // Создаем новое окно с инструкцией
    const instructionsWindow = window.open('', '_blank');
    
    // Загружаем содержимое файла FIRESTORE_RULES.md
    fetch('/FIRESTORE_RULES.md')
      .then(response => response.text())
      .then(text => {
        // Создаем HTML-страницу с инструкцией
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Настройка правил безопасности Firestore</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                }
                h1 { color: #1a237e; }
                h2 { color: #3f51b5; }
                h3 { color: #5c6bc0; }
                pre {
                  background-color: #f5f5f5;
                  padding: 16px;
                  border-radius: 4px;
                  overflow-x: auto;
                }
                code {
                  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                  background-color: #f5f5f5;
                  padding: 2px 4px;
                  border-radius: 3px;
                }
                a {
                  color: #1976d2;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <div id="content"></div>
              <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
              <script>
                document.getElementById('content').innerHTML = marked.parse(\`${text}\`);
              </script>
            </body>
          </html>
        `;
        
        // Записываем HTML в новое окно
        instructionsWindow.document.write(html);
      })
      .catch(error => {
        console.error('Ошибка при загрузке инструкции:', error);
        instructionsWindow.document.write('<h1>Ошибка при загрузке инструкции</h1>');
      });
  };

  return (
    <div className="firestore-error-banner">
      <div className="error-icon">
        <FaExclamationTriangle />
      </div>
      <div className="error-content">
        <h3>Внимание! Проблема с доступом к базе данных</h3>
        <p>
          Приложение работает в режиме ограниченной функциональности из-за проблем с доступом к Firestore.
          Отображаются тестовые данные.
        </p>
        <div className="error-actions">
          <button className="info-button" onClick={openInstructions}>
            <FaFileAlt /> Инструкция по настройке
          </button>
          <button className="info-button" onClick={() => window.open('https://console.firebase.google.com/', '_blank')}>
            <FaInfoCircle /> Консоль Firebase
          </button>
        </div>
      </div>
      <button className="close-button" onClick={onClose}>×</button>
      
      <style jsx>{`
        .firestore-error-banner {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          padding: 16px;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: flex-start;
          max-width: 400px;
          z-index: 1000;
        }
        
        .error-icon {
          color: #f44336;
          font-size: 24px;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .error-content {
          flex: 1;
        }
        
        .error-content h3 {
          margin: 0 0 8px;
          color: #d32f2f;
          font-size: 16px;
        }
        
        .error-content p {
          margin: 0 0 12px;
          color: #616161;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .error-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .info-button {
          background-color: transparent;
          color: #1976d2;
          border: 1px solid #1976d2;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.3s;
        }
        
        .info-button:hover {
          background-color: rgba(25, 118, 210, 0.1);
        }
        
        .close-button {
          background: none;
          border: none;
          color: #9e9e9e;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
          line-height: 1;
        }
        
        .close-button:hover {
          color: #616161;
        }
        
        @media (max-width: 480px) {
          .firestore-error-banner {
            bottom: 0;
            right: 0;
            left: 0;
            max-width: 100%;
            border-radius: 0;
          }
          
          .error-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default FirestoreErrorBanner; 