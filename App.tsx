import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Loader from './components/Loader';
import { Icons } from './components/Icon';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  // Initialize theme and background
  useEffect(() => {
    const savedTheme = localStorage.getItem('lifesync_theme');
    const savedBg = localStorage.getItem('lifesync_bg');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
    }
    
    if (savedBg) {
        setBackgroundImage(savedBg);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('lifesync_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('lifesync_theme', 'light');
    }
  }, [isDarkMode]);

  const handleSetBackground = (url: string) => {
      setBackgroundImage(url);
      if (url) {
        localStorage.setItem('lifesync_bg', url);
      } else {
        localStorage.removeItem('lifesync_bg');
      }
  };

  // Simulate checking for an existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('lifesync_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Artificial delay to show off the cool loader a bit longer on first load if it's too fast
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  const handleLogin = (username: string) => {
    setLoading(true);
    // Simulate API call delay for the loader
    setTimeout(() => {
        const newUser: User = {
          username,
          email: `${username.toLowerCase()}@example.com`
        };
        setUser(newUser);
        localStorage.setItem('lifesync_user', JSON.stringify(newUser));
        setLoading(false);
    }, 2000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lifesync_user');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setThemeMode = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  return (
    <div className="relative min-h-screen transition-all duration-500 overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Global Loader Overlay */}
      {loading && <Loader />}

      {/* Background Layer (z-0) */}
      <div className="fixed inset-0 z-0">
          {backgroundImage ? (
             // Image Background
             <>
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform scale-105" 
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                ></div>
                {/* Overlay for readability on images */}
                <div className={`absolute inset-0 transition-colors duration-700 ${isDarkMode ? 'bg-black/70' : 'bg-white/40 backdrop-blur-[2px]'}`}></div>
             </>
          ) : (
             // Default Gradient Background
             <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-700 ease-in-out"></div>
          )}
      </div>

      {/* Content Layer (z-10) */}
      <div className="relative z-10 h-full">
        {!user ? (
            <AuthPage onLogin={handleLogin} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        ) : (
            <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            toggleTheme={toggleTheme}
            setThemeMode={setThemeMode}
            isDarkMode={isDarkMode}
            onSetBackground={handleSetBackground}
            setGlobalLoading={setLoading}
            />
        )}
      </div>
    </div>
  );
};

export default App;