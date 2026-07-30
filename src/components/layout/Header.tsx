import React from 'react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { user, logout, mobileMenuOpen, setMobileMenuOpen, isDarkMode, toggleTheme } = useApp();


  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 px-4 md:px-6 py-3 flex items-center justify-between border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03), inset 0 -1px 0 rgba(226, 232, 240, 0.5)'
      }}
    >
      <div className="flex items-center space-x-3">
        {/* Hamburger Toggle (Mobile Only) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo mark — matching blue-to-violet gradient */}
        <div className="p-2 rounded-xl shadow-md flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 60%, #8b5cf6 100%)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <div>
          <h1 className="text-base font-bold tracking-tight"
            style={{ background: 'linear-gradient(90deg, #0f172a, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            DHLC Tasks
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">

        <span className="text-sm font-medium hidden sm:inline" style={{ color: '#475569' }}>
          {user.displayName || user.email}
        </span>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-all duration-200 touch-target"
          style={{ color: '#64748b' }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={logout}
          className="p-2 rounded-xl transition-all duration-200 touch-target"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e11d48'; (e.currentTarget as HTMLElement).style.background = 'rgba(225,29,72,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          title="Sign Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};
