/*
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
     
      {/* 3S 1500MS FLASHBANG OVERLAY 
      {showFlashbang && (
        <div className="flashbang-wrapper">
          <div className="flashbang-white"></div>
          <img src="/flashbang-cat.jpg" alt="Flashbang Cat" className="flashbang-cat" />
        </div>
      )}


      /* TOP NAVBAR 
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


        {/* SLIDER TOGGLE BUTTON 
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
        low boat{/*<h2>{activeTab}</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          nee mow{/*Current Theme: {theme.toUpperCase()}}
        </p>
      </main>
    </div>
  );
}


export default App;

*/

import { useState, useEffect } from 'react';
import { Sun, Moon, Terminal, RefreshCw, Cat } from 'lucide-react';
import axios from 'axios';
import './App.css';

function App() {
  // 1. Theme state (remembers choice in browser via localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('duediss-theme') || 'dark';
  });
  const [showFlashbang, setShowFlashbang] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  // 2. Roaster.ai states
  const [riskLevel, setRiskLevel] = useState('SAVAGE');
  const [roastText, setRoastText] = useState('Booting up roaster.ai...');
  const [isLoadingRoast, setIsLoadingRoast] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const tabs = ['Dashboard', 'Hall of Fame', 'Hall of Shame', 'Badges & Stats'];

  // 3. Fetch a roast from Toper's Backend
  const fetchRoast = async () => {
    if (isMuted) return;
    setIsLoadingRoast(true);
    try {
      // Connects to Toper's Express server on port 5000
      const response = await axios.get('http://localhost:5000/api/test-roast');
      setRiskLevel(response.data.risk);
      setRoastText(response.data.roast);
    } catch (error) {
      // Fallback message if Toper's server isn't running yet
      setRoastText("Backend offline. Even your server is procrastinating right now.");
    } finally {
      setIsLoadingRoast(false);
    }
  };

  // Run once when the page first loads
  useEffect(() => {
    fetchRoast();
  }, []);

  // Theme toggle + Flashbang Cat
  const handleToggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      localStorage.setItem('duediss-theme', 'light');
      setShowFlashbang(true);
      setTimeout(() => setShowFlashbang(false), 1500);
    } else {
      setTheme('dark');
      localStorage.setItem('duediss-theme', 'dark');
    }
  };

  // panic/mute button
  const handleMuteToggle = () => {
    if (!isMuted) {
      setIsMuted(true);
      setRoastText("roaster muted. coward. streak penalty applied.");
    } else {
      setIsMuted(false);
      fetchRoast();
    }
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-mode' : ''}`}>
      
      {/* white to flashbang cat overlay */}
      {showFlashbang && (
        <div className="flashbang-wrapper">
          <div className="flashbang-white"></div>
          <img src="/flashbang-cat.jpg" alt="Flashbang Cat" className="flashbang-cat" />
        </div>
      )}

      {/* navbar */}
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

        <div className="nav-right">
          {/* FAKE XP BAR */}
          <div className="xp-container">
            <span className="xp-level">LVL 1</span>
            <span className="xp-numbers">0 / 500 XP</span>
          </div>

          {/* slider button d/l m */}
          <button
            className={`theme-slider ${theme}`}
            onClick={handleToggleTheme}
            title="Toggle Dark / Light Mode"
          >
            <span className="slider-knob"></span>
            <span className="slider-icon sun-icon"><Sun size={14} /></span>
            <span className="slider-icon moon-icon"><Moon size={14} /></span>
          </button>
        </div>
      </nav>

      {/* 2 column dahsboard */}
      <main className="dashboard-grid">
        
        {/* LEFT COLUMN (70%): WORK ZONE PLACEHOLDER */}
        <section className="work-zone">
          task list{/*<h2>{activeTab}</h2>*/}
          <p className="subtitle">mata, kaon, dula, tulog</p>
        </section>

        {/* RIGHT COLUMN (30%): STICKY ROASTER.AI PANEL */}
        <aside className="roaster-panel">
          <div className="roaster-header">
            <div className="roaster-title">
              <Terminal size={18} color="#00ff66" />
              <span>roaster.ai</span>
            </div>
            <span className={`risk-badge risk-${riskLevel.toLowerCase()}`}>
              Risk: {riskLevel}
            </span>
          </div>

          {/* terminal box - dark style */}
          <div className="roaster-terminal">
            <p className="roast-output">
              <span className="prompt-arrow">&gt; </span>
              {isLoadingRoast ? "Thinking of an insult..." : roastText}
              <span className="blinking-cursor">▌</span>
            </p>
          </div>

          {/* buttons */}
          <div className="roaster-actions">
            <button 
              className="roast-again-btn" 
              onClick={fetchRoast}
              disabled={isMuted || isLoadingRoast}
            >
              <RefreshCw size={14} />
              <span>roast me again</span>
            </button>

            <button 
              className={`mute-btn ${isMuted ? 'muted-active' : ''}`} 
              onClick={handleMuteToggle}
              title="Penalty: Resets Win Streak to 0"
            >
              <Cat size={16} />
              <span>{isMuted ? "Unmute" : "Mute (-Streak)"}</span>
            </button>
          </div>
        </aside>

      </main>
    </div>
  );
}

export default App;