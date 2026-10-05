import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Properties from './pages/Properties';
import ModelDashboard from './pages/ModelDashboard';
import About from './pages/About';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [prefillData, setPrefillData] = useState(null);

  const handleNavigate = (page, data = null) => {
    if (data) {
      setPrefillData(data);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar activePage={activePage} setActivePage={handleNavigate} />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {activePage === 'home' && (
          <Home setActivePage={handleNavigate} setPrefillData={setPrefillData} />
        )}
        {activePage === 'predict' && (
          <Predict prefillData={prefillData} setActivePage={handleNavigate} />
        )}
        {activePage === 'properties' && (
          <Properties setActivePage={handleNavigate} setPrefillData={setPrefillData} />
        )}
        {activePage === 'model' && (
          <ModelDashboard setActivePage={handleNavigate} />
        )}
        {activePage === 'about' && (
          <About setActivePage={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <Footer setActivePage={handleNavigate} />
    </div>
  );
}
