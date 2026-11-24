import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');
  const [showFlashbang, setShowFlashbang] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = ['Dashboard', 'Hall of Fame', 'Hall of Shame', 'Badges & Stats'];

  const handleToggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      setShowFlashbang(true);

      setTimeout(() => {
        setShowFlashbang(false);
      }, 1500);
    } else {
      setTheme('dark');
    }
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-mode' : ''}`}>
      
      {/* 3S 1500MS FLASHBANG OVERLAY */}
      {showFlashbang && (
        <div className="flashbang-wrapper">
          <div className="flashbang-white"></div>
          <img src="/flashbang-cat.jpg" alt="Flashbang Cat" className="flashbang-cat" />
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          Due<span>Diss</span>
        </div>

        <div className="nav-links">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SLIDER TOGGLE BUTTON */}
        <button
          className={`theme-slider ${theme}`}
          onClick={handleToggleTheme}
          title="Toggle Dark / Light Mode"
        >
          <span className="slider-knob"></span>
          <span className="slider-icon sun-icon">
            <Sun size={14} />
          </span>
          <span className="slider-icon moon-icon">
            <Moon size={14} />
          </span>
        </button>
      </nav>

      <main style={{ padding: '2rem' }}>
        <h2>{activeTab}</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          Current Theme: {theme.toUpperCase()}
        </p>
      </main>
    </div>
  );
}

export default App;