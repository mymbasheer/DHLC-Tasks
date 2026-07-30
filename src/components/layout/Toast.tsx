import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast.show) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 glass max-w-sm rounded-xl p-4 shadow-2xl border-l-4 ${toast.type === 'error' ? 'border-l-rose-500' : 'border-l-emerald-500'} transition-all duration-300`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {toast.type === 'error' ? (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">{toast.type === 'error' ? 'Error' : 'Success'}</h4>
          <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
        </div>
      </div>
    </div>
  );
};
