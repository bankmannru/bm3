import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import MarketPage from './pages/MarketPage';
import { auth } from './firebase';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <style jsx>{`
          .app {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
        `}</style>
      </div>
    </Router>
  );
}

export default App;
