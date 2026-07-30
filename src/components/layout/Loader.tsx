import React from 'react';
import { useApp } from '../../context/AppContext';

export const Loader: React.FC = () => {
  const { loading } = useApp();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      <p className="text-slate-400 font-medium animate-pulse">Initializing DHLC Tasks...</p>
    </div>
  );
};
