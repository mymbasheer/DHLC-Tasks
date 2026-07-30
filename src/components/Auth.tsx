import React from 'react';
import { useApp } from '../context/AppContext';

export const Auth: React.FC = () => {
  const {
    user,
    loginWithGoogle
  } = useApp();

  if (user) return null;

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
      {/* Auth card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(243, 244, 246, 0.6), 0 8px 10px -6px rgba(243, 244, 246, 0.6)',
      }}>
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl shadow-md"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 55%, #8b5cf6 100%)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold"
            style={{ background: 'linear-gradient(90deg, #0f172a, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Welcome to DHLC Tasks
          </h2>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Task Operations & Consultation Management
          </p>
        </div>

        {/* Google Login/Register Button */}
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full h-12 font-semibold rounded-xl shadow-md border border-slate-200 transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer hover:bg-slate-50"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1 1.14 1.14 2.37l3.3 2.56c1.93-1.78 3.05-4.4 3.05-7.46z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.3-2.56c-.92.62-2.1 1-3.66 1-2.82 0-5.2-1.9-6.05-4.47H2.66v2.64C4.64 21.07 8.08 24 12 24z" />
              <path fill="#FBBC05" d="M5.95 14.06c-.22-.68-.35-1.4-.35-2.06s.13-1.38.35-2.06V7.3H2.66C1.86 8.87 1.4 10.38 1.4 12s.46 3.13 1.26 4.7l3.29-2.64z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 8.08 0 4.64 2.93 2.66 6.94l3.29 2.64c.85-2.57 3.23-4.83 6.05-4.83z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Sign in with Google Account</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Note: If you do not have an account, signing in with your Google account will automatically register you. Self-registered accounts require Admin approval before full access is granted.
          </p>
        </div>
      </div>
    </div>
  );
};
