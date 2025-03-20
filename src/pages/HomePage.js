import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';

function HomePage() {
  return (
    <div className="home-page">
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        main {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default HomePage; 