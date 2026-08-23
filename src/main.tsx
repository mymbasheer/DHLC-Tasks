/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import './styles.css';

// Root rendering

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

// Register Vite PWA
if ('serviceWorker' in navigator) {
  // @ts-ignore
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegistered(r: any) {
        console.log('SW Registered:', r);
      },
      onRegisterError(error: any) {
        console.log('SW registration error', error);
      }
    });
  });
}
